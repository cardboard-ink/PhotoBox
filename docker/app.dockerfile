FROM oven/bun:1.1.7-debian

WORKDIR /app

COPY ./app/package.json ./
COPY ./app/bun.lockb ./

CMD bun i; bun start;