"use client";

import { Users2 } from "lucide-react";
import { resolveUrl } from "~/utils/resolveUrl";

type CommunityLike = {
  address: string;
  metadata?: {
    icon?: string;
    name?: string;
  };
};

export function CommunityIcon({
  community,
  size = "sm",
  className,
}: {
  community: CommunityLike;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const hasCustomSize = className && /\b[wh]-\d+|\b[wh]-\[/.test(className);
  const containerClass = hasCustomSize ? "" : size === "lg" ? "w-20 h-20" : size === "md" ? "w-12 h-12" : "w-10 h-10";
  const imageClass = "w-[70%] h-[70%]";
  const fallbackClass = "w-[50%] h-[50%]";
  const textClass = hasCustomSize ? "text-[0.5rem]" : size === "lg" ? "text-3xl" : size === "md" ? "text-xl" : "text-xs";
  const roundingClass = size === "sm" ? "rounded-sm" : "rounded-xl";

  const backgroundUrl = `https://api.dicebear.com/9.x/glass/svg?seed=${community.address.toLowerCase()}`;
  const iconUrl = resolveUrl(community.metadata?.icon);
  const altText = community.metadata?.name || community.address;

  const getInitials = (name: string) => {
    const words = name.trim().split(/\s+/);
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={`${containerClass} ${roundingClass} relative overflow-hidden flex items-center justify-center shrink-0 ${className || ""}`}
    >
      <img
        src={backgroundUrl}
        alt=""
        aria-hidden
        className={"absolute inset-0 w-full h-full object-cover opacity-60"}
      />
      {community.metadata?.icon ? (
        <img src={iconUrl} alt={altText} className={`${imageClass} rounded-lg object-cover relative z-10`} />
      ) : community.metadata?.name ? (
        <span className={`${textClass} font-bold text-foreground/90 relative z-10`}>
          {getInitials(community.metadata.name)}
        </span>
      ) : (
        <Users2 className={`${fallbackClass} text-foreground/90 relative z-10`} strokeWidth={2.5} />
      )}
    </div>
  );
}
