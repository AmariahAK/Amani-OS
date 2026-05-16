# Build Vite React app
FROM node:20-alpine AS build
WORKDIR /app

ENV NODE_OPTIONS=--max-old-space-size=4096

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Serve static files on Cloud Run (port 8080)
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
