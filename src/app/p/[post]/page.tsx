import { isImageMetadata } from "@cartel-sh/ui";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostComments } from "~/components/post/PostComments";
import { PostView } from "~/components/post/PostView";
import { generatePostOGUrl } from "~/utils/generateOGUrl";
import { getBaseUrl } from "~/utils/getBaseUrl";

export async function generateMetadata(props: { params: Promise<{ post: string }> }): Promise<Metadata> {
  const params = await props.params;
  try {
    const response = await fetch(`${getBaseUrl()}/api/posts/${params.post}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        title: "Post",
        description: "View post on Flow Talk",
        openGraph: {
          type: "article",
          title: "Post",
          description: "View post on Flow Talk",
        },
      };
    }

    const post = await response.json();

    const handle =
      post.author?.username ||
      `${post.author?.address?.slice(0, 6)}...${post.author?.address?.slice(-4)}` ||
      "Anonymous";
    const content = post.metadata?.content || "";
    const profilePictureUrl = post.author?.profilePictureUrl || "";
    const postImage = isImageMetadata(post.metadata) ? post.metadata?.image?.item : "";

    const title = `${handle} on Flow Talk`;
    const description = content.length > 160 ? `${content.slice(0, 160)}...` : content || "View post on Flow Talk";

    const ogImageURL = generatePostOGUrl({
      handle,
      content,
      profilePictureUrl,
      image: postImage || undefined,
    });

    return {
      title,
      description,
      openGraph: {
        type: "article",
        title,
        description,
        images: [ogImageURL],
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/p/${params.post}`,
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
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Post",
      description: "View post on Flow Talk",
      openGraph: {
        type: "article",
        title: "Post",
        description: "View post on Flow Talk",
      },
    };
  }
}

export default async function PostPage(props: { params: Promise<{ post: string }> }) {
  const params = await props.params;
  try {
    const response = await fetch(`${getBaseUrl()}/api/posts/${params.post}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 404) {
        notFound();
      }
      throw new Error("Failed to fetch post");
    }

    const post = await response.json();

    return (
      <div className="max-w-3xl p-4 mx-auto">
        <PostView item={post} defaultExpanded={true} defaultReplyOpen={false} />
        <PostComments post={post} level={1} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
}
