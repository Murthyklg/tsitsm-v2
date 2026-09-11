# ThaiSummit ITSM

React/Vite ITSM frontend with Microsoft Entra ID authentication, an Express API, and Microsoft SQL Server persistence. Firestore and Firebase Authentication are no longer used by the active application path.

## Architecture

- `src/`: React portal and Microsoft MSAL client.
- `server/`: Express API that validates Entra access tokens and enforces admin authorization.
- `database/001_initial_schema.sql`: SQL Server schema modeled after the former Firestore collections.
- `src/api.ts`: authenticated API client.

SQL tables preserve the existing data model: `Users`, `Assets`, `AssetRequests`, `AssetRequestComments`, `Incidents`, `IncidentComments`, `ActivityLogs`, and `NotificationTokens`.

## Entra setup

Create or use two Entra app registrations:

1. A SPA registration for the Vite client. Add `http://localhost:5173` as a SPA redirect URI.
2. An API registration. Expose the delegated scope `access_as_user` and grant the SPA permission to that scope.

The `AADSTS500011` error means the API registration or scope is missing. In Microsoft Entra admin center:

1. Open **App registrations** and select the API registration.
2. Open **Expose an API** and set the Application ID URI to `api://<API_CLIENT_ID>`.
3. Add a delegated scope named `access_as_user` and enable administrator consent.
4. Open the SPA registration's **API permissions**, choose **My APIs**, select the API registration, add `access_as_user`, and grant admin consent.
5. In the SPA registration's **API permissions**, add Microsoft Graph delegated permission `User.Read` and grant consent.
6. Set `VITE_API_SCOPE=api://<API_CLIENT_ID>/access_as_user` and `ENTRA_CLIENT_ID=<API_CLIENT_ID>` in `.env`.

If you expose the API on the existing SPA registration instead, use its client ID in both values and create the same `access_as_user` scope. The API resource must exist before the frontend can request its token.

Copy `.env.example` to `.env` and set `VITE_MICROSOFT_CLIENT_ID` to the SPA client ID and `VITE_API_SCOPE` to the API scope. The server uses `ENTRA_CLIENT_ID` for the API registration's client ID.

The configured tenant is `f1dad057-a1be-4bcd-b374-50cba74582fd`.

## SQL Server setup

Create an empty database named `tsitsm`, set the SQL connection variables in `.env`, then run:

```bash
npm run db:migrate
```

The server expects `SQL_SERVER`, `SQL_DATABASE`, `SQL_USER`, `SQL_PASSWORD`, and optionally `SQL_PORT`, `SQL_ENCRYPT`, and `SQL_TRUST_SERVER_CERTIFICATE`.

## Run locally

Start the API and frontend in separate terminals:

```bash
npm run api
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:3001`. To run the API elsewhere, set `VITE_API_URL`.

### Vercel frontend deployment

Vercel builds the frontend separately from the Express API. Add these Vercel environment variables before deploying:

```env
VITE_API_URL=https://<your-public-api-host>/api
VITE_MICROSOFT_CLIENT_ID=<spa-client-id>
VITE_MICROSOFT_TENANT_ID=<tenant-id>
VITE_API_SCOPE=api://<api-client-id>/access_as_user
```

On the API host, set `CLIENT_ORIGIN` to the Vercel URL, for example `https://your-app.vercel.app`. If using Vercel preview URLs, include each allowed preview origin as a comma-separated value. The API deployment must use the repository root and [vercel.json](vercel.json), which routes requests to the Express server. Redeploy the frontend after changing `VITE_API_URL`; Vite variables are embedded at build time.

The frontend Vercel project must use `npm run build` with output directory `dist`. Do not apply the API-only `vercel.json` routing to the frontend project; deploy the frontend and API as separate Vercel projects or use separate project root directories.

For a Vercel API deployment, use `SQL_AUTH=sql` and a public/cloud SQL Server hostname. `SQL_AUTH=windows` and `localhost\SQLEXPRESS` only work for the local Windows API and cannot be used by Vercel's Linux runtime.

Vite listens on all network interfaces over local HTTPS, so other devices can open the app at `https://<host-ip>:5173`. Accept the development certificate warning in the browser, and add that exact HTTPS URL as a SPA redirect URI in the Microsoft Entra app registration before testing sign-in from the IP address.

## Validation

```bash
npm run build
npm run lint
```

The existing `functions/` directory and Firebase deployment artifacts are retained as historical migration material, but the active frontend and API do not import or call Firebase.
