FROM node:18

COPY pnpm-lock.yaml ./
COPY package.json ./

RUN npm install -g pnpm

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["pnpm", "serve"]