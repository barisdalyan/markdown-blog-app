FROM node:20.10-slim
WORKDIR /root/markdown-blog-app/
COPY . .
RUN npm install
CMD [ "node", "index.js" ]