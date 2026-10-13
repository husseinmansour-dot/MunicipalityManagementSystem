
const express = require("express");

module.exports = function createSearchRouter({
  prisma,
  authenticateToken
}) {
  const router = express.Router();

  router.use(authenticateToken);

  router.get("/", async (req, res) => {
    try {
      const q = String(req.query.q || "").trim();

      if (q.length < 2) {
        return res.status(200).json({
          citizens: [],
          requests: [],
          permits: []
        });
      }

      if (q.length > 100) {
        return res.status(400).json({
          message: "Search query is too long"
        });
      }

      const numericId = /^\d+$/.test(q)
        ? Number(q)
        : null;

      const validId =
        numericId !== null &&
        Number.isSafeInteger(numericId) &&
        numericId > 0
          ? numericId
          : null;

      const nameParts = q.split(/\s+/).filter(Boolean);

      const citizenNameSearch = nameParts.length >= 2
        ? {
            AND: [
              {
                firstName: {
                  contains: nameParts[0]
                }
              },
              {
                lastName: {
                  contains: nameParts.slice(1).join(" ")
                }
              }
            ]
          }
        : null;

      const citizenFilters = [
        { firstName: { contains: q } },
        { lastName: { contains: q } },
        { nationalId: { contains: q } },
        { phoneNumber: { contains: q } }
      ];

      if (citizenNameSearch) {
        citizenFilters.push(citizenNameSearch);
      }

      if (validId !== null) {
        citizenFilters.push({ id: validId });
      }

      const relatedCitizenFilter = {
        OR: citizenFilters
      };

      const requestFilters = [
        { type: { contains: q } },
        { status: { contains: q } },
        { citizen: { is: relatedCitizenFilter } }
      ];

      const permitFilters = [
        { type: { contains: q } },
        { status: { contains: q } },
        { citizen: { is: relatedCitizenFilter } }
      ];

      if (validId !== null) {
        requestFilters.push({ id: validId });
        permitFilters.push({ id: validId });
      }

      const [citizens, requests, permits] = await Promise.all([
        prisma.citizen.findMany({
          where: { OR: citizenFilters },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            nationalId: true
          },
          take: 5,
          orderBy: { id: "desc" }
        }),

        prisma.request.findMany({
          where: { OR: requestFilters },
          select: {
            id: true,
            type: true,
            status: true,
            citizen: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          take: 5,
          orderBy: { id: "desc" }
        }),

        prisma.permit.findMany({
          where: { OR: permitFilters },
          select: {
            id: true,
            type: true,
            status: true,
            citizen: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          take: 5,
          orderBy: { id: "desc" }
        })
      ]);

      return res.status(200).json({
        citizens,
        requests,
        permits
      });
    } catch (error) {
      console.error("Global search error:", error);

      return res.status(500).json({
        message: "Failed to search records"
      });
    }
  });

  return router;
};
