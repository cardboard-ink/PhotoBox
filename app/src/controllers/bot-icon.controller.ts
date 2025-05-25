import { Elysia, t } from "elysia";
import { guildedBotProfileScrape } from "../libs";
import { botIconBucket } from "../stores/s3";

export const botIconController = new Elysia().get(
	"/:id",
	async ({ params }) => {
		if (await botIconBucket.exists(params.id)) {
			const lastModified = (await botIconBucket.stat(params.id))
				.lastModified;
			if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
				(async () =>
					guildedBotProfileScrape(params.id, "icon"))().catch((e) =>
					console.error(e),
				);
			}
			return new Response(
				await botIconBucket.file(params.id).arrayBuffer(),
				{
					headers: { "Content-Type": "image/webp" },
				},
			);
		}
		const imageBlob = await guildedBotProfileScrape(params.id, "icon");
		if (imageBlob instanceof Error || !imageBlob) {
			return new Response("Bot not found", { status: 404 });
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
			description: "Get the bot icon of a bot by it's ID.",
			summary: "Get bot icon by ID.",
			tags: ["bot"],
		},
	},
);
