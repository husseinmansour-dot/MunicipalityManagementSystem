
const express = require("express");
const bcrypt = require("bcryptjs");

module.exports = function createSettingsRouter({
  prisma,
  authenticateToken
}) {
  const router = express.Router();

  // All Settings APIs require authentication
  router.use(authenticateToken);

  // Retrieve the logged-in user from the database
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
        include: { role: true }
      });

      if (!user) {
        return res.status(401).json({
          message: "User not found"
        });
      }

      req.settingsUser = user;
      next();
    } catch (error) {
      next(error);
    }
  });

  const publicUser = {
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
  };

  // API 1: GET PROFILE
  router.get("/profile", async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.settingsUser.id },
        select: publicUser
      });

      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  });

  // API 2: UPDATE PROFILE
  router.put("/profile", async (req, res, next) => {
    try {
      const { fullName, email } = req.body || {};

      if (
        typeof fullName !== "string" ||
        !fullName.trim() ||
        fullName.trim().length > 150 ||
        typeof email !== "string" ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        email.trim().length > 254
      ) {
        return res.status(400).json({
          message: "Valid full name and email are required"
        });
      }

      const user = await prisma.user.update({
        where: { id: req.settingsUser.id },
        data: {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase()
        },
        select: publicUser
      });

      res.status(200).json({
        message: "Profile updated successfully",
        user
      });
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Email already exists"
        });
      }
      next(error);
    }
  });

  // API 3: CHANGE PASSWORD
  router.put("/change-password", async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body || {};

      if (
        typeof currentPassword !== "string" ||
        typeof newPassword !== "string" ||
        newPassword.length < 8 ||
        newPassword.length > 128
      ) {
        return res.status(400).json({
          message: "New password must contain 8 to 128 characters"
        });
      }

      const isValid = await bcrypt.compare(
        currentPassword,
        req.settingsUser.passwordHash
      );

      if (!isValid) {
        return res.status(400).json({
          message: "Current password is incorrect"
        });
      }

      if (currentPassword === newPassword) {
        return res.status(400).json({
          message: "New password must be different"
        });
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: req.settingsUser.id },
        data: { passwordHash }
      });

      res.status(200).json({
        message: "Password changed successfully"
      });
    } catch (error) {
      next(error);
    }
  });

  // API 4: GET MUNICIPALITY INFORMATION
  router.get("/municipality", async (req, res, next) => {
    try {
      const municipality =
        await prisma.municipalitySettings.findUnique({
          where: { id: 1 }
        });

      res.status(200).json(
        municipality || {
          name: "",
          address: "",
          phone: "",
          email: ""
        }
      );
    } catch (error) {
      next(error);
    }
  });

  // API 5: UPDATE MUNICIPALITY INFORMATION
  router.put("/municipality", async (req, res, next) => {
    try {
      if (req.settingsUser.role?.name?.toUpperCase() !== "ADMIN") {
        return res.status(403).json({
          message: "Only administrators can update municipality information"
        });
      }

      const { name, address, phone, email } = req.body || {};

      if (
        [name, address, phone, email].some(
          value => typeof value !== "string"
        ) ||
        !name.trim() ||
        name.trim().length > 150 ||
        address.length > 300 ||
        phone.length > 50 ||
        email.length > 254 ||
        (
          email.trim() &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
        )
      ) {
        return res.status(400).json({
          message: "Invalid municipality information"
        });
      }

      const data = {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim()
      };

      const municipality =
        await prisma.municipalitySettings.upsert({
          where: { id: 1 },
          create: { id: 1, ...data },
          update: data
        });

      res.status(200).json({
        message: "Municipality updated successfully",
        municipality
      });
    } catch (error) {
      next(error);
    }
  });

  // API 6: GET USER PREFERENCES
  router.get("/preferences", async (req, res, next) => {
    try {
      const preferences =
        await prisma.userPreferences.findUnique({
          where: { userId: req.settingsUser.id }
        });

      res.status(200).json(
        preferences || {
          userId: req.settingsUser.id,
          emailNotifications: true,
          language: "en"
        }
      );
    } catch (error) {
      next(error);
    }
  });

  // API 7: UPDATE USER PREFERENCES
  router.put("/preferences", async (req, res, next) => {
    try {
      const { emailNotifications, language } = req.body || {};

      if (
        typeof emailNotifications !== "boolean" ||
        !["en", "ar", "fr"].includes(language)
      ) {
        return res.status(400).json({
          message: "Invalid preferences"
        });
      }

      const preferences =
        await prisma.userPreferences.upsert({
          where: { userId: req.settingsUser.id },
          create: {
            userId: req.settingsUser.id,
            emailNotifications,
            language
          },
          update: {
            emailNotifications,
            language
          }
        });

      res.status(200).json({
        message: "Preferences saved successfully",
        preferences
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
