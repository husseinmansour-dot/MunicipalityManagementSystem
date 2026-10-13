
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: {
      role: { is: { name: "ADMIN" } }
    },
    select: { id: true }
  });

  if (!admin) {
    console.log("No ADMIN user found");
    return;
  }

  await prisma.notification.create({
    data: {
      userId: admin.id,
      title: "Welcome to Notifications",
      message: "Your municipality notification system is working!",
      type: "INFO",
      link: "/dashboard"
    }
  });

  console.log("Test notification created successfully");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
