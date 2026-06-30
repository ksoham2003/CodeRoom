import mongoose from "mongoose";

const participantSchema = new mongoose.Schema(
	{
		socketId: { type: String, required: true },
		username: { type: String, required: true, trim: true },
		joinedAt: { type: Date, default: Date.now },
		isHost: { type: Boolean, default: false },
	},
	{ _id: false },
);

const roomSchema = new mongoose.Schema(
	{
		roomCode: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			index: true,
		},
		roomName: {
			type: String,
			default: "Untitled Room",
			trim: true,
			maxlength: 100,
		},
		hostId: {
			type: String,
			required: true,
		},
		participants: [participantSchema],
		isLocked: {
			type: Boolean,
			default: false,
		},
		maxParticipants: {
			type: Number,
			default: 10,
		},
	},
	{
		timestamps: true,
	},
);

const Room = mongoose.model("Room", roomSchema);

export default Room;
