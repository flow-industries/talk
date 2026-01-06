import type { User } from "@cartel-sh/ui";
import { API_URLS } from "~/config/api";

interface EnsRecord {
  avatar?: string;
  "com.discord"?: string;
  "com.twitter"?: string;
  description?: string;
  email?: string;
  name?: string;
  "org.telegram"?: string;
  url?: string;
  [key: string]: string | undefined;
}

interface EnsData {
  name: string;
  avatar?: string;
  records?: EnsRecord;
  updated_at?: string;
}

export interface EthFollowAccount {
  address: string; // same as data
  ens?: {
    name: string;
    avatar?: string;
    records?: Record<string, string>;
  };
  version?: number;
  record_type?: string;
  data?: string; // address
  tags?: string[]; // []
}

export function ensAccountToUser(account: EthFollowAccount): User {
  const address = account.address.toLowerCase();
  const ensName = account.ens?.name && account.ens.name !== "" ? account.ens.name : undefined;
  const avatar = account.ens?.avatar || account.ens?.records?.avatar;
  const description = account.ens?.records?.description;

  // Convert ENS records to metadata attributes
  const attributes: Array<{ key: string; value: string }> = [];

  if (account.ens?.records) {
    const records = account.ens.records;

    // Add website
    if (records.url) {
      attributes.push({ key: "website", value: records.url });
    }

    // Add social platforms
    if (records["com.twitter"]) {
      attributes.push({ key: "x", value: `https://x.com/${records["com.twitter"]}` });
    }

    if (records["com.discord"]) {
      attributes.push({ key: "discord", value: records["com.discord"] });
    }

    if (records["org.telegram"]) {
      attributes.push({ key: "telegram", value: `https://t.me/${records["org.telegram"]}` });
    }

    if (records.email) {
      attributes.push({ key: "email", value: records.email });
    }
  }

  const user: User = {
    id: address,
    address: address,
    username: ensName,
    profilePictureUrl: avatar || `https://api.dicebear.com/9.x/lorelei-neutral/svg?seed=${address}`,
    description: description || undefined,
    namespace: "ens",
    metadata:
      attributes.length > 0
        ? {
            attributes,
          }
        : undefined,
    actions: {
      followed: false,
      following: false,
      blocked: false,
      muted: false,
    },
    stats: {
      following: 0,
      followers: 0,
    },
  };

  return user;
}

export async function fetchUserStats(addressOrEns: string): Promise<{ following: number; followers: number } | null> {
  try {
    const response = await fetch(
      `${API_URLS.EFP}/users/${addressOrEns}/stats`,
      { next: { revalidate: 300 } }, // Cache for 5 minutes
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return {
      following: data.following_count || 0,
      followers: data.followers_count || 0,
    };
  } catch (error) {
    console.error("Failed to fetch user stats:", error);
    return null;
  }
}

export async function fetchEnsUser(
  addressOrEns: string,
  options?: {
    currentUserAddress?: string;
    skipStats?: boolean;
    skipFollowRelationships?: boolean;
  },
): Promise<User | null> {
  try {
    // Start all independent requests in parallel for better performance
    const accountPromise = fetch(`${API_URLS.EFP}/users/${addressOrEns}/account`, {
      next: { revalidate: 3600 },
    });

    const statsPromise = !options?.skipStats ? fetchUserStats(addressOrEns) : Promise.resolve(null);

    const followingPromise =
      options?.currentUserAddress && !options?.skipFollowRelationships
        ? fetch(`${API_URLS.EFP}/users/${options.currentUserAddress}/following`, {
            next: { revalidate: 300 },
          }).catch(() => null)
        : Promise.resolve(null);

    const followsBackPromise =
      options?.currentUserAddress && !options?.skipFollowRelationships
        ? fetch(`${API_URLS.EFP}/users/${addressOrEns}/following`, {
            next: { revalidate: 300 },
          }).catch(() => null)
        : Promise.resolve(null);

    // Wait for account data first (required to construct user)
    const ensResponse = await accountPromise;
    if (!ensResponse.ok) {
      return null;
    }

    const ensData: EthFollowAccount = await ensResponse.json();
    const user = ensAccountToUser(ensData);

    // Wait for all parallel requests to complete
    const [stats, followingResponse, followsBackResponse] = await Promise.all([
      statsPromise,
      followingPromise,
      followsBackPromise,
    ]);

    // Apply stats
    if (stats) {
      user.stats = {
        following: stats.following,
        followers: stats.followers,
      };
    }

    // Apply following relationships
    if (followingResponse?.ok) {
      try {
        const followingData = await followingResponse.json();
        const isFollowing = followingData.following?.some(
          (account: any) => account.address?.toLowerCase() === user.address.toLowerCase(),
        );
        if (user.actions) {
          user.actions.followed = isFollowing || false;
        }
      } catch {
        // ignore json parse errors
      }
    }

    if (followsBackResponse?.ok) {
      try {
        const followerData = await followsBackResponse.json();
        const followsMe = followerData.following?.some(
          (account: any) => account.address?.toLowerCase() === options?.currentUserAddress?.toLowerCase(),
        );
        if (user.actions) {
          user.actions.following = followsMe || false;
        }
      } catch {
        // ignore json parse errors
      }
    }

    return user;
  } catch (error) {
    console.error("Failed to fetch ENS user:", error);
    return null;
  }
}
