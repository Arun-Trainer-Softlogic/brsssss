FROM registry.gitlab.com/matw_integration/sap/sap_fi_document_maintain:18.20.4-bookworm-slim
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci
COPY . .
CMD [ "npm", "start" ]