"use client";

import { CHANNEL_MANAGER_ADDRESS, ChannelManagerABI, SUPPORTED_CHAINS } from "@ecp.eth/sdk";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { waitForTransactionReceipt } from "@wagmi/core";
import { Settings } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";
import { keccak256, stringToHex, toHex } from "viem";
import { useAccount, useConfig, useSwitchChain, useWriteContract } from "wagmi";
import { getDefaultChain, getDefaultChainId } from "~/config/chains";
import type { CommunityWithOperations } from "~/hooks/useCommunity";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";

interface EditChannelDialogProps {
  community: CommunityWithOperations;
  onChannelUpdated?: () => void;
}

export function EditChannelDialog({ community, onChannelUpdated }: EditChannelDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(community.metadata?.name || "");
  const [description, setDescription] = useState(community.metadata?.description || "");
  const [icon, setIcon] = useState(community.metadata?.icon || "");
  const [rules, setRules] = useState(
    community.rules?.map((r) => (typeof r === "string" ? r : r.title)).join("\n") || "",
  );
  const [category, setCategory] = useState(((community.metadata as Record<string, unknown>)?.category as string) || "");
  const [isWaitingForTx, setIsWaitingForTx] = useState(false);
  const queryClient = useQueryClient();
  const { address, chainId } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();
  const config = useConfig();
  const defaultChainId = getDefaultChainId();

  const nameId = useId();
  const descriptionId = useId();
  const iconId = useId();
  const categoryId = useId();
  const rulesId = useId();

  const updateChannel = useMutation({
    mutationFn: async () => {
      if (!address) {
        toast.error("Please connect your wallet");
        throw new Error("Wallet not connected");
      }

      if (!name.trim()) {
        toast.error("Community name is required");
        throw new Error("Community name is required");
      }

      const currentChainSupported = chainId && SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS];

      if (!currentChainSupported) {
        toast.info("Switching to supported network...");
        await switchChainAsync({ chainId: defaultChainId });
      }

      // Create metadata operations array
      // MetadataEntryOp: { operation: uint8, key: bytes32, value: bytes }
      // operation: 0 = SET, 1 = DELETE
      const metadataOperations: Array<{ operation: number; key: `0x${string}`; value: `0x${string}` }> = [];

      const metadataObj: Record<string, unknown> = {};

      if (category.trim()) {
        metadataObj.category = category.trim();
      }

      if (rules.trim()) {
        const rulesArray = rules
          .split("\n")
          .filter((r) => r.trim())
          .map((r) => r.trim());
        if (rulesArray.length > 0) {
          metadataObj.rules = rulesArray;
        }
      }

      if (icon.trim()) {
        metadataObj.icon = icon.trim();
      }

      // If we have metadata, add it as a SET operation with key "metadata"
      if (Object.keys(metadataObj).length > 0) {
        const key = keccak256(toHex("metadata"));
        const value = stringToHex(JSON.stringify(metadataObj));
        metadataOperations.push({ operation: 0, key, value }); // operation: 0 = SET
      }

      const channelManagerAddress = CHANNEL_MANAGER_ADDRESS as `0x${string}`;
      const channelId = BigInt(community.id);

      const hash = await writeContractAsync({
        address: channelManagerAddress,
        abi: ChannelManagerABI,
        functionName: "updateChannel",
        args: [channelId, name.trim(), description.trim(), metadataOperations],
        chain: getDefaultChain(),
        account: address,
      });

      setIsWaitingForTx(true);
      toast.info("Transaction submitted. Waiting for confirmation...");

      const receipt = await waitForTransactionReceipt(config, {
        hash,
        chainId: defaultChainId,
      });

      if (receipt.status === "success") {
        toast.success("Community updated successfully!");
        queryClient.invalidateQueries({ queryKey: ["community", community.id] });
        queryClient.invalidateQueries({ queryKey: ["channels"] });

        if (onChannelUpdated) {
          onChannelUpdated();
        }

        setOpen(false);
      } else {
        toast.error("Transaction failed");
      }

      setIsWaitingForTx(false);
    },
    onError: (error) => {
      console.error("Error updating community:", error);
      toast.error(error.message || "Failed to update community");
      setIsWaitingForTx(false);
    },
  });

  // Reset form when dialog opens with current community values
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setName(community.metadata?.name || "");
      setDescription(community.metadata?.description || "");
      setIcon(community.metadata?.icon || "");
      setRules(community.rules?.map((r) => (typeof r === "string" ? r : r.title)).join("\n") || "");
      setCategory(((community.metadata as Record<string, unknown>)?.category as string) || "");
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Community</DialogTitle>
          <DialogDescription>Update your community settings. This will require a transaction.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor={nameId}>Community Name *</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., My Awesome Community"
              disabled={updateChannel.isPending || isWaitingForTx}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={descriptionId}>Description</Label>
            <Textarea
              id={descriptionId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this community about?"
              rows={3}
              disabled={updateChannel.isPending || isWaitingForTx}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={iconId}>Icon URL</Label>
            <Input
              id={iconId}
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="https://example.com/icon.png"
              disabled={updateChannel.isPending || isWaitingForTx}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={categoryId}>Category</Label>
            <Input
              id={categoryId}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., blog, forum, social"
              disabled={updateChannel.isPending || isWaitingForTx}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={rulesId}>Rules (one per line)</Label>
            <Textarea
              id={rulesId}
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              placeholder="Be respectful&#10;No spam&#10;Stay on topic"
              rows={3}
              disabled={updateChannel.isPending || isWaitingForTx}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="submit"
            onClick={() => updateChannel.mutate()}
            disabled={!address || !name.trim() || updateChannel.isPending || isWaitingForTx}
            className="w-full"
          >
            {updateChannel.isPending || isWaitingForTx ? "Updating..." : "Update Community"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
