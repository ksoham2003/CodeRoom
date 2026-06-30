import dotenv from "dotenv";

dotenv.config({ quiet: true });

const config = {
	PORT: process.env.PORT || 5000,
	MONGO_URI: process.env.MONGO_URI || "",
	CLIENT_URL: process.env.CLIENT_URL || "http://localhost:5173",
	NODE_ENV: process.env.NODE_ENV || "development",
};

export default config;
