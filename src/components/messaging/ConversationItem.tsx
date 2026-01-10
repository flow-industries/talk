"use client";

import { ConsentState } from "@xmtp/browser-sdk";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { ConversationWithMeta } from "~/hooks/useConversations";
import { fetchEnsUser } from "~/utils/ens/converters/userConverter";
import { UserAvatar } from "../user/UserAvatar";

interface ConversationItemProps {
	conversation: ConversationWithMeta;
}

export function ConversationItem({ conversation }: ConversationItemProps) {
	const lastMessageTime = conversation.lastMessage?.sentAtNs
		? new Date(Number(conversation.lastMessage.sentAtNs) / 1_000_000)
		: null;

	// Fetch peer user data
	const { data: peerUser } = useQuery({
		queryKey: ["ens-user", conversation.peerInboxId],
		queryFn: async () => {
			return fetchEnsUser(conversation.peerInboxId);
		},
		staleTime: 5 * 60 * 1000,
	});

	const displayName =
		peerUser?.username ||
		(conversation.peerInboxId
			? `${conversation.peerInboxId.slice(0, 6)}...${conversation.peerInboxId.slice(-4)}`
			: "Unknown");

	return (
		<Link
			href={`/messages/${conversation.id}`}
			className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
		>
			<div className="w-10 h-10 shrink-0">
				{peerUser ? (
					<UserAvatar user={peerUser} link={false} card={false} />
				) : (
					<div className="w-10 h-10 rounded-full bg-muted" />
				)}
			</div>

			<div className="flex-1 min-w-0">
				<div className="flex items-center justify-between gap-2">
					<span className="font-medium truncate">{displayName}</span>
					{lastMessageTime && (
						<span className="text-xs text-muted-foreground shrink-0">
							{formatDistanceToNow(lastMessageTime, { addSuffix: true })}
						</span>
					)}
				</div>
				{conversation.lastMessage?.content && (
					<p className="text-sm text-muted-foreground truncate">
						{conversation.lastMessage.content}
					</p>
				)}
			</div>

			{conversation.consentState === ConsentState.Unknown && (
				<span className="px-2 py-0.5 text-xs bg-secondary rounded-full">
					Request
				</span>
			)}
		</Link>
	);
}
