# ---- Stage 1: Build the application ----
FROM node:23-alpine AS builder

WORKDIR /app
COPY package*.json ./

# https://npmmirror.com
RUN npm config set registry https://registry.npmmirror.com
RUN npm install

COPY . .
RUN npm run build

# ---- Stage 2: Serve the App with Nginx ----
FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
