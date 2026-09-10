# Email setup for incident notifications

The incident email notification is now sent from the Firebase Functions backend when a new incident document is created in Firestore.

## 1. Configure SMTP credentials

Use one of these options:

### Option A: Microsoft 365 / Outlook

```bash
cd functions
firebase functions:config:set \
  smtp.host="smtp.office365.com" \
  smtp.port="587" \
  smtp.secure="false" \
  smtp.user="itadmin@thaisummit.ind.in" \
  smtp.pass="YOUR_APP_PASSWORD" \
  smtp.from="itadmin@thaisummit.ind.in" \
  incident_notification_email="itadmin@thaisummit.ind.in"
```

If your Microsoft account uses MFA, create an app password in your Microsoft account settings.

If Microsoft 365 returns `535 5.7.139` or says the user is locked by the organization's Security Defaults policy, password-based SMTP AUTH is blocked. An app password will not fix that by itself. A Microsoft 365 administrator must either:

1. Enable **Authenticated SMTP** for this mailbox under **Microsoft 365 admin center -> Users -> Active users -> Mail -> Manage email apps**, and ensure the tenant policy permits SMTP AUTH; or
2. Use the Microsoft Graph `Mail.Send` API with OAuth2 instead of SMTP.

Security Defaults generally should remain enabled. The Graph option is the preferred production approach because it avoids re-enabling legacy SMTP authentication. Rotate any password or app password that has been exposed, then restart the API after changing `.env`.

### Option B: Generic SMTP server on Ubuntu

If you are running a local SMTP relay on Ubuntu, set the values to match your server:

```bash
cd functions
firebase functions:config:set \
  smtp.host="mail.yourdomain.com" \
  smtp.port="587" \
  smtp.secure="false" \
  smtp.user="itadmin@thaisummit.ind.in" \
  smtp.pass="YOUR_PASSWORD" \
  smtp.from="itadmin@thaisummit.ind.in" \
  incident_notification_email="itadmin@thaisummit.ind.in"
```

## 2. Deploy the functions

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

## 3. Ubuntu server notes

If you run the web app or other services directly on Ubuntu, export the same values before starting the process:

```bash
export SMTP_HOST="smtp.office365.com"
export SMTP_PORT="587"
export SMTP_SECURE="false"
export SMTP_USER="itadmin@thaisummit.ind.in"
export SMTP_PASS="YOUR_APP_PASSWORD"
export SMTP_FROM="itadmin@thaisummit.ind.in"
export INCIDENT_NOTIFICATION_EMAIL="itadmin@thaisummit.ind.in"
```

For the SQL-backed Express API, provide the same SMTP variables to the API process (or Docker Compose). Incident creation emails `INCIDENT_NOTIFICATION_EMAIL`; admin status, notes, and comments email the incident reporter. Email delivery errors are logged after the database operation succeeds.

For persistent setup, add them to `/etc/environment` or a systemd service file.

## 4. Verify

After deployment, create a test incident in the app and check:

- the Firestore incident document is created
- the Functions logs show `Incident notification sent to ...`
- the email arrives at `itadmin@thaisummit.ind.in`

## 5. Troubleshooting

- Check the logs:

```bash
firebase functions:log
```

- If email fails, confirm:
  - SMTP host and port are correct
  - the username/password or app password is correct
  - port 587 is open from the server
  - the sender address is allowed by your mail provider
