FROM node:20-alpine AS frontend_build
ARG BACKEND
ARG WORKBENCH_BASE_URL
ENV WORKBENCH_BASE_URL=${WORKBENCH_BASE_URL}
WORKDIR /app
COPY . /app

# Build platform first
RUN cd /app/platform && \
    npm install --registry=https://registry.npmmirror.com --prefer-offline --no-audit && \
    npm run build && \
    rm -rf node_modules

# Build client
RUN cd /app/client && \
    npm install --registry=https://registry.npmmirror.com --prefer-offline --no-audit && \
    npm run build && \
    rm -rf node_modules

FROM nginx
COPY --from=frontend_build /app/platform/build/ /usr/share/nginx/html/platform
COPY --from=frontend_build /app/client/build/ /usr/share/nginx/html/client
COPY /nginx.conf /etc/nginx/conf.d/default.conf
