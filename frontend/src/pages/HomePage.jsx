import CreateRoom from "../components/Room/CreateRoom";
import JoinRoom from "../components/Room/JoinRoom";
import { Code2, Terminal, GitBranch, Braces } from "lucide-react";
import "./HomePage.css";

const HomePage = () => {
	return (
		<div className="home-page">
			{/* Hero Section */}
			<div className="hero-section">
				<div className="hero-badge animate-fadeIn">
					<Terminal size={14} />
					<span>Real-Time Collaborative Editor</span>
				</div>

				<h1 className="hero-title animate-fadeInUp">
					Code Together,
					<br />
					<span className="hero-gradient">In Real Time</span>
				</h1>

				<p className="hero-subtitle animate-fadeInUp" style={{ animationDelay: "0.15s" }}>
					Create a room, share the code, and collaborate live. Delta-based sync
					with conflict resolution — no edits lost.
				</p>

				{/* Floating icons */}
				<div className="hero-floating-icons">
					<div className="floating-icon fi-1"><Braces size={18} /></div>
					<div className="floating-icon fi-2"><GitBranch size={18} /></div>
					<div className="floating-icon fi-3"><Code2 size={18} /></div>
				</div>
			</div>

			{/* Room Forms */}
			<div className="home-forms">
				<CreateRoom />
				<div className="home-divider">
					<span>or</span>
				</div>
				<JoinRoom />
			</div>
		</div>
	);
};

export default HomePage;
