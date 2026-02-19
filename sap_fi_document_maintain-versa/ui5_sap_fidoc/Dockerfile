# FROM registry.gitlab.com/matw_integration/sap/sap_fi_document_maintain:18.20.4-bookworm-slim
FROM node:lts-alpine3.20
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD [ "npm", "run", "preview" ]