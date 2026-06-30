import { useRef, useCallback, useEffect } from "react";
import { useRoom } from "../../context/RoomContext";
import useDelta from "../../hooks/useDelta";
import usePresence from "../../hooks/usePresence";
import "./CodeEditor.css";

/**
 * CodeEditor — Monospace textarea that captures keystrokes as position-based deltas.
 *
 * Instead of sending the full document on every change, it computes the diff
 * between the previous and new content and emits an insert or delete delta.
 */
const CodeEditor = () => {
	const { document } = useRoom();
	const { handleLocalChange } = useDelta();
	const { emitTyping } = usePresence();
	const textareaRef = useRef(null);
	const prevContentRef = useRef(document.content);
	const prevSelectionRef = useRef(0);
	const isRemoteUpdateRef = useRef(false);

	// Sync textarea when remote deltas arrive
	useEffect(() => {
		if (textareaRef.current && isRemoteUpdateRef.current === false) {
			const textarea = textareaRef.current;
			const cursorPos = textarea.selectionStart;
			const oldLen = prevContentRef.current.length;
			const newLen = document.content.length;

			// Only update if content actually changed from remote
			if (textarea.value !== document.content) {
				isRemoteUpdateRef.current = true;

				// Adjust cursor position based on content length change
				const diff = newLen - oldLen;
				const adjustedCursor = Math.max(0, cursorPos + (diff > 0 && cursorPos >= oldLen ? diff : 0));

				textarea.value = document.content;

				// Restore cursor position
				textarea.selectionStart = adjustedCursor;
				textarea.selectionEnd = adjustedCursor;

				prevContentRef.current = document.content;

				setTimeout(() => {
					isRemoteUpdateRef.current = false;
				}, 0);
			}
		}
		prevContentRef.current = document.content;
	}, [document.content]);

	/**
	 * Capture input events and compute deltas.
	 */
	const handleInput = useCallback(
		(e) => {
			if (isRemoteUpdateRef.current) return;

			const newContent = e.target.value;
			const selectionStart = e.target.selectionStart;
			const prevContent = prevContentRef.current;
			const prevSelection = prevSelectionRef.current;

			// Emit typing presence
			emitTyping();

			// Compute and send delta
			handleLocalChange(newContent, selectionStart, prevContent, prevSelection);

			prevContentRef.current = newContent;
			prevSelectionRef.current = selectionStart;
		},
		[handleLocalChange, emitTyping],
	);

	/**
	 * Track selection/cursor changes for delta positioning.
	 */
	const handleSelect = useCallback((e) => {
		prevSelectionRef.current = e.target.selectionStart;
	}, []);

	/**
	 * Handle Tab key for code indentation.
	 */
	const handleKeyDown = useCallback(
		(e) => {
			if (e.key === "Tab") {
				e.preventDefault();
				const textarea = e.target;
				const start = textarea.selectionStart;
				const end = textarea.selectionEnd;

				const prevContent = textarea.value;
				const newContent =
					prevContent.substring(0, start) + "  " + prevContent.substring(end);

				textarea.value = newContent;
				textarea.selectionStart = textarea.selectionEnd = start + 2;

				// Emit as delta
				handleLocalChange(newContent, start + 2, prevContent, start);
				prevContentRef.current = newContent;
				prevSelectionRef.current = start + 2;
				emitTyping();
			}
		},
		[handleLocalChange, emitTyping],
	);

	// Line numbers
	const lineCount = (document.content || "").split("\n").length;
	const lines = Array.from({ length: Math.max(lineCount, 20) }, (_, i) => i + 1);

	return (
		<div className="code-editor">
			<div className="editor-line-numbers">
				{lines.map((num) => (
					<div key={num} className="line-number">
						{num}
					</div>
				))}
			</div>
			<textarea
				ref={textareaRef}
				className="editor-textarea"
				defaultValue={document.content}
				onInput={handleInput}
				onSelect={handleSelect}
				onKeyDown={handleKeyDown}
				spellCheck={false}
				autoComplete="off"
				autoCorrect="off"
				autoCapitalize="off"
				wrap="off"
				placeholder="// Start coding here..."
			/>
		</div>
	);
};

export default CodeEditor;
