FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./

# Instala também devDependencies para conseguir rodar o TypeScript (tsc)
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
