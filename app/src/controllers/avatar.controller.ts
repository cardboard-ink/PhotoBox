import Elysia from "elysia"
import { browser, checkAvatarExists, getAvatar, getAvatarLastModified, guildedProfileScrape, streamToBuffer, uploadAvatar } from "../libs"

export const avatarController = new Elysia()
    .get('/:id', async ({ params }) => {
        if (await checkAvatarExists(params.id)) {
            const lastModified = await getAvatarLastModified(params.id)
            if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
                guildedProfileScrape(params.id, 'avatar')
            }
            const avatar = await getAvatar(params.id)
            return new Response(await streamToBuffer(avatar), { headers: { 'Content-Type': 'image/webp' } })
        }
        const imageBlob = await guildedProfileScrape(params.id, 'avatar')
        return new Response(imageBlob, { headers: { 'Content-Type': 'image/webp' } })
    })
