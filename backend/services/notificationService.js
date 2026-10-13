
async function createNotification(prisma, {
  userId,
  title,
  message,
  type = "INFO",
  link = null
}) {
  if (!Number.isSafeInteger(Number(userId))) {
    throw new Error("A valid user ID is required");
  }

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof message !== "string" ||
    !message.trim()
  ) {
    throw new Error("Notification title and message are required");
  }

  return prisma.notification.create({
    data: {
      userId: Number(userId),
      title: title.trim(),
      message: message.trim(),
      type,
      link
    }
  });
}

async function notifyAdmins(prisma, {
  title,
  message,
  type = "INFO",
  link = null
}) {
  const admins = await prisma.user.findMany({
    where: {
      role: {
        is: { name: "ADMIN" }
      }
    },
    select: { id: true }
  });

  if (admins.length === 0) return { count: 0 };

  return prisma.notification.createMany({
    data: admins.map(admin => ({
      userId: admin.id,
      title,
      message,
      type,
      link
    }))
  });
}

module.exports = {
  createNotification,
  notifyAdmins
};
