# ----------------------------
# Stage 1: Build the App
# ----------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build
# (This creates a /dist folder with your static site)

# ----------------------------
# Stage 2: Serve with Nginx
# ----------------------------
FROM nginx:alpine

# Copy the built files from Stage 1 to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy our custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]