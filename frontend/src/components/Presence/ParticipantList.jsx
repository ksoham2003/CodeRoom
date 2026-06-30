import { User, Crown, Circle } from "lucide-react";
import { useRoom } from "../../context/RoomContext";
import { useSocket } from "../../context/SocketContext";
import "./Presence.css";

const ParticipantList = () => {
	const { participants, hostId, typingUsers } = useRoom();
	const { socket } = useSocket();

	const getInitials = (name) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	// Color palette for participant avatars
	const colors = [
		"#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
		"#f97316", "#eab308", "#22c55e", "#06b6d4",
		"#3b82f6", "#a855f7",
	];

	const getColor = (index) => colors[index % colors.length];

	const isTyping = (socketId) => {
		return typingUsers.some((u) => u.socketId === socketId);
	};

	return (
		<div className="participant-list">
			<div className="participant-header">
				<User size={14} />
				<span>Participants</span>
				<span className="participant-count">{participants.length}</span>
			</div>

			<div className="participant-items">
				{participants.map((participant, index) => (
					<div
						key={participant.socketId}
						className={`participant-item animate-slideInRight ${
							participant.socketId === socket?.id ? "is-self" : ""
						}`}
						style={{ animationDelay: `${index * 50}ms` }}
					>
						<div
							className="participant-avatar"
							style={{ background: getColor(index) }}
						>
							{participant.isHost ? (
								<Crown size={12} />
							) : (
								<span>{getInitials(participant.username)}</span>
							)}
						</div>

						<div className="participant-info">
							<span className="participant-name">
								{participant.username}
								{participant.socketId === socket?.id && (
									<span className="participant-you"> (you)</span>
								)}
							</span>
							{isTyping(participant.socketId) && (
								<span className="participant-typing animate-fadeIn">
									typing...
								</span>
							)}
						</div>

						<div className="participant-status">
							{participant.isHost && (
								<span className="host-badge">Host</span>
							)}
							<Circle
								size={8}
								fill="var(--success)"
								color="var(--success)"
							/>
						</div>
					</div>
				))}
			</div>

			{participants.length === 0 && (
				<div className="participant-empty">
					<p>No one here yet...</p>
				</div>
			)}
		</div>
	);
};

export default ParticipantList;
