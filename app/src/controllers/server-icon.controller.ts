import { Elysia, t } from "elysia";
import {
	// serverIconBucket,
	guildedServerProfileScrape,
	// streamToBuffer,
} from "../libs";
import { serverIconBucket } from "../stores/s3";

export const serverIconController = new Elysia().get(
	"/:id",
	async ({ params }) => {
		if (await serverIconBucket.exists(params.id)) {
			const lastModified = (await serverIconBucket.stat(params.id))
				.lastModified;
			if (Date.now() - lastModified.valueOf() > 5 * 60 * 1000) {
				(async () =>
					guildedServerProfileScrape(params.id, "icon"))().catch(
					(e) => console.error(e),
				);
			}
			const res = new Response(
				await serverIconBucket.file(params.id).arrayBuffer(),
				{
					headers: { "Content-Type": "image/webp" },
				},
			);
			return res;
		}
		const imageBlob = await guildedServerProfileScrape(params.id, "icon");
		if (imageBlob instanceof Error || !imageBlob) {
			return new Response("Server not found", { status: 404 });
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
			description: "Get the server icon of a server by it's ID.",
			summary: "Get server icon by ID.",
			tags: ["server"],
		},
	},
);
