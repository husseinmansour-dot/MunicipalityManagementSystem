
require("dotenv").config();

const authorizeRoles = require("./middleware/authorizeRoles");
const authenticateToken = require("./middleware/authMiddleware");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const express = require("express");
const prisma = require("./lib/prisma");
const createAuditLogsRouter = require("./routes/auditLogs");
const { logActivity } = require("./utils/auditLogger");
const errorHandler = require("./middleware/errorHandler");

const app = express();

const PORT = Number(process.env.PORT) || 3000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));

app.use(express.json({ limit: "1mb" }));

// Test API
app.get("/", (req, res) => {
  res.send("Municipality Management System API is running!");
});

// KEEP ALL YOUR EXISTING API ROUTES BELOW THIS LINE


// GET all roles
app.get("/api/roles", authenticateToken, authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const roles = await prisma.role.findMany();
    res.json(roles);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error retrieving roles"
    });
  }
});

// POST create a new role

app.post(
  "/api/roles",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { name } = req.body;

      // Validate role name
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Role name is required"
        });
      }

      // Get the authenticated administrator ID
      const userId = Number(
        req.user?.id ?? req.user?.userId
      );

      // Create role and audit log in one transaction
      const role = await prisma.$transaction(async (tx) => {

        // STEP 1: Create the role
        const createdRole = await tx.role.create({
          data: {
            name: name.trim().toUpperCase()
          }
        });

        // STEP 2: Record the activity
        await logActivity(tx, {
          userId,
          action: "CREATE",
          module: "ROLES",
          entityId: createdRole.id,
          details: `Created role ${createdRole.name}`
        });

        return createdRole;
      });

      res.status(201).json(role);

    } catch (error) {
      console.error("Error creating role:", error);

      if (error.code === "P2002") {
        return res.status(409).json({
          message: "This role already exists"
        });
      }

      res.status(500).json({
        message: "Failed to create role"
      });
    }
  }
);

app.post(
  "/api/users",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const { fullName, email, password, roleId } = req.body;

      // Validate the input
      if (
        typeof fullName !== "string" ||
        !fullName.trim() ||
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        typeof password !== "string" ||
        password.length < 8 ||
        !Number.isInteger(roleId)
      ) {
        return res.status(400).json({
          message:
            "Valid name, email, password (8+ characters), and roleId are required"
        });
      }

      // Verify that the role exists
      const role = await prisma.role.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        return res.status(400).json({
          message: "Invalid roleId"
        });
      }

      // Hash the password
      const passwordHash = await bcrypt.hash(password, 12);

      // Get authenticated administrator ID
      const userId = Number(
        req.user?.id ?? req.user?.userId
      );

      // Create user and audit log in one transaction
      const user = await prisma.$transaction(async (tx) => {

        // STEP 1: Create the user
        const createdUser = await tx.user.create({
          data: {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            passwordHash,
            roleId
          },
          select: {
            id: true,
            fullName: true,
            email: true,
            roleId: true,
            createdAt: true
          }
        });

        // STEP 2: Record audit activity
        await logActivity(tx, {
          userId,
          action: "CREATE",
          module: "USERS",
          entityId: createdUser.id,
          details: `Created user account #${createdUser.id} with role ${role.name}`
        });

        return createdUser;
      });

      res.status(201).json(user);

    } catch (error) {
      console.error("Error creating user:", error);

      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Email already exists"
        });
      }

      res.status(500).json({
        message: "Failed to create user"
      });
    }
  }
);

app.get("/api/users", authenticateToken, authorizeRoles("ADMIN"), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.json(users);
  } catch (error) {
    console.error("Error retrieving users:", error);

    res.status(500).json({
      message: "Failed to retrieve users"
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required"
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase()
      },
      include: {
        role: true
      }
    });

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Compare password with stored hash
    const isValidPassword = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!isValidPassword) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    // Successful password verification
    
    // Generate a signed JWT token
   
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET
    );


    // Return user information and token
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role.name
      }
    });


  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed"
    });
  }
});

app.get("/api/auth/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists"
      });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error retrieving authenticated user:", error);

    res.status(500).json({
      message: "Failed to retrieve user"
    });
  }
});



app.get(
  "/api/citizens",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);
      const name = String(req.query.name ?? "").trim();
      const address = String(req.query.address ?? "").trim();
      
      if (
        !Number.isSafeInteger(page) ||
        page < 1 ||
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return res.status(400).json({
          message: "Page must be positive and limit must be between 1 and 100"
        });
      }

      const skip = (page - 1) * limit;

      if (!Number.isSafeInteger(skip)) {
        return res.status(400).json({
          message: "Pagination values are too large"
        });
      }

      const where = {
        ...(address && {
          address: { contains: address }
        }),
        ...(name && {
          OR: [
            { firstName: { contains: name } },
            { lastName: { contains: name } }
          ]
        })
      };

      const [citizens, total] = await prisma.$transaction([
        prisma.citizen.findMany({
          where,
          skip,
          take: limit,
          orderBy: { id: "asc" }
        }),
        prisma.citizen.count({ where })
      ]);

      res.status(200).json({
        data: citizens,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error("Error retrieving citizens:", error);

      res.status(500).json({
        message: "Failed to retrieve citizens"
      });
    }
  }
);


app.post(
  "/api/citizens",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        nationalId,
        dateOfBirth,
        phoneNumber,
        address
      } = req.body;

      // Validate required fields
      if (
        typeof firstName !== "string" ||
        !firstName.trim() ||
        typeof lastName !== "string" ||
        !lastName.trim() ||
        typeof nationalId !== "string" ||
        !nationalId.trim() ||
        typeof dateOfBirth !== "string"
      ) {
        return res.status(400).json({
          message: "First name, last name, national ID and date of birth are required"
        });
      }

      const birthDate = new Date(dateOfBirth);

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ||
        Number.isNaN(birthDate.getTime()) ||
        birthDate.toISOString().slice(0, 10) !== dateOfBirth ||
        birthDate > new Date()
      ) {
        return res.status(400).json({
          message: "Date of birth must be a valid past or current date in YYYY-MM-DD format"
        });
      }

      const userId = Number(req.user?.id ?? req.user?.userId);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(401).json({
          message: "Invalid authenticated user"
        });
      }

      // Create citizen and audit log in one transaction.
      const citizen = await prisma.$transaction(async (tx) => {
        const createdCitizen = await tx.citizen.create({
          data: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            nationalId: nationalId.trim(),
            dateOfBirth: birthDate,
            phoneNumber: phoneNumber || null,
            address: address || null
          }
        });

        await logActivity(tx, {
          userId,
          action: "CREATE",
          module: "CITIZENS",
          entityId: createdCitizen.id,
          details: "Created a new citizen record"
        });

        return createdCitizen;
      });

      res.status(201).json(citizen);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "A citizen with this national ID already exists"
        });
      }

      console.error("Error creating citizen:", error);

      res.status(500).json({
        message: "Failed to create citizen"
      });
    }
  }
);

app.put(
  "/api/citizens/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid citizen ID"
        });
      }

      const {
        firstName,
        lastName,
        nationalId,
        dateOfBirth,
        phoneNumber,
        address
      } = req.body;

      // Check that the citizen exists
      const existingCitizen = await prisma.citizen.findUnique({
        where: { id }
      });

      if (!existingCitizen) {
        return res.status(404).json({
          message: "Citizen not found"
        });
      }

      // Prepare updated fields
      const data = {};

      if (firstName !== undefined) {
        if (typeof firstName !== "string" || !firstName.trim()) {
          return res.status(400).json({ message: "Invalid first name" });
        }
        data.firstName = firstName.trim();
      }

      if (lastName !== undefined) {
        if (typeof lastName !== "string" || !lastName.trim()) {
          return res.status(400).json({ message: "Invalid last name" });
        }
        data.lastName = lastName.trim();
      }

      if (nationalId !== undefined) {
        if (typeof nationalId !== "string" || !nationalId.trim()) {
          return res.status(400).json({ message: "Invalid national ID" });
        }
        data.nationalId = nationalId.trim();
      }

      if (dateOfBirth !== undefined) {
        if (typeof dateOfBirth !== "string" ||
            !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
          return res.status(400).json({ message: "Invalid date format" });
        }

        const birthDate = new Date(dateOfBirth);

        if (Number.isNaN(birthDate.getTime()) ||
            birthDate.toISOString().slice(0, 10) !== dateOfBirth ||
            birthDate > new Date()) {
          return res.status(400).json({ message: "Invalid date of birth" });
        }

        data.dateOfBirth = birthDate;
      }

      if (phoneNumber !== undefined) {
        if (phoneNumber !== null && typeof phoneNumber !== "string") {
          return res.status(400).json({ message: "Invalid phone number" });
        }
        data.phoneNumber = phoneNumber;
      }

      if (address !== undefined) {
        if (address !== null && typeof address !== "string") {
          return res.status(400).json({ message: "Invalid address" });
        }
        data.address = address;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          message: "No fields provided for update"
        });
      }

      const updatedCitizen = await prisma.$transaction(async (tx) => {
        const citizen = await tx.citizen.update({
          where: { id: citizenId },
          data: updateData
        });

        await logActivity(tx, {
          userId: Number(req.user.id ?? req.user.userId),
          action: "UPDATE",
          module: "CITIZENS",
          entityId: citizen.id,
          details: "Updated a citizen record"
        });

        return citizen;
      });
      res.status(200).json(updatedCitizen);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "National ID already exists"
        });
      }

      if (error.code === "P2025") {
        return res.status(404).json({
          message: "Citizen not found"
        });
      }

      console.error("Error updating citizen:", error);

      res.status(500).json({
        message: "Failed to update citizen"
      });
    }
  }
);


app.delete(
  "/api/citizens/:id",
  authenticateToken,
  authorizeRoles("ADMIN"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid citizen ID"
        });
      }

      const citizen = await prisma.citizen.findUnique({
        where: { id }
      });

      if (!citizen) {
        return res.status(404).json({
          message: "Citizen not found"
        });
      }

      const userId = Number(req.user?.id ?? req.user?.userId);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(401).json({
          message: "Invalid authenticated user"
        });
      }

      await prisma.$transaction(async (tx) => {
        await tx.citizen.delete({
          where: { id }
        });

        await logActivity(tx, {
          userId,
          action: "DELETE",
          module: "CITIZENS",
          entityId: id,
          details: "Deleted a citizen record"
        });
      });

      res.status(200).json({
        message: "Citizen deleted successfully"
      });

    } catch (error) {
      if (error.code === "P2025") {
        return res.status(404).json({
          message: "Citizen not found"
        });
      }

      if (error.code === "P2003") {
        return res.status(409).json({
          message: "Cannot delete citizen because related records exist"
        });
      }

      console.error("Error deleting citizen:", error);

      res.status(500).json({
        message: "Failed to delete citizen"
      });
    }
  }
);

app.get(
  "/api/citizens/search",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const { name } = req.query;

      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Search name is required"
        });
      }

      const searchName = name.trim();

      const citizens = await prisma.citizen.findMany({
        where: {
          OR: [
            {
              firstName: {
                contains: searchName
              }
            },
            {
              lastName: {
                contains: searchName
              }
            }
          ]
        },
        orderBy: {
          id: "asc"
        }
      });

      res.status(200).json(citizens);
    } catch (error) {
      console.error("Error searching citizens:", error);

      res.status(500).json({
        message: "Failed to search citizens"
      });
    }
  }
);
app.get(
  "/api/citizens/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid citizen ID"
        });
      }

      const citizen = await prisma.citizen.findUnique({
        where: { id }
      });

      if (!citizen) {
        return res.status(404).json({
          message: "Citizen not found"
        });
      }

      res.status(200).json(citizen);
    } catch (error) {
      console.error("Error retrieving citizen:", error);

      res.status(500).json({
        message: "Failed to retrieve citizen"
      });
    }
  }
);


app.post(
  "/api/requests",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const { citizenId, type } = req.body;

      // Validate citizen ID
      if (!Number.isSafeInteger(citizenId) || citizenId <= 0) {
        return res.status(400).json({
          message: "Valid citizen ID is required"
        });
      }

      // Validate request type
      const allowedTypes = [
        "RESIDENCY_CERTIFICATE",
        "BIRTH_CERTIFICATE",
        "MARRIAGE_CERTIFICATE",
        "COMPLAINT",
        "STREET_REPAIR",
        "GARBAGE_COLLECTION",
        "OTHER"
      ];

      if (
        typeof type !== "string" ||
        !allowedTypes.includes(type.trim().toUpperCase())
      ) {
        return res.status(400).json({
          message: "Invalid request type",
          allowedTypes
        });
      }

      const normalizedType = type.trim().toUpperCase();

      // Validate authenticated user
      const userId = Number(req.user?.id ?? req.user?.userId);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(401).json({
          message: "Invalid authenticated user"
        });
      }

      // Check whether citizen exists
      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId }
      });

      if (!citizen) {
        return res.status(404).json({
          message: "Citizen not found"
        });
      }

      // Check for an existing pending request
      const existingPendingRequest = await prisma.request.findFirst({
        where: {
          citizenId,
          type: normalizedType,
          status: "PENDING"
        }
      });

      if (existingPendingRequest) {
        return res.status(409).json({
          message: "Citizen already has a pending request of this type",
          existingRequestId: existingPendingRequest.id
        });
      }

      // Create request and audit log in one transaction
      const request = await prisma.$transaction(async (tx) => {
        const createdRequest = await tx.request.create({
          data: {
            citizenId,
            type: normalizedType,
            status: "PENDING"
          }
        });

        await logActivity(tx, {
          userId,
          action: "CREATE",
          module: "REQUESTS",
          entityId: createdRequest.id,
          details: "Created a new citizen request"
        });

        return createdRequest;
      });

      res.status(201).json(request);

    } catch (error) {
      console.error("Error creating request:", error);

      if (error.code === "P2003") {
        return res.status(404).json({
          message: "Citizen or authenticated user not found"
        });
      }

      res.status(500).json({
        message: "Failed to create request"
      });
    }
  }
);


app.get(
  "/api/requests/statistics",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const grouped = await prisma.request.groupBy({
        by: ["status"],
        _count: {
          _all: true
        }
      });

      const statistics = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        completed: 0
      };

      for (const group of grouped) {
        const count = group._count._all;

        statistics.total += count;

        switch (group.status) {
          case "PENDING":
            statistics.pending = count;
            break;

          case "APPROVED":
            statistics.approved = count;
            break;

          case "REJECTED":
            statistics.rejected = count;
            break;

          case "COMPLETED":
            statistics.completed = count;
            break;
        }
      }

      res.status(200).json(statistics);

    } catch (error) {
      console.error("Error retrieving statistics:", error);

      res.status(500).json({
        message: "Failed to retrieve request statistics"
      });
    }
  }
);

app.get(
  "/api/requests/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      // Validate request ID
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid request ID"
        });
      }

      // Find request and its citizen
      const request = await prisma.request.findUnique({
        where: { id },
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              phoneNumber: true,
              address: true
            }
          }
        }
      });

      // Request does not exist
      if (!request) {
        return res.status(404).json({
          message: "Request not found"
        });
      }

      res.status(200).json(request);

    } catch (error) {
      console.error("Error retrieving request:", error);

      res.status(500).json({
        message: "Failed to retrieve request"
      });
    }
  }
);


app.put(
  "/api/requests/:id/status",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      // Validate request ID
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid request ID"
        });
      }

      // Validate status
      const allowedStatuses = [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "COMPLETED"
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid request status"
        });
      }

      // Validate authenticated user
      const userId = Number(req.user?.id ?? req.user?.userId);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(401).json({
          message: "Invalid authenticated user"
        });
      }

      // Define allowed transitions
      const transitions = {
        PENDING: ["APPROVED", "REJECTED"],
        APPROVED: ["COMPLETED"],
        REJECTED: [],
        COMPLETED: []
      };

      const result = await prisma.$transaction(async (tx) => {
        // Read current request
        const existingRequest = await tx.request.findUnique({
          where: { id }
        });

        if (!existingRequest) {
          return { error: "NOT_FOUND" };
        }

        const previousStatus = existingRequest.status;

        // Check allowed transition
        if (!transitions[previousStatus]?.includes(status)) {
          return { error: "INVALID_TRANSITION" };
        }

        // Conditional update prevents overwriting a status
        // that another user changed in the meantime.
        const updateResult = await tx.request.updateMany({
          where: {
            id,
            status: previousStatus
          },
          data: {
            status,
            completionDate:
              status === "COMPLETED" ? new Date() : null
          }
        });

        if (updateResult.count !== 1) {
          return { error: "CONCURRENT_UPDATE" };
        }

        // Record status change in audit log
        await logActivity(tx, {
          userId,
          action: "STATUS_CHANGE",
          module: "REQUESTS",
          entityId: id,
          details: `Changed request status from ${previousStatus} to ${status}`
        });

        const updatedRequest = await tx.request.findUnique({
          where: { id }
        });

        return { request: updatedRequest };
      });

      if (result.error === "NOT_FOUND") {
        return res.status(404).json({
          message: "Request not found"
        });
      }

      if (result.error === "INVALID_TRANSITION") {
        return res.status(409).json({
          message: "Invalid status transition"
        });
      }

      if (result.error === "CONCURRENT_UPDATE") {
        return res.status(409).json({
          message: "Request status changed. Please refresh and try again"
        });
      }

      res.status(200).json({
        message: "Request status updated successfully",
        request: result.request
      });

    } catch (error) {
      console.error("Error updating request status:", error);

      res.status(500).json({
        message: "Failed to update request status"
      });
    }
  }
);

app.get(
  "/api/requests",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const { status } = req.query;

      // Validate status
      const allowedStatuses = [
        "PENDING",
        "APPROVED",
        "REJECTED",
        "COMPLETED"
      ];

      if (
        status !== undefined &&
        (typeof status !== "string" ||
          !allowedStatuses.includes(status))
      ) {
        return res.status(400).json({
          message: "Invalid request status"
        });
      }

      // Pagination
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);

      if (
        !Number.isSafeInteger(page) ||
        page < 1 ||
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return res.status(400).json({
          message: "Invalid pagination parameters"
        });
      }

      const skip = (page - 1) * limit;

      if (!Number.isSafeInteger(skip)) {
        return res.status(400).json({
          message: "Pagination range is too large"
        });
      }

      const where = status ? { status } : {};

      // Retrieve requests and total count
      const [requests, total] = await prisma.$transaction([
        prisma.request.findMany({
          where,
          skip,
          take: limit,
          include: {
            citizen: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                nationalId: true
              }
            }
          },
          orderBy: [
            { submissionDate: "desc" },
            { id: "desc" }
          ]
        }),

        prisma.request.count({ where })
      ]);

      res.status(200).json({
        data: requests,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error("Error retrieving requests:", error);

      res.status(500).json({
        message: "Failed to retrieve requests"
      });
    }
  }
);

app.get(
  "/api/citizens/:id/requests",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const citizenId = Number(req.params.id);

      // Validate citizen ID
      if (!Number.isSafeInteger(citizenId) || citizenId <= 0) {
        return res.status(400).json({
          message: "Invalid citizen ID"
        });
      }

      // Find the citizen
      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId },
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      });

      if (!citizen) {
        return res.status(404).json({
          message: "Citizen not found"
        });
      }

      // Retrieve requests belonging to this citizen
      const requests = await prisma.request.findMany({
        where: { citizenId },
        orderBy: {
          submissionDate: "desc"
        }
      });

      res.status(200).json({
        citizen,
        totalRequests: requests.length,
        requests
      });

    } catch (error) {
      console.error("Error retrieving citizen requests:", error);

      res.status(500).json({
        message: "Failed to retrieve citizen requests"
      });
    }
  }
);

/* =========================================================
   PERMITS API — WITH AUDIT LOGGING
   ========================================================= */

// CREATE PERMIT
app.post(
  "/api/permits",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const { citizenId, type, description } = req.body;

      if (!Number.isSafeInteger(citizenId) || citizenId <= 0) {
        return res.status(400).json({
          message: "Valid citizen ID is required"
        });
      }

      const allowedTypes = [
        "CONSTRUCTION",
        "RENOVATION",
        "BUSINESS_LICENSE"
      ];

      if (
        typeof type !== "string" ||
        !allowedTypes.includes(type.trim().toUpperCase())
      ) {
        return res.status(400).json({
          message: "Invalid permit type",
          allowedTypes
        });
      }

      if (
        description !== undefined &&
        description !== null &&
        typeof description !== "string"
      ) {
        return res.status(400).json({
          message: "Description must be a string"
        });
      }

      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId }
      });

      if (!citizen) {
        return res.status(404).json({
          message: "Citizen not found"
        });
      }

      const permit = await prisma.$transaction(async (tx) => {
        const created = await tx.permit.create({
          data: {
            citizenId,
            type: type.trim().toUpperCase(),
            description: description ?? null,
            status: "PENDING"
          }
        });

        await logActivity(tx, {
          userId: Number(req.user?.id ?? req.user?.userId),
          action: "CREATE",
          module: "PERMITS",
          entityId: created.id,
          details: "Created a new permit application"
        });

        return created;
      });

      res.status(201).json({
        message: "Permit application created successfully",
        permit
      });
    } catch (error) {
      console.error("Error creating permit:", error);
      res.status(500).json({
        message: "Failed to create permit application"
      });
    }
  }
);

// GET ALL PERMITS
app.get(
  "/api/permits",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const { status } = req.query;
      const allowedStatuses = ["PENDING", "APPROVED", "REJECTED"];

      if (
        status !== undefined &&
        (
          typeof status !== "string" ||
          !allowedStatuses.includes(status)
        )
      ) {
        return res.status(400).json({
          message: "Invalid permit status"
        });
      }

      const isPositiveInteger = (value) =>
        typeof value === "string" &&
        /^[1-9]\d*$/.test(value) &&
        Number.isSafeInteger(Number(value));

      if (
        (req.query.page !== undefined &&
          !isPositiveInteger(req.query.page)) ||
        (req.query.limit !== undefined &&
          !isPositiveInteger(req.query.limit))
      ) {
        return res.status(400).json({
          message: "Page and limit must be positive integers"
        });
      }

      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);

      if (limit > 100) {
        return res.status(400).json({
          message: "Maximum limit is 100"
        });
      }

      const skip = (page - 1) * limit;

      if (!Number.isSafeInteger(skip)) {
        return res.status(400).json({
          message: "Page number is too large"
        });
      }

      const where = status ? { status } : {};

      const total = await prisma.permit.count({ where });

      const permits = await prisma.permit.findMany({
        where,
        skip,
        take: limit,
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true
            }
          }
        },
        orderBy: [
          { applicationDate: "desc" },
          { id: "desc" }
        ]
      });

      res.status(200).json({
        data: permits,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error("Error retrieving permits:", error);
      res.status(500).json({
        message: "Failed to retrieve permits"
      });
    }
  }
);

// PERMIT STATISTICS
app.get(
  "/api/permits/statistics",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const [total, pending, approved, rejected] =
        await Promise.all([
          prisma.permit.count(),
          prisma.permit.count({
            where: { status: "PENDING" }
          }),
          prisma.permit.count({
            where: { status: "APPROVED" }
          }),
          prisma.permit.count({
            where: { status: "REJECTED" }
          })
        ]);

      res.status(200).json({
        total,
        pending,
        approved,
        rejected
      });
    } catch (error) {
      console.error("Error retrieving permit statistics:", error);
      res.status(500).json({
        message: "Failed to retrieve permit statistics"
      });
    }
  }
);

// EXPIRED PERMITS
app.get(
  "/api/permits/expired",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const expiredPermits = await prisma.permit.findMany({
        where: {
          status: "APPROVED",
          expiryDate: { lt: today }
        },
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true
            }
          }
        },
        orderBy: { expiryDate: "asc" }
      });

      res.status(200).json({
        totalExpired: expiredPermits.length,
        permits: expiredPermits
      });
    } catch (error) {
      console.error("Error retrieving expired permits:", error);
      res.status(500).json({
        message: "Failed to retrieve expired permits"
      });
    }
  }
);

// PERMITS EXPIRING SOON
app.get(
  "/api/permits/expiring-soon",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      const endDate = new Date(today);
      endDate.setUTCDate(endDate.getUTCDate() + 31);

      const permits = await prisma.permit.findMany({
        where: {
          status: "APPROVED",
          expiryDate: {
            gte: today,
            lt: endDate
          }
        },
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true
            }
          }
        },
        orderBy: { expiryDate: "asc" }
      });

      const millisecondsPerDay = 24 * 60 * 60 * 1000;

      const results = permits.map((permit) => ({
        ...permit,
        daysRemaining: Math.round(
          (permit.expiryDate.getTime() - today.getTime()) /
            millisecondsPerDay
        )
      }));

      res.status(200).json({
        totalExpiringSoon: results.length,
        permits: results
      });
    } catch (error) {
      console.error("Error retrieving expiring permits:", error);
      res.status(500).json({
        message: "Failed to retrieve expiring permits"
      });
    }
  }
);

// GET ONE PERMIT
app.get(
  "/api/permits/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid permit ID"
        });
      }

      const permit = await prisma.permit.findUnique({
        where: { id },
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              phoneNumber: true,
              address: true
            }
          }
        }
      });

      if (!permit) {
        return res.status(404).json({
          message: "Permit not found"
        });
      }

      res.status(200).json(permit);
    } catch (error) {
      console.error("Error retrieving permit:", error);
      res.status(500).json({
        message: "Failed to retrieve permit"
      });
    }
  }
);

// APPROVE OR REJECT PERMIT
app.put(
  "/api/permits/:id/status",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid permit ID"
        });
      }

      if (!["APPROVED", "REJECTED"].includes(status)) {
        return res.status(400).json({
          message: "Status must be APPROVED or REJECTED"
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.permit.updateMany({
          where: {
            id,
            status: "PENDING"
          },
          data: {
            status,
            approvalDate:
              status === "APPROVED" ? new Date() : null
          }
        });

        if (!updated.count) {
          const existing = await tx.permit.findUnique({
            where: { id },
            select: { id: true }
          });

          return {
            error: existing ? 409 : 404,
            message: existing
              ? "Only pending permits can be approved or rejected"
              : "Permit not found"
          };
        }

        const permit = await tx.permit.findUnique({
          where: { id }
        });

        await logActivity(tx, {
          userId: Number(req.user?.id ?? req.user?.userId),
          action: "STATUS_CHANGE",
          module: "PERMITS",
          entityId: id,
          details: `Changed permit status to ${status}`
        });

        return { permit };
      });

      if (result.error) {
        return res.status(result.error).json({
          message: result.message
        });
      }

      res.status(200).json({
        message: "Permit status updated successfully",
        permit: result.permit
      });
    } catch (error) {
      console.error("Error updating permit status:", error);
      res.status(500).json({
        message: "Failed to update permit status"
      });
    }
  }
);

// GET CITIZEN PERMITS
app.get(
  "/api/citizens/:id/permits",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const citizenId = Number(req.params.id);

      if (!Number.isSafeInteger(citizenId) || citizenId <= 0) {
        return res.status(400).json({
          message: "Invalid citizen ID"
        });
      }

      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nationalId: true
        }
      });

      if (!citizen) {
        return res.status(404).json({
          message: "Citizen not found"
        });
      }

      const permits = await prisma.permit.findMany({
        where: { citizenId },
        orderBy: [
          { applicationDate: "desc" },
          { id: "desc" }
        ]
      });

      res.status(200).json({
        citizen,
        totalPermits: permits.length,
        permits
      });
    } catch (error) {
      console.error("Error retrieving citizen permits:", error);
      res.status(500).json({
        message: "Failed to retrieve citizen permits"
      });
    }
  }
);

// UPDATE PERMIT EXPIRY DATE
app.put(
  "/api/permits/:id/expiry",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { expiryDate } = req.body;

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid permit ID"
        });
      }

      if (
        typeof expiryDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(expiryDate)
      ) {
        return res.status(400).json({
          message: "Expiry date must use YYYY-MM-DD format"
        });
      }

      const parsedDate = new Date(
        expiryDate + "T00:00:00.000Z"
      );

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== expiryDate
      ) {
        return res.status(400).json({
          message: "Invalid expiry date"
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const permit = await tx.permit.findUnique({
          where: { id }
        });

        if (!permit) {
          return {
            error: 404,
            message: "Permit not found"
          };
        }

        if (permit.status !== "APPROVED") {
          return {
            error: 409,
            message: "Only approved permits can have an expiry date"
          };
        }

        if (
          !permit.approvalDate ||
          parsedDate <= permit.approvalDate
        ) {
          return {
            error: 400,
            message: "Expiry date must be after approval date"
          };
        }

        const updatedPermit = await tx.permit.update({
          where: { id },
          data: {
            expiryDate: parsedDate
          }
        });

        await logActivity(tx, {
          userId: Number(req.user?.id ?? req.user?.userId),
          action: "UPDATE",
          module: "PERMITS",
          entityId: id,
          details: "Updated permit expiry date"
        });

        return { updatedPermit };
      });

      if (result.error) {
        return res.status(result.error).json({
          message: result.message
        });
      }

      res.status(200).json({
        message: "Permit expiry date updated successfully",
        permit: result.updatedPermit
      });
    } catch (error) {
      console.error("Error updating permit expiry:", error);
      res.status(500).json({
        message: "Failed to update permit expiry date"
      });
    }
  }
);

// RENEW PERMIT
app.put(
  "/api/permits/:id/renew",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { newExpiryDate } = req.body;

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid permit ID"
        });
      }

      if (
        typeof newExpiryDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(newExpiryDate)
      ) {
        return res.status(400).json({
          message: "Date must use YYYY-MM-DD format"
        });
      }

      const parsedDate = new Date(
        newExpiryDate + "T00:00:00.000Z"
      );

      if (
        Number.isNaN(parsedDate.getTime()) ||
        parsedDate.toISOString().slice(0, 10) !== newExpiryDate
      ) {
        return res.status(400).json({
          message: "Invalid renewal expiry date"
        });
      }

      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (parsedDate <= today) {
        return res.status(400).json({
          message: "New expiry date must be in the future"
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        // Lock permit to prevent simultaneous renewals
        await tx.$queryRaw`
          SELECT id FROM Permit
          WHERE id = ${id}
          FOR UPDATE
        `;

        const permit = await tx.permit.findUnique({
          where: { id }
        });

        if (!permit) {
          return {
            error: 404,
            message: "Permit not found"
          };
        }

        if (permit.status !== "APPROVED") {
          return {
            error: 409,
            message: "Only approved permits can be renewed"
          };
        }

        if (!permit.expiryDate) {
          return {
            error: 400,
            message: "Permit has no existing expiry date"
          };
        }

        if (parsedDate <= permit.expiryDate) {
          return {
            error: 400,
            message:
              "New expiry date must be later than current expiry date"
          };
        }

        const renewedPermit = await tx.permit.update({
          where: { id },
          data: {
            expiryDate: parsedDate
          }
        });

        const renewal = await tx.permitRenewal.create({
          data: {
            permitId: id,
            previousExpiry: permit.expiryDate,
            newExpiry: parsedDate
          }
        });

        await logActivity(tx, {
          userId: Number(req.user?.id ?? req.user?.userId),
          action: "RENEW",
          module: "PERMITS",
          entityId: id,
          details: "Renewed permit expiry date"
        });

        return { renewedPermit, renewal };
      });

      if (result.error) {
        return res.status(result.error).json({
          message: result.message
        });
      }

      res.status(200).json({
        message: "Permit renewed successfully",
        permit: result.renewedPermit,
        renewal: result.renewal
      });
    } catch (error) {
      console.error("Error renewing permit:", error);
      res.status(500).json({
        message: "Failed to renew permit"
      });
    }
  }
);

// GET PERMIT RENEWAL HISTORY
app.get(
  "/api/permits/:id/renewals",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid permit ID"
        });
      }

      const permit = await prisma.permit.findUnique({
        where: { id },
        include: {
          renewals: {
            orderBy: [
              { renewalDate: "desc" },
              { id: "desc" }
            ]
          },
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true
            }
          }
        }
      });

      if (!permit) {
        return res.status(404).json({
          message: "Permit not found"
        });
      }

      res.status(200).json({
        permit: {
          id: permit.id,
          type: permit.type,
          status: permit.status,
          currentExpiryDate: permit.expiryDate,
          citizen: permit.citizen
        },
        totalRenewals: permit.renewals.length,
        renewals: permit.renewals
      });
    } catch (error) {
      console.error("Error retrieving renewal history:", error);
      res.status(500).json({
        message: "Failed to retrieve renewal history"
      });
    }
  }
);


app.post(
  "/api/invoices",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const { citizenId, description, amount, dueDate } = req.body;

      // Validate citizen ID
      if (!Number.isSafeInteger(citizenId) || citizenId <= 0) {
        return res.status(400).json({
          message: "Valid citizen ID is required"
        });
      }

      // Validate description
      if (
        typeof description !== "string" ||
        description.trim().length === 0
      ) {
        return res.status(400).json({
          message: "Invoice description is required"
        });
      }

      // Accept a positive amount with up to 2 decimal places
      const amountString = String(amount ?? "");

      if (
        !/^\d+(\.\d{1,2})?$/.test(amountString) ||
        !/[1-9]/.test(amountString.replace(".", "")) ||
        amountString.split(".")[0].length > 10
      ) {
        return res.status(400).json({
          message: "Amount must be positive with up to 2 decimal places"
        });
      }

      // Validate due date format
      if (
        typeof dueDate !== "string" ||
        !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)
      ) {
        return res.status(400).json({
          message: "Due date must use YYYY-MM-DD format"
        });
      }

      const parsedDueDate = new Date(
        dueDate + "T00:00:00.000Z"
      );

      if (
        Number.isNaN(parsedDueDate.getTime()) ||
        parsedDueDate.toISOString().slice(0, 10) !== dueDate
      ) {
        return res.status(400).json({
          message: "Invalid due date"
        });
      }

      // Check that due date is not before today
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (parsedDueDate < today) {
        return res.status(400).json({
          message: "Due date cannot be in the past"
        });
      }

      // Verify citizen exists
      const citizen = await prisma.citizen.findUnique({
        where: { id: citizenId }
      });

      if (!citizen) {
        return res.status(404).json({
          message: "Citizen not found"
        });
      }

      // Get authenticated user ID for audit logging
      const userId = Number(
        req.user?.id ?? req.user?.userId
      );

      // Create invoice and audit log in one transaction
      const invoice = await prisma.$transaction(async (tx) => {

        // STEP 1: Create invoice
        const createdInvoice = await tx.invoice.create({
          data: {
            citizenId,
            description: description.trim(),
            amount: amountString,
            dueDate: parsedDueDate
          }
        });

        // STEP 2: Record audit activity
        await logActivity(tx, {
          userId,
          action: "CREATE",
          module: "FINANCE",
          entityId: createdInvoice.id,
          details: `Created invoice #${createdInvoice.id} for citizen #${citizenId}`
        });

        return createdInvoice;
      });

      res.status(201).json({
        message: "Invoice created successfully",
        invoice
      });

    } catch (error) {
      console.error("Error creating invoice:", error);

      res.status(500).json({
        message: "Failed to create invoice"
      });
    }
  }
);

app.get(
  "/api/invoices",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const { status } = req.query;

      // Validate status
      if (
        status !== undefined &&
        (
          typeof status !== "string" ||
          !["UNPAID", "PAID"].includes(status)
        )
      ) {
        return res.status(400).json({
          message: "Status must be UNPAID or PAID"
        });
      }

      // Validate pagination parameters
      const isPositiveInteger = (value) =>
        typeof value === "string" &&
        /^[1-9]\d*$/.test(value) &&
        Number.isSafeInteger(Number(value));

      if (
        (req.query.page !== undefined &&
          !isPositiveInteger(req.query.page)) ||
        (req.query.limit !== undefined &&
          !isPositiveInteger(req.query.limit))
      ) {
        return res.status(400).json({
          message: "Page and limit must be positive integers"
        });
      }

      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);

      if (limit > 100) {
        return res.status(400).json({
          message: "Maximum limit is 100"
        });
      }

      const skip = (page - 1) * limit;

      if (!Number.isSafeInteger(skip)) {
        return res.status(400).json({
          message: "Page number is too large"
        });
      }

      // Optional status filter
      const where = status ? { status } : {};

      // Count matching invoices
      const total = await prisma.invoice.count({
        where
      });

      // Retrieve invoices
      const invoices = await prisma.invoice.findMany({
        where,
        skip,
        take: limit,
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true
            }
          }
        },
        orderBy: [
          { issueDate: "desc" },
          { id: "desc" }
        ]
      });

      res.status(200).json({
        data: invoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error("Error retrieving invoices:", error);

      res.status(500).json({
        message: "Failed to retrieve invoices"
      });
    }
  }
);

app.get(
  "/api/invoices/statistics",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      // Count all invoices
      const totalInvoices = await prisma.invoice.count();

      // Count paid invoices
      const paidInvoices = await prisma.invoice.count({
        where: { status: "PAID" }
      });

      // Count unpaid invoices
      const unpaidInvoices = await prisma.invoice.count({
        where: { status: "UNPAID" }
      });

      // Calculate total billed amount
      const billedResult = await prisma.invoice.aggregate({
        _sum: {
          amount: true
        }
      });

      // Calculate collected revenue
      const revenueResult = await prisma.invoice.aggregate({
        where: { status: "PAID" },
        _sum: {
          amount: true
        }
      });

      // Calculate outstanding amount
      const outstandingResult = await prisma.invoice.aggregate({
        where: { status: "UNPAID" },
        _sum: {
          amount: true
        }
      });

      const { Prisma } = require("@prisma/client");

      const zero = new Prisma.Decimal(0);

      res.status(200).json({
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        totalBilled: (
          billedResult._sum.amount ?? zero
        ).toFixed(2),
        totalRevenue: (
          revenueResult._sum.amount ?? zero
        ).toFixed(2),
        totalOutstanding: (
          outstandingResult._sum.amount ?? zero
        ).toFixed(2)
      });

    } catch (error) {
      console.error("Error retrieving invoice statistics:", error);

      res.status(500).json({
        message: "Failed to retrieve invoice statistics"
      });
    }
  }
);

app.get(
  "/api/invoices/overdue",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      // Get the start of today in UTC
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Retrieve unpaid invoices past their due date
      const invoices = await prisma.invoice.findMany({
        where: {
          status: "UNPAID",
          dueDate: {
            lt: today
          }
        },
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true
            }
          }
        },
        orderBy: [
          { dueDate: "asc" },
          { id: "asc" }
        ]
      });

      // Calculate how many days each invoice is overdue
      const overdueInvoices = invoices.map((invoice) => {
        const dueDate = new Date(invoice.dueDate);
        dueDate.setUTCHours(0, 0, 0, 0);

        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) /
          (1000 * 60 * 60 * 24)
        );

        return {
          ...invoice,
          daysOverdue
        };
      });

      res.status(200).json({
        totalOverdue: overdueInvoices.length,
        invoices: overdueInvoices
      });

    } catch (error) {
      console.error("Error retrieving overdue invoices:", error);

      res.status(500).json({
        message: "Failed to retrieve overdue invoices"
      });
    }
  }
);

app.get(
  "/api/invoices/due-soon",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      // Start of today in UTC
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // End of the 7-day window
      const endDate = new Date(today);
      endDate.setUTCDate(endDate.getUTCDate() + 7);

      // Retrieve unpaid invoices due within 7 days
      const invoices = await prisma.invoice.findMany({
        where: {
          status: "UNPAID",
          dueDate: {
            gte: today,
            lte: endDate
          }
        },
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true
            }
          }
        },
        orderBy: [
          { dueDate: "asc" },
          { id: "asc" }
        ]
      });

      // Calculate remaining days
      const dueSoonInvoices = invoices.map((invoice) => {
        const dueDate = new Date(invoice.dueDate);

        const daysRemaining = Math.round(
          (dueDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
        );

        return {
          ...invoice,
          daysRemaining
        };
      });

      res.status(200).json({
        totalDueSoon: dueSoonInvoices.length,
        invoices: dueSoonInvoices
      });

    } catch (error) {
      console.error("Error retrieving due-soon invoices:", error);

      res.status(500).json({
        message: "Failed to retrieve due-soon invoices"
      });
    }
  }
);

app.get(
  "/api/invoices/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      // Validate invoice ID
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid invoice ID"
        });
      }

      // Retrieve invoice with citizen details
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true,
              phoneNumber: true,
              address: true
            }
          }
        }
      });

      // Check if invoice exists
      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found"
        });
      }

      res.status(200).json(invoice);

    } catch (error) {
      console.error("Error retrieving invoice:", error);

      res.status(500).json({
        message: "Failed to retrieve invoice"
      });
    }
  }
);


app.put(
  "/api/invoices/:id/pay",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { paymentMethod, transactionReference } = req.body;

      // Validate invoice ID
      if (
        !/^[1-9]\d*$/.test(req.params.id) ||
        !Number.isSafeInteger(id)
      ) {
        return res.status(400).json({
          message: "Invalid invoice ID"
        });
      }

      // Validate payment method
      const allowedMethods = [
        "CASH",
        "BANK_TRANSFER",
        "CARD"
      ];

      if (!allowedMethods.includes(paymentMethod)) {
        return res.status(400).json({
          message: "Invalid payment method"
        });
      }

      // Validate optional transaction reference
      if (
        transactionReference !== undefined &&
        transactionReference !== null &&
        (
          typeof transactionReference !== "string" ||
          transactionReference.trim().length === 0 ||
          transactionReference.length > 100
        )
      ) {
        return res.status(400).json({
          message: "Invalid transaction reference"
        });
      }

      const reference =
        typeof transactionReference === "string"
          ? transactionReference.trim()
          : null;

      // Get the authenticated user ID for audit logging
      const userId = Number(
        req.user?.id ?? req.user?.userId
      );

      // Perform payment, invoice update and audit logging
      // in a single transaction
      const result = await prisma.$transaction(async (tx) => {

        // Lock invoice row against concurrent payment attempts
        await tx.$queryRaw`
          SELECT id FROM Invoice
          WHERE id = ${id}
          FOR UPDATE
        `;

        const invoice = await tx.invoice.findUnique({
          where: { id }
        });

        if (!invoice) {
          return {
            error: 404,
            message: "Invoice not found"
          };
        }

        if (invoice.status !== "UNPAID") {
          return {
            error: 409,
            message: "Invoice has already been paid"
          };
        }

        const paymentDate = new Date();

        // STEP 1: Update invoice
        const updatedInvoice = await tx.invoice.update({
          where: { id },
          data: {
            status: "PAID",
            paidDate: paymentDate
          }
        });

        // STEP 2: Create payment history record
        const payment = await tx.payment.create({
          data: {
            invoiceId: id,
            amount: invoice.amount,
            paymentMethod,
            transactionReference: reference,
            paymentDate
          }
        });

        // STEP 3: Record the payment activity
        await logActivity(tx, {
          userId,
          action: "CREATE",
          module: "FINANCE",
          entityId: payment.id,
          details: `Recorded payment for invoice #${id}`
        });

        // STEP 4: Record the invoice status change
        await logActivity(tx, {
          userId,
          action: "STATUS_CHANGE",
          module: "FINANCE",
          entityId: id,
          details: "Changed invoice status from UNPAID to PAID"
        });

        return {
          updatedInvoice,
          payment
        };
      });

      if (result.error) {
        return res.status(result.error).json({
          message: result.message
        });
      }

      res.status(200).json({
        message: "Payment recorded successfully",
        invoice: result.updatedInvoice,
        payment: result.payment
      });

    } catch (error) {
      console.error("Error recording payment:", error);

      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Transaction reference already exists"
        });
      }

      res.status(500).json({
        message: "Failed to record payment"
      });
    }
  }
);

app.get(
  "/api/citizens/:id/invoices",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      // Validate citizen ID
      if (
        !/^[1-9]\d*$/.test(req.params.id) ||
        !Number.isSafeInteger(id)
      ) {
        return res.status(400).json({
          message: "Invalid citizen ID"
        });
      }

      // Find citizen and their invoices
      const citizen = await prisma.citizen.findUnique({
        where: { id },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          nationalId: true,
          invoices: {
            orderBy: [
              { issueDate: "desc" },
              { id: "desc" }
            ]
          }
        }
      });

      if (!citizen) {
        return res.status(404).json({
          message: "Citizen not found"
        });
      }

      // Calculate totals using Prisma Decimal
      const { Prisma } = require("@prisma/client");

      let totalBilled = new Prisma.Decimal(0);
      let totalPaid = new Prisma.Decimal(0);
      let totalUnpaid = new Prisma.Decimal(0);

      for (const invoice of citizen.invoices) {
        totalBilled = totalBilled.plus(invoice.amount);

        if (invoice.status === "PAID") {
          totalPaid = totalPaid.plus(invoice.amount);
        } else if (invoice.status === "UNPAID") {
          totalUnpaid = totalUnpaid.plus(invoice.amount);
        }
      }

      res.status(200).json({
        citizen: {
          id: citizen.id,
          firstName: citizen.firstName,
          lastName: citizen.lastName,
          nationalId: citizen.nationalId
        },
        summary: {
          totalInvoices: citizen.invoices.length,
          totalBilled: totalBilled.toFixed(2),
          totalPaid: totalPaid.toFixed(2),
          totalUnpaid: totalUnpaid.toFixed(2)
        },
        invoices: citizen.invoices
      });

    } catch (error) {
      console.error("Error retrieving citizen invoices:", error);

      res.status(500).json({
        message: "Failed to retrieve citizen invoices"
      });
    }
  }
);

app.get(
  "/api/invoices/:id/payments",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      // Validate invoice ID
      if (
        !/^[1-9]\d*$/.test(req.params.id) ||
        !Number.isSafeInteger(id)
      ) {
        return res.status(400).json({
          message: "Invalid invoice ID"
        });
      }

      // Find invoice and its payment history
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
          citizen: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              nationalId: true
            }
          },
          payments: {
            orderBy: [
              { paymentDate: "desc" },
              { id: "desc" }
            ]
          }
        }
      });

      if (!invoice) {
        return res.status(404).json({
          message: "Invoice not found"
        });
      }

      // Calculate total payments using Decimal
      const { Prisma } = require("@prisma/client");

      let totalPaid = new Prisma.Decimal(0);

      for (const payment of invoice.payments) {
        totalPaid = totalPaid.plus(payment.amount);
      }

      res.status(200).json({
        invoice: {
          id: invoice.id,
          description: invoice.description,
          amount: invoice.amount,
          status: invoice.status,
          citizen: invoice.citizen
        },
        summary: {
          totalPayments: invoice.payments.length,
          totalPaid: totalPaid.toFixed(2)
        },
        payments: invoice.payments
      });

    } catch (error) {
      console.error("Error retrieving payment history:", error);

      res.status(500).json({
        message: "Failed to retrieve payment history"
      });
    }
  }
);

app.get(
  "/api/payments/statistics",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const { Prisma } = require("@prisma/client");

      // Count payment records
      const totalPayments = await prisma.payment.count();

      // Sum all recorded payments
      const totalResult = await prisma.payment.aggregate({
        _sum: {
          amount: true
        }
      });

      // Group payments by payment method
      const groupedPayments = await prisma.payment.groupBy({
        by: ["paymentMethod"],
        _count: {
          _all: true
        },
        _sum: {
          amount: true
        }
      });

      const methods = ["CASH", "BANK_TRANSFER", "CARD"];

      const byPaymentMethod = {};

      for (const method of methods) {
        const group = groupedPayments.find(
          (item) => item.paymentMethod === method
        );

        byPaymentMethod[method] = {
          count: group?._count._all ?? 0,
          totalAmount: (
            group?._sum.amount ?? new Prisma.Decimal(0)
          ).toFixed(2)
        };
      }

      res.status(200).json({
        totalPayments,
        totalAmount: (
          totalResult._sum.amount ?? new Prisma.Decimal(0)
        ).toFixed(2),
        byPaymentMethod
      });

    } catch (error) {
      console.error("Error retrieving payment statistics:", error);

      res.status(500).json({
        message: "Failed to retrieve payment statistics"
      });
    }
  }
);

app.get(
  "/api/payments",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const page = Number(req.query.page ?? 1);
      const limit = Number(req.query.limit ?? 10);

      const allowedMethods = [
        "CASH",
        "BANK_TRANSFER",
        "CARD"
      ];

      const paymentMethod = req.query.paymentMethod;

      // Validate pagination parameters
      if (
        !Number.isSafeInteger(page) ||
        page < 1 ||
        !Number.isSafeInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return res.status(400).json({
          message: "Invalid pagination parameters"
        });
      }

      // Validate payment method filter
      if (
        paymentMethod !== undefined &&
        (
          typeof paymentMethod !== "string" ||
          !allowedMethods.includes(paymentMethod)
        )
      ) {
        return res.status(400).json({
          message: "Invalid payment method"
        });
      }

      const skip = (page - 1) * limit;

      if (!Number.isSafeInteger(skip)) {
        return res.status(400).json({
          message: "Page number is too large"
        });
      }

      const where = {};

      if (paymentMethod) {
        where.paymentMethod = paymentMethod;
      }

      // Retrieve payments and total count
      const [payments, total] = await prisma.$transaction([
        prisma.payment.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { paymentDate: "desc" },
            { id: "desc" }
          ],
          include: {
            invoice: {
              select: {
                id: true,
                description: true,
                amount: true,
                status: true,
                citizenId: true
              }
            }
          }
        }),

        prisma.payment.count({
          where
        })
      ]);

      res.status(200).json({
        data: payments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

    } catch (error) {
      console.error("Error retrieving payments:", error);

      res.status(500).json({
        message: "Failed to retrieve payments"
      });
    }
  }
);

app.get(
  "/api/payments/:id",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      // Validate payment ID
      if (
        !/^[1-9]\d*$/.test(req.params.id) ||
        !Number.isSafeInteger(id)
      ) {
        return res.status(400).json({
          message: "Invalid payment ID"
        });
      }

      // Find payment and related invoice
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: {
            include: {
              citizen: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  nationalId: true
                }
              }
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({
          message: "Payment not found"
        });
      }

      res.status(200).json({
        message: "Payment retrieved successfully",
        payment
      });

    } catch (error) {
      console.error("Error retrieving payment:", error);

      res.status(500).json({
        message: "Failed to retrieve payment"
      });
    }
  }
);

app.get(
  "/api/payments/:id/receipt",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      // Validate payment ID
      if (
        !/^[1-9]\d*$/.test(req.params.id) ||
        !Number.isSafeInteger(id)
      ) {
        return res.status(400).json({
          message: "Invalid payment ID"
        });
      }

      // Retrieve payment, invoice and citizen
      const payment = await prisma.payment.findUnique({
        where: { id },
        include: {
          invoice: {
            include: {
              citizen: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  nationalId: true
                }
              }
            }
          }
        }
      });

      if (!payment) {
        return res.status(404).json({
          message: "Payment not found"
        });
      }

      const invoice = payment.invoice;
      const citizen = invoice.citizen;

      // Create a unique receipt identifier
      const receiptNumber =
        `REC-${String(payment.id).padStart(6, "0")}`;

      // Build receipt response
      const receipt = {
        receiptNumber,
        paymentId: payment.id,
        invoiceId: invoice.id,
        citizen: {
          id: citizen.id,
          fullName: `${citizen.firstName} ${citizen.lastName}`,
          nationalId: citizen.nationalId
        },
        description: invoice.description,
        amountPaid: payment.amount.toFixed(2),
        paymentMethod: payment.paymentMethod,
        transactionReference: payment.transactionReference,
        paymentDate: payment.paymentDate,
        invoiceStatus: invoice.status
      };

      res.status(200).json({
        message: "Payment receipt generated successfully",
        receipt
      });

    } catch (error) {
      console.error("Error generating payment receipt:", error);

      res.status(500).json({
        message: "Failed to generate payment receipt"
      });
    }
  }
);

app.get(
  "/api/reports/financial",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Validate date format and calendar dates
      const parseDate = (value) => {
        if (
          typeof value !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value)
        ) {
          return null;
        }

        const date = new Date(`${value}T00:00:00.000Z`);

        if (
          Number.isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !== value
        ) {
          return null;
        }

        return date;
      };

      const start = parseDate(startDate);
      const end = parseDate(endDate);

      if (!start || !end || start > end) {
        return res.status(400).json({
          message: "Invalid startDate or endDate"
        });
      }

      // Exclusive end boundary includes the entire end date
      const endExclusive = new Date(end);
      endExclusive.setUTCDate(
        endExclusive.getUTCDate() + 1
      );

      const where = {
        paymentDate: {
          gte: start,
          lt: endExclusive
        }
      };

      const { Prisma } = require("@prisma/client");

      // Retrieve payments in the selected date range
      const payments = await prisma.payment.findMany({
        where,
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          paymentDate: true
        },
        orderBy: [
          { paymentDate: "asc" },
          { id: "asc" }
        ]
      });

      // Calculate totals using Decimal
      let totalAmount = new Prisma.Decimal(0);

      const methods = {
        CASH: {
          count: 0,
          totalAmount: new Prisma.Decimal(0)
        },
        BANK_TRANSFER: {
          count: 0,
          totalAmount: new Prisma.Decimal(0)
        },
        CARD: {
          count: 0,
          totalAmount: new Prisma.Decimal(0)
        }
      };

      const dailyTotals = {};

      for (const payment of payments) {
        totalAmount = totalAmount.plus(payment.amount);

        if (!methods[payment.paymentMethod]) {
          methods[payment.paymentMethod] = {
            count: 0,
            totalAmount: new Prisma.Decimal(0)
          };
        }

        const method = methods[payment.paymentMethod];

        method.count++;
        method.totalAmount =
          method.totalAmount.plus(payment.amount);

        // Group payments by UTC calendar date
        const day = payment.paymentDate
          .toISOString()
          .slice(0, 10);

        if (!dailyTotals[day]) {
          dailyTotals[day] = {
            count: 0,
            totalAmount: new Prisma.Decimal(0)
          };
        }

        dailyTotals[day].count++;
        dailyTotals[day].totalAmount =
          dailyTotals[day].totalAmount.plus(payment.amount);
      }

      // Format payment method totals
      const byPaymentMethod = {};

      for (const [method, data] of Object.entries(methods)) {
        byPaymentMethod[method] = {
          count: data.count,
          totalAmount: data.totalAmount.toFixed(2)
        };
      }

      // Format daily totals
      const dailyCollections = Object.entries(
        dailyTotals
      ).map(([date, data]) => ({
        date,
        count: data.count,
        totalAmount: data.totalAmount.toFixed(2)
      }));

      res.status(200).json({
        period: {
          startDate,
          endDate
        },
        summary: {
          totalPayments: payments.length,
          totalCollected: totalAmount.toFixed(2)
        },
        byPaymentMethod,
        dailyCollections
      });

    } catch (error) {
      console.error("Error generating financial report:", error);

      res.status(500).json({
        message: "Failed to generate financial report"
      });
    }
  }
);

app.get(
  "/api/reports/financial/export",
  authenticateToken,
  authorizeRoles("ADMIN", "EMPLOYEE"),
  async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Validate YYYY-MM-DD calendar dates
      const parseDate = (value) => {
        if (
          typeof value !== "string" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(value)
        ) {
          return null;
        }

        const date = new Date(`${value}T00:00:00.000Z`);

        if (
          Number.isNaN(date.getTime()) ||
          date.toISOString().slice(0, 10) !== value
        ) {
          return null;
        }

        return date;
      };

      const start = parseDate(startDate);
      const end = parseDate(endDate);

      if (!start || !end || start > end) {
        return res.status(400).json({
          message: "Invalid startDate or endDate"
        });
      }

      // Include all payments on the end date
      const endExclusive = new Date(end);
      endExclusive.setUTCDate(
        endExclusive.getUTCDate() + 1
      );

      // Retrieve payment transactions
      const payments = await prisma.payment.findMany({
        where: {
          paymentDate: {
            gte: start,
            lt: endExclusive
          }
        },
        include: {
          invoice: {
            select: {
              id: true,
              description: true,
              citizen: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        },
        orderBy: [
          { paymentDate: "asc" },
          { id: "asc" }
        ]
      });

      // Escape values for CSV format and spreadsheet safety
      const escapeCSV = (value) => {
        let text = String(value ?? "");

        // Prevent spreadsheet formula injection
        if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text)) {
          text = "'" + text;
        }

        return `"${text.replace(/"/g, '""')}"`;
      };

      const headers = [
        "Payment ID",
        "Invoice ID",
        "Citizen",
        "Description",
        "Amount",
        "Payment Method",
        "Transaction Reference",
        "Payment Date"
      ];

      const rows = payments.map((payment) => {
        const citizen = payment.invoice.citizen;

        const values = [
          payment.id,
          payment.invoiceId,
          `${citizen.firstName} ${citizen.lastName}`,
          payment.invoice.description,
          payment.amount.toFixed(2),
          payment.paymentMethod,
          payment.transactionReference,
          payment.paymentDate.toISOString()
        ];

        return values.map(escapeCSV).join(",");
      });

      // Add UTF-8 BOM for Excel compatibility
      const csv =
        "\uFEFF" +
        [
          headers.map(escapeCSV).join(","),
          ...rows
        ].join("\r\n") +
        "\r\n";

      const filename =
        `financial-report-${startDate}-to-${endDate}.csv`;

      res.setHeader(
        "Content-Type",
        "text/csv; charset=utf-8"
      );

      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );

      res.status(200).send(csv);

    } catch (error) {
      console.error("Error exporting financial report:", error);

      res.status(500).json({
        message: "Failed to export financial report"
      });
    }
  }
);

const createSettingsRouter = require("./routes/settings");

app.use(
  "/api/settings",
  createSettingsRouter({ prisma, authenticateToken })
);

const createSearchRouter = require("./routes/search");

app.use(
  "/api/search",
  createSearchRouter({ prisma, authenticateToken })
);

const createNotificationsRouter = require("./routes/notifications");

app.use(
  "/api/notifications",
  createNotificationsRouter({ prisma, authenticateToken })
);

const createProjectsRouter = require("./routes/projects");

app.use(
  "/api/projects",
  createProjectsRouter({ prisma, authenticateToken })
);

const createHrRouter = require("./routes/hr");

app.use(
  "/api/hr",
  createHrRouter({ prisma, authenticateToken })
);

const createEventsRouter = require("./routes/events");

app.use(
  "/api/community",
  createEventsRouter({ prisma, authenticateToken })
);

const createDocumentsRouter = require("./routes/documents");

app.use(
  "/api/documents",
  createDocumentsRouter({ prisma, authenticateToken })
);

// Existing API routes
app.use("/api/projects", createProjectsRouter({ prisma, authenticateToken }));

app.use(
  "/api/documents",
  createDocumentsRouter({ prisma, authenticateToken })
);

app.use(
  "/api/community",
  createEventsRouter({ prisma, authenticateToken })
);

// NEW: Audit Logs
app.use(
  "/api/audit-logs",
  createAuditLogsRouter({ prisma, authenticateToken })
);
// Handle unknown API endpoints
app.use((req, res) => {
  res.status(404).json({
    message: "API endpoint not found"
  });
});

// Centralized error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});


