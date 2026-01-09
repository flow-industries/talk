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
		if (!address || !isConnected || !walletClient || client || isInitializing) return false;

		setIsInitializing(true);
		setError(null);

		try {
			const signMessage = async (args: { message: string }) => {
				return walletClient.signMessage({
					account: address,
					message: args.message,
				});
			};
			const signer = createXmtpSigner(address, signMessage);
			const xmtpClient = await Client.create(signer, {
				env: "production",
				appVersion: "flow-talk/1.0.0",
			});
			setClient(xmtpClient);
			initializedAddressRef.current = address;
			return true;
		} catch (err) {
			console.error("Failed to initialize XMTP client:", err);
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
