FROM node:alpine

WORKDIR /usr/src/app

RUN apk add --update python3 make g++

COPY package*.json ./

RUN npm i

RUN npm rebuild bcrypt --build-from-source

COPY . .

EXPOSE 3000

CMD npx prisma migrate deploy && npx prisma generate && node app.js