import type { Identifier } from "@xmtp/browser-sdk";
import { hexToBytes } from "viem";

type SignMessageAsync = (args: { message: string }) => Promise<`0x${string}`>;

export type XmtpSigner = {
	type: "EOA";
	getIdentifier: () => Identifier;
	signMessage: (message: string) => Promise<Uint8Array>;
};

export function createXmtpSigner(
	address: `0x${string}`,
	signMessageAsync: SignMessageAsync,
): XmtpSigner {
	return {
		type: "EOA",
		getIdentifier: () => ({
			identifier: address.toLowerCase(),
			identifierKind: "Ethereum" as const,
		}),
		signMessage: async (message: string) => {
			const signature = await signMessageAsync({ message });
			return hexToBytes(signature);
		},
	};
}
