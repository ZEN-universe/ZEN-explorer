FROM node:19 as build

ENV NODE_ENV=development 

WORKDIR /app

COPY package.json ./

RUN npm install
COPY . ./
RUN npm run build

ENV NODE_ENV=production

FROM node:19-alpine3.16

WORKDIR /app
COPY --from=build /app .


ENV HOST=0.0.0.0
EXPOSE 8050
CMD ["npm","run", "preview","--", "--host", "0.0.0.0", "--port", "8050"]