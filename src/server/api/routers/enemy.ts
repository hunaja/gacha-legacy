import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getEnemyUploadUrl, getPublicUrl } from "../../minio";

export const enemiesRouter = createTRPCRouter({
  createUploadUrl: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        class: z.enum(["DPS", "TANK", "HEALER", "BUFF"]),
        hp: z.number(),
        atk: z.number(),
        mAtk: z.number(),
        def: z.number(),
        mDef: z.number(),
        critAtk: z.number(),
        critChance: z.number(),
        dodgeChance: z.number(),
        activeSpellName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Luo enemy tietokantaan
      const enemy = await ctx.db.enemy.create({
        data: {
          name: input.name,
          description: input.description,
          class: input.class,
          hp: input.hp,
          atk: input.atk,
          mAtk: input.mAtk,
          def: input.def,
          mDef: input.mDef,
          critAtk: input.critAtk,
          critChance: input.critChance,
          dodgeChance: input.dodgeChance,
          activeSpellName: input.activeSpellName,
        },
      });

      // 2. Luo presigned URL spriteä varten
      const { uploadUrl, publicUrl } = await getEnemyUploadUrl(enemy.id);

      return {
        uploadUrl,
        enemy: { ...enemy, spriteUrl: publicUrl },
      };
    }),
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        class: z.enum(["DPS", "TANK", "HEALER", "BUFF"]),
        hp: z.number(),
        atk: z.number(),
        mAtk: z.number(),
        def: z.number(),
        mDef: z.number(),
        critAtk: z.number(),
        critChance: z.number(),
        dodgeChance: z.number(),
        activeSpellName: z.string().optional(),
        passiveSpellName: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const enemy = await ctx.db.enemy.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
          class: input.class,
          hp: input.hp,
          atk: input.atk,
          mAtk: input.mAtk,
          def: input.def,
          mDef: input.mDef,
          critAtk: input.critAtk,
          critChance: input.critChance,
          dodgeChance: input.dodgeChance,
          activeSpellName: input.activeSpellName,
          passiveSpellName: input.passiveSpellName,
        },
      });
      return enemy;
    }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const enemies = await ctx.db.enemy.findMany({
      orderBy: { name: "asc" },
    });

    return enemies.map((e) => ({
      ...e,
      spriteUrl: getPublicUrl(`enemies/${e.id}.png`),
    }));
  }),
});
