import { type Client, type Dm, ConsentState } from "@xmtp/browser-sdk";
import { useQuery } from "@tanstack/react-query";

export type ConversationWithMeta = {
	id: string;
	dm: Dm;
	peerInboxId: string;
	consentState: ConsentState;
	lastMessage?: {
		content: string;
		sentAtNs: bigint;
	};
};

export function useConversations(client: Client | null) {
	return useQuery({
		queryKey: ["xmtp-conversations", client?.inboxId],
		queryFn: async (): Promise<ConversationWithMeta[]> => {
			if (!client) return [];
			await client.conversations.sync();
			const dms = await client.conversations.listDms();

			// Fetch metadata for each conversation
			const conversationsWithMeta = await Promise.all(
				dms.map(async (dm) => {
					const [peerInboxId, consentState, lastMessage] = await Promise.all([
						dm.peerInboxId(),
						dm.consentState(),
						dm.lastMessage(),
					]);

					return {
						id: dm.id,
						dm,
						peerInboxId,
						consentState,
						lastMessage: lastMessage
							? {
									content:
										typeof lastMessage.content === "string"
											? lastMessage.content
											: "",
									sentAtNs: lastMessage.sentAtNs,
								}
							: undefined,
					};
				}),
			);

			return conversationsWithMeta;
		},
		enabled: !!client,
		staleTime: 30 * 1000,
		refetchInterval: 60 * 1000,
	});
}
