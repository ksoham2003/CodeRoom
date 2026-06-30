import cors from "cors";
import express from "express";
import morgan from "morgan";
import config from "./config/config.js";
import errorHandler from "./middlewares/error.handler.js";
import roomRoute from "./routes/room.route.js";

// Express instance
const app = express();

// Build allowed origins array
const allowedOrigins = Array.isArray(config.CLIENT_URL)
	? config.CLIENT_URL
	: [config.CLIENT_URL];

// Dynamic CORS origin checker
const corsOptions = {
	origin: (origin, callback) => {
		// Allow requests with no origin (e.g. mobile apps, curl, Postman)
		if (!origin) return callback(null, true);
		if (allowedOrigins.includes(origin)) {
			return callback(null, true);
		}
		console.warn(`[CORS] Blocked origin: ${origin}`);
		// Return false (not an Error) so Express sends 403, not 500
		return callback(null, false);
	},
	credentials: true,
};

// Middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(cors(corsOptions));

// Health check
app.get("/check", (_, res) => {
	res.json({ status: "ok", message: "CodeRoom API is running" });
});

// Route branching
app.use("/api/rooms", roomRoute);

// Global error handler
app.use(errorHandler);

export default app;
