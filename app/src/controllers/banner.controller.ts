import Elysia from "elysia"
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
    })