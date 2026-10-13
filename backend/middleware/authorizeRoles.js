
const prisma = require("../lib/prisma");

function authorizeRoles(...allowedRoles) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;

      // Ensure authentication middleware ran successfully
      if (
        !Number.isSafeInteger(userId) ||
        userId <= 0
      ) {
        return res.status(401).json({
          message: "Authentication required"
        });
      }

      // Retrieve current user and role from database
      const user = await prisma.user.findUnique({
        where: {
          id: userId
        },
        select: {
          id: true,
          role: {
            select: {
              name: true
            }
          }
        }
      });

      // Reject deleted accounts
      if (!user) {
        return res.status(401).json({
          message: "User no longer exists"
        });
      }

      // Reject accounts without a valid role
      if (!user.role?.name) {
        return res.status(403).json({
          message: "User has no valid role"
        });
      }

      // Verify current permissions
      if (!allowedRoles.includes(user.role.name)) {
        return res.status(403).json({
          message: "Access denied: insufficient permissions"
        });
      }

      next();

    } catch (error) {
      console.error("Authorization error:", error);

      return res.status(500).json({
        message: "Authorization failed"
      });
    }
  };
}

module.exports = authorizeRoles;
