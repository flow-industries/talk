import type { Metadata } from "next";
import { NotificationsFeed } from "~/components/notifications/NotificationsFeed";

export const metadata: Metadata = {
  title: "Activity",
  description: "Your latest activity",
  openGraph: {
    title: "Activity",
    description: "Your latest activity",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const notifications = async () => {
  return <NotificationsFeed />;
};

export default notifications;
