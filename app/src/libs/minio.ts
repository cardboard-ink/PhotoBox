import * as Minio from 'minio'
import {Readable} from 'stream'

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_HOST!,
  port:  parseInt(process.env.MINIO_PORT!),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY!,
  secretKey: process.env.MINIO_SECRET_KEY!
});

const ensureBucket = async (bucketName: string) => {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
        await minioClient.makeBucket(bucketName);
    }
}

export const streamToBuffer = (stream: Readable): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

const uploadImageToBucket = async (bucketName: string, id: string, url: string) => {
    await ensureBucket(bucketName);
    const res = await fetch(url);
    const blob = await res.blob();
    // Convert the ReadableStream<Uint8Array> to a Buffer
    const reader = blob.stream().getReader();
    const chunks = [];
    let chunk;
    while (!(chunk = await reader.read()).done) {
        chunks.push(chunk.value);
    }
    const buffer = Buffer.concat(chunks);
    const metaData = {
        'Content-Type': 'image/webp',
    };
    await minioClient.putObject(bucketName, `${id}.webp`, buffer, buffer.length, metaData);
}

export const checkAssetExists = async (bucketName: string, id: string) => {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
        return false;
    }
    try {
        await minioClient.statObject(bucketName, `${id}.webp`);
        return true;
    } catch (e) {
        return false;
    }
}

export const getAssetLastModified = async (bucketName: string, id: string) => {
    const exists = await checkAssetExists(bucketName, id);
    if (!exists) {
        throw new Error(`Asset with ID ${id} does not exist in ${bucketName}.`);
    }
    try {
        const metaData = await minioClient.statObject(bucketName, `${id}.webp`);
        return metaData.lastModified;
    } catch (e) {
        throw new Error(`Failed to retrieve last modified date for asset with ID ${id}.`);
    }
}

export const getAsset = async (bucketName: string, id: string) => {
    const exists = await checkAssetExists(bucketName, id);
    if (!exists) {
        throw new Error(`Asset with ID ${id} does not exist in ${bucketName}.`);
    }
    try {
        const stream = await minioClient.getObject(bucketName, `${id}.webp`);
        return stream;
    } catch (e) {
        throw new Error(`Failed to retrieve asset with ID ${id} from ${bucketName}.`);
    }

}

const USER_BANNERS_BUCKET = 'user-banners';
const USER_AVATARS_BUCKET = 'user-avatars';
const SERVER_BANNERS_BUCKET = 'server-banners';
const SERVER_ICONS_BUCKET = 'server-icons';

export const uploadUserAvatar = async (id: string, avatarUrl: string) => {
    await ensureBucket(USER_AVATARS_BUCKET);
    await uploadImageToBucket(USER_AVATARS_BUCKET, id, avatarUrl);
}

export const getUserAvatar = async (id: string) => {
    return getAsset(USER_AVATARS_BUCKET, id);
}

export const getUserAvatarLastModified = async (id: string) => {
    return getAssetLastModified(USER_AVATARS_BUCKET, id);
}

export const checkUserAvatarExists = async (id: string) => {
    return checkAssetExists(USER_AVATARS_BUCKET, id);
}

export const uploadUserBanner = async (id: string, avatarUrl: string) => {
    await ensureBucket(USER_BANNERS_BUCKET);
    await uploadImageToBucket(USER_BANNERS_BUCKET, id, avatarUrl);
}

export const getUserBanner = async (id: string) => {
    return getAsset(USER_BANNERS_BUCKET, id);
}

export const getUserBannerLastModified = async (id: string) => {
    return getAssetLastModified(USER_BANNERS_BUCKET, id);
}

export const checkUserBannerExists = async (id: string) => {
    return checkAssetExists(USER_BANNERS_BUCKET, id);
}

export const uploadServerIcon = async (id: string, avatarUrl: string) => {
    await ensureBucket(SERVER_ICONS_BUCKET);
    await uploadImageToBucket(SERVER_ICONS_BUCKET, id, avatarUrl);
}

export const getServerIcon = async (id: string) => {
    return getAsset(SERVER_ICONS_BUCKET, id);
}

export const getServerIconLastModified = async (id: string) => {
    return getAssetLastModified(SERVER_ICONS_BUCKET, id);
}

export const checkServerIconExists = async (id: string) => {
    return checkAssetExists(SERVER_ICONS_BUCKET, id);
}

export const uploadServerBanner = async (id: string, avatarUrl: string) => {
    await ensureBucket(SERVER_BANNERS_BUCKET);
    await uploadImageToBucket(SERVER_BANNERS_BUCKET, id, avatarUrl);
}

export const getServerBanner = async (id: string) => {
    return getAsset(SERVER_BANNERS_BUCKET, id);
}

export const getServerBannerLastModified = async (id: string) => {
    return getAssetLastModified(SERVER_BANNERS_BUCKET, id);
}

export const checkServerBannerExists = async (id: string) => {
    return checkAssetExists(SERVER_BANNERS_BUCKET, id);
}
