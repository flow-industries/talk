import type { Identifier, Signer } from "@xmtp/browser-sdk";
import { toBytes } from "viem";

type SignMessageAsync = (args: { message: string }) => Promise<`0x${string}`>;
type GetBlockNumber = () => Promise<bigint>;

// Normal EOA signature is 65 bytes (130 hex chars + 0x prefix = 132 chars)
const EOA_SIGNATURE_LENGTH = 132;

// Base chain ID - where Porto/Coinbase Smart Wallets are deployed
const BASE_CHAIN_ID = 8453n;

export function createXmtpSigner(
	address: `0x${string}`,
	signMessageAsync: SignMessageAsync,
	chainId: bigint,
	getBlockNumber?: GetBlockNumber,
): Signer {
	const identifier = {
		identifier: address.toLowerCase(),
		identifierKind: "Ethereum" as const,
	};

	// For SCW verification, use the chain where the wallet is deployed
	// Porto/Coinbase Smart Wallets are on Base
	const scwChainId = chainId === 1n ? BASE_CHAIN_ID : chainId;

	console.log("[XMTP Signer] Creating signer for address:", address);
	console.log("[XMTP Signer] Wallet chain ID:", chainId.toString());
	console.log("[XMTP Signer] SCW verification chain ID:", scwChainId.toString());

	const signMessage = async (message: string): Promise<Uint8Array> => {
		console.log("[XMTP Signer] signMessage called");
		console.log("[XMTP Signer] Message to sign (first 100 chars):", message.substring(0, 100));

		const signature = await signMessageAsync({ message });
		console.log("[XMTP Signer] Signature length:", signature.length);

		const isScwSignature = signature.length > EOA_SIGNATURE_LENGTH;
		console.log("[XMTP Signer] Detected signature type:", isScwSignature ? "SCW" : "EOA");

		const signatureBytes = toBytes(signature);
		console.log("[XMTP Signer] Signature bytes length:", signatureBytes.length);

		return signatureBytes;
	};

	// Return SCW signer - it works for both EOA and SCW wallets
	// SCW signer has additional getChainId method that EOA doesn't have
	const signer: Signer = {
		type: "SCW",
		getIdentifier: () => identifier,
		signMessage,
		getChainId: () => scwChainId,
	};

	// Add optional getBlockNumber for ERC-6492 verification
	if (getBlockNumber) {
		(signer as Signer & { getBlockNumber: GetBlockNumber }).getBlockNumber = getBlockNumber;
	}

	return signer;
}
