import { Elysia, t } from "elysia";
import {
	// userAvatarBucket,
	guildedUserProfileScrape,
	// streamToBuffer,
} from "../libs";
import { userAvatarBucket } from "../stores/s3";

export const userAvatarController = new Elysia().get(
	"/:id",
	async ({ params }) => {
		if (await userAvatarBucket.exists(params.id)) {
			const lastModified = (await userAvatarBucket.stat(params.id))
				.lastModified;
			if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
				(async () =>
					guildedUserProfileScrape(params.id, "avatar"))().catch(
					(e) => console.error(e),
				);
			}
			const res = new Response(
				await userAvatarBucket.file(params.id).arrayBuffer(),
				{
					headers: { "Content-Type": "image/webp" },
				},
			);
			return res;
		}
		const imageBlob = await guildedUserProfileScrape(params.id, "avatar");
		if (imageBlob instanceof Error || !imageBlob) {
			return new Response("User not found", { status: 404 });
		}
		const res = new Response(imageBlob, {
			headers: { "Content-Type": "image/webp" },
		});
		return res;
	},
	{
		params: t.Object({
			id: t.String(),
		}),
		detail: {
			description: "Get the avatar of a user by their ID.",
			summary: "Get user avatar by ID.",
			tags: ["user"],
		},
	},
);
