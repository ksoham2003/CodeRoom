import { Server } from "socket.io";
import config from "../config/config.js";
import roomHandler from "./roomHandler.js";
import documentHandler from "./documentHandler.js";
import presenceHandler from "./presenceHandler.js";

/**
 * Initialize Socket.io server and attach all event handlers.
 * @param {import('http').Server} httpServer
 * @returns {Server} The Socket.io server instance
 */
const initializeSocket = (httpServer) => {
	const allowedOrigins = Array.isArray(config.CLIENT_URL)
		? config.CLIENT_URL
		: [config.CLIENT_URL];

	const io = new Server(httpServer, {
		pingTimeout: 60000,
		cors: {
			origin: (origin, callback) => {
				if (!origin) return callback(null, true);
				if (allowedOrigins.includes(origin)) return callback(null, true);
				console.warn(`[Socket CORS] Blocked origin: ${origin}`);
				// Return false (not an Error) so it rejects cleanly without 500
				return callback(null, false);
			},
			methods: ["GET", "POST"],
			credentials: true,
		},
	});

	io.on("connection", (socket) => {
		console.log(`[Socket] Connected: ${socket.id}`);

		// Attach all domain handlers
		roomHandler(io, socket);
		documentHandler(io, socket);
		presenceHandler(io, socket);

		socket.on("disconnect", () => {
			console.log(`[Socket] Disconnected: ${socket.id}`);
		});
	});

	return io;
};

export default initializeSocket;
