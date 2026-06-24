# --- Build stage ---
FROM oven/bun:1.3-alpine AS build
WORKDIR /app

COPY package.json ./
RUN bun install --no-save

COPY tsconfig.json tsconfig.node.json vite.config.ts tailwind.config.js postcss.config.js index.html ./
COPY src ./src

ARG VITE_API_BASE=/api
ENV VITE_API_BASE=$VITE_API_BASE
RUN bun run build

# --- Serve stage ---
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
