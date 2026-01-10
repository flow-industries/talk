"use client";

import type { DecodedMessage } from "@xmtp/browser-sdk";
import { format } from "date-fns";
import { cn } from "~/utils";

interface MessageItemProps {
	message: DecodedMessage;
	isOwnMessage: boolean;
}

export function MessageItem({ message, isOwnMessage }: MessageItemProps) {
	const content =
		typeof message.content === "string" ? message.content : String(message.content ?? "");

	const sentAt = new Date(Number(message.sentAtNs) / 1_000_000);

	return (
		<div
			className={cn(
				"flex flex-col max-w-[80%] gap-1",
				isOwnMessage ? "ml-auto items-end" : "mr-auto items-start",
			)}
		>
			<div
				className={cn(
					"px-4 py-2 rounded-2xl",
					isOwnMessage
						? "bg-primary text-primary-foreground rounded-br-md"
						: "bg-muted rounded-bl-md",
				)}
			>
				<p className="text-sm whitespace-pre-wrap break-words">{content}</p>
			</div>
			<span className="text-xs text-muted-foreground px-1">
				{format(sentAt, "HH:mm")}
			</span>
		</div>
	);
}
