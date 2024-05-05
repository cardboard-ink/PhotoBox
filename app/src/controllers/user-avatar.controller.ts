import { Elysia, t } from "elysia"
import { userAvatarBucket, guildedUserProfileScrape, streamToBuffer } from "../libs"

export const userAvatarController = new Elysia()
    .get('/:id', async ({ params }) => {
        if (await userAvatarBucket.checkAssetExists(params.id)) {
            const lastModified = await userAvatarBucket.getAssetLastModified(params.id)
            if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
                guildedUserProfileScrape(params.id, 'avatar')
            }
            const avatar = await userAvatarBucket.getAsset(params.id)
            const res = new Response(await streamToBuffer(avatar), { headers: { 'Content-Type': 'image/webp' } })
            return res
        }
        const imageBlob = await guildedUserProfileScrape(params.id, 'avatar')
        if (imageBlob instanceof Error) {
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
