# PhotoBox
PhotoBox is a Guilded based avatar/banner CDN cache. Powered by ElysiaJS, SeaweedFS and Bun.

Open http://localhost:3000/ with your browser to see the result.

# How to Setup 
1. Copy `.env.example` to `.env` and fill in the required values.
> VARS:
> - G_TOKEN: Your Guilded bot token.
> - PORT: The port to run the Elysia Server on.
> - SEAWEED_ENDPOINT: The SeaweedFS master server endpoint. (http://photobox-seaweedfs:8333 on default docker compose network)
> - SEAWEED_ACCESS_KEY: The SeaweedFS access key. (Same as the one you set in `s3_config.json`)
> - SEAWEED_SECRET_KEY: The SeaweedFS secret key. (Same as the one you set in `s3_config.json`)
2. Copy `s3_config.sample.json` to `s3_config.json` and fill in the required values.
3. Run `docker compose up -d`

# Default Ports
- ElysiaJS: 3000
- SeaweedFS S3: 8333 
- SeaweedFS Master: 9333
- SeaweedFS Volume: 8080
- SeaweedFS Filer: 8888

# How to use
Refer to [API docs](https://photobox.cardboard.ink/swagger)