import dotenv from "dotenv";

dotenv.config({ quiet: true });

// CLIENT_URL can be a comma-separated list, e.g.:
// http://localhost:5173,https://code-room-brown.vercel.app
const rawClientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = rawClientUrl
	.split(",")
	.map((u) => u.trim().replace(/\/$/, ""))  // strip trailing slash
	.filter(Boolean);

const config = {
	PORT: process.env.PORT || 5000,
	MONGO_URI: process.env.MONGO_URI || "",
	CLIENT_URL: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
	NODE_ENV: process.env.NODE_ENV || "development",
};

export default config;
