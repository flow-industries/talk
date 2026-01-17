import type { Metadata } from "next";
import { Feed } from "~/components/Feed";
import { PostView } from "~/components/post/PostView";
import { getUserByUsername } from "~/utils/getUserByHandle";

export async function generateMetadata(props: { params: Promise<{ user: string }> }): Promise<Metadata> {
  const params = await props.params;
  const handle = params.user;
  const title = `${handle}`;
  return {
    title,
    description: `@${handle}'s comments on Flow Talk`,
    openGraph: {
      title,
      description: `@${handle}'s comments on Flow Talk`,
      images: [
        {
          url: "/logo.png",
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

const user = async (props: { params: Promise<{ user: string }> }) => {
  const params = await props.params;
  const handle = params.user;
  const user = await getUserByUsername(handle);

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <Feed
      ItemView={PostView}
      endpoint={`/api/posts?address=${user.address}&type=comment`}
      emptyStateTitle="No comments yet"
      emptyStateDescription="When this user replies, you'll see it here."
    />
  );
};

export default user;
