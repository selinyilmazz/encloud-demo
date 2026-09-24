FROM node:24-alpine

WORKDIR /app

# GitHub Actions bu degerleri derleme sirasinda doldurur
ARG APP_VERSION=dev
ARG BUILD_TIME=-

ENV NODE_ENV=production \
    PORT=8080 \
    APP_VERSION=$APP_VERSION \
    BUILD_TIME=$BUILD_TIME

COPY server.js .

# Uygulama root yerine node kullanicisiyla calisir
USER node

EXPOSE 8080

CMD ["node", "server.js"]
