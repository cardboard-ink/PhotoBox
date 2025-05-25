import {
	botBannerBucket,
	botIconBucket,
	serverBannerBucket,
	serverIconBucket,
	userAvatarBucket,
	userBannerBucket,
} from "../stores/s3";

type ProfileType = "avatar" | "banner" | "icon";
type BucketMap = Record<string, Bun.S3Client>;

const bucketMap: BucketMap = {
	userAvatar: userAvatarBucket,
	userBanner: userBannerBucket,
	botIcon: botIconBucket,
	botBanner: botBannerBucket,
	serverIcon: serverIconBucket,
	serverBanner: serverBannerBucket,
};

export const guildedMediaLink = (awsUrl?: string) => {
	// replace https://s3-us-west-2.amazonaws.com/www.guilded.gg with https://cdn.gilcdn.com
	// keep everything else same
	if (!awsUrl) return awsUrl;
	return awsUrl.replace(
		"https://s3-us-west-2.amazonaws.com/www.guilded.gg",
		"https://cdn.gilcdn.com",
	);
};

const fetchAndSignUrl: (src: string) => Promise<string> = async (
	src: string,
) => {
	const signed = await (
		await fetch("https://www.guilded.gg/api/v1/url-signatures", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${process.env.G_TOKEN}`,
			},
			body: JSON.stringify({ urls: [src] }),
			keepalive: false,
		})
	).json();
	if (
		!signed ||
		!signed.urlSignatures ||
		!signed.urlSignatures[0] ||
		!signed.urlSignatures[0].url
	) {
		throw new Error("Failed to sign URL");
	}
	return signed.urlSignatures[0].url;
};

const uploadToBucket = async (bucket: Bun.S3Client, id: string, blob: Blob) => {
	// Convert the ReadableStream<Uint8Array> to a Buffer
	const reader = blob.stream().getReader();
	const chunks = [];
	let chunk = await reader.read();
	while (!chunk.done) {
		chunks.push(chunk.value);
		chunk = await reader.read();
	}
	const buffer = Buffer.concat(chunks);
	await bucket.write(`${id}.webp`, buffer, {
		type: "image/webp",
	});
};

async function handleProfileScrape(
	id: string,
	getElement: ProfileType,
	src: string | undefined,
	bucketKey: string,
): Promise<Blob> {
	if (!src) throw new Error("Source not found");
	const blob = await (await fetch(await fetchAndSignUrl(src))).blob();
	await uploadToBucket(bucketMap[bucketKey], id, blob);
	return blob;
}

export const guildedUserProfileScrape = async (
	id: string,
	getElement: "avatar" | "banner",
): Promise<Blob> => {
	const profile = await (
		await fetch(`https://www.guilded.gg/api/users/${id}`, {
			keepalive: false,
		})
	).json();
	const src =
		getElement === "avatar"
			? guildedMediaLink(profile.user.profilePictureLg)
			: guildedMediaLink(profile.user.profileBannerLg);
	const bucketKey = getElement === "avatar" ? "userAvatar" : "userBanner";
	return handleProfileScrape(id, getElement, src, bucketKey);
};

export const guildedBotProfileScrape = async (
	id: string,
	getElement: "icon" | "banner",
): Promise<Blob> => {
	const botUserProfile = await (
		await fetch(`https://www.guilded.gg/api/users/${id}`, {
			keepalive: false,
		})
	).json();
	const src =
		getElement === "icon"
			? guildedMediaLink(botUserProfile.user.profilePicture)
			: guildedMediaLink(botUserProfile.user.profileBannerLg);
	const bucketKey = getElement === "icon" ? "botIcon" : "botBanner";
	return handleProfileScrape(id, getElement, src, bucketKey);
};

export const guildedServerProfileScrape = async (
	id: string,
	getElement: "icon" | "banner",
): Promise<Blob> => {
	const server = await (
		await fetch(`https://www.guilded.gg/api/teams/${id}/info`, {
			keepalive: false,
		})
	).json();
	if (!server) throw new Error("Server not found");
	const src =
		getElement === "icon"
			? guildedMediaLink(server.team.profilePicture)
			: guildedMediaLink(server.team.teamDashImage);
	const bucketKey = getElement === "icon" ? "serverIcon" : "serverBanner";
	return handleProfileScrape(id, getElement, src, bucketKey);
};
