FROM node:20-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable
RUN corepack prepare pnpm@10.29.3 --activate

# Copy entire monorepo (needed for pnpm workspace)
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

EXPOSE 3003

CMD ["pnpm", "--filter", "backend", "dev"]
