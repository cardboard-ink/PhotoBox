import { userAvatarBucket, userBannerBucket, serverBannerBucket, serverIconBucket } from "./minio"

export const guildedMediaLink = (awsUrl?: string) => {
    // replace https://s3-us-west-2.amazonaws.com/www.guilded.gg with https://cdn.gilcdn.com 
    // keep everything else same
    if (!awsUrl) return awsUrl;
    return awsUrl.replace('https://s3-us-west-2.amazonaws.com/www.guilded.gg', 'https://cdn.gilcdn.com');
  }

export const guildedUserProfileScrape: (id: string, getElement: 'avatar' | 'banner') => Promise<Blob|Error> = async (id: string, getElement: 'avatar' | 'banner') => {
    const profile = await (await fetch(`https://www.guilded.gg/api/users/${id}/profilev3`, {keepalive: false})).json()
    if (!profile) {
        return new Error('User not found')
    }
    const src = getElement === 'avatar' ? guildedMediaLink(profile.profilePictureLg) : guildedMediaLink(profile.profileBannerLg)
    const signed = await(await fetch(`https://www.guilded.gg/api/v1/url-signatures`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${process.env.G_TOKEN}`
        },
        body: JSON.stringify({
            urls: [src]
        }),
        keepalive: false
    })).json()
    if (!signed) {
        return new Error('Failed to sign URL')
    }
    const signedSrc = signed.urlSignatures[0].url
    if (getElement === 'avatar') {
        await userAvatarBucket.uploadImage(id, signedSrc)
    } else if (getElement === 'banner') {
        await userBannerBucket.uploadImage(id, signedSrc)
    }
    return await (await fetch(signedSrc)).blob()
}

export const guildedServerProfileScrape: (id: string, getElement: 'icon' | 'banner') => Promise<Blob | Error> = async (id, getElement) => {
    try {
        const server = await (await fetch(`https://www.guilded.gg/api/teams/${id}/info`, {keepalive: false})).json()
        if (!server) {
            return new Error('Server not found')
        }
        const src = getElement === 'icon' ? guildedMediaLink(server.profilePicture) : guildedMediaLink(server.teamDashImage)
        const signed = await(await fetch(`https://www.guilded.gg/api/v1/url-signatures`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.G_TOKEN}`
            },
            body: JSON.stringify({
                urls: [src]
            }),
            keepalive: false
        })).json()
        if (!signed) {
            return new Error('Failed to sign URL')
        }
        const signedSrc = signed.urlSignatures[0].url
        if (getElement === 'icon') {
            await serverIconBucket.uploadImage(id, signedSrc)
        } else if (getElement === 'banner') {
            await serverBannerBucket.uploadImage(id, signedSrc)
        }
        return await (await fetch(signedSrc)).blob()
    } catch (e) {
        return new Error('Server not found')
    }
}
