# Quick Start Guide

## Step 1: Install Firebase (if not already installed)

```bash
npm install firebase
```

## Step 2: Firebase Configuration

1. Go to https://console.firebase.google.com
2. Create a new project or use an existing one
3. Create a web app
4. Copy your Firebase config

## Step 3: Configure Environment Variables

1. Open `.env.local` in the project root
2. Add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

3. Save the file

## Step 4: Enable Firebase Features

### Authentication
1. Go to Firebase Console → Authentication
2. Enable "Email/Password" sign-in method

### Firestore Database
1. Go to Firebase Console → Firestore Database
2. Create database in "Production mode"
3. Update Security Rules (see PROJECT_README.md for rules)

### Storage (Optional)
1. Go to Firebase Console → Storage
2. Create storage bucket

## Step 5: Start Development

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Step 6: Test the Application

1. Sign up with an email and password
2. Create an asset
3. View and manage your assets

## Available Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## File Structure Quick Reference

- **src/config/firebase.ts** - Firebase initialization
- **src/hooks/** - Custom React hooks (useAuth, useAssets)
- **src/components/** - Reusable components
- **src/pages/** - Page components (Dashboard)
- **src/types/** - TypeScript type definitions
- **.env.local** - Environment variables (add your Firebase config here)

## Common Issues

**Q: Firebase config not loading?**
- A: Ensure `.env.local` file exists and has correct variable names starting with `VITE_`

**Q: Cannot sign up or login?**
- A: Enable Email/Password authentication in Firebase Console

**Q: Assets not showing?**
- A: Check Firestore security rules and ensure user is authenticated

## Next Steps

1. Customize the UI in `src/components/`
2. Add more asset fields in `src/types/asset.ts`
3. Implement asset edit/create forms
4. Add image upload functionality
5. Create reports and analytics pages

## Additional Resources

- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Vite Documentation](https://vite.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Need Help?

- Check PROJECT_README.md for detailed documentation
- Review code comments in source files
- Check Firebase Console for errors
- Check browser console for JavaScript errors
