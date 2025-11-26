import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../trpc";
import { getPublicUrl } from "~/server/minio";
import { TRPCError } from "@trpc/server";

export const stagesRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        mapId: z.string(),
        mapLevel: z.number(),
        xPercent: z.number(),
        yPercent: z.number(),
        enemies: z
          .array(
            z.object({
              enemyId: z.string(),
              position: z.number().min(0).max(2),
              level: z.number(),
            }),
          )
          .max(3),
        boss: z.boolean().optional().default(false),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const stage = await ctx.db.stage.create({
        data: {
          name: input.name,
          mapId: input.mapId,
          mapLevel: input.mapLevel,
          xPercent: input.xPercent,
          yPercent: input.yPercent,
          boss: input.boss,
          enemies: {
            create: input.enemies.map((e) => ({
              enemyId: e.enemyId,
              position: e.position,
              level: e.level,
            })),
          },
        },
        include: {
          enemies: { include: { enemy: true } }, // include enemy relation for convenience
        },
      });

      return stage;
    }),

  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.stage.findMany({
      include: {
        enemies: { include: { enemy: true } },
        map: true,
      },
      orderBy: { name: "asc" },
    });
  }),

  findById: protectedProcedure
    .input(
      z.object({
        stageId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const withoutUrls = await ctx.db.stage.findUnique({
        where: { id: input.stageId },
        include: { enemies: { include: { enemy: true } } },
      });

      if (!withoutUrls) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Stage not found" });
      }

      return {
        ...withoutUrls,
        enemies: withoutUrls.enemies
          .map((e) => ({
            ...e,
            // use the actual enemy id (enemyId) to build the sprite URL
            spriteUrl: getPublicUrl(`enemies/${e.enemyId}.png`),
            // also expose the nested enemy object (if needed)
            enemy: e.enemy,
          }))
          .sort((a, b) => a.position - b.position),
      };
    }),
});
