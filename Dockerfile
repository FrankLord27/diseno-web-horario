# Web (Next.js 16). Contexto de build = raíz del monorepo.
# NEXT_PUBLIC_API_URL se hornea en build; por defecto apunta a localhost:8101
# (cada colegio corre API y web en la misma PC).

# ─── build ───────────────────────────────────────────────────────────────
FROM node:24-slim AS build
RUN corepack enable
WORKDIR /repo
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8101/api/v1
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm install --frozen-lockfile \
  && pnpm --filter @horarios/shared-types build \
  && pnpm --filter @horarios/web build

# ─── runtime ─────────────────────────────────────────────────────────────
FROM node:24-slim AS runtime
RUN corepack enable
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo ./
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["pnpm", "exec", "next", "start", "-p", "3000"]
