import type { Metadata } from "next";
import { ConversationView } from "~/components/messaging/ConversationView";

export const metadata: Metadata = {
	title: "Conversation | Flow Talk",
	description: "Direct message conversation",
};

interface PageProps {
	params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
	const { conversationId } = await params;
	return <ConversationView conversationId={conversationId} />;
}
