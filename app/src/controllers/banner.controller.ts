import { Elysia, t } from "elysia"
import { checkBannerExists, getBanner, getBannerLastModified, guildedProfileScrape, streamToBuffer } from "../libs"

export const bannerController = new Elysia()
    .get('/:id', async ({ params }) => {
        if (await checkBannerExists(params.id)) {
            const lastModified = await getBannerLastModified(params.id)
            if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
                guildedProfileScrape(params.id, 'banner')
            }
            const banner = await getBanner(params.id)
            return new Response(await streamToBuffer(banner), { headers: { 'Content-Type': 'image/webp' } })
        }
        const imageBlob = await guildedProfileScrape(params.id, 'banner')
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
        {description: 'The banner image.'}),
        detail: {
            description: 'Get the banner of a user by their ID.',
            summary: 'Get banner by ID.',
            tags: ['banner'],
        }
    })