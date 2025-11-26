import { redirect } from "next/navigation";
import { db } from "~/server/db";

export default async function GachRollRedirect() {
  const banner = await db.banner.findFirst({
    where: { active: true },
    orderBy: { createdAt: "asc" },
  });
  const firstBannerId = banner?.id;
  if (!firstBannerId) return <p>No banners yet</p>;

  return redirect(`/roll/${firstBannerId}`);
}
