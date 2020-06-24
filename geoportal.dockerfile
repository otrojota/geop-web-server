# docker build -f geoportal.dockerfile -t otrojota/geoportal:web-server-0.65 .
# docker push otrojota/geoportal:web-server-0.65
#
FROM node:12.3.1-alpine
WORKDIR /opt/geoportal/geop-web-server
COPY . .
RUN npm install 
EXPOSE 8180
CMD node index.js