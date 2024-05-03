import { uploadAvatar, uploadBanner } from "./minio"
import { browser } from "./puppeteer"

export const guildedProfileScrape = async (id: string, getElement: 'avatar' | 'banner') => {
    const getClass = getElement === 'avatar' ? '.UserProfilePictureControl-picture' : '.UserProfileBackground-image'
    const page = await browser.newPage()
    await page.goto(`https://guilded.gg/profile/${id}`, {waitUntil: 'networkidle0'})
    const src = await page.$eval(getClass, (el: any) => el.src)
    if (getElement === 'avatar') {
        await uploadAvatar(id, src)
    } else if (getElement === 'banner') {
        await uploadBanner(id, src)
    }
    await page.close()
    return await (await fetch(src)).blob()
}