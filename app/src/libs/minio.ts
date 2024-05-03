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

export const streamToBuffer = (stream: Readable): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        const chunks: any[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
}

const BANNERS_BUCKET = 'banners';
const AVATARS_BUCKET = 'avatars';

export const uploadAvatar = async (id: string, avatarUrl: string) => {
    await uploadImageToBucket(AVATARS_BUCKET, id, avatarUrl);
}

export const checkAvatarExists = async (id: string) => {
    const exists = await minioClient.bucketExists(AVATARS_BUCKET);
    if (!exists) {
        return false;
    }
    try {
        await minioClient.statObject(AVATARS_BUCKET, `${id}.webp`);
        return true;
    } catch (e) {
        return false;
    }
}

export const getAvatar = async (id: string) => {
    const exists = await checkAvatarExists(id);
    if (!exists) {
        throw new Error(`Avatar with ID ${id} does not exist.`);
    }
    try {
        const stream = await minioClient.getObject(AVATARS_BUCKET, `${id}.webp`);
        return stream;
    } catch (e) {
        throw new Error(`Failed to retrieve avatar with ID ${id}.`);
    }
}

export const getAvatarLastModified = async (id: string) => {
    const exists = await checkAvatarExists(id);
    if (!exists) {
        throw new Error(`Avatar with ID ${id} does not exist.`);
    }
    try {
        const metaData = await minioClient.statObject(AVATARS_BUCKET, `${id}.webp`);
        return metaData.lastModified;
    } catch (e) {
        throw new Error(`Failed to retrieve last modified date for avatar with ID ${id}.`);
    }
}

export const uploadBanner = async (id: string, avatarUrl: string) => {
    await uploadImageToBucket(BANNERS_BUCKET, id, avatarUrl);
}

export const checkBannerExists = async (id: string) => {
    const exists = await minioClient.bucketExists(BANNERS_BUCKET);
    if (!exists) {
        return false;
    }
    try {
        await minioClient.statObject(BANNERS_BUCKET, `${id}.webp`);
        return true;
    } catch (e) {
        return false;
    }
}

export const getBanner = async (id: string) => {
    const exists = await checkBannerExists(id);
    if (!exists) {
        throw new Error(`Banner with ID ${id} does not exist.`);
    }
    try {
        const stream = await minioClient.getObject(BANNERS_BUCKET, `${id}.webp`);
        return stream;
    } catch (e) {
        throw new Error(`Failed to retrieve banner with ID ${id}.`);
    }
}

export const getBannerLastModified = async (id: string) => {
    const exists = await checkBannerExists(id);
    if (!exists) {
        throw new Error(`Banner with ID ${id} does not exist.`);
    }
    try {
        const metaData = await minioClient.statObject(BANNERS_BUCKET, `${id}.webp`);
        return metaData.lastModified;
    } catch (e) {
        throw new Error(`Failed to retrieve last modified date for banner with ID ${id}.`);
    }
}