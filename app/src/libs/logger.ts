import chalk from "chalk";

function bootLogger() {
	console.log(
		"🦊 running on",
		chalk.blueBright("http://localhost:") +
			chalk.greenBright(process.env.PORT),
	);
}

const gracefulShutdown = async () => {
	console.log(
		chalk.yellowBright("shutting down gracefully (5 seconds) ...."),
	);
	// disconnet DB and other services...
	setTimeout(() => {
		console.log("good bye");
		process.exit();
	}, 5000);
};
export { bootLogger, gracefulShutdown };
