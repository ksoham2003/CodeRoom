import mongoose from "mongoose";

const editHistorySchema = new mongoose.Schema(
	{
		type: {
			type: String,
			enum: ["insert", "delete"],
			required: true,
		},
		position: { type: Number, required: true },
		content: { type: String, required: true },
		userId: { type: String, required: true },
		username: { type: String, default: "Anonymous" },
		timestamp: { type: Number, required: true },
		version: { type: Number, required: true },
	},
	{ _id: false },
);

const documentSchema = new mongoose.Schema(
	{
		roomCode: {
			type: String,
			required: true,
			unique: true,
			index: true,
		},
		content: {
			type: String,
			default: "// Welcome to CodeRoom! Start coding together...\n",
		},
		version: {
			type: Number,
			default: 0,
		},
		// Store recent operations for OT transform (circular buffer — keep last 100)
		recentOps: {
			type: [editHistorySchema],
			default: [],
		},
		// Full edit log for activity history (stretch goal)
		editHistory: {
			type: [editHistorySchema],
			default: [],
		},
		lastEditedBy: { type: String, default: null },
		lastEditedAt: { type: Date, default: null },
	},
	{
		timestamps: true,
	},
);

const Document = mongoose.model("Document", documentSchema);

export default Document;
