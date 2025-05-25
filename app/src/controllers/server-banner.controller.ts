import { Elysia, t } from "elysia";
import { guildedServerProfileScrape } from "../libs";
import { serverBannerBucket } from "../stores/s3";

export const serverBannerController = new Elysia().get(
	"/:id",
	async ({ params }) => {
		if (await serverBannerBucket.exists(params.id)) {
			const lastModified = (await serverBannerBucket.stat(params.id))
				.lastModified;
			if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
				(async () =>
					guildedServerProfileScrape(params.id, "banner"))().catch(
					(e) => console.error(e),
				);
			}
			return new Response(
				await serverBannerBucket.file(params.id).arrayBuffer(),
				{
					headers: { "Content-Type": "image/webp" },
				},
			);
		}
		const imageBlob = await guildedServerProfileScrape(params.id, "banner");
		if (imageBlob instanceof Error || !imageBlob) {
			return new Response("Server not found", { status: 404 });
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
			description: "Get the banner of a server by its ID.",
			summary: "Get server banner by ID.",
			tags: ["server"],
		},
	},
);
