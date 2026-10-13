
const express = require("express");

module.exports = function createAuditLogsRouter({
  prisma,
  authenticateToken
}) {
  const router = express.Router();

  router.use(authenticateToken);

  // Only ADMIN users can view audit logs.
  router.use(async (req, res, next) => {
    try {
      const userId = Number(req.user?.id ?? req.user?.userId);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: { select: { name: true } }
        }
      });

      if (user?.role?.name?.toUpperCase() !== "ADMIN") {
        return res.status(403).json({
          message: "Only ADMIN can access audit logs"
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  });

  router.get("/", async (req, res, next) => {
    try {
      const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
      const limit = Math.min(
        100,
        Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
      );

      const moduleFilter = String(req.query.module || "").trim();
      const actionFilter = String(req.query.action || "").trim();

      const where = {
        ...(moduleFilter ? { module: moduleFilter } : {}),
        ...(actionFilter ? { action: actionFilter } : {})
      };

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          },
          orderBy: [
            { createdAt: "desc" },
            { id: "desc" }
          ],
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.auditLog.count({ where })
      ]);

      res.json({
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
