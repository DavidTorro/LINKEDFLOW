FROM node:22-alpine AS build

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend ./

ARG VITE_BACKEND_BASE_URL=/api
ENV VITE_BACKEND_BASE_URL=${VITE_BACKEND_BASE_URL}

RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
