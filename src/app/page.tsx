import { redirect } from "next/navigation";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import GachaNavbar from "./_components/navbar";
import FrontPageWrapper from "./_components/frontPageWrapper";

export default async function Home() {
  const session = await auth();

  if (!session?.user) return redirect("/api/auth/signin");

  void api.user.getBalance.prefetch();
  void api.fight.getOwn.prefetch();
  void api.map.nextPlayableMap.prefetch({});

  return (
    <HydrateClient>
      <main className="flex h-full flex-col">
        <GachaNavbar selected="frontPage" />
        <div className="flex grow bg-[url(/backgrounds/bg3.png)] bg-cover">
          <FrontPageWrapper username={session.user.name} />
        </div>
      </main>
    </HydrateClient>
  );
}
