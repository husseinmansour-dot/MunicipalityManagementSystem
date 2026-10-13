
const express = require("express");
const { logActivity } = require("../utils/auditLogger");

module.exports = function createHrRouter({ prisma, authenticateToken }) {
  const router = express.Router();

  router.use(authenticateToken);

  function getActorId(req) {
    return Number(req.user?.id ?? req.user?.userId);
  }

  // HR records include sensitive salary information.
  // Only ADMIN users may access this module.
  router.use(async (req, res, next) => {
    try {
      const userId = getActorId(req);

      if (!Number.isSafeInteger(userId) || userId <= 0) {
        return res.status(401).json({
          message: "Authentication required"
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          role: {
            select: { name: true }
          }
        }
      });

      if (user?.role?.name?.toUpperCase() !== "ADMIN") {
        return res.status(403).json({
          message: "HR access requires ADMIN role"
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  });

  const statuses = ["ACTIVE", "ON_LEAVE", "INACTIVE"];

  const idOf = value => {
    const n = Number(value);
    return Number.isSafeInteger(n) && n > 0 ? n : null;
  };

  function employeeData(body, creating = false) {
    const data = {};

    for (const field of ["firstName", "lastName", "jobTitle"]) {
      if (creating || body[field] !== undefined) {
        if (
          typeof body[field] !== "string" ||
          !body[field].trim()
        ) {
          throw new Error(`${field} is required`);
        }

        data[field] = body[field].trim();
      }
    }

    for (const field of ["email", "phone"]) {
      if (body[field] !== undefined) {
        if (
          body[field] !== null &&
          typeof body[field] !== "string"
        ) {
          throw new Error(`Invalid ${field}`);
        }

        data[field] = body[field]?.trim() || null;
      }
    }

    if (body.status !== undefined) {
      if (!statuses.includes(body.status)) {
        throw new Error("Invalid status");
      }

      data.status = body.status;
    }

    if (creating || body.hireDate !== undefined) {
      const date = new Date(body.hireDate);

      if (Number.isNaN(date.getTime())) {
        throw new Error("Invalid hireDate");
      }

      data.hireDate = date;
    }

    if (body.salary !== undefined) {
      if (body.salary === "" || body.salary === null) {
        data.salary = null;
      } else {
        const salary = Number(body.salary);

        if (!Number.isFinite(salary) || salary < 0) {
          throw new Error("Invalid salary");
        }

        data.salary = salary;
      }
    }

    for (const field of ["departmentId", "userId"]) {
      if (body[field] !== undefined) {
        if (body[field] === null || body[field] === "") {
          data[field] = null;
        } else {
          const id = idOf(body[field]);

          if (!id) {
            throw new Error(`Invalid ${field}`);
          }

          data[field] = id;
        }
      }
    }

    return data;
  }

  const include = {
    department: {
      select: { id: true, name: true }
    },
    user: {
      select: {
        id: true,
        fullName: true,
        email: true
      }
    }
  };

  // GET /api/hr/departments
  router.get("/departments", async (req, res, next) => {
    try {
      const departments = await prisma.department.findMany({
        include: {
          _count: {
            select: { employees: true }
          }
        },
        orderBy: { name: "asc" }
      });

      res.json(departments);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/hr/departments
  // Audit: CREATE department
  router.post("/departments", async (req, res, next) => {
    try {
      const name = req.body?.name;

      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          message: "Department name is required"
        });
      }

      const department = await prisma.$transaction(async (tx) => {
        const created = await tx.department.create({
          data: { name: name.trim() }
        });

        await logActivity(tx, {
          userId: getActorId(req),
          action: "CREATE",
          module: "HR",
          entityId: created.id,
          details: "Created a new department"
        });

        return created;
      });

      res.status(201).json(department);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Department already exists"
        });
      }

      next(error);
    }
  });

  // GET /api/hr/employees
  router.get("/employees", async (req, res, next) => {
    try {
      const search = String(req.query.search || "")
        .trim()
        .slice(0, 100);

      const status = String(req.query.status || "ALL");

      const departmentId = req.query.departmentId
        ? idOf(req.query.departmentId)
        : null;

      if (status !== "ALL" && !statuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid status filter"
        });
      }

      if (req.query.departmentId && !departmentId) {
        return res.status(400).json({
          message: "Invalid department filter"
        });
      }

      const where = {
        ...(status !== "ALL" ? { status } : {}),
        ...(departmentId ? { departmentId } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
                { jobTitle: { contains: search } },
                {
                  department: {
                    is: {
                      name: { contains: search }
                    }
                  }
                }
              ]
            }
          : {})
      };

      const employees = await prisma.employee.findMany({
        where,
        include,
        orderBy: [{ createdAt: "desc" }]
      });

      res.json(employees);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/hr/stats
  router.get("/stats", async (req, res, next) => {
    try {
      const [
        total,
        active,
        onLeave,
        inactive,
        departments
      ] = await Promise.all([
        prisma.employee.count(),
        prisma.employee.count({
          where: { status: "ACTIVE" }
        }),
        prisma.employee.count({
          where: { status: "ON_LEAVE" }
        }),
        prisma.employee.count({
          where: { status: "INACTIVE" }
        }),
        prisma.department.count()
      ]);

      res.json({
        total,
        active,
        onLeave,
        inactive,
        departments
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/hr/users (unlinked system users)
  router.get("/users", async (req, res, next) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          employee: { is: null }
        },
        select: {
          id: true,
          fullName: true,
          email: true
        },
        orderBy: { fullName: "asc" }
      });

      res.json(users);
    } catch (error) {
      next(error);
    }
  });

  // GET /api/hr/employees/:id
  router.get("/employees/:id", async (req, res, next) => {
    try {
      const id = idOf(req.params.id);

      if (!id) {
        return res.status(400).json({
          message: "Invalid employee ID"
        });
      }

      const employee = await prisma.employee.findUnique({
        where: { id },
        include
      });

      if (!employee) {
        return res.status(404).json({
          message: "Employee not found"
        });
      }

      res.json(employee);
    } catch (error) {
      next(error);
    }
  });

  // POST /api/hr/employees
  // Audit: CREATE employee
  router.post("/employees", async (req, res, next) => {
    try {
      const data = employeeData(req.body, true);

      const employee = await prisma.$transaction(async (tx) => {
        const created = await tx.employee.create({
          data,
          include
        });

        await logActivity(tx, {
          userId: getActorId(req),
          action: "CREATE",
          module: "HR",
          entityId: created.id,
          details: "Created a new employee"
        });

        return created;
      });

      res.status(201).json(employee);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Email or linked user already exists"
        });
      }

      if (error.code === "P2003") {
        return res.status(400).json({
          message: "Invalid department or user reference"
        });
      }

      if (
        error.message?.includes("required") ||
        error.message?.startsWith("Invalid")
      ) {
        return res.status(400).json({
          message: error.message
        });
      }

      next(error);
    }
  });

  // PUT /api/hr/employees/:id
  // Audit: UPDATE employee
  router.put("/employees/:id", async (req, res, next) => {
    try {
      const id = idOf(req.params.id);

      if (!id) {
        return res.status(400).json({
          message: "Invalid employee ID"
        });
      }

      const data = employeeData(req.body);

      const result = await prisma.$transaction(async (tx) => {
        const updateResult = await tx.employee.updateMany({
          where: { id },
          data
        });

        if (!updateResult.count) {
          return { notFound: true };
        }

        await logActivity(tx, {
          userId: getActorId(req),
          action: "UPDATE",
          module: "HR",
          entityId: id,
          details: "Updated employee information"
        });

        const employee = await tx.employee.findUnique({
          where: { id },
          include
        });

        return { employee };
      });

      if (result.notFound) {
        return res.status(404).json({
          message: "Employee not found"
        });
      }

      res.json(result.employee);
    } catch (error) {
      if (error.code === "P2002") {
        return res.status(409).json({
          message: "Email or linked user already exists"
        });
      }

      if (error.code === "P2003") {
        return res.status(400).json({
          message: "Invalid department or user reference"
        });
      }

      if (
        error.message?.includes("required") ||
        error.message?.startsWith("Invalid")
      ) {
        return res.status(400).json({
          message: error.message
        });
      }

      next(error);
    }
  });

  // PATCH /api/hr/employees/:id/deactivate
  // Audit: STATUS_CHANGE employee
  router.patch("/employees/:id/deactivate", async (req, res, next) => {
    try {
      const id = idOf(req.params.id);

      if (!id) {
        return res.status(400).json({
          message: "Invalid employee ID"
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.employee.updateMany({
          where: {
            id,
            status: { not: "INACTIVE" }
          },
          data: {
            status: "INACTIVE"
          }
        });

        if (updated.count === 1) {
          await logActivity(tx, {
            userId: getActorId(req),
            action: "STATUS_CHANGE",
            module: "HR",
            entityId: id,
            details: "Changed employee status to INACTIVE"
          });

          return { deactivated: true };
        }

        const employee = await tx.employee.findUnique({
          where: { id },
          select: { status: true }
        });

        if (!employee) {
          return { notFound: true };
        }

        return { alreadyInactive: true };
      });

      if (result.notFound) {
        return res.status(404).json({
          message: "Employee not found"
        });
      }

      res.json({
        message: result.alreadyInactive
          ? "Employee is already inactive"
          : "Employee deactivated"
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
};
