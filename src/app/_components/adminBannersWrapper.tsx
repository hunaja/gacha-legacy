"use client";

import { api } from "~/trpc/react";
import CreateBanner from "./createBanner";
import { Accordion, AccordionItem } from "@heroui/react";
import AdminBannerInfo from "./adminBannerInfo";

export default function AdminBannersWrapper() {
  const [banners] = api.banner.list.useSuspenseQuery({
    ignoreActiveFlag: true,
  });

  return (
    <>
      <h3 className="mb-2 text-xl font-semibold">Banners List</h3>
      {banners.length > 0 && (
        <Accordion variant="bordered" className="mt-10">
          {banners.map((m) => (
            <AccordionItem
              key={m.id}
              title={m.name}
              subtitle={m.active ? "Active" : "Not Active"}
              className="my-2"
            >
              <AdminBannerInfo bannerId={m.id} />
            </AccordionItem>
          ))}
        </Accordion>
      )}
      {banners.length === 0 && <p className="mb-2">No banners yet.</p>}

      <CreateBanner />
    </>
  );
}
