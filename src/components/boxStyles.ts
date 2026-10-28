import type { BoxTier } from "../lib/achievements";

// Rarity colors for loot boxes, lowest to highest (kept out of lib/achievements so client
// components don't pull in Prisma)
export const BOX_STYLES: Record<BoxTier, { text: string; border: string }> = {
  Bronze: { text: "text-amber-600", border: "border-amber-700" },
  Silver: { text: "text-gray-300", border: "border-gray-400" },
  Gold: { text: "text-yellow-400", border: "border-yellow-500" },
  Platinum: { text: "text-cyan-300", border: "border-cyan-400" },
  Legendary: { text: "text-fuchsia-400", border: "border-fuchsia-500" },
};

export const BOX_ORDER = Object.keys(BOX_STYLES) as BoxTier[];
