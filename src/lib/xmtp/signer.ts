import type { Identifier, Signer } from "@xmtp/browser-sdk";
import { toBytes } from "viem";

type SignMessageAsync = (args: { message: string }) => Promise<`0x${string}`>;

// Normal EOA signature is 65 bytes (130 hex chars + 0x prefix = 132 chars)
const EOA_SIGNATURE_LENGTH = 132;

export function createXmtpSigner(
	address: `0x${string}`,
	signMessageAsync: SignMessageAsync,
	chainId: bigint,
): Signer {
	const identifier = {
		identifier: address.toLowerCase(),
		identifierKind: "Ethereum" as const,
	};

	console.log("[XMTP Signer] Creating signer for address:", address);
	console.log("[XMTP Signer] Chain ID:", chainId.toString());

	// We'll determine the signer type based on the first signature
	let detectedSignerType: "EOA" | "SCW" | null = null;

	const signMessage = async (message: string): Promise<Uint8Array> => {
		console.log("[XMTP Signer] signMessage called");
		console.log("[XMTP Signer] Message to sign (first 100 chars):", message.substring(0, 100));

		const signature = await signMessageAsync({ message });
		console.log("[XMTP Signer] Signature length:", signature.length);

		// Detect if this is an SCW signature (much longer than EOA)
		if (detectedSignerType === null) {
			detectedSignerType = signature.length > EOA_SIGNATURE_LENGTH ? "SCW" : "EOA";
			console.log("[XMTP Signer] Detected signer type:", detectedSignerType);
		}

		const signatureBytes = toBytes(signature);
		console.log("[XMTP Signer] Signature bytes length:", signatureBytes.length);

		return signatureBytes;
	};

	// Return SCW signer - it works for both EOA and SCW wallets
	// SCW signer has additional getChainId method that EOA doesn't have
	return {
		type: "SCW",
		getIdentifier: () => identifier,
		signMessage,
		getChainId: () => chainId,
	};
}
