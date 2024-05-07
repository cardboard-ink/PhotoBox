import { Elysia, t } from "elysia"
import { userAvatarBucket, guildedUserProfileScrape, streamToBuffer } from "../libs"

export const userAvatarController = new Elysia()
    .get('/:id', async ({ params }) => {
        if (await userAvatarBucket.checkAssetExists(params.id)) {
            console.log('User avatar exists')
            const lastModified = await userAvatarBucket.getAssetLastModified(params.id)
            if (Date.now() - lastModified.valueOf() > 24 * 60 * 60 * 1000) {
                console.log('User avatar is older than 24 hours')
                guildedUserProfileScrape(params.id, 'avatar')
            }
            console.log('Sending cached avatar')
            const avatar = await userAvatarBucket.getAsset(params.id)
            const res = new Response(await streamToBuffer(avatar), { headers: { 'Content-Type': 'image/webp' } })
            return res
        }
        const imageBlob = await guildedUserProfileScrape(params.id, 'avatar')
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
        {description: 'The avatar image.'}),
        detail: {
            description: 'Get the avatar of a user by their ID.',
            summary: 'Get user avatar by ID.',
            tags: ['user'],
        }
    })
