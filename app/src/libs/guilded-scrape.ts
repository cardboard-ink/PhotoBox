import { userAvatarBucket, userBannerBucket, serverBannerBucket, serverIconBucket } from "./minio"
import puppeteer, { Browser } from "puppeteer";

export let browserInstances: Browser[] = []

export const guildedUserProfileScrape = async (id: string, getElement: 'avatar' | 'banner') => {
    const getClass = getElement === 'avatar' ? '.UserProfilePictureControl-picture' : '.UserProfileBackground-image'
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: "/usr/bin/chromium",
    })
    browserInstances.push(browser)
    const page = await browser.newPage()
    await page.goto(`https://guilded.gg/profile/${id}`, {waitUntil: 'networkidle0'})
    const src = await page.$eval(getClass, (el: any) => el.src)
    if (getElement === 'avatar') {
        await userAvatarBucket.uploadImage(id, src)
    } else if (getElement === 'banner') {
        await userBannerBucket.uploadImage(id, src)
    }
    await page.close()
    await browser.close()
    browserInstances.pop()
    return await (await fetch(src)).blob()
}

export const guildedServerProfileScrape = async (id: string, getElement: 'icon' | 'banner') => {
    const getClass = getElement === 'icon' ? '.TeamPlaqueV2-profile-pic' : '.TeamOverviewBanner-banner.TeamPageBanner-overview-banner'
    const browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: "/usr/bin/chromium",
    })
    browserInstances.push(browser)
    const page = await browser.newPage()
    await page.goto(`https://www.guilded.gg/teams/${id}/overview`, {waitUntil: 'networkidle0'})
    const src = await page.$eval(getClass, (el: any) => el.src)
    if (getElement === 'icon') {
        await serverIconBucket.uploadImage(id, src)
    } else if (getElement === 'banner') {
        await serverBannerBucket.uploadImage(id, src)
    }
    await page.close()
    await browser.close()
    browserInstances.pop()
    return await (await fetch(src)).blob()
}