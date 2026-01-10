"use client";

import { Client, type Identifier } from "@xmtp/browser-sdk";
import {
	createContext,
	type ReactNode,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { useAccount, useWalletClient } from "wagmi";
import { createXmtpSigner } from "~/lib/xmtp/signer";

interface XmtpContextValue {
	client: Client | null;
	isInitializing: boolean;
	isReady: boolean;
	error: Error | null;
	initialize: () => Promise<boolean>;
	disconnect: () => void;
	unreadCount: number;
}

const XmtpContext = createContext<XmtpContextValue | undefined>(undefined);

export function XmtpProvider({ children }: { children: ReactNode }) {
	const { address, isConnected } = useAccount();
	const { data: walletClient } = useWalletClient();
	const [client, setClient] = useState<Client | null>(null);
	const [isInitializing, setIsInitializing] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [unreadCount, setUnreadCount] = useState(0);
	const streamCleanupRef = useRef<(() => void) | null>(null);
	const initializedAddressRef = useRef<string | null>(null);

	const isReady = !!client && !isInitializing;

	const initialize = useCallback(async (): Promise<boolean> => {
		console.log("[XMTP Context] Initialize called");
		console.log("[XMTP Context] State:", { address, isConnected, hasWalletClient: !!walletClient, hasClient: !!client, isInitializing });

		if (!address || !isConnected || !walletClient || client || isInitializing) {
			console.log("[XMTP Context] Skipping initialization - preconditions not met");
			return false;
		}

		setIsInitializing(true);
		setError(null);

		try {
			console.log("[XMTP Context] Creating signer for address:", address);
			console.log("[XMTP Context] Wallet client chain:", walletClient.chain);
			console.log("[XMTP Context] Wallet client account:", walletClient.account);

			const chainId = BigInt(walletClient.chain?.id ?? 1);
			console.log("[XMTP Context] Chain ID:", chainId.toString());

			const signMessage = async (args: { message: string }) => {
				console.log("[XMTP Context] signMessage wrapper called");
				const result = await walletClient.signMessage({
					message: args.message,
				});
				console.log("[XMTP Context] Signature length:", result.length);
				return result;
			};

			const signer = createXmtpSigner(address, signMessage, chainId);
			console.log("[XMTP Context] Signer created (SCW type for compatibility)");
			console.log("[XMTP Context] Using environment: dev");

			const xmtpClient = await Client.create(signer, {
				env: "dev",
				appVersion: "flow-talk/1.0.0",
			});

			console.log("[XMTP Context] XMTP client created successfully");
			console.log("[XMTP Context] Client inbox ID:", xmtpClient.inboxId);

			setClient(xmtpClient);
			initializedAddressRef.current = address;
			return true;
		} catch (err) {
			console.error("[XMTP Context] Failed to initialize XMTP client:", err);
			console.error("[XMTP Context] Error details:", {
				name: err instanceof Error ? err.name : "Unknown",
				message: err instanceof Error ? err.message : String(err),
				stack: err instanceof Error ? err.stack : undefined,
			});
			setError(err instanceof Error ? err : new Error("Failed to initialize XMTP"));
			return false;
		} finally {
			setIsInitializing(false);
		}
	}, [address, isConnected, walletClient, client, isInitializing]);

	const disconnect = useCallback(() => {
		if (streamCleanupRef.current) {
			streamCleanupRef.current();
			streamCleanupRef.current = null;
		}
		setClient(null);
		setUnreadCount(0);
		initializedAddressRef.current = null;
	}, []);

	// Cleanup on unmount, wallet disconnect, or account change
	useEffect(() => {
		if (!isConnected && client) {
			disconnect();
			return;
		}

		// Disconnect if account changed while client is active
		if (client && initializedAddressRef.current && address !== initializedAddressRef.current) {
			disconnect();
		}
	}, [isConnected, address, client, disconnect]);

	// Stream messages for unread count
	useEffect(() => {
		if (!client) return;

		let cancelled = false;

		const streamMessages = async () => {
			try {
				const stream = await client.conversations.streamAllMessages({
					onValue: () => {
						if (!cancelled) {
							setUnreadCount((prev) => prev + 1);
						}
					},
					onError: (err) => {
						console.error("XMTP stream error:", err);
					},
				});

				streamCleanupRef.current = () => {
					cancelled = true;
					stream.return();
				};
			} catch (err) {
				console.error("Failed to start message stream:", err);
			}
		};

		streamMessages();

		return () => {
			cancelled = true;
			if (streamCleanupRef.current) {
				streamCleanupRef.current();
				streamCleanupRef.current = null;
			}
		};
	}, [client]);

	return (
		<XmtpContext.Provider
			value={{
				client,
				isInitializing,
				isReady,
				error,
				initialize,
				disconnect,
				unreadCount,
			}}
		>
			{children}
		</XmtpContext.Provider>
	);
}

export function useXmtp() {
	const ctx = useContext(XmtpContext);
	if (!ctx) throw new Error("useXmtp must be used within XmtpProvider");
	return ctx;
}
