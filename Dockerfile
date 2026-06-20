FROM node:22
WORKDIR /app
COPY . .
RUN npm ci
RUN npm run build
RUN rm -rf node_modules src public index.html vite.config.ts tsconfig*.json eslint.config.js
RUN npm ci --omit=dev
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["node", "--import", "tsx", "server/index.ts"]
