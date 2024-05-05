FROM oven/bun:1.1.7-slim

WORKDIR /app

COPY ./app/package.json ./
COPY ./app/bun.lockb ./

CMD bun start;