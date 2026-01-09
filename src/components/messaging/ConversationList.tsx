"use client";

import { ConsentState } from "@xmtp/browser-sdk";
import { useAtom } from "jotai";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { useState } from "react";
import { consentFilterAtom } from "~/atoms/messaging";
import { useConversations } from "~/hooks/useConversations";
import { Button } from "../ui/button";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { ConversationItem } from "./ConversationItem";
import { NewConversationDialog } from "./NewConversationDialog";
import { XmtpOnboardingDialog } from "./XmtpOnboardingDialog";
import { useXmtp } from "./XmtpContext";

export function ConversationList() {
	const { client, isReady, isInitializing } = useXmtp();
	const { data: conversations, isLoading } = useConversations(client);
	const [filter, setFilter] = useAtom(consentFilterAtom);
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [showNewConversation, setShowNewConversation] = useState(false);

	// Show onboarding prompt if not initialized
	if (!isReady && !isInitializing) {
		return (
			<div className="flex flex-col items-center justify-center py-16 gap-4">
				<div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
					<MessageSquarePlus className="w-8 h-8 text-muted-foreground" />
				</div>
				<div className="text-center space-y-2">
					<h2 className="text-lg font-medium">Enable Direct Messages</h2>
					<p className="text-sm text-muted-foreground max-w-sm">
						Start encrypted conversations with anyone on Flow Talk.
					</p>
				</div>
				<Button onClick={() => setShowOnboarding(true)}>Get Started</Button>
				<XmtpOnboardingDialog
					open={showOnboarding}
					onOpenChange={setShowOnboarding}
				/>
			</div>
		);
	}

	// Show loading state
	if (isInitializing || isLoading) {
		return (
			<div className="flex items-center justify-center py-16">
				<Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	// Filter conversations by consent state
	const allowedConversations =
		conversations?.filter((c) => c.consentState === ConsentState.Allowed) || [];
	const requestConversations =
		conversations?.filter((c) => c.consentState === ConsentState.Unknown) || [];

	return (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between py-4">
				<Tabs
					value={filter}
					onValueChange={(v) => setFilter(v as typeof filter)}
				>
					<TabsList>
						<TabsTrigger value="allowed">
							Inbox
							{allowedConversations.length > 0 && (
								<span className="ml-1.5 text-xs">
									({allowedConversations.length})
								</span>
							)}
						</TabsTrigger>
						<TabsTrigger value="requests">
							Requests
							{requestConversations.length > 0 && (
								<span className="ml-1.5 text-xs">
									({requestConversations.length})
								</span>
							)}
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<Button
					variant="outline"
					size="sm"
					onClick={() => setShowNewConversation(true)}
				>
					<MessageSquarePlus className="w-4 h-4 mr-2" />
					New
				</Button>
			</div>

			<div className="flex-1 overflow-y-auto space-y-1">
				{filter === "allowed" && (
					<>
						{allowedConversations.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<p>No conversations yet</p>
								<p className="text-sm">
									Start a new conversation to get started
								</p>
							</div>
						) : (
							allowedConversations.map((conv) => (
								<ConversationItem key={conv.id} conversation={conv} />
							))
						)}
					</>
				)}

				{filter === "requests" && (
					<>
						{requestConversations.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<p>No message requests</p>
							</div>
						) : (
							requestConversations.map((conv) => (
								<ConversationItem key={conv.id} conversation={conv} />
							))
						)}
					</>
				)}
			</div>

			<NewConversationDialog
				open={showNewConversation}
				onOpenChange={setShowNewConversation}
			/>
		</div>
	);
}
