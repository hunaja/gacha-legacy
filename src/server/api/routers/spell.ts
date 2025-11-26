import { implementedSpellFns } from "~/server/fightEngine";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { z } from "zod";

export const spellsRouter = createTRPCRouter({
  getCreatableActiveSpells: protectedProcedure.query(async ({ ctx }) => {
    const allSpells = await ctx.db.activeSpell.findMany({});
    const allSpellNames = allSpells.map((s) => s.name);

    return implementedSpellFns.filter(
      (spellName) => !allSpellNames.includes(spellName),
    );
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.activeSpell.findMany({});
  }),

  edit: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        requiredMana: z.number(),
        manaIncrease: z.number(),
        maxMana: z.number(),
        duration: z.number().optional(),
        targetPosition: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { name: ignored, ...data } = input;

      return ctx.db.activeSpell.update({
        where: { name: input.name },
        data,
      });
    }),

  createActiveSpell: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string(),
        requiredMana: z.number(),
        manaIncrease: z.number(),
        maxMana: z.number(),
        duration: z.number().optional(),
        targetPosition: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.activeSpell.create({
        data: {
          name: input.name,
          description: input.description,
          requiredMana: input.requiredMana,
          targetPosition: input.targetPosition,
          duration: input.duration,
          manaIncrease: input.manaIncrease,
          maxMana: input.maxMana,
        },
      });
    }),
});
