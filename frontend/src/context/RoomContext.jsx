import { createContext, useContext, useReducer, useCallback } from "react";

const RoomContext = createContext(null);

const initialState = {
	roomCode: null,
	roomName: "Untitled Room",
	username: "",
	isHost: false,
	hostId: null,
	isLocked: false,
	participants: [],
	isInRoom: false,
	document: { content: "", version: 0 },
	typingUsers: [],
};

const roomReducer = (state, action) => {
	switch (action.type) {
		case "SET_USERNAME":
			return { ...state, username: action.payload };

		case "JOIN_ROOM":
			return {
				...state,
				roomCode: action.payload.roomCode,
				roomName: action.payload.roomName,
				isHost: action.payload.isHost,
				hostId: action.payload.hostId,
				isLocked: action.payload.isLocked,
				participants: action.payload.participants,
				document: action.payload.document,
				isInRoom: true,
			};

		case "LEAVE_ROOM":
			return { ...initialState, username: state.username };

		case "PARTICIPANT_JOINED":
			return {
				...state,
				participants: [
					...state.participants.filter(
						(p) => p.socketId !== action.payload.socketId,
					),
					action.payload,
				],
			};

		case "PARTICIPANT_LEFT":
			return {
				...state,
				participants: state.participants.filter(
					(p) => p.socketId !== action.payload.socketId,
				),
			};

		case "HOST_CHANGED":
			return {
				...state,
				hostId: action.payload.newHostId,
				isHost: action.payload.isCurrentUser,
				participants: state.participants.map((p) => ({
					...p,
					isHost: p.socketId === action.payload.newHostId,
				})),
			};

		case "ROOM_RENAMED":
			return { ...state, roomName: action.payload.roomName };

		case "ROOM_LOCK_TOGGLED":
			return { ...state, isLocked: action.payload.isLocked };

		case "UPDATE_DOCUMENT":
			return {
				...state,
				document: {
					content: action.payload.content,
					version: action.payload.version,
				},
			};

		case "UPDATE_VERSION":
			return {
				...state,
				document: { ...state.document, version: action.payload },
			};

		case "ADD_TYPING_USER":
			if (state.typingUsers.find((u) => u.socketId === action.payload.socketId))
				return state;
			return {
				...state,
				typingUsers: [...state.typingUsers, action.payload],
			};

		case "REMOVE_TYPING_USER":
			return {
				...state,
				typingUsers: state.typingUsers.filter(
					(u) => u.socketId !== action.payload.socketId,
				),
			};

		default:
			return state;
	}
};

export const RoomProvider = ({ children }) => {
	const [state, dispatch] = useReducer(roomReducer, initialState);

	const setUsername = useCallback(
		(username) => dispatch({ type: "SET_USERNAME", payload: username }),
		[],
	);

	const joinRoom = useCallback(
		(data) => dispatch({ type: "JOIN_ROOM", payload: data }),
		[],
	);

	const leaveRoom = useCallback(
		() => dispatch({ type: "LEAVE_ROOM" }),
		[],
	);

	const value = {
		...state,
		dispatch,
		setUsername,
		joinRoom,
		leaveRoom,
	};

	return (
		<RoomContext.Provider value={value}>
			{children}
		</RoomContext.Provider>
	);
};

export const useRoom = () => {
	const context = useContext(RoomContext);
	if (!context) {
		throw new Error("useRoom must be used within a RoomProvider");
	}
	return context;
};

export default RoomContext;
