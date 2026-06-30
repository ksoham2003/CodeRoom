import { useRoom } from "../../context/RoomContext";
import "./Presence.css";

const TypingIndicator = () => {
	const { typingUsers } = useRoom();

	if (typingUsers.length === 0) return null;

	const getTypingText = () => {
		if (typingUsers.length === 1) {
			return `${typingUsers[0].username} is typing`;
		} else if (typingUsers.length === 2) {
			return `${typingUsers[0].username} and ${typingUsers[1].username} are typing`;
		} else {
			return `${typingUsers[0].username} and ${typingUsers.length - 1} others are typing`;
		}
	};

	return (
		<div className="typing-indicator animate-fadeIn">
			<div className="typing-dots">
				<span className="typing-dot" />
				<span className="typing-dot" />
				<span className="typing-dot" />
			</div>
			<span className="typing-text">{getTypingText()}</span>
		</div>
	);
};

export default TypingIndicator;
