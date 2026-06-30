import http from "http";
import chalk from "chalk";
import app from "./src/app.js";
import config from "./src/config/config.js";
import connectDB from "./src/config/database.js";
import initializeSocket from "./src/sockets/index.js";

async function startServer() {
	try {
		// Connect to MongoDB
		await connectDB();

		// Create HTTP server from Express app
		const server = http.createServer(app);

		// Mount Socket.io
		const io = initializeSocket(server);

		// Make io accessible to routes if needed
		app.set("io", io);

		// Start server
		server.listen(config.PORT, () => {
			console.log(
				chalk.bgCyan.bold(
					` CodeRoom server running on port ${config.PORT} `,
				),
			);
			console.log(
				chalk.green(`  → Environment: ${config.NODE_ENV}`),
			);
			console.log(
				chalk.green(`  → Client URL:  ${config.CLIENT_URL}`),
			);
		});
	} catch (error) {
		console.error(chalk.red("Failed to start server:"), error);
		process.exit(1);
	}
}

startServer();
