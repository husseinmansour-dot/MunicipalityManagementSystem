
const express = require("express");
const { logActivity } = require("../utils/auditLogger");

module.exports = function createProjectsRouter({
  prisma,
  authenticateToken
}) {
  const router = express.Router();

  router.use(authenticateToken);

  const statuses = [
    "PLANNED",
    "IN_PROGRESS",
    "ON_HOLD",
    "COMPLETED",
    "CANCELLED"
  ];

  const taskStatuses = ["TODO", "IN_PROGRESS", "DONE"];
  const priorities = ["LOW", "MEDIUM", "HIGH"];

  function validId(value) {
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  }

  function actorId(req) {
    return validId(req.user?.id ?? req.user?.userId);
  }

  function parseDate(value) {
    if (value === null || value === "") return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  function parseBudget(value) {
    if (value === null || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  }

  async function getRole(req) {
    const userId = actorId(req);
    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: { select: { name: true } }
      }
    });

    return user?.role?.name?.toUpperCase() || null;
  }

  async function requireAdmin(req, res, next) {
    try {
      if ((await getRole(req)) !== "ADMIN") {
        return res.status(403).json({
          message: "Admin access required"
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  }

  function validateProject(body, updating = false) {
    const data = {};

    if (!updating || body.name !== undefined) {
      if (typeof body.name !== "string" || !body.name.trim()) {
        throw new Error("Project name is required");
      }
      data.name = body.name.trim();
    }

    if (body.description !== undefined) {
      data.description = body.description || null;
    }

    if (body.status !== undefined) {
      if (!statuses.includes(body.status)) {
        throw new Error("Invalid project status");
      }
      data.status = body.status;
    }

    if (body.budget !== undefined) {
      const budget = parseBudget(body.budget);
      if (budget === undefined) {
        throw new Error("Invalid budget");
      }
      data.budget = budget;
    }

    for (const field of ["startDate", "endDate"]) {
      if (body[field] !== undefined) {
        const date = parseDate(body[field]);
        if (date === undefined) {
          throw new Error(`Invalid ${field}`);
        }
        data[field] = date;
      }
    }

    if (body.managerId !== undefined) {
      const id =
        body.managerId === null || body.managerId === ""
          ? null
          : validId(body.managerId);

      if (
        id === null &&
        body.managerId !== null &&
        body.managerId !== ""
      ) {
        throw new Error("Invalid manager ID");
      }

      data.managerId = id;
    }

    return data;
  }

  function validateTask(body, updating = false) {
    const data = {};

    if (!updating || body.title !== undefined) {
      if (typeof body.title !== "string" || !body.title.trim()) {
        throw new Error("Task title is required");
      }
      data.title = body.title.trim();
    }

    if (body.description !== undefined) {
      data.description = body.description || null;
    }

    if (body.status !== undefined) {
      if (!taskStatuses.includes(body.status)) {
        throw new Error("Invalid task status");
      }
      data.status = body.status;
    }

    if (body.priority !== undefined) {
      if (!priorities.includes(body.priority)) {
        throw new Error("Invalid priority");
      }
      data.priority = body.priority;
    }

    if (body.dueDate !== undefined) {
      const date = parseDate(body.dueDate);
      if (date === undefined) {
        throw new Error("Invalid due date");
      }
      data.dueDate = date;
    }

    if (body.assignedTo !== undefined) {
      const id =
        body.assignedTo === null || body.assignedTo === ""
          ? null
          : validId(body.assignedTo);

      if (
        id === null &&
        body.assignedTo !== null &&
        body.assignedTo !== ""
      ) {
        throw new Error("Invalid assignee ID");
      }

      data.assignedTo = id;
    }

    return data;
  }

  // GET ALL PROJECTS
  router.get("/", async (req, res, next) => {
    try {
      const projects = await prisma.project.findMany({
        include: {
          manager: {
            select: { id: true, fullName: true }
          },
          _count: {
            select: { tasks: true }
          }
        },
        orderBy: { createdAt: "desc" }
      });

      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  // GET EMPLOYEES FOR ASSIGNMENT
  router.get("/employees", async (req, res, next) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: {
            is: {
              name: { in: ["ADMIN", "EMPLOYEE"] }
            }
          }
        },
        select: {
          id: true,
          fullName: true,
          role: { select: { name: true } }
        },
        orderBy: { fullName: "asc" }
      });

      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  // GET ONE PROJECT AND ITS TASKS
  router.get("/:id", async (req, res, next) => {
    try {
      const id = validId(req.params.id);

      if (!id) {
        return res.status(400).json({
          message: "Invalid project ID"
        });
      }

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          manager: {
            select: { id: true, fullName: true }
          },
          tasks: {
            include: {
              assignee: {
                select: { id: true, fullName: true }
              }
            },
            orderBy: { createdAt: "desc" }
          }
        }
      });

      if (!project) {
        return res.status(404).json({
          message: "Project not found"
        });
      }

      res.json(project);
    } catch (error) {
      next(error);
    }
  });

  // CREATE PROJECT (ADMIN)
  router.post("/", requireAdmin, async (req, res, next) => {
    try {
      const data = validateProject(req.body);

      const project = await prisma.$transaction(async (tx) => {
        const created = await tx.project.create({ data });

        await logActivity(tx, {
          userId: actorId(req),
          action: "CREATE",
          module: "PROJECTS",
          entityId: created.id,
          details: "Created a new project"
        });

        return created;
      });

      res.status(201).json(project);
    } catch (error) {
      if (
        error.message?.startsWith("Invalid") ||
        error.message === "Project name is required"
      ) {
        return res.status(400).json({
          message: error.message
        });
      }

      next(error);
    }
  });

  // UPDATE PROJECT (ADMIN)
  router.put("/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = validId(req.params.id);

      if (!id) {
        return res.status(400).json({
          message: "Invalid project ID"
        });
      }

      const data = validateProject(req.body, true);

      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.project.findUnique({
          where: { id },
          select: { id: true, status: true }
        });

        if (!existing) {
          return { notFound: true };
        }

        const project = await tx.project.update({
          where: { id },
          data
        });

        const statusChanged =
          data.status !== undefined &&
          data.status !== existing.status;

        await logActivity(tx, {
          userId: actorId(req),
          action: statusChanged ? "STATUS_CHANGE" : "UPDATE",
          module: "PROJECTS",
          entityId: id,
          details: statusChanged
            ? `Changed project status to ${data.status}`
            : "Updated project information"
        });

        return { project };
      });

      if (result.notFound) {
        return res.status(404).json({
          message: "Project not found"
        });
      }

      res.json(result.project);
    } catch (error) {
      if (
        error.message?.startsWith("Invalid") ||
        error.message === "Project name is required"
      ) {
        return res.status(400).json({
          message: error.message
        });
      }

      next(error);
    }
  });

  // DELETE PROJECT (ADMIN)
  router.delete("/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = validId(req.params.id);

      if (!id) {
        return res.status(400).json({
          message: "Invalid project ID"
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const deleted = await tx.project.deleteMany({
          where: { id }
        });

        if (!deleted.count) {
          return { notFound: true };
        }

        await logActivity(tx, {
          userId: actorId(req),
          action: "DELETE",
          module: "PROJECTS",
          entityId: id,
          details: "Deleted a project and its tasks"
        });

        return { deleted: true };
      });

      if (result.notFound) {
        return res.status(404).json({
          message: "Project not found"
        });
      }

      res.json({
        message: "Project and its tasks deleted"
      });
    } catch (error) {
      next(error);
    }
  });

  // CREATE TASK (ADMIN)
  router.post("/:id/tasks", requireAdmin, async (req, res, next) => {
    try {
      const projectId = validId(req.params.id);

      if (!projectId) {
        return res.status(400).json({
          message: "Invalid project ID"
        });
      }

      const data = validateTask(req.body);

      const result = await prisma.$transaction(async (tx) => {
        const exists = await tx.project.findUnique({
          where: { id: projectId },
          select: { id: true }
        });

        if (!exists) {
          return { notFound: true };
        }

        const task = await tx.projectTask.create({
          data: {
            ...data,
            projectId
          }
        });

        await logActivity(tx, {
          userId: actorId(req),
          action: "CREATE",
          module: "PROJECTS",
          entityId: task.id,
          details: `Created a task in project #${projectId}`
        });

        return { task };
      });

      if (result.notFound) {
        return res.status(404).json({
          message: "Project not found"
        });
      }

      res.status(201).json(result.task);
    } catch (error) {
      if (
        error.message?.startsWith("Invalid") ||
        error.message === "Task title is required"
      ) {
        return res.status(400).json({
          message: error.message
        });
      }

      next(error);
    }
  });

  // UPDATE TASK (ADMIN OR ASSIGNED EMPLOYEE)
  router.put("/tasks/:taskId", async (req, res, next) => {
    try {
      const id = validId(req.params.taskId);

      if (!id) {
        return res.status(400).json({
          message: "Invalid task ID"
        });
      }

      const role = await getRole(req);
      const userId = actorId(req);

      const data = validateTask(req.body, true);

      if (
        role !== "ADMIN" &&
        Object.keys(data).some(key => key !== "status")
      ) {
        return res.status(403).json({
          message: "Employees may only change task status"
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const task = await tx.projectTask.findUnique({
          where: { id }
        });

        if (!task) {
          return { notFound: true };
        }

        if (role !== "ADMIN" && task.assignedTo !== userId) {
          return { forbidden: true };
        }

        const updated = await tx.projectTask.update({
          where: { id },
          data
        });

        const statusChanged =
          data.status !== undefined &&
          data.status !== task.status;

        await logActivity(tx, {
          userId,
          action: statusChanged ? "STATUS_CHANGE" : "UPDATE",
          module: "PROJECTS",
          entityId: id,
          details: statusChanged
            ? `Changed task status to ${data.status}`
            : "Updated project task"
        });

        return { updated };
      });

      if (result.notFound) {
        return res.status(404).json({
          message: "Task not found"
        });
      }

      if (result.forbidden) {
        return res.status(403).json({
          message: "Not allowed to update this task"
        });
      }

      res.json(result.updated);
    } catch (error) {
      if (
        error.message?.startsWith("Invalid") ||
        error.message === "Task title is required"
      ) {
        return res.status(400).json({
          message: error.message
        });
      }

      next(error);
    }
  });

  // DELETE TASK (ADMIN)
  router.delete(
    "/tasks/:taskId",
    requireAdmin,
    async (req, res, next) => {
      try {
        const id = validId(req.params.taskId);

        if (!id) {
          return res.status(400).json({
            message: "Invalid task ID"
          });
        }

        const result = await prisma.$transaction(async (tx) => {
          const deleted = await tx.projectTask.deleteMany({
            where: { id }
          });

          if (!deleted.count) {
            return { notFound: true };
          }

          await logActivity(tx, {
            userId: actorId(req),
            action: "DELETE",
            module: "PROJECTS",
            entityId: id,
            details: "Deleted a project task"
          });

          return { deleted: true };
        });

        if (result.notFound) {
          return res.status(404).json({
            message: "Task not found"
          });
        }

        res.json({
          message: "Task deleted"
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
};
