import type { PropsWithChildren } from "react";

export default function MessagesLayout({ children }: PropsWithChildren) {
	return (
		<div className="px-4 max-w-3xl mx-auto h-[calc(100vh-80px)]">
			{children}
		</div>
	);
}
