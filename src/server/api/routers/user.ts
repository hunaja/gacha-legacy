import { TRPCError } from "@trpc/server";
import z from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { getPublicUrl } from "~/server/minio";

export const usersRouter = createTRPCRouter({
  giveGold: protectedProcedure.mutation(async ({ ctx }) => {
    const balance = await ctx.db.userBalance.findUnique({
      where: { userId: ctx.session.user.id },
    });
    if (!balance)
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User balance not found",
      });

    return await ctx.db.userBalance.update({
      where: { userId: ctx.session.user.id },
      data: { gold: balance.gold + 100 },
    });
  }),

  getAllies: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        allies: { include: { ally: true } },
      },
    });

    if (!user) return [];

    return user.allies.map((ua) => ({
      ...ua,
      portraitUrl: getPublicUrl(`allies/${ua.allyId}.portrait.png`),
      spriteUrl: getPublicUrl(`allies/${ua.allyId}.sprite.png`),
    }));
  }),
  setPosterAlly: protectedProcedure
    .input(
      z.object({
        allyId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userAlly = await ctx.db.userAlly.findFirst({
        where: {
          userId: ctx.session.user.id,
          ally: {
            id: input.allyId,
            settableAsPortrait: true,
          },
        },
        include: { ally: true },
      });
      if (!userAlly)
        throw new TRPCError({ message: "Ally not found", code: "NOT_FOUND" });

      await ctx.db.userBalance.update({
        where: { userId: ctx.session.user.id },
        data: {
          posterAllyId: input.allyId,
        },
      });
    }),
  // TODO: Move to `createBalance` route handler, now this has side-effects
  getBalance: protectedProcedure.query(async ({ ctx }) => {
    const userBalance = await ctx.db.userBalance.findUnique({
      where: { userId: ctx.session.user.id },
      include: { posterAlly: true },
    });
    if (!userBalance) {
      const starterAllies = await ctx.db.ally.findMany({
        where: { starterAlly: true },
      });

      await ctx.db.userAlly.createMany({
        data: starterAllies.map((a) => ({
          userId: ctx.session.user.id,
          allyId: a.id,
        })),
      });

      const posterAlly = starterAllies.find((a) => a.settableAsPortrait);
      const createdBalance = await ctx.db.userBalance.create({
        data: {
          userId: ctx.session.user.id,
          posterAllyId: posterAlly?.id ?? undefined,
        },
        include: { posterAlly: true },
      });

      return {
        ...createdBalance,
        posterAlly: createdBalance.posterAlly
          ? {
              ...createdBalance.posterAlly,
              bgUrl: getPublicUrl(
                `allyBackgrounds/${createdBalance.posterAlly.backgroundId}.png`,
              ),
              portraitUrl: getPublicUrl(
                `allies/${createdBalance.posterAlly.id}.portrait.png`,
              ),
              spriteUrl: getPublicUrl(
                `allies/${createdBalance.posterAlly.id}.sprite.png`,
              ),
            }
          : null,
      };
    }

    return {
      ...userBalance,
      posterAlly: userBalance.posterAlly
        ? {
            ...userBalance.posterAlly,
            bgUrl: getPublicUrl(
              `allyBackgrounds/${userBalance.posterAlly.backgroundId}.png`,
            ),
            portraitUrl: getPublicUrl(
              `allies/${userBalance.posterAlly.id}.portrait.png`,
            ),
            spriteUrl: getPublicUrl(
              `allies/${userBalance.posterAlly.id}.sprite.png`,
            ),
          }
        : null,
    };
  }),
  selectAlly: protectedProcedure
    .input(z.object({ allyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { allyId } = input;

      const currentlySelected = await ctx.db.userAlly.findMany({
        where: {
          userId: ctx.session.user.id,
          selected: true,
        },
      });
      const currentlySelectedIds = currentlySelected.map((ua) => ua.allyId);
      if (currentlySelectedIds.length >= 4)
        throw new TRPCError({
          message: "Can't set more than 4 allies",
          code: "BAD_REQUEST",
        });
      if (currentlySelectedIds.includes(allyId))
        throw new TRPCError({
          message: "This ally is already set.",
          code: "BAD_REQUEST",
        });

      const allyInInventory = await ctx.db.userAlly.findFirst({
        where: {
          userId: ctx.session.user.id,
          allyId: allyId,
          selected: false,
        },
      });
      if (!allyInInventory)
        throw new TRPCError({
          message: "Ally not in inventory.",
          code: "BAD_REQUEST",
        });

      await ctx.db.userAlly.update({
        where: { userId_allyId: { userId: ctx.session.user.id, allyId } },
        data: { selected: true, position: currentlySelectedIds.length },
      });
    }),
  deselectAlly: protectedProcedure
    .input(z.object({ allyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { allyId } = input;
      const userId = ctx.session.user.id;

      const currentlySelected = await ctx.db.userAlly.findFirst({
        where: {
          userId: ctx.session.user.id,
          allyId,
          selected: true,
        },
      });

      if (!currentlySelected)
        throw new TRPCError({
          message: "This ally is not selected.",
          code: "BAD_REQUEST",
        });

      await ctx.db.$transaction([
        ctx.db.userAlly.update({
          where: { userId_allyId: { userId, allyId } },
          data: { selected: false, position: null },
        }),
        ctx.db.userAlly.updateMany({
          where: {
            userId,
            selected: true,
            position: { gte: currentlySelected.position! },
          },
          data: { position: { decrement: 1 } },
        }),
      ]);
    }),
  /*setAllyAsPortrait: protectedProcedure
    .input(z.object({ allyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      
    }),*/
  /*moveAllyLeft: protectedProcedure
    .input(z.object({ allyId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const allyToMove = await ctx.db.userAlly.findUnique({
        where: { userId_allyId: { userId: ctx.session.user.id, allyId: input.allyId }, selected: true, position: { not: 0}}
      })
      if (!allyToMove)
    }),*/
});
