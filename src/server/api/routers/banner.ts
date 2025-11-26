import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getBannerUploadUrl, getPublicUrl } from "../../minio";

export const bannerRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        active: z.boolean(),
        posterAllyId: z.string(),
        commonRate: z.number(),
        rareRate: z.number(),
        srRate: z.number(),
        ssrRate: z.number(),
        sssrRate: z.number(),
        allyIds: z.array(z.string()),
        acceptedPayments: z.array(
          z.object({
            currency: z.enum(["DIAMONDS", "GOLD"]),
            amount: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const banner = await ctx.db.banner.create({
        data: {
          name: input.name,
          active: input.active,
          posterAllyId: input.posterAllyId,
          commonRate: input.commonRate,
          rareRate: input.rareRate,
          srRate: input.srRate,
          ssrRate: input.ssrRate,
          sssrRate: input.sssrRate,
          allies: {
            create: input.allyIds.map((id) => ({ allyId: id })),
          },
          acceptedPayments: {
            create: input.acceptedPayments,
          },
        },
      });

      const { uploadUrl, publicUrl } = await getBannerUploadUrl(banner.id);

      return {
        uploadUrl,
        banner: { ...banner, bgUrl: publicUrl },
      };
    }),
  list: protectedProcedure
    .input(
      z
        .object({
          ignoreActiveFlag: z.boolean(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      const banners = await ctx.db.banner.findMany({
        where: { active: input?.ignoreActiveFlag ? undefined : true },
        orderBy: { createdAt: "asc" },
      });

      return banners.map((b) => ({
        ...b,
        bgUrl: getPublicUrl(`/banners/${b.id}.png`),
      }));
    }),
  addAlly: protectedProcedure
    .input(z.object({ bannerId: z.string(), allyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.bannerAlly.create({
        data: {
          bannerId: input.bannerId,
          allyId: input.allyId,
        },
      });
    }),
  removeAlly: protectedProcedure
    .input(z.object({ bannerId: z.string(), allyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.bannerAlly.delete({
        where: {
          bannerId_allyId: {
            bannerId: input.bannerId,
            allyId: input.allyId,
          },
        },
      });
    }),
  get: protectedProcedure
    .input(
      z.object({
        bannerId: z.string(),
        ignoreActiveFlag: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
      const banner = await ctx.db.banner.findUnique({
        where: {
          id: input.bannerId,
          active: input.ignoreActiveFlag ? undefined : true,
        },
        include: {
          allies: { include: { ally: true } },
          acceptedPayments: true,
        },
      });
      if (!banner) return null;

      const dbUserPityForBanner = await ctx.db.userPityForBanner.findUnique({
        where: {
          bannerId_userId: { userId: ctx.session.user.id, bannerId: banner.id },
        },
      });
      const pity = dbUserPityForBanner?.pity ?? 0;

      return {
        ...banner,
        pity,
        allies: banner.allies.map((ba) => ({
          ...ba,
          ally: {
            ...ba.ally,
            spriteUrl: getPublicUrl(`allies/${ba.ally.id}.sprite.png`),
            portraitUrl: getPublicUrl(`allies/${ba.ally.id}.portrait.png`),
          },
        })),
      };
    }),
});
