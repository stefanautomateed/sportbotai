# Running the app with Docker

If you don't want to install Node.js locally, you can run the app inside Docker.

Prerequisites:
- Docker and Docker Compose installed on your machine.

Quick start:

```bash
# from the repo root
cp .env.example .env.local  # fill in secrets
./scripts/check_env.sh
./scripts/start_with_docker.sh
```

The app will be available at http://localhost:3000

Notes:
- The Dockerfile uses `npm install` and runs `npm run dev` for a development experience.
- For production builds, use `npm run build` and `npm run start` inside a production image.
