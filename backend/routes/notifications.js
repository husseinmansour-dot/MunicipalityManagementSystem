
const express = require("express");

module.exports = function createNotificationsRouter({
  prisma,
  authenticateToken
}) {
  const router = express.Router();

  router.use(authenticateToken);

  // Resolve the current authenticated user
  router.use(async (req, res, next) => {
    try {
      const userId = Number(
        req.user?.id ?? req.user?.userId
      );

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(401).json({
          message: "Invalid authentication token"
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true }
      });

      if (!user) {
        return res.status(401).json({
          message: "User not found"
        });
      }

      req.notificationUserId = user.id;
      next();
    } catch (error) {
      next(error);
    }
  });

  // API 1: GET NOTIFICATIONS
  router.get("/", async (req, res, next) => {
    try {
      const userId = req.notificationUserId;

      const [notifications, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 30
        }),
        prisma.notification.count({
          where: {
            userId,
            isRead: false
          }
        })
      ]);

      res.status(200).json({
        notifications,
        unreadCount
      });
    } catch (error) {
      next(error);
    }
  });

  // API 2: GET UNREAD COUNT
  router.get("/unread-count", async (req, res, next) => {
    try {
      const unreadCount = await prisma.notification.count({
        where: {
          userId: req.notificationUserId,
          isRead: false
        }
      });

      res.status(200).json({ unreadCount });
    } catch (error) {
      next(error);
    }
  });

  // API 3: MARK ALL AS READ
  router.patch("/read-all", async (req, res, next) => {
    try {
      const result = await prisma.notification.updateMany({
        where: {
          userId: req.notificationUserId,
          isRead: false
        },
        data: { isRead: true }
      });

      res.status(200).json({
        message: "All notifications marked as read",
        updatedCount: result.count
      });
    } catch (error) {
      next(error);
    }
  });

  // API 4: MARK ONE AS READ
  router.patch("/:id/read", async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid notification ID"
        });
      }

      const result = await prisma.notification.updateMany({
        where: {
          id,
          userId: req.notificationUserId
        },
        data: { isRead: true }
      });

      if (result.count === 0) {
        return res.status(404).json({
          message: "Notification not found"
        });
      }

      res.status(200).json({
        message: "Notification marked as read"
      });
    } catch (error) {
      next(error);
    }
  });

  // API 5: DELETE NOTIFICATION
  router.delete("/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          message: "Invalid notification ID"
        });
      }

      const result = await prisma.notification.deleteMany({
        where: {
          id,
          userId: req.notificationUserId
        }
      });

      if (result.count === 0) {
        return res.status(404).json({
          message: "Notification not found"
        });
      }

      res.status(200).json({
        message: "Notification deleted"
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
