# Firebase Cloud Functions for Email Notifications

## Setup Instructions

### 1. Install Dependencies

```bash
# From the project root
cd functions
npm install
cd ..
```

### 2. Configure Environment Variables

Set your Outlook email credentials using Firebase configuration:

```bash
firebase functions:config:set outlook.email="your-outlook-email@outlook.com" outlook.password="your-app-password"
```

**For Outlook/Microsoft 365:**
- Use your Outlook email address as the user
- Generate an [App Password](https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-your-microsoft-account-c6ff677e-2da4-44f4-a0f1-5d6fa921d6f0) for the password (2FA must be enabled)
- Do NOT use your regular password

### 3. Optional: Configure Admin Email

```bash
firebase functions:config:set admin.email="admin-email@company.com"
```

### 4. View Current Configuration

```bash
firebase functions:config:get
```

### 5. Deploy Functions

```bash
# From the project root
npm run deploy:functions
# or
firebase deploy --only functions
```

### 6. View Logs

```bash
firebase functions:log
```

## How It Works

When a new asset is created:
1. The Cloud Function `sendAssetNotification` is triggered
2. It reads the `userEmail` from the asset document
3. Sends an HTML email notification to that email address
4. The `sendAdminNotification` function also sends a copy to the admin

## Email Content

The email includes:
- Employee ID & Name
- Asset Category, Manufacturer, Model
- Serial Number & Department
- Status & Condition
- Timestamp

## Troubleshooting

**Email not sending?**
- Check that App Password is correctly set
- Verify email is enabled in Firebase Console → Functions
- Check logs: `firebase functions:log`

**Configuration not found?**
- Run `firebase functions:config:get` to verify settings
- Re-run the config:set command

**Need to change credentials?**
- Update with: `firebase functions:config:set outlook.email="new-email@outlook.com"`
