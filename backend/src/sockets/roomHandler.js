import Room from "../models/Room.model.js";
import Document from "../models/Document.model.js";
import { getDocumentContent, evictDocument } from "../services/document.service.js";

/**
 * Room Socket Handler — manages join/leave, participant tracking, and host privileges.
 */
const roomHandler = (io, socket) => {
	/**
	 * Closes a room by deleting it from database and database-cache,
	 * notifying all participants, and removing them from the socket room.
	 */
	const closeRoom = async (roomCode) => {
		try {
			// Notify remaining clients
			io.to(roomCode).emit("room:closed", {
				message: "The host has left. This room is now closed.",
			});

			// Evict document from cache
			evictDocument(roomCode);

			// Delete database records
			await Room.deleteOne({ roomCode });
			await Document.deleteOne({ roomCode });

			// Force leave socket room
			const roomSockets = await io.in(roomCode).fetchSockets();
			for (const s of roomSockets) {
				s.leave(roomCode);
				s.data.roomCode = null;
			}

			console.log(`[Room] Room ${roomCode} has been closed because the host left`);
		} catch (err) {
			console.error(`[Room] Error closing room ${roomCode}:`, err.message);
		}
	};

	/**
	 * Join a room by roomCode.
	 * Payload: { roomCode, username }
	 */
	socket.on("room:join", async ({ roomCode, username }) => {
		try {
			const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });

			if (!room) {
				socket.emit("room:error", { message: "Room not found" });
				return;
			}

			if (room.isLocked) {
				socket.emit("room:error", { message: "Room is locked" });
				return;
			}

			// Check if username is already taken by another active socket in the room
			const existingParticipant = room.participants.find(
				(p) => p.username.toLowerCase() === username.trim().toLowerCase()
			);

			if (existingParticipant) {
				const isSocketActive = io.sockets.sockets.has(existingParticipant.socketId);
				if (isSocketActive) {
					socket.emit("room:error", { message: "Username is already taken in this room" });
					return;
				}

				// Reconnection case: remove the old stale participant with the same username
				room.participants = room.participants.filter(
					(p) => p.username.toLowerCase() !== username.trim().toLowerCase()
				);
			}

			// Determine if this is the first participant (host)
			const isHost = room.participants.length === 0;

			// Add participant to room
			const participant = {
				socketId: socket.id,
				username: username.trim(),
				joinedAt: new Date(),
				isHost,
			};

			// Remove stale entry for this socket if it exists
			room.participants = room.participants.filter(
				(p) => p.socketId !== socket.id,
			);
			room.participants.push(participant);

			if (isHost) {
				room.hostId = socket.id;
			}

			await room.save();

			// Join Socket.io room
			socket.join(roomCode);

			// Store room data on socket for cleanup on disconnect
			socket.data.roomCode = roomCode;
			socket.data.username = username.trim();
			socket.data.isHost = isHost;

			// Get current document content
			const docData = await getDocumentContent(roomCode);

			// Send room state to the joining user
			socket.emit("room:joined", {
				roomCode: room.roomCode,
				roomName: room.roomName,
				isHost,
				hostId: room.hostId,
				isLocked: room.isLocked,
				participants: room.participants.map((p) => ({
					socketId: p.socketId,
					username: p.username,
					isHost: p.isHost,
					joinedAt: p.joinedAt,
				})),
				document: docData,
			});

			// Notify others in the room
			socket.to(roomCode).emit("room:participant-joined", {
				socketId: socket.id,
				username: username.trim(),
				isHost,
				participantCount: room.participants.length,
			});

			console.log(
				`[Room] ${username} joined ${roomCode} (${room.participants.length} participants)`,
			);
		} catch (err) {
			console.error("[Room] Join error:", err.message);
			socket.emit("room:error", { message: "Failed to join room" });
		}
	});

	/**
	 * Host action — kick a participant.
	 * Payload: { roomCode, targetSocketId }
	 */
	socket.on("room:kick", async ({ roomCode, targetSocketId }) => {
		try {
			const room = await Room.findOne({ roomCode });
			if (!room || room.hostId !== socket.id) {
				socket.emit("room:error", { message: "Only the host can kick participants" });
				return;
			}

			// Don't allow kicking yourself
			if (targetSocketId === socket.id) return;

			// Find and remove the participant
			const kicked = room.participants.find((p) => p.socketId === targetSocketId);
			if (!kicked) return;

			room.participants = room.participants.filter(
				(p) => p.socketId !== targetSocketId,
			);
			await room.save();

			// Notify the kicked user
			io.to(targetSocketId).emit("room:kicked", {
				message: "You have been removed from the room by the host",
			});

			// Force leave socket room
			const targetSocket = io.sockets.sockets.get(targetSocketId);
			if (targetSocket) {
				targetSocket.leave(roomCode);
				targetSocket.data.roomCode = null;
			}

			// Notify remaining participants
			io.to(roomCode).emit("room:participant-left", {
				socketId: targetSocketId,
				username: kicked.username,
				reason: "kicked",
				participantCount: room.participants.length,
			});

			console.log(`[Room] ${kicked.username} was kicked from ${roomCode}`);
		} catch (err) {
			console.error("[Room] Kick error:", err.message);
		}
	});

	/**
	 * Host action — rename room.
	 * Payload: { roomCode, newName }
	 */
	socket.on("room:rename", async ({ roomCode, newName }) => {
		try {
			const room = await Room.findOne({ roomCode });
			if (!room || room.hostId !== socket.id) {
				socket.emit("room:error", { message: "Only the host can rename the room" });
				return;
			}

			room.roomName = newName.trim() || "Untitled Room";
			await room.save();

			io.to(roomCode).emit("room:renamed", {
				roomName: room.roomName,
				renamedBy: socket.data.username,
			});
		} catch (err) {
			console.error("[Room] Rename error:", err.message);
		}
	});

	/**
	 * Host action — toggle room lock.
	 * Payload: { roomCode }
	 */
	socket.on("room:toggle-lock", async ({ roomCode }) => {
		try {
			const room = await Room.findOne({ roomCode });
			if (!room || room.hostId !== socket.id) {
				socket.emit("room:error", { message: "Only the host can lock/unlock the room" });
				return;
			}

			room.isLocked = !room.isLocked;
			await room.save();

			io.to(roomCode).emit("room:lock-toggled", {
				isLocked: room.isLocked,
				toggledBy: socket.data.username,
			});
		} catch (err) {
			console.error("[Room] Lock toggle error:", err.message);
		}
	});

	/**
	 * Leave a room manually.
	 */
	socket.on("room:leave", async ({ roomCode }) => {
		try {
			if (!roomCode) return;
			const room = await Room.findOne({ roomCode: roomCode.toUpperCase() });
			if (!room) return;

			const leavingUser = room.participants.find(
				(p) => p.socketId === socket.id,
			);
			if (!leavingUser) return;

			room.participants = room.participants.filter(
				(p) => p.socketId !== socket.id,
			);

			// If host leaves, close the room
			if (room.hostId === socket.id) {
				await closeRoom(roomCode);
				return;
			}

			socket.leave(roomCode);
			socket.data.roomCode = null;

			// Notify remaining participants
			io.to(roomCode).emit("room:participant-left", {
				socketId: socket.id,
				username: leavingUser.username,
				reason: "left",
				participantCount: room.participants.length,
			});

			console.log(
				`[Room] ${leavingUser.username} left room ${roomCode} manually`,
			);
		} catch (err) {
			console.error("[Room] Leave cleanup error:", err.message);
		}
	});

	/**
	 * Handle disconnection — clean up participant from room.
	 */
	socket.on("disconnect", async () => {
		const roomCode = socket.data.roomCode;
		if (!roomCode) return;

		try {
			const room = await Room.findOne({ roomCode });
			if (!room) return;

			const leavingUser = room.participants.find(
				(p) => p.socketId === socket.id,
			);
			if (!leavingUser) return;

			room.participants = room.participants.filter(
				(p) => p.socketId !== socket.id,
			);

			// If host disconnects, close the room
			if (room.hostId === socket.id) {
				await closeRoom(roomCode);
				return;
			}

			// Notify remaining participants
			io.to(roomCode).emit("room:participant-left", {
				socketId: socket.id,
				username: leavingUser.username,
				reason: "disconnected",
				participantCount: room.participants.length,
			});

			console.log(
				`[Room] ${leavingUser.username} left ${roomCode} (${room.participants.length} remaining)`,
			);
		} catch (err) {
			console.error("[Room] Disconnect cleanup error:", err.message);
		}
	});
};

export default roomHandler;
