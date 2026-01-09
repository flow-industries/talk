"use client";

import { Loader2, Send } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

interface MessageInputProps {
	onSend: (content: string) => Promise<void>;
	disabled?: boolean;
	placeholder?: string;
}

export function MessageInput({
	onSend,
	disabled = false,
	placeholder = "Type a message...",
}: MessageInputProps) {
	const [message, setMessage] = useState("");
	const [isSending, setIsSending] = useState(false);

	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			const trimmed = message.trim();
			if (!trimmed || isSending || disabled) return;

			setIsSending(true);
			try {
				await onSend(trimmed);
				setMessage("");
			} catch (err) {
				console.error("Failed to send message:", err);
				toast.error("Failed to send message");
			} finally {
				setIsSending(false);
			}
		},
		[message, isSending, disabled, onSend],
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="flex items-center gap-2 p-4 border-t">
			<Input
				value={message}
				onChange={(e) => setMessage(e.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				disabled={disabled || isSending}
				className="flex-1"
			/>
			<Button
				type="submit"
				size="icon"
				disabled={disabled || isSending || !message.trim()}
			>
				{isSending ? (
					<Loader2 className="w-4 h-4 animate-spin" />
				) : (
					<Send className="w-4 h-4" />
				)}
			</Button>
		</form>
	);
}
