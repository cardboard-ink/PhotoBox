import { Elysia, t } from "elysia";
import {
	// userBannerBucket,
	guildedUserProfileScrape,
	// streamToBuffer,
} from "../libs";
import { userBannerBucket } from "../stores/s3";

export const userBannerController = new Elysia().get(
	"/:id",
	async ({ params }) => {
		if (await userBannerBucket.exists(params.id)) {
			const lastModified = (await userBannerBucket.stat(params.id))
				.lastModified;
			if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
				(async () =>
					guildedUserProfileScrape(params.id, "banner"))().catch(
					(e) => console.error(e),
				);
			}
			return new Response(
				await userBannerBucket.file(params.id).arrayBuffer(),
				{
					headers: { "Content-Type": "image/webp" },
				},
			);
		}
		const imageBlob = await guildedUserProfileScrape(params.id, "banner");
		if (imageBlob instanceof Error || !imageBlob) {
			return new Response("User not found", { status: 404 });
		}
		return new Response(imageBlob, {
			headers: { "Content-Type": "image/webp" },
		});
	},
	{
		params: t.Object({
			id: t.String(),
		}),
		detail: {
			description: "Get the banner of a user by their ID.",
			summary: "Get user banner by ID.",
			tags: ["user"],
		},
	},
);
