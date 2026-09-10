# Asset Management System

A modern asset management website built with React (frontend) and Firebase (backend).

## Features

- **User Authentication**: Secure login and signup using Firebase Authentication
- **Asset Tracking**: Create, read, update, and delete assets
- **Asset Categories**: Organize assets by category
- **Asset Status**: Track asset status (active, inactive, retired)
- **Asset Valuation**: Monitor current and purchase values
- **User-friendly Dashboard**: Intuitive interface for managing assets
- **Real-time Data**: Firebase Firestore for real-time database updates

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: Firebase (Authentication, Firestore, Storage)
- **Styling**: CSS3
- **Build Tool**: Vite

## Project Structure

```
assetmgmt/
├── src/
│   ├── components/          # Reusable React components
│   │   ├── AssetList.tsx   # Asset list component
│   │   ├── AssetList.css
│   │   ├── Login.tsx       # Login/signup component
│   │   └── Login.css
│   ├── config/
│   │   └── firebase.ts     # Firebase configuration
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts      # Authentication hook
│   │   └── useAssets.ts    # Assets data hook
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx   # Main dashboard
│   │   └── Dashboard.css
│   ├── types/              # TypeScript type definitions
│   │   └── asset.ts        # Asset-related types
│   ├── App.tsx             # Main App component
│   ├── App.css
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── .env.example            # Environment variables template
├── .env.local              # Local environment variables (gitignored)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Firebase account (https://firebase.google.com)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Firebase** (if not already installed):
   ```bash
   npm install firebase
   ```

### Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com

2. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable Email/Password authentication

3. Create Firestore Database:
   - Go to Firestore Database
   - Create database in production mode
   - Add security rules:
     ```javascript
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         // Only allow authenticated users to read/write
         match /assets/{document=**} {
           allow read, write: if request.auth != null;
         }
         match /users/{document=**} {
           allow read, write: if request.auth.uid == document;
         }
       }
     }
     ```

4. Get your Firebase config:
   - Go to Project Settings → General
   - Copy your web app credentials

5. Configure environment variables:
   - Copy `.env.example` to `.env.local`
   - Add your Firebase credentials:
     ```
     VITE_FIREBASE_API_KEY=your_api_key_here
     VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
     VITE_FIREBASE_PROJECT_ID=your_project_id_here
     VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
     VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
     VITE_FIREBASE_APP_ID=your_app_id_here
     ```

### Running the Application

#### Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

#### Build for Production

```bash
npm run build
```

#### Preview Production Build

```bash
npm run preview
```

## Usage

1. **Sign Up**: Create a new account with email and password
2. **Login**: Login with your credentials
3. **Add Assets**: Click "Add New Asset" to create a new asset
4. **View Assets**: See all your assets in the dashboard
5. **Edit Assets**: Click the "Edit" button to modify asset details
6. **Delete Assets**: Click the "Delete" button to remove an asset
7. **Logout**: Click the "Logout" button to sign out

## API Endpoints (Firestore Collections)

### Assets Collection
```javascript
{
  id: string,
  employeeId: string,
  employeeName: string,
  department: string,
  location: string,
  owner: string, // user uid
  category: 'laptop' | 'desktop' | 'monitor' | 'printer' | 'network' | 'peripheral' | 'other',
  
  serialNumber: string,
  manufacturer: string,
  ownership: 'company' | 'vendor',
  vendorName?: string,
  model: string,
  purchaseDate: timestamp,
  purchasePrice: number,
  warrantyExpiration?: timestamp,
  condition: 'new' | 'good' | 'fair' | 'poor' | 'retired',
  status: 'active' | 'inactive' | 'maintenance' | 'retired',
  cpuManufacturer?: string,
  cpuModel?: string,
  cpuGeneration?: string,
  ramType?: string,
  ramSizeGb?: number,
  storageType?: 'HDD' | 'SSD' | 'NVMe' | 'eMMC' | 'other',
  storageCapacityGb?: number,
  os?: string,
  operatingSystemVersion?: string,
  macAddress?: string,
  purchaseOrderNumber?: string,
  notes?: string,
  imageUrl?: string,
  tags: string[],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Users Collection
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  role: 'admin' | 'user',
  createdAt: timestamp
}
```

## Future Enhancements

- [ ] Add asset images/attachments
- [ ] Implement asset depreciation calculations
- [ ] Add asset maintenance history
- [ ] Create reports and analytics
- [ ] Add multi-user collaboration
- [ ] Implement role-based access control
- [ ] Add asset export functionality (CSV, PDF)
- [ ] Mobile app version
- [ ] Real-time notifications

## Troubleshooting

### Firebase Configuration Issues
- Ensure all environment variables are set correctly
- Check Firebase project settings
- Verify authentication is enabled
- Check Firestore security rules

### Build Issues
- Delete `node_modules` and run `npm install` again
- Clear Vite cache: `rm -rf dist/` then `npm run build`
- Ensure Node.js version is compatible

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For support, please create an issue in the repository or contact the development team.
