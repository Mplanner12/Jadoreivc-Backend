const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const createNotification = async (req, res) => {
  try {
    const { userId, tourPlanId, message, type } = req.body;
    const notification = await prisma.notification.create({
      data: {
        userId,
        tourPlanId,
        message,
        type,
      },
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error; // Handle the error appropriately
  }
};

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have user authentication middleware

    const notifications = await prisma.notification.findMany({
      where: { userId, isRead: false }, // Fetch unread notifications for the user
      orderBy: { createdAt: "desc" }, // Show newest notifications first
      include: {
        tourPlan: {
          select: {
            location: true, // Include relevant TourPlan details
            startDate: true,
          },
        },
      },
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id; // Make sure the user owns the notification

    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });

    res.status(200).json(updatedNotification);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Failed to mark notification as read" });
  }
};

module.exports = {
  getNotifications,
  markNotificationAsRead,
  createNotification,
};
