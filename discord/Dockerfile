FROM node:22-bookworm-slim
WORKDIR /app
COPY discord/package.json discord/package-lock.json* ./discord/
WORKDIR /app/discord
RUN npm install --omit=dev
WORKDIR /app
COPY public/brand/icon-discord.png public/brand/icon-discord.png
COPY discord/index.mjs discord/index.mjs
WORKDIR /app/discord
ENV ADMIN_PORT=8787
EXPOSE 8787
CMD ["node", "index.mjs"]
