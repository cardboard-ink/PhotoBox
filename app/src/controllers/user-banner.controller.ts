import { Elysia, t } from "elysia"
import { userBannerBucket, guildedUserProfileScrape, streamToBuffer } from "../libs"

export const userBannerController = new Elysia()
    .get('/:id', async ({ params }) => {
        if (await userBannerBucket.checkAssetExists(params.id)) {
            const lastModified = await userBannerBucket.getAssetLastModified(params.id)
            if (Date.now() - lastModified.valueOf() > 24 * 60 * 60 * 1000) {
                guildedUserProfileScrape(params.id, 'banner')
            }
            const banner = await userBannerBucket.getAsset(params.id)
            return new Response(await streamToBuffer(banner), { headers: { 'Content-Type': 'image/webp' } })
        }
        const imageBlob = await guildedUserProfileScrape(params.id, 'banner')
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
        {description: 'The banner image.'}),
        detail: {
            description: 'Get the banner of a user by their ID.',
            summary: 'Get user banner by ID.',
            tags: ['user'],
        }
    })