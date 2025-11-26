import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import {
  getBattleBgUploadUrl,
  getMapUploadUrl,
  getPublicUrl,
} from "../../minio";
import { TRPCError } from "@trpc/server";

export const mapsRouter = createTRPCRouter({
  createUploadUrl: publicProcedure
    .input(
      z.object({ name: z.string(), level: z.number(), campaign: z.boolean() }),
    )
    .mutation(async ({ ctx, input }) => {
      const map = await ctx.db.map.create({
        data: {
          name: input.name,
          level: input.level,
          campaign: input.campaign,
        },
      });

      const { uploadUrl, publicUrl } = await getMapUploadUrl(map.id);
      const { uploadUrl: battleBgUploadUrl } = await getBattleBgUploadUrl(
        map.id,
      );

      return {
        uploadUrl,
        battleBgUploadUrl,
        map: { ...map, bgUrl: publicUrl },
      };
    }),

  getMap: protectedProcedure
    .input(
      z.object({
        mapId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const map = await ctx.db.map.findUnique({
        where: { id: input.mapId },
        include: { stages: true },
      });
      if (!map)
        throw new TRPCError({ code: "NOT_FOUND", message: "Map not found" });

      const highestFightByMapLevel = await ctx.db.fight.findFirst({
        where: {
          userId: ctx.session.user.id,
          stage: { mapId: input.mapId },
          result: "win",
        },
        orderBy: {
          stage: { mapLevel: "desc" },
        },
        select: {
          stage: { select: { mapLevel: true } },
        },
      });
      const recordLevel = highestFightByMapLevel?.stage.mapLevel ?? 0;

      return {
        ...map,
        recordLevel,
        bgUrl: getPublicUrl(`maps/${map.id}.png`),
      };
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const maps = await ctx.db.map.findMany({
      orderBy: { name: "asc" },
      include: { stages: true },
    });

    return maps.map((m) => ({
      ...m,
      bgUrl: getPublicUrl(`maps/${m.id}.png`),
      battleBgUrl: getPublicUrl(`battleBgs/${m.id}.png`),
    }));
  }),

  listForEvent: protectedProcedure
    .input(z.object({ eventId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.map.findMany({
        where: {
          campaign: !input.eventId,
        },
      });
    }),

  recordLevelInMap: protectedProcedure
    .input(z.object({ mapId: z.string() }))
    .query(async ({ ctx, input }) => {
      const highestPlayerWin = await ctx.db.fight.findFirst({
        where: {
          userId: ctx.session.user.id,
          stage: { mapId: input.mapId },
          result: "win",
        },
        orderBy: {
          stage: { mapLevel: "desc" },
        },
        select: {
          stage: { select: { mapLevel: true } },
        },
      });
      return highestPlayerWin?.stage.mapLevel ?? 0;
    }),
  nextPlayableMap: protectedProcedure
    .input(z.object({ eventId: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.map.findFirst({
        where: {
          campaign: !input.eventId,
          level: {
            gt:
              (
                await ctx.db.fight.findFirst({
                  where: {
                    userId: ctx.session.user.id,
                    stage: { boss: true, map: { campaign: !input.eventId } },
                    result: "win",
                  },
                  orderBy: { stage: { map: { level: "desc" } } },
                  select: {
                    stage: { select: { map: { select: { level: true } } } },
                  },
                })
              )?.stage.map.level ?? 0,
          },
        },
        orderBy: { level: "asc" },
      });
    }),
});
