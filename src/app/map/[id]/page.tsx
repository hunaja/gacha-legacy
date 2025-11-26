import { api, HydrateClient } from "~/trpc/server";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

import GachaNavbar from "../../_components/navbar";
import StageMap from "../../_components/stageMap";

export default async function MapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user) return redirect("/");

  void Promise.all([
    api.user.getBalance.prefetch(),
    api.map.getMap({ mapId: id }),
    api.map.listForEvent.prefetch({}),
    api.map.nextPlayableMap.prefetch({}),
  ]);

  return (
    <HydrateClient>
      <main className="flex h-screen flex-col overflow-hidden">
        <GachaNavbar selected="frontPage" />
        <div className="flex grow overflow-hidden bg-[url(/backgrounds/bg2.png)] bg-cover">
          <StageMap mapId={id} />
        </div>
      </main>
    </HydrateClient>
  );
}
