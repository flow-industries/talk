"use client";

import { Loader2, MessageSquare, Shield } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { useXmtp } from "./XmtpContext";

interface XmtpOnboardingDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function XmtpOnboardingDialog({
	open,
	onOpenChange,
}: XmtpOnboardingDialogProps) {
	const { initialize, isInitializing, error } = useXmtp();

	const handleEnable = async () => {
		await initialize();
		if (!error) {
			onOpenChange(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<MessageSquare className="w-5 h-5" />
						Enable Direct Messages
					</DialogTitle>
					<DialogDescription>
						Flow Talk uses XMTP for secure, encrypted messaging between wallets.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					<div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
						<Shield className="w-5 h-5 mt-0.5 text-primary" />
						<div className="space-y-1">
							<p className="text-sm font-medium">End-to-End Encrypted</p>
							<p className="text-xs text-muted-foreground">
								Your messages are encrypted and can only be read by you and the
								recipient.
							</p>
						</div>
					</div>

					<p className="text-sm text-muted-foreground">
						To enable messaging, you'll need to sign a message with your wallet.
						This signature authenticates your inbox and does not cost any gas.
					</p>

					{error && (
						<p className="text-sm text-destructive">
							{error.message || "Failed to enable messaging. Please try again."}
						</p>
					)}
				</div>

				<div className="flex justify-end gap-2">
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isInitializing}
					>
						Cancel
					</Button>
					<Button onClick={handleEnable} disabled={isInitializing}>
						{isInitializing ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Signing...
							</>
						) : (
							"Enable Messaging"
						)}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
