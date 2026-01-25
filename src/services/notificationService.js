const Notification = require('../models/Notification');
const { Expo } = require('expo-server-sdk');

const expo = new Expo();

exports.createNotification = async (data) => {
  try {
    const notification = await Notification.create(data);
    
    // Envoyer push notification si token disponible
    if (data.expoPushToken && Expo.isExpoPushToken(data.expoPushToken)) {
      await sendPushNotification(data.expoPushToken, {
        title: data.title,
        body: data.message,
        data: { notificationId: notification._id },
      });
      notification.sent = true;
      await notification.save();
    }
    
    return notification;
  } catch (error) {
    console.error('Erreur création notification:', error);
    throw error;
  }
};

const sendPushNotification = async (pushToken, { title, body, data }) => {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  try {
    const ticket = await expo.sendPushNotificationsAsync([message]);
    console.log('Push notification envoyée:', ticket);
  } catch (error) {
    console.error('Erreur push notification:', error);
  }
};

exports.notifyConversationStarted = async (professionalId, patientId, conversationId, expoPushToken) => {
  return await exports.createNotification({
    professionalId,
    patientId,
    type: 'conversation_started',
    title: 'Nouvelle conversation',
    message: 'Un patient a démarré une conversation',
    priority: 'medium',
    relatedConversationId: conversationId,
    expoPushToken,
  });
};

exports.notifyHighGravity = async (professionalId, patientId, conversationId, expoPushToken) => {
  return await exports.createNotification({
    professionalId,
    patientId,
    type: 'high_gravity',
    title: '⚠️ Alerte gravité élevée',
    message: 'Un patient a signalé une situation grave',
    priority: 'urgent',
    relatedConversationId: conversationId,
    expoPushToken,
  });
};