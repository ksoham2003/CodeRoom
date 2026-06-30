/**
 * Delta Engine — Position-Shifting Transform Logic
 *
 * Each delta represents a single edit operation:
 *   { type: 'insert'|'delete', position: number, content: string, timestamp: number, userId: string, baseVersion: number }
 *
 * The engine transforms incoming deltas against operations that have occurred
 * since the delta's baseVersion, using Operational Transformation (OT) principles:
 *
 * - Insert before/at position → shift subsequent positions forward
 * - Delete before/at position → shift subsequent positions backward
 * - Same-position conflicts → timestamp-based LWW (later timestamp placed after earlier)
 */

/**
 * Transform a single delta's position against a previously applied operation.
 * @param {Object} incoming - The delta to transform
 * @param {Object} applied - The already-applied delta to transform against
 * @returns {Object} The transformed delta with adjusted position
 */
export const transformDelta = (incoming, applied) => {
	const transformed = { ...incoming };

	if (applied.type === "insert") {
		if (incoming.position > applied.position) {
			// Applied insert is before our position — shift forward
			transformed.position += applied.content.length;
		} else if (
			incoming.position === applied.position &&
			incoming.type === "insert"
		) {
			// Both inserting at the same position — use timestamp tiebreaker
			// Later timestamp goes after the earlier one
			if (incoming.timestamp > applied.timestamp) {
				transformed.position += applied.content.length;
			} else if (
				incoming.timestamp === applied.timestamp &&
				incoming.userId > applied.userId
			) {
				// Same timestamp — use userId as secondary tiebreaker for determinism
				transformed.position += applied.content.length;
			}
		}
	} else if (applied.type === "delete") {
		if (incoming.position > applied.position) {
			// Applied delete is before our position — shift backward
			const shift = Math.min(
				applied.content.length,
				incoming.position - applied.position,
			);
			transformed.position -= shift;
		}
	}

	// Clamp position to non-negative
	transformed.position = Math.max(0, transformed.position);

	return transformed;
};

/**
 * Transform a delta against a list of operations that have been applied
 * since the delta's base version.
 * @param {Object} delta - The incoming delta
 * @param {Array} operationsSince - Array of deltas applied since delta.baseVersion
 * @returns {Object} The fully transformed delta
 */
export const transformAgainstHistory = (delta, operationsSince) => {
	let transformed = { ...delta };

	for (const op of operationsSince) {
		transformed = transformDelta(transformed, op);
	}

	return transformed;
};

/**
 * Apply a delta to a document string.
 * @param {string} document - The current document content
 * @param {Object} delta - The delta to apply { type, position, content }
 * @returns {string} The updated document content
 */
export const applyDelta = (document, delta) => {
	const { type, position, content } = delta;

	// Clamp position within document bounds
	const clampedPos = Math.max(0, Math.min(position, document.length));

	if (type === "insert") {
		return (
			document.slice(0, clampedPos) + content + document.slice(clampedPos)
		);
	} else if (type === "delete") {
		const deleteEnd = Math.min(clampedPos + content.length, document.length);
		return document.slice(0, clampedPos) + document.slice(deleteEnd);
	}

	return document;
};
