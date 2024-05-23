import { Elysia, t } from "elysia"
import { botBannerBucket, guildedBotProfileScrape, streamToBuffer } from "../libs"

export const botBannerController = new Elysia()
    .get('/:id', async ({ params }) => {
        if (await botBannerBucket.checkAssetExists(params.id)) {
            const lastModified = await botBannerBucket.getAssetLastModified(params.id)
            if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
                (async () => guildedBotProfileScrape(params.id, 'banner'))().catch((e) => console.error(e))
            }
            const banner = await botBannerBucket.getAsset(params.id)
            return new Response(await streamToBuffer(banner), { headers: { 'Content-Type': 'image/webp' } })
        }
        const imageBlob = await guildedBotProfileScrape(params.id, 'banner')
        if (imageBlob instanceof Error || !imageBlob) {
            return new Response('Bot not found', { status: 404 })
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
        {description: 'The bot banner image.'}),
        detail: {
            description: 'Get the banner of a bot by its ID.',
            summary: 'Get bot banner by ID.',
            tags: ['bot'],
        }
    })
