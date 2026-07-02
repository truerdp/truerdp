FROM node:24-alpine

WORKDIR /app

# Enable pnpm
RUN corepack enable
RUN corepack prepare pnpm@11.7.0 --activate

# Copy entire monorepo (needed for pnpm workspace)
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile --trust-lockfile

EXPOSE 3003

CMD ["pnpm", "--filter", "backend", "dev"]
