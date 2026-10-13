
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { logActivity } = require("../utils/auditLogger");

module.exports = function createDocumentsRouter({
  prisma,
  authenticateToken
}) {
  const router = express.Router();
  const uploadDir = path.resolve(__dirname, "../uploads");
  fs.mkdirSync(uploadDir, { recursive: true });

  const allowedTypes = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"]
  };

  const categories = [
    "GENERAL", "CITIZEN", "PERMIT",
    "CONTRACT", "DECISION", "FINANCE"
  ];

  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadDir,
      filename: (req, file, cb) =>
        cb(null, crypto.randomUUID())
    }),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!allowedTypes[file.mimetype]?.includes(ext)) {
        return cb(new Error("Unsupported file type"));
      }
      cb(null, true);
    }
  });

  function removeFile(filename) {
    if (!filename) return;
    fs.promises.unlink(path.join(uploadDir, filename))
      .catch(err => {
        if (err.code !== "ENOENT") console.error("File cleanup:", err);
      });
  }

  // Check real file signatures, not just MIME type and extension.
  async function validFile(file) {
    const handle = await fs.promises.open(file.path, "r");
    try {
      const buffer = Buffer.alloc(8);
      const { bytesRead } = await handle.read(buffer, 0, 8, 0);
      const bytes = buffer.subarray(0, bytesRead);
      const mime = file.mimetype;

      if (mime === "application/pdf") {
        return bytes.subarray(0, 5).toString() === "%PDF-";
      }

      if (mime === "image/png") {
        return bytes.subarray(0, 8).equals(
          Buffer.from("89504e470d0a1a0a", "hex")
        );
      }

      if (mime === "image/jpeg") {
        return bytes.length >= 3 &&
          bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
      }

      // DOCX/XLSX are ZIP containers. This is only a preliminary
      // signature check, not full Office-document validation.
      if (mime.includes("officedocument")) {
        return bytes.subarray(0, 4).equals(
          Buffer.from("504b0304", "hex")
        );
      }

      return false;
    } finally {
      await handle.close();
    }
  }

  router.use(authenticateToken);

  router.use(async (req, res, next) => {
    try {
      const id = Number(req.user?.id ?? req.user?.userId);
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: { role: { select: { name: true } } }
      });

      if (!user) return res.status(401).json({ message: "Unauthorized" });

      req.documentUserId = id;
      req.documentAdmin = user.role.name.toUpperCase() === "ADMIN";
      next();
    } catch (err) {
      next(err);
    }
  });

  // Both ADMIN and EMPLOYEE may read/upload.
  // Only ADMIN may delete documents.

  router.get("/", async (req, res, next) => {
    try {
      const documents = await prisma.document.findMany({
        select: {
          id: true,
          title: true,
          description: true,
          category: true,
          originalName: true,
          mimeType: true,
          size: true,
          createdAt: true,
          uploadedBy: {
            select: { id: true, fullName: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });
      res.json(documents);
    } catch (err) {
      next(err);
    }
  });

  router.post("/", (req, res, next) => {
    upload.single("file")(req, res, async err => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: err.message });
        }
        return res.status(400).json({
          message: err.message || "Upload failed"
        });
      }

      if (!req.file) {
        return res.status(400).json({ message: "File is required" });
      }

      try {
        const title = String(req.body.title || "").trim();
        const category = String(req.body.category || "GENERAL");

        if (!title || title.length > 200) {
          removeFile(req.file.filename);
          return res.status(400).json({
            message: "Title must contain 1–200 characters"
          });
        }

        if (!categories.includes(category)) {
          removeFile(req.file.filename);
          return res.status(400).json({
            message: "Invalid category"
          });
        }

        if (!(await validFile(req.file))) {
          removeFile(req.file.filename);
          return res.status(400).json({
            message: "File content does not match its type"
          });
        }

        
    const document = await prisma.$transaction(async (tx) => {
    const createdDocument = await tx.document.create({
        data: {
        title,
        description: String(req.body.description || "").trim() || null,
        category,
        originalName: path.basename(req.file.originalname),
        storedName: req.file.filename,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadedById: req.documentUserId
        }
    });

    await logActivity(tx, {
        userId: req.documentUserId,
        action: "CREATE",
        module: "DOCUMENTS",
        entityId: createdDocument.id,
        details: "Uploaded a new document"
    });

    return createdDocument;
    });


        res.status(201).json(document);
      } catch (error) {
        removeFile(req.file.filename);
        next(error);
      }
    });
  });

  router.get("/:id/download", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await prisma.document.findUnique({
        where: { id }
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      const filePath = path.join(uploadDir, document.storedName);
      await fs.promises.access(filePath, fs.constants.R_OK);

      res.download(filePath, document.originalName, err => {
        if (err && !res.headersSent) next(err);
      });
    } catch (err) {
      if (err.code === "ENOENT") {
        return res.status(404).json({
          message: "Stored file not found"
        });
      }
      next(err);
    }
  });

  router.delete("/:id", async (req, res, next) => {
    if (!req.documentAdmin) {
      return res.status(403).json({
        message: "Only ADMIN can delete documents"
      });
    }

    try {
      const id = Number(req.params.id);
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await prisma.document.findUnique({
        where: { id }
      });

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
    await prisma.$transaction(async (tx) => {
    await tx.document.delete({
        where: { id }
    });

    await logActivity(tx, {
        userId: req.documentUserId,
        action: "DELETE",
        module: "DOCUMENTS",
        entityId: id,
        details: "Deleted a document"
    });
    });

    // Remove the physical file after the database transaction succeeds.
    removeFile(document.storedName);

    res.json({
    message: "Document deleted"
    });

    } catch (err) {
      next(err);
    }
  });

  return router;
};
