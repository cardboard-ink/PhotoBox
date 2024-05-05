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

export class BucketManager {
    private bucketName: string;
    constructor(bucketName: string) {
        this.bucketName = bucketName;
    }

    async ensureBucket() {
        await ensureBucket(this.bucketName);
    }

    async uploadImage(id: string, url: string) {
        await this.ensureBucket();
        await uploadImageToBucket(this.bucketName, id, url);
    }

    async checkAssetExists(id: string) {
        return checkAssetExists(this.bucketName, id);
    }

    async getAssetLastModified(id: string) {
        return getAssetLastModified(this.bucketName, id);
    }

    async getAsset(id: string) {
        return getAsset(this.bucketName, id);
    }
}

export const userAvatarBucket = new BucketManager('user-avatars');
export const userBannerBucket = new BucketManager('user-banners');
export const serverIconBucket = new BucketManager('server-icons');
export const serverBannerBucket = new BucketManager('server-banners');
