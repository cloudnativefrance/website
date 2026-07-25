# Stage 1: Build the Astro site
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Origin this image is built for. Empty by default so astro.config.mjs's own
# fallback to production (src/lib/site-env.ts) is the single source of truth
# for that default — an argument-less `docker build` still produces the
# production site. The staging CI job overrides it via --build-arg. Placed
# after `pnpm install` so a differing origin only invalidates the build layer,
# not the dependency-install layer, letting staging and production builds
# share the install cache.
ARG PUBLIC_SITE_URL=
ENV PUBLIC_SITE_URL=$PUBLIC_SITE_URL
RUN pnpm run build

# Stage 2: Serve with the official rootless nginx image
#
# Why nginx-unprivileged: runs as user `nginx` (uid 101) by default, listens on
# 8080 without NET_BIND_SERVICE, and has all writable paths (/var/cache/nginx,
# /var/run, /tmp) chowned to uid 101. Lets the K8s deployment use a strict
# securityContext (runAsNonRoot: true, readOnlyRootFilesystem: true,
# capabilities: drop ALL) without permission gymnastics.
FROM nginxinc/nginx-unprivileged:1.27-alpine AS runtime
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
# Base image already EXPOSEs 8080 and CMDs nginx -g "daemon off;" with logs
# symlinked to /dev/stdout and /dev/stderr — nothing else to do here.
# K8s livenessProbe/readinessProbe handle health-checking; no Dockerfile
# HEALTHCHECK needed.
