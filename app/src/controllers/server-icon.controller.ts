import { Elysia, t } from "elysia"
import { serverIconBucket, guildedServerProfileScrape, streamToBuffer, scrapeQueue } from "../libs"

export const serverIconController = new Elysia()
    .get('/:id', async ({ params }) => {
        if (await serverIconBucket.checkAssetExists(params.id)) {
            const lastModified = await serverIconBucket.getAssetLastModified(params.id)
            if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
                scrapeQueue.add(() => guildedServerProfileScrape(params.id, 'icon'))
            }
            const avatar = await serverIconBucket.getAsset(params.id)
            const res = new Response(await streamToBuffer(avatar), { headers: { 'Content-Type': 'image/webp' } })
            return res
        }
        const imageBlob = await scrapeQueue.add(async () => await guildedServerProfileScrape(params.id, 'icon'), {priority: 1})
        if (imageBlob instanceof Error || !imageBlob) {
            return new Response('User not found', { status: 404 })
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
        {description: 'The server icon image.'}),
        detail: {
            description: "Get the server icon of a server by it's ID.",
            summary: 'Get server icon by ID.',
            tags: ['server'],
        }
    })
