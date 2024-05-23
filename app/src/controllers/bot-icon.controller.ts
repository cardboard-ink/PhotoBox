import { Elysia, t } from "elysia"
import { botIconBucket, guildedBotProfileScrape, streamToBuffer } from "../libs"

export const botIconController = new Elysia()
    .get('/:id', async ({ params }) => {
        if (await botIconBucket.checkAssetExists(params.id)) {
            const lastModified = await botIconBucket.getAssetLastModified(params.id)
            if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
                (async () => guildedBotProfileScrape(params.id, 'icon'))().catch((e) => console.error(e))
            }
            const avatar = await botIconBucket.getAsset(params.id)
            const res = new Response(await streamToBuffer(avatar), { headers: { 'Content-Type': 'image/webp' } })
            return res
        }
        const imageBlob = await guildedBotProfileScrape(params.id, 'icon')
        if (imageBlob instanceof Error || !imageBlob) {
            return new Response('Bot not found', { status: 404 })
        }
        const res = new Response(imageBlob, { headers: { 'Content-Type': 'image/webp' } })
        return res
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
        {description: 'The bot icon image.'}),
        detail: {
            description: "Get the bot icon of a bot by it's ID.",
            summary: 'Get bot icon by ID.',
            tags: ['bot'],
        }
    })

