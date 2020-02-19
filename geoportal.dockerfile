FROM node:12.3.1-alpine
#ENV NODE_ENV production
WORKDIR /opt/geoportal/geop-web-server
COPY . .
RUN npm install 
EXPOSE 8180
CMD node index.js