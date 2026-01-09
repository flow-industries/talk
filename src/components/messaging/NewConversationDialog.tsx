"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { isAddress } from "viem";
import { useXmtpCanMessage } from "~/hooks/useXmtpCanMessage";
import { fetchEnsUser } from "~/utils/ens/converters/userConverter";
import { Button } from "../ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { UserAvatar } from "../user/UserAvatar";
import { useXmtp } from "./XmtpContext";

interface NewConversationDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function NewConversationDialog({
	open,
	onOpenChange,
}: NewConversationDialogProps) {
	const router = useRouter();
	const { client } = useXmtp();
	const queryClient = useQueryClient();
	const [input, setInput] = useState("");
	const [isResolving, setIsResolving] = useState(false);
	const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
	const [resolvedUser, setResolvedUser] = useState<any>(null);
	const [isCreating, setIsCreating] = useState(false);

	const { data: canMessage, isLoading: isCheckingCanMessage } =
		useXmtpCanMessage(resolvedAddress || undefined);

	const handleResolve = useCallback(async () => {
		const trimmed = input.trim();
		if (!trimmed) return;

		setIsResolving(true);
		setResolvedAddress(null);
		setResolvedUser(null);

		try {
			// Check if it's already an address
			if (isAddress(trimmed)) {
				setResolvedAddress(trimmed);
				// Try to fetch ENS data for the address
				const user = await fetchEnsUser(trimmed);
				setResolvedUser(user);
			} else {
				// Try to resolve as ENS name
				const user = await fetchEnsUser(trimmed);
				if (user?.address) {
					setResolvedAddress(user.address);
					setResolvedUser(user);
				} else {
					toast.error("Could not resolve ENS name");
				}
			}
		} catch (err) {
			console.error("Failed to resolve address:", err);
			toast.error("Failed to resolve address");
		} finally {
			setIsResolving(false);
		}
	}, [input]);

	const handleCreate = useCallback(async () => {
		if (!client || !resolvedAddress) return;

		setIsCreating(true);
		try {
			const conversation = await client.conversations.newDmWithIdentifier({
				identifier: resolvedAddress.toLowerCase(),
				identifierKind: "Ethereum" as const,
			});

			// Invalidate conversations cache
			queryClient.invalidateQueries({
				queryKey: ["xmtp-conversations"],
			});

			onOpenChange(false);
			router.push(`/messages/${conversation.id}`);
		} catch (err) {
			console.error("Failed to create conversation:", err);
			toast.error("Failed to create conversation");
		} finally {
			setIsCreating(false);
		}
	}, [client, resolvedAddress, queryClient, onOpenChange, router]);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			e.preventDefault();
			handleResolve();
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>New Conversation</DialogTitle>
					<DialogDescription>
						Enter an ENS name or Ethereum address to start a conversation.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="flex gap-2">
						<Input
							value={input}
							onChange={(e) => setInput(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="vitalik.eth or 0x..."
							disabled={isResolving}
						/>
						<Button
							onClick={handleResolve}
							disabled={isResolving || !input.trim()}
							variant="outline"
						>
							{isResolving ? (
								<Loader2 className="w-4 h-4 animate-spin" />
							) : (
								<Search className="w-4 h-4" />
							)}
						</Button>
					</div>

					{resolvedAddress && (
						<div className="p-4 border rounded-lg space-y-3">
							<div className="flex items-center gap-3">
								{resolvedUser ? (
									<UserAvatar user={resolvedUser} link={false} card={false} />
								) : (
									<div className="w-10 h-10 rounded-full bg-muted" />
								)}
								<div className="flex-1 min-w-0">
									<p className="font-medium truncate">
										{resolvedUser?.username || "Unknown"}
									</p>
									<p className="text-xs text-muted-foreground truncate">
										{resolvedAddress}
									</p>
								</div>
							</div>

							{isCheckingCanMessage ? (
								<p className="text-sm text-muted-foreground flex items-center gap-2">
									<Loader2 className="w-3 h-3 animate-spin" />
									Checking XMTP availability...
								</p>
							) : canMessage ? (
								<p className="text-sm text-green-600">
									This user can receive messages
								</p>
							) : (
								<p className="text-sm text-destructive">
									This user hasn't enabled XMTP messaging
								</p>
							)}
						</div>
					)}
				</div>

				<div className="flex justify-end gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isCreating}
					>
						Cancel
					</Button>
					<Button
						onClick={handleCreate}
						disabled={!resolvedAddress || !canMessage || isCreating}
					>
						{isCreating ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Creating...
							</>
						) : (
							"Start Conversation"
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
