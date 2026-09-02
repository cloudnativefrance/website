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
# Feature-flag overrides for this image, as `name=on,name2=off`.
#
# Flags resolve from process.env at BUILD time and the artifact is a static
# nginx image, so a Kubernetes-level env var on the running pod cannot change
# them — the override has to be present when the image is built. Empty by
# default so an argument-less `docker build` still produces the production
# site, driven purely by the dates in src/config/flags.ts.
#
# One bundle rather than one ARG per flag: adding a flag needs no edit here.
# An unknown name or a value other than on/off fails the build (src/lib/flags.ts).
ARG FLAG_OVERRIDES=
ENV FLAG_OVERRIDES=$FLAG_OVERRIDES
# Pretalx API token, as a BuildKit secret — deliberately NOT a build-arg.
# Build-args are recorded in image history, so `docker history` on a published
# image would print the token to anyone who can pull it. A secret mount exists
# only for this layer and leaves nothing behind.
#
# PRETALX_TOKEN_REQUIRED=1 makes a missing token fail the build. Speaker
# company/role and talk levels are authenticated reads; without them the site
# still builds, but ships a speakers page with no affiliations and a schedule
# with no level chips. That is a silent regression, and a red build is the
# cheaper failure.
RUN --mount=type=secret,id=pretalx_token \
    PRETALX_TOKEN_REQUIRED=1 \
    PRETALX_API_TOKEN_FILE=/run/secrets/pretalx_token \
    pnpm run build

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
