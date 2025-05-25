import {
	botBannerBucket,
	botIconBucket,
	serverBannerBucket,
	serverIconBucket,
	userAvatarBucket,
	userBannerBucket,
} from "../stores/s3";

export const guildedMediaLink = (awsUrl?: string) => {
	// replace https://s3-us-west-2.amazonaws.com/www.guilded.gg with https://cdn.gilcdn.com
	// keep everything else same
	if (!awsUrl) return awsUrl;
	return awsUrl.replace(
		"https://s3-us-west-2.amazonaws.com/www.guilded.gg",
		"https://cdn.gilcdn.com",
	);
};

const uploadToBucket = async (
	bucket: Bun.S3Client,
	id: string,
	url: string,
) => {
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
	await bucket.write(`${id}.webp`, buffer, {
		type: "image/webp",
	});
};

export const guildedUserProfileScrape: (
	id: string,
	getElement: "avatar" | "banner",
) => Promise<Blob | Error> = async (
	id: string,
	getElement: "avatar" | "banner",
) => {
	const profile = (await (
		await fetch(`https://www.guilded.gg/api/users/${id}`, {
			keepalive: false,
		})
	).json()) as {
		user: {
			profilePictureLg?: string;
			profileBannerLg?: string;
		}
	};
	if (!profile) {
		return new Error("User not found");
	}
	const src =
		getElement === "avatar"
			? guildedMediaLink(profile.user.profilePictureLg)
			: guildedMediaLink(profile.user.profileBannerLg);
	const signed = (await (
		await fetch(`https://www.guilded.gg/api/v1/url-signatures`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${process.env.G_TOKEN}`,
			},
			body: JSON.stringify({
				urls: [src],
			}),
			keepalive: false,
		})
	).json()) as {urlSignatures: {url: string}[]};
	if (
		!signed ||
		!signed.urlSignatures ||
		!signed.urlSignatures[0] ||
		!signed.urlSignatures[0].url
	) {
		return new Error("Failed to sign URL");
	}
	const signedSrc = signed.urlSignatures[0].url;
	if (getElement === "avatar") {
		// await userAvatarBucket.uploadImage(id, signedSrc);
		await uploadToBucket(userAvatarBucket, id, signedSrc);
	} else if (getElement === "banner") {
		await uploadToBucket(userBannerBucket, id, signedSrc);
	}
	return await (await fetch(signedSrc)).blob();
};

export const guildedBotProfileScrape: (
	id: string,
	getElement: "icon" | "banner",
) => Promise<Blob | Error> = async (id, getElement) => {
	const botUserProfile = await (
		await fetch(`https://www.guilded.gg/api/users/${id}`, {
			keepalive: false,
		})
	).json();
	const src =
		getElement === "icon"
			? guildedMediaLink(botUserProfile.user.profilePicture)
			: guildedMediaLink(botUserProfile.user.profileBannerLg);
	const signed = await (
		await fetch(`https://www.guilded.gg/api/v1/url-signatures`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${process.env.G_TOKEN}`,
			},
			body: JSON.stringify({
				urls: [src],
			}),
			keepalive: false,
		})
	).json();
	if (
		!signed ||
		!signed.urlSignatures ||
		!signed.urlSignatures[0] ||
		!signed.urlSignatures[0].url
	) {
		return new Error("Failed to sign URL");
	}
	const signedSrc = signed.urlSignatures[0].url;
	if (getElement === "icon") {
		await uploadToBucket(botIconBucket, id, signedSrc);
	} else if (getElement === "banner") {
		await uploadToBucket(botBannerBucket, id, signedSrc);
	}
	return await (await fetch(signedSrc)).blob();
};

export const guildedServerProfileScrape: (
	id: string,
	getElement: "icon" | "banner",
) => Promise<Blob | Error> = async (id, getElement) => {
	try {
		const server = await (
			await fetch(`https://www.guilded.gg/api/teams/${id}/info`, {
				keepalive: false,
			})
		).json();
		if (!server) {
			return new Error("Server not found");
		}
		const src =
			getElement === "icon"
				? guildedMediaLink(server.team.profilePicture)
				: guildedMediaLink(server.team.teamDashImage);
		const signed = await (
			await fetch(`https://www.guilded.gg/api/v1/url-signatures`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json",
					Authorization: `Bearer ${process.env.G_TOKEN}`,
				},
				body: JSON.stringify({
					urls: [src],
				}),
				keepalive: false,
			})
		).json();
		if (
			!signed ||
			!signed.urlSignatures ||
			!signed.urlSignatures[0] ||
			!signed.urlSignatures[0].url
		) {
			return new Error("Failed to sign URL");
		}
		const signedSrc = signed.urlSignatures[0].url;
		if (getElement === "icon") {
			await uploadToBucket(serverIconBucket, id, signedSrc);
		} else if (getElement === "banner") {
			await uploadToBucket(serverBannerBucket, id, signedSrc);
		}
		return await (await fetch(signedSrc)).blob();
	} catch (e) {
		return new Error("Server not found");
	}
};
