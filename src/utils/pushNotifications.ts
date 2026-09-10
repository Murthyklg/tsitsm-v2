const ADMIN_EMAIL = 'itadmin@thaisummit.ind.in';
const TARGET_EMAIL = import.meta.env.VITE_NOTIFICATION_TARGET_EMAIL || ADMIN_EMAIL;

const isAdminEmail = (email?: string | null) => {
  return !!email && email.toLowerCase() === TARGET_EMAIL.toLowerCase();
};

export const sendAdminPushNotification = async ({
  title,
  body,
}: {
  type?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (Notification.permission === 'granted') new Notification(title, { body, icon: '/favicon.ico' });
  } catch (error) {
    console.error('Failed to send admin push notification:', error);
  }
};

export const registerAdminPushNotifications = async (uid?: string, email?: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!uid || !isAdminEmail(email)) {
    return;
  }

  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('This browser does not support service workers');
    return;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return;
    }

    if (Notification.permission === 'default') await Notification.requestPermission();
  } catch (error) {
    console.error('Push notification registration failed:', error);
  }
};
