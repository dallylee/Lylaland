// src/config/progressionConfig.ts
export type Currency = "goldStars" | "blueTokens" | "redTokens";

export type UnlockRule =
  | { kind: "starsTotalAtLeast"; total: number }
  | { kind: "tokensAtLeast"; token: "blueTokens" | "redTokens"; total: number }
  | { kind: "riddlesSolvedAtLeast"; total: number }
  | { kind: "craftsCompletedAtLeast"; total: number }
  | { kind: "daysOpenedAtLeast"; total: number }
  | { kind: "discovery"; discoveryId: string };

export type SlotId =
  | "ts_p1" | "ts_p2" | "ts_p3" | "ts_owl"
  | "s2_p1" | "s2_p2" | "s2_p3" | "s2_p4"
  | "s1_p1" | "s1_p2" | "s1_p3" | "s1_p4"
  | "bs_p1" | "bs_p2" | "bs_p3" | "bs_egg"
  | "lt_stone_p1" | "lt_tower_p1" | "lt_tower_p2"
  | "rt_stone_p1" | "rt_tower_p1" | "rt_tower_p2";

export type ItemId =
  | "owl" | "dragon_egg"
  | "item_01" | "item_02" | "item_03_clueRelic" | "item_04" | "item_05"
  | "item_06" | "item_07" | "item_08" | "item_09" | "item_10"
  | "item_11" | "item_12"
  | "item_13_blue" | "item_14_blue"
  | "item_15_discovery" | "item_16"
  | "item_17_red" | "item_18_red"
  | "item_19_discovery" | "item_20_meta";

export type HotspotId =
  | "home_moon"
  | "home_left_tower_ledge"
  | "home_right_tower_ledge"
  | "home_arch_window"
  | "media_red_book"
  | "diary_corner_seal";

export const ProgressionConfig = {
  version: "v1",

  // -------------------------
  // Rewards and pacing
  // -------------------------
  rewards: {
    // Core earning events
    owlRiddleCorrect: { goldStars: 8, tokenBonus: { blueChanceBoost: 0.01, redChanceBoost: 0.005 } },
    owlRiddleWrongOrTimeout: { goldStars: 0 },

    quizComplete: { goldStarsMin: 6, goldStarsMax: 10 },
    craftComplete: { goldStars: 3 },
    gameSessionComplete: { goldStars: 1 },
    mediaInteraction: { goldStars: 1 },
    diaryEntry: { goldStars: 1 },

    // Streaks
    diaryStreak7Days: { goldStars: 8 }, // encourages diary without accelerating too hard
  },

  dailyCaps: {
    // Prevent click-grinding. Owl is intentionally not capped here.
    dailyGoldCap: 10, // applies to gameSessionComplete, mediaInteraction, diaryEntry, craftComplete
  },

  tokenDrops: {
    // Tokens are bonuses, gold is always granted as normal.
    blueTokenChancePerGoldStar: 0.04,
    redTokenChancePerGoldStar: 0.015,

    // Optional anti-frustration: soft pity
    pity: {
      enable: true,
      blueGuaranteeAfterGoldStarsWithoutBlue: 80,
      redGuaranteeAfterGoldStarsWithoutRed: 180,
    },
  },

  // -------------------------
  // Shelf layout and assets
  // -------------------------
  shelf: {
    slots: [
      // Top shelf and owl
      { slotId: "ts_p1", kind: "item" },
      { slotId: "ts_p2", kind: "item" },
      { slotId: "ts_p3", kind: "item" },
      { slotId: "ts_owl", kind: "owl" },

      // Shelf 2
      { slotId: "s2_p1", kind: "item" },
      { slotId: "s2_p2", kind: "item" },
      { slotId: "s2_p3", kind: "item" },
      { slotId: "s2_p4", kind: "item" },

      // Shelf 1
      { slotId: "s1_p1", kind: "item" },
      { slotId: "s1_p2", kind: "item" },
      { slotId: "s1_p3", kind: "item" },
      { slotId: "s1_p4", kind: "item" },

      // Bottom shelf and egg
      { slotId: "bs_p1", kind: "item" },
      { slotId: "bs_p2", kind: "item" },
      { slotId: "bs_p3", kind: "item" },
      { slotId: "bs_egg", kind: "egg" },

      // Towers (3 slots each side to reach 22 total slots)
      { slotId: "lt_stone_p1", kind: "item" },
      { slotId: "lt_tower_p1", kind: "item" },
      { slotId: "lt_tower_p2", kind: "item" },

      { slotId: "rt_stone_p1", kind: "item" },
      { slotId: "rt_tower_p1", kind: "item" },
      { slotId: "rt_tower_p2", kind: "item" },
    ] satisfies Array<{ slotId: SlotId; kind: "item" | "owl" | "egg" }>,

    // Asset paths, consistent conventions
    assets: {
      itemPath: (itemId: string) => `/ui/items/${itemId}.png`,
      emptySlotPath: `/ui/items/empty.png`,
      owlArmedPath: `/ui/items/owl_armed.webp`,
      owlSleepPath: `/ui/items/owl_sleep.webp`,
      eggPath: `/ui/items/dragon_egg.png`,
      hatchVideoPath: `/ui/cinematics/egg_hatch.mp4`,
    },
  },

  // -------------------------
  // Items and unlock rules
  // 20 collectible items plus owl and egg (reserved)
  // -------------------------
  items: [
    // Reserved occupants
    { id: "owl" as ItemId, slotId: "ts_owl" as SlotId, reserved: true },
    { id: "dragon_egg" as ItemId, slotId: "bs_egg" as SlotId, reserved: true },

    // Early, easy
    { id: "item_01" as ItemId, slotId: "s1_p1" as SlotId, unlock: { kind: "starsTotalAtLeast", total: 10 } as UnlockRule },
    { id: "item_02" as ItemId, slotId: "s1_p2" as SlotId, unlock: { kind: "starsTotalAtLeast", total: 20 } as UnlockRule },

    // Item 3 is the clue giver, discovered not purchased
    { id: "item_03_clueRelic" as ItemId, slotId: "ts_p2" as SlotId, unlock: { kind: "discovery", discoveryId: "disc_clueRelic" } as UnlockRule },

    // Two early clue discoveries (within first 10)
    { id: "item_04" as ItemId, slotId: "s2_p2" as SlotId, unlock: { kind: "discovery", discoveryId: "disc_early_01" } as UnlockRule },
    { id: "item_05" as ItemId, slotId: "s2_p3" as SlotId, unlock: { kind: "discovery", discoveryId: "disc_early_02" } as UnlockRule },

    // Star milestones, ramping
    { id: "item_06" as ItemId, slotId: "s2_p1" as SlotId, unlock: { kind: "starsTotalAtLeast", total: 35 } as UnlockRule },
    { id: "item_07" as ItemId, slotId: "s2_p4" as SlotId, unlock: { kind: "starsTotalAtLeast", total: 55 } as UnlockRule },
    { id: "item_08" as ItemId, slotId: "s1_p3" as SlotId, unlock: { kind: "starsTotalAtLeast", total: 80 } as UnlockRule },
    { id: "item_09" as ItemId, slotId: "s1_p4" as SlotId, unlock: { kind: "starsTotalAtLeast", total: 110 } as UnlockRule },
    { id: "item_10" as ItemId, slotId: "bs_p1" as SlotId, unlock: { kind: "starsTotalAtLeast", total: 145 } as UnlockRule },
    { id: "item_11" as ItemId, slotId: "bs_p2" as SlotId, unlock: { kind: "starsTotalAtLeast", total: 185 } as UnlockRule },
    { id: "item_12" as ItemId, slotId: "bs_p3" as SlotId, unlock: { kind: "starsTotalAtLeast", total: 230 } as UnlockRule },

    // Blue token gated
    { id: "item_13_blue" as ItemId, slotId: "lt_stone_p1" as SlotId, unlock: { kind: "tokensAtLeast", token: "blueTokens", total: 3 } as UnlockRule },
    { id: "item_14_blue" as ItemId, slotId: "rt_stone_p1" as SlotId, unlock: { kind: "tokensAtLeast", token: "blueTokens", total: 6 } as UnlockRule },

    // Midgame discovery after at least one blue item exists
    { id: "item_15_discovery" as ItemId, slotId: "ts_p1" as SlotId, unlock: { kind: "discovery", discoveryId: "disc_mid_01" } as UnlockRule },

    // More stars
    { id: "item_16" as ItemId, slotId: "lt_tower_p1" as SlotId, unlock: { kind: "starsTotalAtLeast", total: 280 } as UnlockRule },

    // Red token gated long tail
    { id: "item_17_red" as ItemId, slotId: "rt_tower_p1" as SlotId, unlock: { kind: "tokensAtLeast", token: "redTokens", total: 3 } as UnlockRule },
    { id: "item_18_red" as ItemId, slotId: "lt_tower_p2" as SlotId, unlock: { kind: "tokensAtLeast", token: "redTokens", total: 6 } as UnlockRule },

    // Late discovery, can be time-windowed but must be fair
    { id: "item_19_discovery" as ItemId, slotId: "rt_tower_p2" as SlotId, unlock: { kind: "discovery", discoveryId: "disc_late_01" } as UnlockRule },

    // Meta goal finale before hatching
    { id: "item_20_meta" as ItemId, slotId: "ts_p3" as SlotId, unlock: { kind: "riddlesSolvedAtLeast", total: 10 } as UnlockRule },
  ] satisfies Array<{ id: ItemId; slotId: SlotId; unlock?: UnlockRule; reserved?: boolean }>,

  // -------------------------
  // Discovery system: clue scheduling and hotspot gating
  // -------------------------
  discovery: {
    // Discovery entries map to clue text stored in clues.json later.
    // Each discovery arms a hotspot only after the clue is shown AND acknowledged.
    rules: [
      // Item 3: clue relic discovery, guaranteed early
      {
        discoveryId: "disc_clueRelic",
        armsHotspot: "home_arch_window" as HotspotId,
        trigger: { kind: "onAppOpenAfterItemsOwned", itemsOwned: ["item_02"], opensAfter: 1 },
        requireAckBeforeArming: true,
        unlocksItemId: "item_03_clueRelic" as ItemId,
      },

      // Item 4: clue delivered on second login after clue relic acquired
      {
        discoveryId: "disc_early_01",
        armsHotspot: "home_moon" as HotspotId,
        trigger: { kind: "onAppOpenAfterItemsOwned", itemsOwned: ["item_03_clueRelic"], opensAfter: 2 },
        requireAckBeforeArming: true,
        unlocksItemId: "item_04" as ItemId,
      },

      // Item 5: clue delivered on third or fourth login after clue relic acquired
      {
        discoveryId: "disc_early_02",
        armsHotspot: "home_left_tower_ledge" as HotspotId,
        trigger: { kind: "onAppOpenAfterItemsOwned", itemsOwned: ["item_03_clueRelic"], opensAfter: 4 },
        requireAckBeforeArming: true,
        unlocksItemId: "item_05" as ItemId,
      },

      // Mid discovery: only after at least one blue-token item is owned
      {
        discoveryId: "disc_mid_01",
        armsHotspot: "media_red_book" as HotspotId,
        trigger: { kind: "onAppOpenAfterItemsOwned", itemsOwned: ["item_13_blue"], opensAfter: 2 },
        requireAckBeforeArming: true,
        unlocksItemId: "item_15_discovery" as ItemId,
      },

      // Late discovery: allow time window but provide fallback if missed
      {
        discoveryId: "disc_late_01",
        armsHotspot: "diary_corner_seal" as HotspotId,
        trigger: { kind: "timeWindow", window: "noon", dayRule: "tuesdayOrFallback24h" },
        requireAckBeforeArming: true,
        unlocksItemId: "item_19_discovery" as ItemId,
      },
    ] as Array<any>,

    hotspots: [
      // Each hotspot can live on any realm, and can require specific interaction patterns.
      { id: "home_moon" as HotspotId, realm: "home", interaction: { kind: "multiTap", taps: 3, maxIntervalMs: 1200 } },
      { id: "home_left_tower_ledge" as HotspotId, realm: "home", interaction: { kind: "tap" } },
      { id: "home_right_tower_ledge" as HotspotId, realm: "home", interaction: { kind: "tap" } },
      { id: "home_arch_window" as HotspotId, realm: "home", interaction: { kind: "tap" } },
      { id: "media_red_book" as HotspotId, realm: "media", interaction: { kind: "tap" } },
      { id: "diary_corner_seal" as HotspotId, realm: "diary", interaction: { kind: "tap" } },
    ] as Array<any>,

    ui: {
      cluePopup: {
        style: "scroll",
        persistentUntilAck: true,
        ackButtonText: "Ok, got it!",
      },
      riddlePopup: {
        answers: 4,
        timerSeconds: 20,
        allowCancel: false,
      },
    },

    memoryKeys: {
      // Persisted state keys, so we do not repeat riddles or clues
      askedRiddleIds: "sparkleworld.riddles.asked.v1",
      usedClueIds: "sparkleworld.clues.used.v1",
      discoveryState: "sparkleworld.discovery.state.v1",
      diaryStreak: "sparkleworld.diary.streak.v1",
      starsTotals: "sparkleworld.stars.totals.v1",
    },
  },

  // -------------------------
  // Owl system
  // -------------------------
  owl: {
    cadenceHours: 24,
    state: ["armed", "inChallenge", "sleeping"] as const,
    sounds: {
      correct: "star_win",
      wrong: "fail_short",
      timeout: "fail_short",
      specialReveal: "special_reveal_long",
    },
  },

  // -------------------------
  // Hatch finale
  // -------------------------
  hatch: {
    whenCollectedCountAtLeast: 20,
    playVideoPath: `/ui/cinematics/egg_hatch.mp4`,
    afterVideo: { grantStars: 0, showConfetti: true },
  },

  // -------------------------
  // Optional anonymous page analytics (implementation choice)
  // -------------------------
  analytics: {
    enable: true,
    mode: "pageCountsOnly",
    events: ["realm_opened"] as const,
  },
} as const;
