import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";
import GachaNavbar from "../_components/navbar";

export default async function GachasPage() {
  const session = await auth();

  if (!session?.user) return redirect("/");

  void Promise.all([api.user.getBalance.prefetch()]);

  return (
    <HydrateClient>
      <GachaNavbar selected="enemies" />
      <p>TBI</p>
    </HydrateClient>
  );
}
