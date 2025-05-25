import { Elysia, t } from "elysia";
import { guildedBotProfileScrape } from "../libs";
import { botBannerBucket } from "../stores/s3";

export const botBannerController = new Elysia().get(
	"/:id",
	async ({ params }) => {
		if (await botBannerBucket.exists(params.id)) {
			const lastModified = (await botBannerBucket.stat(params.id))
				.lastModified;
			if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
				(async () =>
					guildedBotProfileScrape(params.id, "banner"))().catch((e) =>
					console.error(e),
				);
			}
			return new Response(
				await botBannerBucket.file(params.id).arrayBuffer(),
				{
					headers: { "Content-Type": "image/webp" },
				},
			);
		}
		const imageBlob = await guildedBotProfileScrape(params.id, "banner");
		if (imageBlob instanceof Error || !imageBlob) {
			return new Response("Bot not found", { status: 404 });
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
			description: "Get the banner of a bot by its ID.",
			summary: "Get bot banner by ID.",
			tags: ["bot"],
		},
	},
);
