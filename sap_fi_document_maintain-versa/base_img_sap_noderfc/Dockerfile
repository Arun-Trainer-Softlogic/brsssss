FROM node:18.20.4-bookworm-slim
COPY ./noderfc/sap/ /usr/local/sap/
COPY ./noderfc/nwrfcsdk.conf /etc/ld.so.conf.d/
ENV SAPNWRFC_HOME=/usr/local/sap/nwrfcsdk
RUN ldconfig
WORKDIR /usr/src/app