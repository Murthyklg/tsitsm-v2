# Docker deployment

The production image runs the React frontend and Express API together. SQL Server remains external to the container.

## Build and run

From `tsitsm`:

```powershell
npm install
docker compose build
docker compose up -d
```

Open `http://localhost:3001`. The API health endpoint is `http://localhost:3001/api/health`.

## Environment

Copy `.env.example` to `.env` and set the Entra app registration values. Vite client variables are passed as Docker build arguments; server variables are passed at runtime.

The container must use SQL authentication. Windows integrated authentication from the host cannot be forwarded into a Linux container. Configure a SQL login and make SQL Server reachable from Docker:

```env
SQL_SERVER=host.docker.internal
SQL_PORT=1433
SQL_AUTH=sql
SQL_DATABASE=tsitsm
SQL_USER=tsitsm_app
SQL_PASSWORD=use-a-real-password
SQL_ENCRYPT=false
SQL_TRUST_SERVER_CERTIFICATE=true
```

For a separate frontend deployment, set `VITE_API_URL` to the public API URL before building (for example, `https://api.example.com/api`). For the combined Docker image, leave it as `/api`.

Ensure SQL Express TCP/IP is enabled, port `1433` is configured or exposed, and the login can access `tsitsm`. Apply the schema before starting the container:

```powershell
npm run db:migrate
```

## Development

For local development without Docker:

```powershell
npm run api
npm run dev
```

Vite proxies `/api` to port `3001`.
