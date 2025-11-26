import { FightView } from "~/app/_components/fightView";
import GachaNavbar from "~/app/_components/navbar";
import { api, HydrateClient } from "~/trpc/server";

export default async function FightPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  void api.fight.getState({ fightId: id });

  return (
    <HydrateClient>
      <main className="flex h-full flex-col">
        <GachaNavbar />
        <div className="flex grow bg-gray-300">
          <FightView fightId={id} />
        </div>
      </main>
    </HydrateClient>
  );
}
