import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import {
	ErrorMessages,
	bootLogger,
	gracefulShutdown,
	requestLogger,
} from "./libs";
import {
	userAvatarController,
	userBannerController,
	serverIconController,
	serverBannerController,
	botIconController,
	botBannerController,
} from "./controllers";

if (!process.env.PORT) {
	console.log("PORT is not defined");
	process.exit(1);
}

if (
	!process.env.MINIO_ACCESS_KEY ||
	!process.env.MINIO_SECRET_KEY ||
	!process.env.MINIO_PORT ||
	!process.env.MINIO_HOST
) {
	console.log(
		"MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_PORT and/or MINIO_HOST are not defined",
	);
	process.exit(1);
}

try {
	const app = new Elysia()
		.use(cors())
		.use(
			swagger({
				documentation: {
					info: {
						title: "PhotoBox API",
						description:
							"API for PhotoBox, a service for fetching user and server images from Guilded with a fast Cache.",
						version: "1.0.0",
					},
					servers: [
						{ url: "https://photobox.cardboard.ink" },
						{ url: `http://localhost:${process.env.PORT}` },
					],
					tags: [
						{ name: "user", description: "User related endpoints" },
						{
							name: "server",
							description: "Server related endpoints",
						},
					],
				},
			}),
		)
		.onStop(gracefulShutdown)
		.onError(({ code, error }) => ErrorMessages(code, error))
		.get("/heartbeat", () => "ok");

	process.on("SIGINT", app.stop);
	process.on("SIGTERM", app.stop);
	app.group("/user", (app) => {
		app.group("/avatar", (app) => app.use(userAvatarController));
		app.group("/banner", (app) => app.use(userBannerController));
		return app;
	});
	app.group("/server", (app) => {
		app.group("/icon", (app) => app.use(serverIconController));
		app.group("/banner", (app) => app.use(serverBannerController));
		return app;
	});
	app.group("/bot", (app) => {
		app.group("/icon", (app) => app.use(botIconController));
		app.group("/banner", (app) => app.use(botBannerController));
		return app;
	});
	app.listen(process.env.PORT!, bootLogger);
} catch (e) {
	console.log("error booting the server");
	console.error(e);
}
