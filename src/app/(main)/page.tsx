import type { Metadata } from "next";
import { generateDefaultOGUrl } from "~/utils/generateOGUrl";
import { LandingContent } from "~/components/LandingContent";

const ogImageURL = generateDefaultOGUrl();

export const metadata: Metadata = {
  title: "Flow Talk",
  description: "Permanent. Permissionless. Flow Talk.",
  openGraph: {
    title: "Flow Talk",
    description: "Permanent. Permissionless. Flow Talk.",
    images: [ogImageURL],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flow Talk",
    description: "Permanent. Permissionless. Flow Talk.",
    images: [ogImageURL],
  },
};

export default function LandingPage() {
  return <LandingContent />;
}
