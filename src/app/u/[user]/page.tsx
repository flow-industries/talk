import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Feed } from "~/components/Feed";
import { PostView } from "~/components/post/PostView";
import { generateUserOGUrl } from "~/utils/generateOGUrl";
import { getUserByUsername } from "~/utils/getUserByHandle";

export async function generateMetadata(props: { params: Promise<{ user: string }> }): Promise<Metadata> {
  const params = await props.params;
  const username = params.user;
  const user = await getUserByUsername(username);

  if (!user) {
    return {
      title: username,
      description: `${username} on Flow Talk`,
    };
  }

  const title = `${username}`;
  const description = user.description || `${username} on Flow Talk`;

  const ogImageURL = generateUserOGUrl({
    username: username,
    profilePictureUrl: user.profilePictureUrl,
  });

  return {
    title,
    description,
    openGraph: {
      images: [ogImageURL],
      title,
      description,
      type: "profile",
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/u/${username}`,
      siteName: "Flow Talk",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageURL],
    },
  };
}

const UserPage = async (props: { params: Promise<{ user: string }> }) => {
  const params = await props.params;
  const username = params.user;
  const user = await getUserByUsername(username);

  if (!user) return notFound();

  return (
    <Feed
      ItemView={PostView}
      endpoint={`/api/posts?address=${user.address}&type=main`}
      emptyStateTitle="No posts from this user yet"
      emptyStateDescription="Check back soon to see what they share."
    />
  );
};

export default UserPage;
