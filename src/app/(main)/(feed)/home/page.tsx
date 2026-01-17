import type { Metadata } from "next";
import { Feed } from "~/components/Feed";
import { PostView } from "~/components/post/PostView";

export const metadata: Metadata = {
  title: "Home",
  description: "Flow Talk feed",
  openGraph: {
    title: "Home",
    description: "Flow Talk feed",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const COMMUNITY_CHANNEL_ID = "0x888047a0eea29205317197f1bc369f311f9b4bc2a64e470f9d7fb21cd530b891";
const endpoint = `api/posts?channelId=${COMMUNITY_CHANNEL_ID}&moderationStatus=approved,pending`;

const home = async () => {
  return (
    <Feed
      ItemView={PostView}
      endpoint={endpoint}
      refetchInterval={300000}
      emptyStateTitle="Your feed is quiet"
      emptyStateDescription="Follow people and communities to start seeing posts here."
    />
  );
};

export default home;
