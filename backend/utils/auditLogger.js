
async function logActivity(prisma, {
  userId,
  action,
  module,
  entityId = null,
  details = null
}) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        module,
        entityId,
        details
      }
    });
  } catch (error) {
    console.error("Audit logging failed:", error);
    throw error;
  }
}

module.exports = { logActivity };
