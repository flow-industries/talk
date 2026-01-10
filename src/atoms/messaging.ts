import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

// Active conversation tracking
export const activeConversationIdAtom = atom<string | null>(null);

// Message draft persistence (per conversation)
export const messageDraftsAtom = atomWithStorage<Record<string, string>>(
	"xmtp_message_drafts",
	{},
);

// Consent filter state
export const consentFilterAtom = atom<"allowed" | "requests" | "all">(
	"allowed",
);

// Unread tracking (conversation ID -> last read timestamp)
export const lastReadTimestampsAtom = atomWithStorage<Record<string, number>>(
	"xmtp_last_read",
	{},
);

// XMTP client initialized state
export const xmtpInitializedAtom = atom<boolean>(false);
