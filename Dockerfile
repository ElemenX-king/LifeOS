FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN rm -rf node_modules src public index.html vite.config.ts tsconfig*.json eslint.config.js
RUN npm install --omit=dev
RUN npm uninstall tailwindcss @tailwindcss/vite
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "--import", "tsx", "server/index.ts"]
