"use client";

import type { MediaData, PostMention } from "@cartel-sh/ui";
import React, { useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import { getBaseUrl } from "~/utils/getBaseUrl";
import { parseContent } from "~/utils/parseContent";
import { LinkPreview } from "./embeds/LinkPreview";
import { extractConsecutiveMedia, MarkdownMediaGallery, MarkdownMediaItem } from "./MarkdownMedia";
import { UserLazyHandle } from "./user/UserLazyHandle";
import "~/components/composer/lexical.css";

const BASE_URL = getBaseUrl();

export const extractUrlsFromText = (text: string): string[] => {
  const uniqueUrls = new Map<string, string>();

  const urlRegex = /https?:\/\/[^\s<>"\])]+/gi;
  const allMatches = text.match(urlRegex) || [];

  const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const markdownUrls = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = markdownLinkRegex.exec(text)) !== null) {
    const linkUrl = match[2].trim();
    markdownUrls.add(linkUrl);
  }

  while ((match = markdownImageRegex.exec(text)) !== null) {
    const imageUrl = match[2].trim();
    markdownUrls.add(imageUrl);
  }

  for (const rawUrl of allMatches) {
    const cleanUrl = rawUrl.replace(/[.,;:!?]+$/, "").trim();

    if (cleanUrl.startsWith(BASE_URL) || markdownUrls.has(cleanUrl)) {
      continue;
    }

    if (cleanUrl.includes("ipfs.io/ipfs/") || cleanUrl.includes("api.grove.storage/")) {
      continue;
    }

    try {
      const urlObj = new URL(cleanUrl);
      const normalizedUrl = urlObj.href;

      if (!uniqueUrls.has(normalizedUrl)) {
        uniqueUrls.set(normalizedUrl, cleanUrl);
      }
    } catch {
      // If URL parsing fails, skip it
    }
  }

  const result = Array.from(uniqueUrls.values());
  return result;
};

const Markdown: React.FC<{
  content: string;
  mentions?: PostMention[];
  className?: string;
  showLinkPreviews?: boolean;
  mediaData?: MediaData;
}> = ({ content, mentions, className = "", showLinkPreviews = false, mediaData }) => {
  let processedText = content;

  processedText = parseContent(content).parseLinks().replaceHandles().toString();

  const { mediaGroups, processedContent } = useMemo(() => {
    return extractConsecutiveMedia(processedText);
  }, [processedText]);

  const createCustomLink = (): Components["a"] => {
    return (props: any) => {
      const { href, children } = props;

      if (href?.startsWith(`${BASE_URL}/u/`)) {
        const urlHandle = href.split("/u/")[1];
        if (urlHandle) {
          let linkText = urlHandle;
          if (typeof children === "string") {
            linkText = children;
          } else if (Array.isArray(children) && children.length > 0 && typeof children[0] === "string") {
            linkText = children[0];
          }

          const handle = linkText;

          return (
            <span className="lexical-link">
              <UserLazyHandle handle={handle} />
            </span>
          );
        }
      }

      return (
        <a {...props} className="lexical-link">
          {children}
        </a>
      );
    };
  };

  const createCustomImage = (mediaData?: MediaData): Components["img"] => {
    return (props: any) => {
      const { src } = props;
      if (!src) return null;
      const mimeType = mediaData?.[src];
      return <MarkdownMediaItem url={src} mimeType={mimeType} />;
    };
  };

  const components: Components = {
    p: ({ children }: any) => {
      // Check if this paragraph contains a media gallery placeholder
      // Children could be a string, array, or React element
      let textContent = "";

      if (typeof children === "string") {
        textContent = children;
      } else if (Array.isArray(children)) {
        // Check if any child is the gallery placeholder
        textContent = children.map((child) => (typeof child === "string" ? child : "")).join("");
      }

      if (textContent.includes("MEDIA_GALLERY_PLACEHOLDER_")) {
        const match = textContent.match(/MEDIA_GALLERY_PLACEHOLDER_(\d+)/);
        if (match) {
          const galleryIndex = Number.parseInt(match[1], 10);
          if (mediaGroups[galleryIndex]) {
            return <MarkdownMediaGallery urls={mediaGroups[galleryIndex]} mimeTypes={mediaData} />;
          }
        }
      }

      if (Array.isArray(children) && children.length === 1) {
        const child = children[0];
        if (child && typeof child === "object" && "props" in child && child.props?.src) {
          const mimeType = mediaData?.[child.props.src];
          if (mimeType?.startsWith("video/")) {
            return <MarkdownMediaItem url={child.props.src} mimeType={mimeType} />;
          }
        }
      } else if (
        !Array.isArray(children) &&
        children &&
        typeof children === "object" &&
        "props" in children &&
        (children as any).props?.src
      ) {
        const props = (children as any).props;
        const mimeType = mediaData?.[props.src];
        if (mimeType?.startsWith("video/")) {
          return <MarkdownMediaItem url={props.src} mimeType={mimeType} />;
        }
      }

      return <p className="lexical-paragraph mb-4 last:mb-0">{children}</p>;
    },
    h1: ({ children }: any) => <h1 className="lexical-h1">{children}</h1>,
    h2: ({ children }: any) => <h2 className="lexical-h2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="lexical-h3">{children}</h3>,
    h4: ({ children }: any) => <h4 className="lexical-h4">{children}</h4>,
    h5: ({ children }: any) => <h5 className="lexical-h5">{children}</h5>,
    h6: ({ children }: any) => <h6 className="lexical-h6">{children}</h6>,
    strong: ({ children }: any) => <strong className="lexical-text-bold">{children}</strong>,
    em: ({ children }: any) => <em className="lexical-text-italic">{children}</em>,
    del: ({ children }: any) => <del className="lexical-text-strikethrough">{children}</del>,
    code: ({ children }: any) => <code className="lexical-text-code">{children}</code>,
    pre: ({ children }: any) => <pre className="lexical-code">{children}</pre>,
    blockquote: ({ children }: any) => <blockquote className="lexical-quote">{children}</blockquote>,
    ul: ({ children }: any) => <ul className="lexical-list-ul">{children}</ul>,
    ol: ({ children }: any) => <ol className="lexical-list-ol">{children}</ol>,
    li: ({ children }: any) => <li className="lexical-listitem">{children}</li>,
    a: createCustomLink(),
    img: createCustomImage(mediaData),
    u: ({ children }: any) => <u className="lexical-text-underline">{children}</u>,
  };

  const extractedUrls = useMemo(() => {
    return extractUrlsFromText(processedContent);
  }, [processedContent]);

  return (
    <>
      <ReactMarkdown
        className={`${className}`}
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeRaw as any]}
        components={components}
      >
        {processedContent}
      </ReactMarkdown>
      {showLinkPreviews && extractedUrls.length > 0 && (
        <div className="mt-4 space-y-3">
          {extractedUrls.map((url, index) => (
            <LinkPreview key={`${url}-${index}`} url={url} />
          ))}
        </div>
      )}
    </>
  );
};

export default Markdown;
