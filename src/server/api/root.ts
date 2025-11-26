import { fightsRouter } from "~/server/api/routers/fight";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { usersRouter } from "./routers/user";
import { mapsRouter } from "./routers/map";
import { enemiesRouter } from "./routers/enemy";
import { stagesRouter } from "./routers/stage";
import { allyRouter } from "./routers/ally";
import { bannerRouter } from "./routers/banner";
import { spellsRouter } from "./routers/spell";
import { allyBackgroundsRouter } from "./routers/allyBackgrounds";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  fight: fightsRouter,
  user: usersRouter,
  map: mapsRouter,
  enemy: enemiesRouter,
  stage: stagesRouter,
  ally: allyRouter,
  banner: bannerRouter,
  spell: spellsRouter,
  allyBackgrounds: allyBackgroundsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
