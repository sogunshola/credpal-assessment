FROM node:16-alpine AS development
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn build

FROM node:16-alpine
WORKDIR /app
# copy from build image
COPY --from=development /app/dist ./dist
COPY --from=development /app/node_modules ./node_modules
COPY package.json ./

CMD ["yarn", "run", "start:dev"]


FROM node:16-alpine AS production
WORKDIR /app
COPY . .
RUN yarn install
RUN yarn build

FROM node:16-alpine
WORKDIR /app
# copy from build image
COPY --from=production /app/dist ./dist
COPY --from=production /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3000
CMD ["yarn", "run", "start:prod"]