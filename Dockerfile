FROM node:20-alpine

WORKDIR /app

# install deps (use package-lock if present for reproducible builds)
COPY package*.json ./
RUN npm install --no-audit --no-fund

# copy rest of repo
COPY . .

# generate prisma client if present (non-fatal)
RUN npx prisma generate || true

ENV NODE_ENV=development
ENV NEXT_TELEMETRY_DISABLED=1

EXPOSE 3000

CMD ["npm", "run", "dev"]
