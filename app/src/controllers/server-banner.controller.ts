import { Elysia, t } from "elysia"
import { checkServerBannerExists, getServerBanner, getServerBannerLastModified, guildedServerProfileScrape, streamToBuffer } from "../libs"

export const serverBannerController = new Elysia()
    .get('/:id', async ({ params }) => {
        if (await checkServerBannerExists(params.id)) {
            const lastModified = await getServerBannerLastModified(params.id)
            if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
                guildedServerProfileScrape(params.id, 'banner')
            }
            const banner = await getServerBanner(params.id)
            return new Response(await streamToBuffer(banner), { headers: { 'Content-Type': 'image/webp' } })
        }
        const imageBlob = await guildedServerProfileScrape(params.id, 'banner')
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
