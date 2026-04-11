# Stage 1: Build the Astro site
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable pnpm
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Stage 2: Serve with nginx on minimal alpine
FROM alpine:3.21 AS runtime
RUN apk add --no-cache nginx && \
    mkdir -p /usr/share/nginx/html && \
    rm -rf /var/cache/apk/*
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://localhost:8080/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
