import { applyDeltaToDocument } from "../services/document.service.js";

/**
 * Document Socket Handler — delta-based sync with OT conflict resolution.
 *
 * Delta format from client:
 * {
 *   type: 'insert' | 'delete',
 *   position: number,        // cursor position in the document
 *   content: string,         // characters inserted or deleted
 *   timestamp: number,       // client timestamp (Date.now())
 *   userId: string,          // socket.id
 *   username: string,        // display name
 *   baseVersion: number      // the document version this delta was authored against
 * }
 */
const documentHandler = (io, socket) => {
	/**
	 * Receive a delta from a client, transform it via OT, apply to server
	 * document, and broadcast the transformed delta to all other clients.
	 */
	socket.on("doc:delta", async ({ roomCode, delta }) => {
		try {
			if (!roomCode || !delta) return;

			// Attach userId from socket
			delta.userId = socket.id;
			delta.username = socket.data.username || "Anonymous";

			// Apply delta with OT transform
			const { transformedDelta, version, content } =
				await applyDeltaToDocument(roomCode, delta);

			// Broadcast transformed delta to all OTHER clients in the room
			socket.to(roomCode).emit("doc:delta", {
				delta: transformedDelta,
				version,
				userId: socket.id,
				username: socket.data.username,
			});

			// Acknowledge to sender with new version
			socket.emit("doc:ack", { version });
		} catch (err) {
			console.error("[Document] Delta error:", err.message);
			socket.emit("doc:error", { message: "Failed to apply edit" });
		}
	});

	/**
	 * Client requests full document sync (e.g., after reconnect).
	 */
	socket.on("doc:request-sync", async ({ roomCode }) => {
		try {
			const { getDocumentContent } = await import(
				"../services/document.service.js"
			);
			const docData = await getDocumentContent(roomCode);

			socket.emit("doc:full-sync", {
				content: docData.content,
				version: docData.version,
			});
		} catch (err) {
			console.error("[Document] Sync request error:", err.message);
		}
	});
};

export default documentHandler;
