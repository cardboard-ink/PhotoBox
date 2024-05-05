import { userAvatarBucket, userBannerBucket, serverBannerBucket, serverIconBucket } from "./minio"
import puppeteer from "puppeteer";

const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: "/usr/bin/chromium",
})

export const guildedUserProfileScrape: (id: string, getElement: 'avatar' | 'banner') => Promise<Blob|Error> = async (id: string, getElement: 'avatar' | 'banner') => {
    try {
        const getClass = getElement === 'avatar' ? '.ProgressiveLoadedImage-container.ProgressiveLoadedImage-container-progressive-loaded.ProgressiveLoadedImage-container-src-loaded>.UserProfilePictureControl-picture' : '.ProgressiveLoadedImage-container.ProgressiveLoadedImage-container-progressive-loaded.ProgressiveLoadedImage-container-src-loaded.ProgressiveLoadedImage-container-cover>.UserProfileBackground-image'
        const page = await browser.newPage()
        await page.goto(`https://www.guilded.gg/profile/${id}`)
        await page.waitForSelector(getClass, { timeout: 7000 })
        const src = await page.$eval(getClass, (el: any) => el.src)
        if (getElement === 'avatar') {
            await userAvatarBucket.uploadImage(id, src)
        } else if (getElement === 'banner') {
            await userBannerBucket.uploadImage(id, src)
        }
        await page.close()
        return await (await fetch(src)).blob()
    } catch (e) {
        return new Error('User not found')
    }
}

export const guildedServerProfileScrape: (id: string, getElement: 'icon' | 'banner') => Promise<Blob | Error> = async (id, getElement) => {
    try {
        const getClass = getElement === 'icon' ? '.ProgressiveLoadedImage-container.ProgressiveLoadedImage-container-progressive-loaded.ProgressiveLoadedImage-container-src-loaded>.TeamPlaqueV2-profile-pic' : '.ProgressiveLoadedImage-container.ProgressiveLoadedImage-container-progressive-loaded.ProgressiveLoadedImage-container-src-loaded>.TeamOverviewBanner-banner.TeamPageBanner-overview-banner'
        const page = await browser.newPage()
        await page.goto(`https://www.guilded.gg/teams/${id}/overview`)
        await page.waitForSelector(getClass, { timeout: 7000 })
        const src = await page.$eval(getClass, (el: any) => el.src)
        if (getElement === 'icon') {
            await serverIconBucket.uploadImage(id, src)
        } else if (getElement === 'banner') {
            await serverBannerBucket.uploadImage(id, src)
        }
        await page.close()
        return await (await fetch(src)).blob()
    } catch (e) {
        return new Error('Server not found')
    }
}