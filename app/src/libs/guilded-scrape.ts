import { userAvatarBucket, userBannerBucket, serverBannerBucket, serverIconBucket } from "./minio"
import puppeteer, { Browser } from "puppeteer";

export let browserInstances: Browser[] = []

export const guildedUserProfileScrape = async (id: string, getElement: 'avatar' | 'banner') => {
    console.log('Reached Scraper')
    const getClass = getElement === 'avatar' ? '.UserProfilePictureControl-picture' : '.UserProfileBackground-image'
    console.log('launching puppeteer')
    const browser = await puppeteer.launch()
    console.log('puppeteer launched')
    browserInstances.push(browser)
    console.log('opening new page')
    const page = await browser.newPage()
    console.log('opened new page, going to url')
    await page.goto(`https://guilded.gg/profile/${id}`, {waitUntil: 'networkidle0'})
    console.log('went to url')
    const src = await page.$eval(getClass, (el: any) => el.src)
    console.log('got src')
    if (getElement === 'avatar') {
        await userAvatarBucket.uploadImage(id, src)
    } else if (getElement === 'banner') {
        await userBannerBucket.uploadImage(id, src)
    }
    console.log('uploaded image')
    await page.close()
    console.log('closed page')
    await browser.close()
    console.log('closed browser')
    browserInstances.pop()
    console.log('popped browser, returning fetched image')
    return await (await fetch(src)).blob()
}

export const guildedServerProfileScrape = async (id: string, getElement: 'icon' | 'banner') => {
    const getClass = getElement === 'icon' ? '.TeamPlaqueV2-profile-pic' : '.TeamOverviewBanner-banner.TeamPageBanner-overview-banner'
    const browser = await puppeteer.launch()
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