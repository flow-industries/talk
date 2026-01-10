import type { Dm, Group, DecodedMessage } from "@xmtp/browser-sdk";
import { useQuery } from "@tanstack/react-query";

type Conversation = Dm | Group;

export function useMessages(conversation: Conversation | null | undefined) {
	return useQuery({
		queryKey: ["xmtp-messages", conversation?.id],
		queryFn: async (): Promise<DecodedMessage[]> => {
			if (!conversation) return [];
			await conversation.sync();
			return conversation.messages();
		},
		enabled: !!conversation,
		staleTime: 10 * 1000,
		refetchInterval: 30 * 1000,
	});
}
