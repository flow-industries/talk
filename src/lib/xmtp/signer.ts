import type { Identifier } from "@xmtp/browser-sdk";
import { toBytes, bytesToHex } from "viem";

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
	const identifier = {
		identifier: address.toLowerCase(),
		identifierKind: "Ethereum" as const,
	};

	console.log("[XMTP Signer] Creating signer for address:", address);
	console.log("[XMTP Signer] Identifier:", identifier);

	return {
		type: "EOA",
		getIdentifier: () => {
			console.log("[XMTP Signer] getIdentifier called, returning:", identifier);
			return identifier;
		},
		signMessage: async (message: string) => {
			console.log("[XMTP Signer] signMessage called");
			console.log("[XMTP Signer] Message to sign:", message);
			console.log("[XMTP Signer] Message length:", message.length);

			try {
				const signature = await signMessageAsync({ message });
				console.log("[XMTP Signer] Raw signature (hex):", signature);
				console.log("[XMTP Signer] Signature length:", signature.length);

				const signatureBytes = toBytes(signature);
				console.log("[XMTP Signer] Signature bytes length:", signatureBytes.length);
				console.log("[XMTP Signer] Signature bytes (first 10):", Array.from(signatureBytes.slice(0, 10)));
				console.log("[XMTP Signer] Converted back to hex:", bytesToHex(signatureBytes));

				return signatureBytes;
			} catch (err) {
				console.error("[XMTP Signer] Error signing message:", err);
				throw err;
			}
		},
	};
}
