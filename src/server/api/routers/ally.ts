import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { getAllyUploadUrls, getPublicUrl } from "../../minio";
import { TRPCError } from "@trpc/server";

type Rarity = "COMMON" | "RARE" | "SR" | "SSR" | "SSSR";

export const allyRouter = createTRPCRouter({
  createUploadUrls: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        hp: z.number(),
        atk: z.number(),
        mAtk: z.number(),
        critAtk: z.number(),
        critChance: z.number(),
        def: z.number(),
        mDef: z.number(),
        dodgeChance: z.number(),
        backgroundId: z.string(),
        settableAsPortrait: z.boolean().default(false),
        starterAlly: z.boolean().default(false),
        rarity: z.enum(["COMMON", "RARE", "SR", "SSR", "SSSR"]),
        class: z.enum(["DPS", "TANK", "HEALER", "BUFF"]),
        activeSpellName: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const ally = await ctx.db.ally.create({
        data: {
          name: input.name,
          description: input.description,
          critAtk: input.critAtk,
          critChance: input.critChance,
          mAtk: input.mAtk,
          def: input.def,
          mDef: input.mDef,
          backgroundId: input.backgroundId,
          class: input.class,
          hp: input.hp,
          settableAsPortrait: input.settableAsPortrait,
          starterAlly: input.starterAlly,
          atk: input.atk,
          rarity: input.rarity,
          dodgeChance: input.dodgeChance,
          activeSpellName: input.activeSpellName,
        },
      });

      const urls = await getAllyUploadUrls(ally.id);

      return {
        ally,
        spriteUploadUrl: urls[".sprite.png"]!.uploadUrl,
        portraitUploadUrl: urls[".portrait.png"]!.uploadUrl,
      };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        hp: z.number(),
        atk: z.number(),
        mAtk: z.number(),
        critAtk: z.number(),
        critChance: z.number(),
        settableAsPortrait: z.boolean().default(false),
        starterAlly: z.boolean().default(false),
        def: z.number(),
        mDef: z.number(),
        dodgeChance: z.number(),
        rarity: z.enum(["COMMON", "RARE", "SR", "SSR", "SSSR"]),
        class: z.enum(["DPS", "TANK", "HEALER", "BUFF"]),
        activeSpellName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: ignored, ...data } = input;

      return ctx.db.ally.update({
        where: { id: input.id },
        data,
      });
    }),

  roll: protectedProcedure
    .input(
      z.object({
        paymentMethod: z.enum(["DIAMONDS", "GOLD"]),
        bannerId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const balance = await ctx.db.userBalance.findFirst({
        where: { userId: ctx.session.user.id },
      });
      if (!balance)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Balance not found",
        });

      const banner = await ctx.db.banner.findUnique({
        where: { id: input.bannerId },
        include: { acceptedPayments: true },
      });
      if (!banner)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Banner not found",
        });

      if (
        input.paymentMethod === "DIAMONDS" &&
        banner.acceptedPayments.some((p) => p.currency === "DIAMONDS")
      ) {
        if (balance.diamonds < 5)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not enough diamonds",
          });

        await ctx.db.userBalance.update({
          where: { userId: ctx.session.user.id },
          data: {
            diamonds: balance.diamonds - 5,
          },
        });
      } else if (
        input.paymentMethod === "GOLD" &&
        banner.acceptedPayments.some((p) => p.currency === "GOLD")
      ) {
        if (balance.gold < 20)
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Not enough gold",
          });

        await ctx.db.userBalance.update({
          where: { userId: ctx.session.user.id },
          data: {
            gold: balance.gold - 20,
          },
        });
      } else {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid payment method",
        });
      }

      const dbUserPityForBanner = await ctx.db.userPityForBanner.findUnique({
        where: {
          bannerId_userId: { userId: ctx.session.user.id, bannerId: banner.id },
        },
      });
      const pity = dbUserPityForBanner?.pity ?? 0;

      // TODO: Pity system

      // Step 1: pick rarity
      const rand = Math.random() * 100;
      let rarity: Rarity;
      if (rand < banner.commonRate) rarity = "COMMON";
      else if (rand < banner.commonRate + banner.rareRate) rarity = "RARE";
      else if (rand < banner.commonRate + banner.rareRate + banner.srRate)
        rarity = "SR";
      else if (
        rand <
        banner.commonRate + banner.rareRate + banner.srRate + banner.ssrRate
      )
        rarity = "SSR";
      else rarity = "SSSR";

      // Step 2: fetch all allies of that rarity
      const allies = await ctx.db.ally.findMany({
        where: { rarity },
      });

      if (allies.length === 0)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No gachas found for rolled rarity",
        });

      // Step 3: pick one at random
      const randomIndex = Math.floor(Math.random() * allies.length);
      const ally = allies[randomIndex];
      if (!ally) return [];

      await ctx.db.userPityForBanner.upsert({
        where: {
          bannerId_userId: { userId: ctx.session.user.id, bannerId: banner.id },
        },
        update: { pity: Math.min(pity + 1, 90) },
        create: { userId: ctx.session.user.id, bannerId: banner.id, pity: 1 },
      });

      const existingAlly = await ctx.db.userAlly.findUnique({
        where: {
          userId_allyId: { userId: ctx.session.user.id, allyId: ally.id },
        },
      });
      if (!existingAlly)
        await ctx.db.userAlly.create({
          data: { userId: ctx.session.user.id, allyId: ally.id },
        });
      else
        await ctx.db.userAlly.update({
          where: { id: existingAlly.id },
          data: { tokens: existingAlly.tokens + 1 },
        });

      return [
        {
          ...ally,
          spriteUrl: getPublicUrl(`allies/${ally.id}.sprite.png`),
        },
      ];
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    const allies = await ctx.db.ally.findMany({
      orderBy: { name: "asc" },
      include: { activeSpell: true },
    });

    return allies.map((a) => ({
      ...a,
      spriteUrl: getPublicUrl(`allies/${a.id}.sprite.png`),
      portraitUrl: getPublicUrl(`allies/${a.id}.portrait.png`),
      bgUrl: getPublicUrl(`allyBackgrounds/${a.backgroundId}.png`),
    }));
  }),
  giveToCurrentUser: protectedProcedure
    .input(
      z.object({
        allyId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const userAlly = await ctx.db.userAlly.upsert({
        where: { userId_allyId: { userId, allyId: input.allyId } },
        update: {}, // already owned, do nothing
        create: { userId, allyId: input.allyId, selected: false },
      });

      return userAlly;
    }),
});
