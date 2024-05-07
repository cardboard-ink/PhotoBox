import { Elysia, t } from "elysia"
import { serverBannerBucket, guildedServerProfileScrape, streamToBuffer } from "../libs"

export const serverBannerController = new Elysia()
    .get('/:id', async ({ params }) => {
        if (await serverBannerBucket.checkAssetExists(params.id)) {
            const lastModified = await serverBannerBucket.getAssetLastModified(params.id)
            if (Date.now() - lastModified.valueOf() > 24 * 60 * 60 * 1000) {
                guildedServerProfileScrape(params.id, 'banner')
            }
            const banner = await serverBannerBucket.getAsset(params.id)
            return new Response(await streamToBuffer(banner), { headers: { 'Content-Type': 'image/webp' } })
        }
        const imageBlob = await guildedServerProfileScrape(params.id, 'banner')
        if (imageBlob instanceof Error || !imageBlob) {
            return new Response('User not found', { status: 404 })
        }
        return new Response(imageBlob, { headers: { 'Content-Type': 'image/webp' } })
    }, {
        params: t.Object({
            id: t.String()
        }),
        body: t.Undefined(),
        response: t.Object({
            body: t.File({
                    type: 'image/webp',
                    maxItems: 1,
                    minItems: 0,
                    maxSize: '10m',
                    minSize: '0k'
                }),
        },
        {description: 'The server banner image.'}),
        detail: {
            description: 'Get the banner of a server by its ID.',
            summary: 'Get server banner by ID.',
            tags: ['server'],
        }
    })
