importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/12.14.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: self.location.hostname.includes('localhost') ? '' : '',
  authDomain: 'tsitsm-3e943.firebaseapp.com',
  projectId: 'tsitsm-3e943',
  storageBucket: 'tsitsm-3e943.firebasestorage.app',
  messagingSenderId: '531033081337',
  appId: '1:531033081337:web:c3fe53e291c6cda34ca928',
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

const showIncomingNotification = (payload) => {
  const notification = payload?.notification || {};
  const data = payload?.data || {};
  const title = notification.title || data.title || 'New request received';
  const body = notification.body || data.body || 'A new request was submitted';

  return self.registration.showNotification(title, {
    body,
    icon: '/favicon.ico',
    tag: data.type || 'tsitsm-notification',
    requireInteraction: true,
  });
};

messaging.onBackgroundMessage((payload) => {
  return showIncomingNotification(payload);
});
