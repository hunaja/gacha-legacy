import { TRPCError } from "@trpc/server";
import { Redis } from "ioredis";
import { z } from "zod";
import { calculateAllyStat, calculateEnemyStat } from "~/lib/leveling";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  resolveTurn,
  type FightState,
  type SpellName,
} from "~/server/fightEngine";
import { getPublicUrl } from "~/server/minio";

// Redis clients
const redis = new Redis();

export const fightsRouter = createTRPCRouter({
  startFight: protectedProcedure
    .input(
      z.object({
        stageId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const stage = await ctx.db.stage.findUnique({
        where: { id: input.stageId },
        include: { map: true },
      });
      if (!stage)
        throw new TRPCError({ code: "NOT_FOUND", message: "Stage not found" });

      const mapCount = await ctx.db.map.count({
        where: { campaign: stage.map.campaign },
      });

      // Searchs for the latest map the player has cleared
      const latestMapCleared = await ctx.db.fight.findFirst({
        where: {
          userId: ctx.session.user.id,
          stage: { boss: true, map: { campaign: stage.map.campaign } },
          result: "win",
        },
        orderBy: {
          stage: { map: { level: "desc" } },
        },
        select: {
          stage: { select: { map: { select: { level: true } } } },
        },
      });

      // The level of the map player can play in
      const currentLevelOfMap = latestMapCleared
        ? Math.min(mapCount, latestMapCleared.stage.map.level + 1)
        : 1;

      if (stage.map.level !== currentLevelOfMap) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only start fights in current level",
        });
      }

      const highestPlayerWin = await ctx.db.fight.findFirst({
        where: {
          userId: ctx.session.user.id,
          stage: { mapId: stage.mapId },
          result: "win",
        },
        orderBy: {
          stage: { mapLevel: "desc" },
        },
        select: {
          stage: { select: { mapLevel: true } },
        },
      });
      const nextFightMapLevel = (highestPlayerWin?.stage.mapLevel ?? 0) + 1;

      if (stage.mapLevel !== nextFightMapLevel)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Your level is not high enough",
        });

      const fittingUserAllies = await ctx.db.userAlly.findMany({
        where: { userId: ctx.session.user.id, selected: true },
        include: { ally: { include: { activeSpell: true } } },
      });
      if (fittingUserAllies.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "At least one ally needed",
        });
      }

      const stageEnemies = await ctx.db.stageEnemy.findMany({
        where: { stageId: stage.id },
        include: { enemy: true },
      });

      const fight = await ctx.db.fight.create({
        data: {
          userId: ctx.session.user.id,
          stageId: stage.id,
          allies: {
            create: fittingUserAllies.map((ua) => ({
              allyId: ua.allyId,
              position: ua.position!,
              level: ua.level,
              ascension: ua.ascension,
            })),
          },
          enemies: {
            create: stageEnemies.map((se) => ({
              enemyId: se.enemyId,
              position: se.position,
              level: se.level,
            })),
          },
        },
        include: {
          allies: { include: { ally: { include: { activeSpell: true } } } },
          enemies: { include: { enemy: { include: { activeSpell: true } } } },
        },
      });

      // Build initial state
      const state: FightState = {
        turn: 1,
        order: [],
        events: [],
        latestEventsIndex: 0,
        bgUrl: getPublicUrl(`/battleBgs/${stage.mapId}.png`),
        characters: [
          ...fight.enemies
            .map((e) => ({
              side: "enemy" as const,
              fightId: e.id,
              class: e.enemy.class,
              id: e.enemy.id,
              name: e.enemy.name,
              def: calculateEnemyStat(e.enemy.def, e.level),
              mDef: calculateEnemyStat(e.enemy.mDef, e.level),
              hp: calculateEnemyStat(e.enemy.hp, e.level),
              maxHp: calculateEnemyStat(e.enemy.hp, e.level),
              atk: calculateEnemyStat(e.enemy.atk, e.level),
              mAtk: calculateEnemyStat(e.enemy.mAtk, e.level),
              position: e.position,
              imageUrl: getPublicUrl(`enemies/${e.enemy.id}.png`),
              buffs: [],
              activeSpell: e.enemy.activeSpell
                ? {
                    type: "active" as const,
                    name: e.enemy.activeSpell.name as SpellName,
                    currentMana: 0,
                    requiredMana: e.enemy.activeSpell.requiredMana,
                    manaIncrease: e.enemy.activeSpell.manaIncrease,
                    maxMana: e.enemy.activeSpell.maxMana,
                  }
                : undefined,
            }))
            .sort((a, b) => a.position - b.position),
          ...fight.allies
            .map((a) => ({
              side: "ally" as const,
              id: a.ally.id,
              fightId: a.id,
              name: a.ally.name,
              maxHp: calculateAllyStat(a.ally.hp, a.level, a.ascension),
              def: calculateAllyStat(a.ally.def, a.level, a.ascension),
              mDef: calculateAllyStat(a.ally.mDef, a.level, a.ascension),
              hp: calculateAllyStat(a.ally.hp, a.level, a.ascension),
              class: a.ally.class,
              atk: calculateAllyStat(a.ally.atk, a.level, a.ascension),
              mAtk: calculateAllyStat(a.ally.mAtk, a.level, a.ascension),
              position: a.position,
              imageUrl: getPublicUrl(`allies/${a.ally.id}.portrait.png`),
              buffs: [],
              activeSpell: a.ally.activeSpell
                ? {
                    type: "active" as const,
                    name: a.ally.activeSpell.name as SpellName,
                    currentMana: 0,
                    requiredMana: a.ally.activeSpell.requiredMana,
                    manaIncrease: a.ally.activeSpell.manaIncrease,
                    maxMana: a.ally.activeSpell.maxMana,
                  }
                : undefined,
            }))
            .sort((a, b) => a.position - b.position),
        ],
        status: "active",
        magicalCritsEnabled: false,
      };

      await redis.set(`fight:${fight.id}:state`, JSON.stringify(state));
      return fight;
    }),

  getState: protectedProcedure
    .input(z.object({ fightId: z.string() }))
    .query(async ({ ctx, input }) => {
      const fight = await ctx.db.fight.findUnique({
        where: { id: input.fightId, userId: ctx.session.user.id },
      });

      if (!fight) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Fight not found or not owned by user",
        });
      }

      const key = `fight:${input.fightId}:state`;
      const raw = await redis.get(key);

      if (raw) {
        return JSON.parse(raw) as FightState;
      }

      throw new TRPCError({
        code: "SERVICE_UNAVAILABLE",
        message: "Fight state unavailable (Redis error)",
      });
    }),

  updateLatestEventsIndex: protectedProcedure
    .input(
      z.object({
        fightId: z.string(),
        index: z.number().int().nonnegative(),
      }),
    )
    .mutation(async ({ input }) => {
      const key = `fight:${input.fightId}:state`;
      const raw = await redis.get(key);
      if (!raw) throw new TRPCError({ code: "NOT_FOUND" });

      const state = JSON.parse(raw) as FightState;

      // Only allow moving forward
      if (
        input.index > state.events.length ||
        input.index < state.latestEventsIndex
      ) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid index" });
      }

      state.latestEventsIndex = input.index;

      await redis.set(key, JSON.stringify(state));
      return state;
    }),

  resolveTurn: protectedProcedure
    .input(z.object({ fightId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const key = `fight:${input.fightId}:state`;

      const raw = await redis.get(key);
      if (!raw)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Fight state not found",
        });

      const originalState = JSON.parse(raw) as FightState;
      if (originalState.status !== "active") {
        return originalState;
      }

      const newState = resolveTurn(structuredClone(originalState));
      if (newState.status !== "active") {
        await ctx.db.fight.update({
          where: { id: input.fightId },
          data: { result: newState.status },
        });
      }

      await redis.set(key, JSON.stringify(newState), "EX", 86400);
      return newState;
    }),
  getOwn: protectedProcedure.query(({ ctx }) => {
    return ctx.db.fight.findMany({
      where: { userId: ctx.session.user.id },
      take: 5,
      orderBy: { createdAt: "desc" },
    });
  }),
});
