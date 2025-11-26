"use client";

import CreateStage from "./createStage";
import CheatGiveAlly from "./cheatGiveAlly";
import CheatGiveBalance from "./cheatGiveBalance";
import { Listbox, ListboxItem } from "@heroui/react";
import { useMemo, useState } from "react";
import AdminMapsWrapper from "./adminMapsWrapper";
import AdminAlliesWrapper from "./adminAlliesWrapper";
import AdminSpellsWrapper from "./adminSpellsWrapper";
import AdminEnemiesWrapper from "./adminEnemiesWrapper";
import AdminBannersWrapper from "./adminBannersWrapper";
import AdminBackgroundsWrapper from "./adminBackgroundsWrapper";

export default function AdminWrapper() {
  const [selectedKeys, setSelectedKeys] = useState(new Set(["maps"]));
  const selectedValue = useMemo(
    () => Array.from(selectedKeys).join(", "),
    [selectedKeys],
  );

  return (
    <>
      <div className="border-l-solid w-96 border-l-2 border-l-gray-200 p-2">
        <Listbox
          disallowEmptySelection
          selectedKeys={selectedKeys}
          topContent={<p className="mb-2 text-center text-lg">Admin Menu</p>}
          selectionMode="single"
          variant="flat" // @ts-expect-error HeroUI tweaking
          onSelectionChange={setSelectedKeys}
        >
          <ListboxItem key="maps">Maps</ListboxItem>
          <ListboxItem key="stages">Stages</ListboxItem>
          <ListboxItem key="allies">Allies</ListboxItem>
          <ListboxItem key="allyBackgrounds">Ally Backgrounds</ListboxItem>
          <ListboxItem key="banners">Banners</ListboxItem>
          <ListboxItem key="enemies">Enemies</ListboxItem>
          <ListboxItem key="spells">Spells</ListboxItem>
          <ListboxItem key="cheats">Cheats</ListboxItem>
        </Listbox>
      </div>
      <div className="grow">
        {selectedValue === "maps" && <AdminMapsWrapper />}
        {selectedValue === "allies" && <AdminAlliesWrapper />}
        {selectedValue === "enemies" && <AdminEnemiesWrapper />}
        {selectedValue === "stages" && <CreateStage />}
        {selectedValue === "cheats" && (
          <>
            <CheatGiveBalance />
            <CheatGiveAlly />
          </>
        )}
        {selectedValue === "spells" && <AdminSpellsWrapper />}

        {selectedValue === "banners" && <AdminBannersWrapper />}

        {selectedValue === "allyBackgrounds" && <AdminBackgroundsWrapper />}
      </div>
    </>
  );
}
