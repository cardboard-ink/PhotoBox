import { Elysia, t } from "elysia"
import { checkUserBannerExists, getUserBanner, getUserBannerLastModified, guildedUserProfileScrape, streamToBuffer } from "../libs"

export const userBannerController = new Elysia()
    .get('/:id', async ({ params }) => {
        if (await checkUserBannerExists(params.id)) {
            const lastModified = await getUserBannerLastModified(params.id)
            if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
                guildedUserProfileScrape(params.id, 'banner')
            }
            const banner = await getUserBanner(params.id)
            return new Response(await streamToBuffer(banner), { headers: { 'Content-Type': 'image/webp' } })
        }
        const imageBlob = await guildedUserProfileScrape(params.id, 'banner')
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
            summary: 'Get user banner by ID.',
            tags: ['user'],
        }
    })