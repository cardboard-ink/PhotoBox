import { Elysia, t } from "elysia"
import { checkAvatarExists, getAvatar, getAvatarLastModified, guildedProfileScrape, streamToBuffer } from "../libs"

export const avatarController = new Elysia()
    .get('/:id', async ({ params }) => {
        if (await checkAvatarExists(params.id)) {
            const lastModified = await getAvatarLastModified(params.id)
            if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
                guildedProfileScrape(params.id, 'avatar')
            }
            const avatar = await getAvatar(params.id)
            const res = new Response(await streamToBuffer(avatar), { headers: { 'Content-Type': 'image/webp' } })
            return res
        }
        const imageBlob = await guildedProfileScrape(params.id, 'avatar')
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
            summary: 'Get avatar by ID.',
            tags: ['avatar'],
        }
    })
