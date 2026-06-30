import asyncHandler from "../middlewares/async.handler.js";
import {
	createRoomService,
	joinRoomService,
	getRoomService,
	renameRoomService,
	toggleLockRoomService,
} from "../services/room.service.js";
import ApiResponse from "../utils/apiResponse.js";

/**
 * POST /api/rooms — Create a new room
 */
export const createRoom = asyncHandler(async (req, res) => {
	const { username } = req.body;
	const { room, roomCode } = await createRoomService({ username });

	return res
		.status(201)
		.json(new ApiResponse(201, "Room created successfully", { roomCode, roomName: room.roomName }));
});

/**
 * POST /api/rooms/join — Validate and join an existing room
 */
export const joinRoom = asyncHandler(async (req, res) => {
	const { roomCode, username } = req.body;
	const result = await joinRoomService({ roomCode, username });

	return res
		.status(200)
		.json(new ApiResponse(200, "Room found", result));
});

/**
 * GET /api/rooms/:roomCode — Get room info
 */
export const getRoom = asyncHandler(async (req, res) => {
	const { roomCode } = req.params;
	const result = await getRoomService(roomCode);

	return res
		.status(200)
		.json(new ApiResponse(200, "Room info retrieved", result));
});

/**
 * PATCH /api/rooms/:roomCode/rename — Host renames room
 */
export const renameRoom = asyncHandler(async (req, res) => {
	const { roomCode } = req.params;
	const { hostId, roomName } = req.body;
	const room = await renameRoomService(roomCode, hostId, roomName);

	return res
		.status(200)
		.json(new ApiResponse(200, "Room renamed", { roomName: room.roomName }));
});

/**
 * PATCH /api/rooms/:roomCode/lock — Host locks/unlocks room
 */
export const toggleLockRoom = asyncHandler(async (req, res) => {
	const { roomCode } = req.params;
	const { hostId } = req.body;
	const result = await toggleLockRoomService(roomCode, hostId);

	return res
		.status(200)
		.json(new ApiResponse(200, `Room ${result.isLocked ? "locked" : "unlocked"}`, result));
});
