FROM oven/bun:1.1.7-debian

WORKDIR /app

COPY ./app/package.json ./

CMD bun i; bun dev;