import { type PropsWithChildren, Suspense } from "react";
import PostComposer from "~/components/post/PostComposer";
import { Card } from "~/components/ui/card";
import { getServerAuth } from "~/utils/getServerAuth";

export const maxDuration = 60;
export const revalidate = 0;
export const dynamic = "force-dynamic";

function ComposerSkeleton() {
  return (
    <div className="flex flex-row gap-4 w-full items-start animate-pulse">
      <div className="shrink-0 w-10 h-10 rounded-full bg-muted" />
      <div className="grow flex-1 space-y-2">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-8 w-full bg-muted rounded" />
      </div>
      <div className="h-8 w-8 bg-muted rounded" />
    </div>
  );
}

async function PostComposerWithAuth() {
  const { user } = await getServerAuth();
  return <PostComposer user={user ?? undefined} />;
}

export default function layout({ children }: PropsWithChildren) {
  return (
    <div className="z-[30] sm:p-4 max-w-3xl mx-auto py-0">
      <Card className="p-4">
        <Suspense fallback={<ComposerSkeleton />}>
          <PostComposerWithAuth />
        </Suspense>
      </Card>
      {children}
    </div>
  );
}
