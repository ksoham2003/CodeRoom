import crypto from "crypto";

/**
 * Generates a unique 6-character alphanumeric room code.
 * Uses uppercase letters and digits for readability (no ambiguous chars like 0/O, 1/I/L).
 * @returns {string} A 6-character room code e.g. "A3F9K2"
 */
const generateRoomCode = () => {
	const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
	let code = "";
	const bytes = crypto.randomBytes(6);

	for (let i = 0; i < 6; i++) {
		code += chars[bytes[i] % chars.length];
	}

	return code;
};

export default generateRoomCode;
