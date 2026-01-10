"use client";

import { ConsentState, type Dm, type Group } from "@xmtp/browser-sdk";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback } from "react";
import { toast } from "sonner";
import { useMessages } from "~/hooks/useMessages";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { MessageInput } from "./MessageInput";
import { MessageItem } from "./MessageItem";
import { useXmtp } from "./XmtpContext";

interface ConversationViewProps {
	conversationId: string;
}

type ConversationMeta = {
	conversation: Dm | Group;
	peerInboxId: string;
	consentState: ConsentState;
};

export function ConversationView({ conversationId }: ConversationViewProps) {
	const { client, isReady } = useXmtp();
	const queryClient = useQueryClient();

	// Fetch the conversation asynchronously
	const { data: conversationMeta, isLoading: isLoadingConversation } = useQuery(
		{
			queryKey: ["xmtp-conversation", conversationId],
			queryFn: async (): Promise<ConversationMeta | null> => {
				if (!client) return null;
				const conv = await client.conversations.getConversationById(
					conversationId,
				);
				if (!conv) return null;

				const [consentState] = await Promise.all([conv.consentState()]);

				// Get peer inbox ID (only for DMs)
				let peerInboxId = "";
				if ("peerInboxId" in conv) {
					peerInboxId = await (conv as Dm<string>).peerInboxId();
				}

				return {
					conversation: conv,
					peerInboxId,
					consentState,
				};
			},
			enabled: !!client,
			staleTime: 30 * 1000,
		},
	);

	const { data: messages, isLoading: isLoadingMessages } = useMessages(
		conversationMeta?.conversation,
	);

	const handleSend = useCallback(
		async (content: string) => {
			if (!conversationMeta?.conversation) return;

			try {
				await conversationMeta.conversation.send(content);
				// Invalidate messages cache to refresh
				queryClient.invalidateQueries({
					queryKey: ["xmtp-messages", conversationId],
				});
			} catch (err) {
				console.error("Failed to send message:", err);
				throw err;
			}
		},
		[conversationMeta?.conversation, conversationId, queryClient],
	);

	const handleAccept = useCallback(async () => {
		if (!conversationMeta?.conversation) return;
		try {
			await conversationMeta.conversation.updateConsentState(ConsentState.Allowed);
			queryClient.invalidateQueries({
				queryKey: ["xmtp-conversations"],
			});
			queryClient.invalidateQueries({
				queryKey: ["xmtp-conversation", conversationId],
			});
			toast.success("Conversation accepted");
		} catch (err) {
			console.error("Failed to accept conversation:", err);
			toast.error("Failed to accept conversation");
		}
	}, [conversationMeta?.conversation, conversationId, queryClient]);

	const handleBlock = useCallback(async () => {
		if (!conversationMeta?.conversation) return;
		try {
			await conversationMeta.conversation.updateConsentState(ConsentState.Denied);
			queryClient.invalidateQueries({
				queryKey: ["xmtp-conversations"],
			});
			queryClient.invalidateQueries({
				queryKey: ["xmtp-conversation", conversationId],
			});
			toast.success("Conversation blocked");
		} catch (err) {
			console.error("Failed to block conversation:", err);
			toast.error("Failed to block conversation");
		}
	}, [conversationMeta?.conversation, conversationId, queryClient]);

	if (!isReady || isLoadingConversation) {
		return (
			<div className="flex items-center justify-center h-full">
				<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	if (!conversationMeta) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<p className="text-muted-foreground">Conversation not found</p>
				<Button asChild variant="outline">
					<Link href="/messages">Back to messages</Link>
				</Button>
			</div>
		);
	}

	const { peerInboxId, consentState } = conversationMeta;
	const isRequest = consentState === ConsentState.Unknown;
	const isBlocked = consentState === ConsentState.Denied;

	const displayName = peerInboxId
		? `${peerInboxId.slice(0, 6)}...${peerInboxId.slice(-4)}`
		: "Conversation";

	return (
		<div className="flex flex-col h-full">
			{/* Header */}
			<div className="flex items-center gap-3 p-4 border-b">
				<Button asChild variant="ghost" size="icon">
					<Link href="/messages">
						<ArrowLeft className="w-5 h-5" />
					</Link>
				</Button>
				<div className="flex-1">
					<h2 className="font-medium">{displayName}</h2>
				</div>
			</div>

			{/* Request banner */}
			{isRequest && (
				<div className="flex items-center justify-between gap-4 p-4 bg-muted border-b">
					<p className="text-sm">
						This is a message request. Accept to start chatting.
					</p>
					<div className="flex gap-2">
						<Button variant="outline" size="sm" onClick={handleBlock}>
							Block
						</Button>
						<Button size="sm" onClick={handleAccept}>
							Accept
						</Button>
					</div>
				</div>
			)}

			{/* Messages */}
			<ScrollArea className="flex-1">
				<div className="flex flex-col gap-3 p-4">
					{isLoadingMessages ? (
						<div className="flex items-center justify-center py-8">
							<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
						</div>
					) : messages?.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							<p>No messages yet</p>
							<p className="text-sm">
								Send a message to start the conversation
							</p>
						</div>
					) : (
						messages?.map((msg) => (
							<MessageItem
								key={msg.id}
								message={msg}
								isOwnMessage={msg.senderInboxId === client?.inboxId}
							/>
						))
					)}
				</div>
			</ScrollArea>

			{/* Input */}
			{!isBlocked && (
				<MessageInput
					onSend={handleSend}
					disabled={isRequest}
					placeholder={
						isRequest
							? "Accept the request to send messages"
							: "Type a message..."
					}
				/>
			)}

			{isBlocked && (
				<div className="p-4 text-center text-muted-foreground border-t">
					This conversation is blocked
				</div>
			)}
		</div>
	);
}
