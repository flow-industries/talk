import type { Signer } from "@xmtp/browser-sdk";
import { toBytes } from "viem";

type SignMessageAsync = (args: { message: string }) => Promise<`0x${string}`>;

export function createXmtpSigner(
	address: `0x${string}`,
	signMessageAsync: SignMessageAsync,
): Signer {
	const identifier = {
		identifier: address.toLowerCase(),
		identifierKind: "Ethereum" as const,
	};

	console.log("[XMTP Signer] Creating EOA signer for address:", address);

	const signMessage = async (message: string): Promise<Uint8Array> => {
		console.log("[XMTP Signer] signMessage called");
		console.log("[XMTP Signer] Message to sign (first 100 chars):", message.substring(0, 100));

		const signature = await signMessageAsync({ message });
		console.log("[XMTP Signer] Signature length:", signature.length);

		const signatureBytes = toBytes(signature);
		console.log("[XMTP Signer] Signature bytes length:", signatureBytes.length);

		return signatureBytes;
	};

	// Use EOA signer type - this works for standard wallets
	// Smart contract wallets with passkeys are not yet supported by XMTP
	return {
		type: "EOA",
		getIdentifier: () => identifier,
		signMessage,
	};
}
