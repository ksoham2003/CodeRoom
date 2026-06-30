import cors from "cors";
import express from "express";
import morgan from "morgan";
import config from "./config/config.js";
import errorHandler from "./middlewares/error.handler.js";
import roomRoute from "./routes/room.route.js";

// Express instance
const app = express();

// Middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(
	cors({
		origin: config.CLIENT_URL,
		credentials: true,
	}),
);

// Health check
app.get("/check", (_, res) => {
	res.json({ status: "ok", message: "CodeRoom API is running" });
});

// Route branching
app.use("/api/rooms", roomRoute);

// Global error handler
app.use(errorHandler);

export default app;
