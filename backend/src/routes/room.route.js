import { Router } from "express";
import {
	createRoom,
	joinRoom,
	getRoom,
	renameRoom,
	toggleLockRoom,
} from "../controllers/room.controller.js";

const router = Router();

// Room CRUD
router.post("/", createRoom);
router.post("/join", joinRoom);
router.get("/:roomCode", getRoom);

// Host actions
router.patch("/:roomCode/rename", renameRoom);
router.patch("/:roomCode/lock", toggleLockRoom);

export default router;
