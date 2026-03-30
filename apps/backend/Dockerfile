FROM node:20-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable

# Copy entire monorepo (needed for pnpm workspace)
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

EXPOSE 3003

CMD ["pnpm", "--filter", "backend", "dev"]
