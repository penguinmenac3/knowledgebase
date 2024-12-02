FROM node:20-alpine

RUN apk update && apk upgrade && apk add git git-subtree openssh

WORKDIR /workspaces/knowledgebase

COPY package.json .
RUN npm install

# For deployment use this
#RUN npm i -g serve
#COPY . .
#RUN npm run build
#EXPOSE 3000

#CMD [ "serve", "-s", "dist" ]
