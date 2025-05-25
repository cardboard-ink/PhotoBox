FROM oven/bun:1.2.14-debian

WORKDIR /app

COPY ./app/package.json ./

CMD bun i; bun start;