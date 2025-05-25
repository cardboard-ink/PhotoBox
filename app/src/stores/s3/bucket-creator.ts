import { S3Client } from "bun";

/**
 * @author SoSweetHam
 * @param bucket The bucket name to create/use
 * @returns A new S3Client instance with the specified bucket
 */
export const bucketCreator = (bucket: string) => {
	return new S3Client({
		endpoint: Bun.env.SEAWEED_ENDPOINT,
		accessKeyId: Bun.env.SEAWEED_ACCESS_KEY,
		secretAccessKey: Bun.env.SEAWEED_SECRET_KEY,
		bucket,
		region: "us-east-1",
	});
};
