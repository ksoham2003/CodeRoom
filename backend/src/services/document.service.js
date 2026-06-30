import Document from "../models/Document.model.js";
import { transformAgainstHistory, applyDelta } from "../utils/deltaEngine.js";

// In-memory document cache for fast delta application
// Periodically flushed to MongoDB
const documentCache = new Map();

/**
 * Get or load document into cache.
 */
export const getDocument = async (roomCode) => {
	if (documentCache.has(roomCode)) {
		return documentCache.get(roomCode);
	}

	const doc = await Document.findOne({ roomCode });
	if (!doc) return null;

	const cached = {
		content: doc.content,
		version: doc.version,
		recentOps: doc.recentOps || [],
		dirty: false,
	};

	documentCache.set(roomCode, cached);
	return cached;
};

/**
 * Apply a delta to the document with OT transform.
 * @returns {Object} { transformed delta, new version, new content }
 */
export const applyDeltaToDocument = async (roomCode, delta) => {
	let doc = await getDocument(roomCode);

	if (!doc) {
		// Create document if it doesn't exist
		doc = {
			content: "// Welcome to CodeRoom! Start coding together...\n",
			version: 0,
			recentOps: [],
			dirty: false,
		};
		documentCache.set(roomCode, doc);
	}

	// Get operations since delta's base version for OT
	const opsSinceBase = doc.recentOps.filter(
		(op) => op.version > (delta.baseVersion || 0),
	);

	// Transform the delta against concurrent operations
	const transformed = transformAgainstHistory(delta, opsSinceBase);

	// Apply to document content
	doc.content = applyDelta(doc.content, transformed);
	doc.version++;
	doc.dirty = true;

	// Add to recent ops (keep last 100 for OT)
	const newOp = {
		...transformed,
		version: doc.version,
	};
	doc.recentOps.push(newOp);

	if (doc.recentOps.length > 100) {
		doc.recentOps = doc.recentOps.slice(-100);
	}

	return {
		transformedDelta: transformed,
		version: doc.version,
		content: doc.content,
	};
};

/**
 * Flush dirty documents to MongoDB.
 * Called periodically to batch writes.
 */
export const flushDocuments = async () => {
	for (const [roomCode, doc] of documentCache.entries()) {
		if (doc.dirty) {
			try {
				await Document.findOneAndUpdate(
					{ roomCode },
					{
						content: doc.content,
						version: doc.version,
						recentOps: doc.recentOps.slice(-50), // Store last 50 in DB
						lastEditedAt: new Date(),
					},
					{ upsert: true },
				);
				doc.dirty = false;
			} catch (err) {
				console.error(`Failed to flush document ${roomCode}:`, err.message);
			}
		}
	}
};

/**
 * Remove document from cache (when room is closed).
 */
export const evictDocument = (roomCode) => {
	documentCache.delete(roomCode);
};

/**
 * Get current document content (from cache or DB).
 */
export const getDocumentContent = async (roomCode) => {
	const doc = await getDocument(roomCode);
	if (!doc) return { content: "", version: 0 };
	return { content: doc.content, version: doc.version };
};

// Periodic flush — every 3 seconds
setInterval(flushDocuments, 3000);
