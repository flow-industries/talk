import type { Metadata } from "next";
import { ConversationList } from "~/components/messaging/ConversationList";

export const metadata: Metadata = {
	title: "Messages | Flow Talk",
	description: "Your direct messages",
};

export default function MessagesPage() {
	return <ConversationList />;
}
