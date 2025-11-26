import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import GachaNavbar from "../../_components/navbar";
import GachaRoll from "../../_components/gachaRoll";

export default async function RollPage({
  params,
}: {
  params: Promise<{ bannerId: string }>;
}) {
  const { bannerId } = await params;
  const session = await auth();

  if (!session?.user) return redirect("/");

  void Promise.all([
    api.banner.list.prefetch(),
    api.banner.get.prefetch({ bannerId }),
    api.user.getBalance.prefetch(),
  ]);

  return (
    <HydrateClient>
      <main className="flex h-full flex-col">
        <GachaNavbar
          username={session.user.name ?? undefined}
          selected="roll"
        />
        <div className="flex grow flex-col">
          <GachaRoll bannerId={bannerId} />
        </div>
      </main>
    </HydrateClient>
  );
}
