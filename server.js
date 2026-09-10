import express from 'express';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

const app = express();
app.use(express.json());

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
  : null;

if (serviceAccount) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

app.post('/api/notifications/admin', async (req, res) => {
  try {
    const payload = req.body?.payload || req.body || {};
    const notification = payload?.notification || {
      title: payload?.title,
      body: payload?.body,
    };
    const data = payload?.data || {};

    if (!notification?.title || !notification?.body) {
      res.status(400).json({ error: 'Missing notification payload' });
      return;
    }

    const targetEmail = process.env.NOTIFICATION_TARGET_EMAIL || 'itadmin@thaisummit.ind.in';
    const tokensSnapshot = await admin.firestore().collection('notificationTokens').where('email', '==', targetEmail).get();
    const tokens = tokensSnapshot.docs.map((docSnap) => docSnap.data().token).filter(Boolean);

    if (tokens.length === 0) {
      res.status(200).json({ status: 'no_tokens' });
      return;
    }

    const message = {
      notification,
      data: {
        type: data.type || 'generic',
        ...data,
      },
      tokens,
    };

    const response = await admin.messaging().sendEachForMulticast(message);
    res.status(200).json({ status: 'ok', response });
  } catch (error) {
    console.error('Push send failed:', error);
    res.status(500).json({ error: 'Push send failed' });
  }
});

app.listen(process.env.PORT || 3001, () => {
  console.log(`Notification server listening on port ${process.env.PORT || 3001}`);
});
