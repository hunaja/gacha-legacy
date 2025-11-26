import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getAllyBackgroundUploadUrl, getPublicUrl } from "../../minio";

export const allyBackgroundsRouter = createTRPCRouter({
  createUploadUrl: protectedProcedure.mutation(async ({ ctx }) => {
    const allyBackground = await ctx.db.allyBackground.create({
      data: {},
    });

    const { uploadUrl, publicUrl } = await getAllyBackgroundUploadUrl(
      allyBackground.id,
    );

    return {
      uploadUrl,
      publicUrl,
      allyBackground: { id: allyBackground.id },
    };
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    const maps = await ctx.db.allyBackground.findMany({});

    return maps.map((m) => ({
      ...m,
      bgUrl: getPublicUrl(`allyBackgrounds/${m.id}.png`),
    }));
  }),
});
