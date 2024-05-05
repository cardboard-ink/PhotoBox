# PhotoBox
PhotoBox is a Guilded based avatar/banner CDN cache. Powered by ElysiaJS, Minio and Bun.

Open http://localhost:3000/ with your browser to see the result.

# How to use
Refer to [docs](https://photobox.cardboard.ink/swagger)

# How to run 
1. Setup the environment file, fill any random value for minio access and secret.
2. Run only minio service.
> `docker compose up photobox-minio1`
3. Login according to env config and setup access.
4. Copy minio access and secret to env file.
5. Restart compose with all containers.
> `docker compose down --remove-orphans && docker compose up --build -d`