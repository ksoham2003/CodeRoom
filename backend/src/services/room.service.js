import Room from "../models/Room.model.js";
import Document from "../models/Document.model.js";
import ApiError from "../utils/apiError.js";
import generateRoomCode from "../utils/generateRoomCode.js";

/**
 * Create a new room with a unique code and initialize its document.
 */
export const createRoomService = async ({ username }) => {
	if (!username || !username.trim()) {
		throw new ApiError(400, "Username is required to create a room");
	}

	// Generate unique room code (retry if collision)
	let roomCode;
	let attempts = 0;
	do {
		roomCode = generateRoomCode();
		const existing = await Room.findOne({ roomCode });
		if (!existing) break;
		attempts++;
	} while (attempts < 5);

	if (attempts >= 5) {
		throw new ApiError(500, "Failed to generate a unique room code");
	}

	// Create room
	const room = await Room.create({
		roomCode,
		hostId: null, // Will be set when host connects via socket
		participants: [],
	});

	// Create associated document
	await Document.create({
		roomCode,
		content: "// Welcome to CodeRoom! Start coding together...\n",
		version: 0,
	});

	return { room, roomCode };
};

/**
 * Validate a room code and return room info for joining.
 */
export const joinRoomService = async ({ roomCode, username }) => {
	if (!roomCode || !roomCode.trim()) {
		throw new ApiError(400, "Room code is required");
	}
	if (!username || !username.trim()) {
		throw new ApiError(400, "Username is required to join a room");
	}

	const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });

	if (!room) {
		throw new ApiError(404, "Room not found. Please check the room code.");
	}

	if (room.isLocked) {
		throw new ApiError(403, "This room is locked. No new participants can join.");
	}

	if (room.participants.length >= room.maxParticipants) {
		throw new ApiError(403, "Room is full. Maximum participants reached.");
	}

	// Get document for the room
	const document = await Document.findOne({ roomCode: room.roomCode });

	return {
		room: {
			roomCode: room.roomCode,
			roomName: room.roomName,
			hostId: room.hostId,
			isLocked: room.isLocked,
			participantCount: room.participants.length,
		},
		document: document
			? { content: document.content, version: document.version }
			: { content: "", version: 0 },
	};
};

/**
 * Get room info by room code.
 */
export const getRoomService = async (roomCode) => {
	const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });

	if (!room) {
		throw new ApiError(404, "Room not found");
	}

	const document = await Document.findOne({ roomCode: room.roomCode });

	return {
		room,
		document: document
			? { content: document.content, version: document.version }
			: null,
	};
};

/**
 * Host action — rename room.
 */
export const renameRoomService = async (roomCode, hostId, newName) => {
	const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });

	if (!room) throw new ApiError(404, "Room not found");
	if (room.hostId !== hostId) throw new ApiError(403, "Only the host can rename the room");
	if (!newName || !newName.trim()) throw new ApiError(400, "Room name is required");

	room.roomName = newName.trim();
	await room.save();

	return room;
};

/**
 * Host action — lock/unlock room.
 */
export const toggleLockRoomService = async (roomCode, hostId) => {
	const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });

	if (!room) throw new ApiError(404, "Room not found");
	if (room.hostId !== hostId) throw new ApiError(403, "Only the host can lock/unlock the room");

	room.isLocked = !room.isLocked;
	await room.save();

	return { isLocked: room.isLocked };
};
