import { Client } from "@xmtp/browser-sdk";
import { useQuery } from "@tanstack/react-query";

export function useXmtpCanMessage(address: string | undefined) {
	return useQuery({
		queryKey: ["xmtp-can-message", address],
		queryFn: async () => {
			if (!address) return false;
			const result = await Client.canMessage([
				{
					identifier: address.toLowerCase(),
					identifierKind: "Ethereum" as const,
				},
			]);
			// Result is a Map of identifier -> boolean
			return result.get(address.toLowerCase()) ?? false;
		},
		enabled: !!address,
		staleTime: 5 * 60 * 1000,
	});
}
