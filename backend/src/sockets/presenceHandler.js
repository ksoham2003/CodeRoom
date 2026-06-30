/**
 * Presence Socket Handler — typing indicators and active-editor status.
 *
 * Events:
 * - presence:typing     → user is actively typing
 * - presence:stop-typing → user stopped typing
 * - presence:cursor     → user cursor position update (stretch goal)
 */
const presenceHandler = (io, socket) => {
	/**
	 * User started typing.
	 * Payload: { roomCode }
	 */
	socket.on("presence:typing", ({ roomCode }) => {
		socket.to(roomCode).emit("presence:typing", {
			socketId: socket.id,
			username: socket.data.username || "Anonymous",
		});
	});

	/**
	 * User stopped typing.
	 * Payload: { roomCode }
	 */
	socket.on("presence:stop-typing", ({ roomCode }) => {
		socket.to(roomCode).emit("presence:stop-typing", {
			socketId: socket.id,
			username: socket.data.username || "Anonymous",
		});
	});

	/**
	 * User cursor position update (stretch goal — live cursors).
	 * Payload: { roomCode, position: { line, column } }
	 */
	socket.on("presence:cursor", ({ roomCode, position }) => {
		socket.to(roomCode).emit("presence:cursor", {
			socketId: socket.id,
			username: socket.data.username || "Anonymous",
			position,
		});
	});
};

export default presenceHandler;
