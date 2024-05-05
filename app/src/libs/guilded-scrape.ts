import { userAvatarBucket, userBannerBucket, serverBannerBucket, serverIconBucket } from "./minio"
import puppeteer, { Browser } from "puppeteer";

export let browserInstances: Browser[] = []

export const guildedUserProfileScrape: (id: string, getElement: 'avatar' | 'banner') => Promise<Blob|Error> = async (id: string, getElement: 'avatar' | 'banner') => {
    try {
        const getClass = getElement === 'avatar' ? '.UserProfilePictureControl-picture' : '.UserProfileBackground-image'
        if (browserInstances.length > 5) {
            throw new Error('Too many requests')
        }
        const browser = await puppeteer.launch({ 
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            executablePath: "/usr/bin/chromium",
        })
        browserInstances.push(browser)
        const page = await browser.newPage()
        try {
            await page.goto(`https://www.guilded.gg/profile/${id}`, {waitUntil: 'networkidle0'})
        } catch (e) {
            throw new Error(`User not found,\nError:\n${e}`)
        }
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
    } catch (e) {
        return new Error('User not found')
    }
}

export const guildedServerProfileScrape: (id: string, getElement: 'icon' | 'banner') => Promise<Blob | Error> = async (id, getElement) => {
    try {
        const getClass = getElement === 'icon' ? '.TeamPlaqueV2-profile-pic' : '.TeamOverviewBanner-banner.TeamPageBanner-overview-banner'
        if (browserInstances.length > 5) {
            throw new Error('Too many requests')
        }
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
    } catch (e) {
        return new Error('Server not found')
    }
}