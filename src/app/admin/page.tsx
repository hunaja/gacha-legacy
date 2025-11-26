import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import AdminWrapper from "../_components/adminWrapper";
import GachaNavbar from "../_components/navbar";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user) return redirect("/");

  void Promise.all([
    api.enemy.list.prefetch(),
    api.ally.list.prefetch(),
    api.map.list.prefetch(),
    api.user.getBalance.prefetch(),
    api.spell.getCreatableActiveSpells.prefetch(),
    api.spell.list.prefetch(),
    api.banner.list.prefetch({ ignoreActiveFlag: true }),
    api.allyBackgrounds.list.prefetch(),
  ]);

  return (
    <HydrateClient>
      <main className="flex h-full flex-col">
        <GachaNavbar selected="admin" />
        <div className="flex grow">
          <AdminWrapper />
        </div>
      </main>
    </HydrateClient>
  );
}
