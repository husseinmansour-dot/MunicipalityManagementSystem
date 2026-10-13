
const express = require("express");

module.exports = function createEventsRouter({ prisma, authenticateToken }) {
  const router = express.Router();
  router.use(authenticateToken);

  // Resolve permissions from the database, not from a client-provided role.
  router.use(async (req, res, next) => {
    try {
      const id = Number(req.user?.id ?? req.user?.userId);
      if (!Number.isSafeInteger(id) || id < 1) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await prisma.user.findUnique({
        where: { id },
        select: { role: { select: { name: true } } }
      });

      if (!user) return res.status(401).json({ message: "Unauthorized" });

      req.isEventsAdmin = user.role.name.toUpperCase() === "ADMIN";
      next();
    } catch (err) {
      next(err);
    }
  });

  const adminOnly = (req, res, next) =>
    req.isEventsAdmin
      ? next()
      : res.status(403).json({ message: "ADMIN access required" });

  const eventStatuses = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"];
  const announcementStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];
  const categories = ["GENERAL", "PUBLIC_NOTICE", "MAINTENANCE", "COMMUNITY"];

  function validId(value) {
    const id = Number(value);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
  }

  function eventPayload(body) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      throw new Error("Event title is required");
    }

    const startDate = new Date(body.startDate);
    if (Number.isNaN(startDate.getTime())) {
      throw new Error("Valid start date is required");
    }

    const endDate = body.endDate ? new Date(body.endDate) : null;
    if (endDate && (Number.isNaN(endDate.getTime()) || endDate < startDate)) {
      throw new Error("End date must be on or after start date");
    }

    const status = body.status || "SCHEDULED";
    if (!eventStatuses.includes(status)) throw new Error("Invalid event status");

    return {
      title: body.title.trim(),
      description: String(body.description || "").trim() || null,
      location: String(body.location || "").trim() || null,
      startDate,
      endDate,
      status
    };
  }

  function announcementPayload(body, existing = null) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      throw new Error("Announcement title is required");
    }
    if (typeof body.content !== "string" || !body.content.trim()) {
      throw new Error("Announcement content is required");
    }

    const status = body.status || "DRAFT";
    const category = body.category || "GENERAL";

    if (!announcementStatuses.includes(status)) {
      throw new Error("Invalid announcement status");
    }
    if (!categories.includes(category)) {
      throw new Error("Invalid announcement category");
    }

    return {
      title: body.title.trim(),
      content: body.content.trim(),
      category,
      status,
      publishedAt: status === "PUBLISHED"
        ? existing?.publishedAt || new Date()
        : null
    };
  }

  const handleError = (err, res, next) => {
    if (
      err.message?.includes("required") ||
      err.message?.startsWith("Invalid") ||
      err.message?.startsWith("End date")
    ) {
      return res.status(400).json({ message: err.message });
    }
    next(err);
  };

  // EVENTS
  router.get("/events", async (req, res, next) => {
    try {
      const events = await prisma.municipalEvent.findMany({
        orderBy: { startDate: "asc" }
      });
      res.json(events);
    } catch (err) { next(err); }
  });

  router.post("/events", adminOnly, async (req, res, next) => {
    try {
      const event = await prisma.municipalEvent.create({
        data: eventPayload(req.body)
      });
      res.status(201).json(event);
    } catch (err) { handleError(err, res, next); }
  });

  router.put("/events/:id", adminOnly, async (req, res, next) => {
    try {
      const id = validId(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid ID" });

      const data = eventPayload(req.body);
      const result = await prisma.municipalEvent.updateMany({
        where: { id },
        data
      });

      if (!result.count) return res.status(404).json({ message: "Event not found" });

      res.json(await prisma.municipalEvent.findUnique({ where: { id } }));
    } catch (err) { handleError(err, res, next); }
  });

  router.delete("/events/:id", adminOnly, async (req, res, next) => {
    try {
      const id = validId(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid ID" });

      const result = await prisma.municipalEvent.deleteMany({ where: { id } });
      if (!result.count) return res.status(404).json({ message: "Event not found" });

      res.json({ message: "Event deleted" });
    } catch (err) { next(err); }
  });

  // ANNOUNCEMENTS
  router.get("/announcements", async (req, res, next) => {
    try {
      const announcements = await prisma.announcement.findMany({
        where: req.isEventsAdmin ? {} : { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" }
      });
      res.json(announcements);
    } catch (err) { next(err); }
  });

  router.post("/announcements", adminOnly, async (req, res, next) => {
    try {
      const announcement = await prisma.announcement.create({
        data: announcementPayload(req.body)
      });
      res.status(201).json(announcement);
    } catch (err) { handleError(err, res, next); }
  });

  router.put("/announcements/:id", adminOnly, async (req, res, next) => {
    try {
      const id = validId(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid ID" });

      const existing = await prisma.announcement.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ message: "Announcement not found" });

      const announcement = await prisma.announcement.update({
        where: { id },
        data: announcementPayload(req.body, existing)
      });

      res.json(announcement);
    } catch (err) { handleError(err, res, next); }
  });

  router.delete("/announcements/:id", adminOnly, async (req, res, next) => {
    try {
      const id = validId(req.params.id);
      if (!id) return res.status(400).json({ message: "Invalid ID" });

      const result = await prisma.announcement.deleteMany({ where: { id } });
      if (!result.count) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      res.json({ message: "Announcement deleted" });
    } catch (err) { next(err); }
  });

  return router;
};
