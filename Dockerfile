FROM node:24-bookworm

RUN apt update && apt upgrade -y
RUN apt install -y git openssh-client python3 python3-pip python3-fastapi python3-multipart \
    python3-requests python3-pil python3-uvicorn python3-pytest

WORKDIR /workspaces/knowledgebase

COPY package.json .
RUN npm install

# For deployment use this
#RUN npm i -g serve
#COPY . .
#RUN npm run build
#EXPOSE 3000

#CMD [ "serve", "-s", "dist" ]
