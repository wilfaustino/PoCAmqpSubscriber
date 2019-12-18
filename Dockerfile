FROM node:8.16.2-jessie

WORKDIR /app

CMD npm install && npm start
