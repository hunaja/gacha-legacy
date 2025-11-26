"use client";

import { useState } from "react";
import { Button, Chip, Switch } from "@heroui/react";
import { api } from "~/trpc/react";
import AllyCard from "./allyCard";
import { Patrick_Hand_SC } from "next/font/google";
import AllyCardModal from "./allyCardModal";

const font = Patrick_Hand_SC({
  weight: "400",
});

const rarityOrder: Record<string, number> = {
  COMMON: 1,
  RARE: 2,
  SR: 3,
  SSR: 4,
  SSSR: 5,
};

export default function AlliesList() {
  const [userAllies] = api.user.getAllies.useSuspenseQuery();
  const [allAllies] = api.ally.list.useSuspenseQuery();

  const [showOwnedOnly, setShowOwnedOnly] = useState(false);

  const ownedIds = new Set(userAllies.map((ua) => ua.allyId));

  const sortedAllies = (allAllies ?? []).sort(
    (a, b) => rarityOrder[b.rarity]! - rarityOrder[a.rarity]!,
  );

  const lineup = userAllies
    .filter((ua) => ua.selected)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  return (
    <div className="bg-[url(/backgrounds/teamBuilder.png)] bg-cover bg-repeat p-5">
      <h3 className="my-5 text-center text-3xl text-shadow-lg">
        Your Heroine Lineup
      </h3>

      <div className="mx-auto w-5/6">
        {/* LINEUP GRID */}
        <div className="grid grid-cols-4 place-items-center gap-3">
          {lineup.map((ua) => {
            const ownedAlly = allAllies.find((a) => a.id === ua.allyId)!;
            return <AllyCard ally={ownedAlly} key={ua.allyId} userAlly={ua} />;
          })}
          {lineup.length < 4 &&
            [...Array(4 - lineup.length).keys()].map((i) => (
              <div
                key={i}
                className={`m-2 flex aspect-[4/5] w-full flex-col place-content-center rounded-2xl border-5 border-gray-500 bg-gray-200 text-center text-4xl text-gray-500 shadow-2xl brightness-50 ${font.className}`}
              >
                <p className="m-2">
                  Not <br /> Selected
                </p>
              </div>
            ))}
        </div>
      </div>

      <div className="mx-auto w-5/6">
        <div className="flex justify-between">
          <h3 className="my-5 text-center text-2xl text-shadow-lg">
            All Heroine Souls
          </h3>

          <Switch
            isSelected={showOwnedOnly}
            size="lg"
            onValueChange={setShowOwnedOnly}
            className="text-shadow-lg"
          >
            Only Owned
          </Switch>
        </div>

        {/* ALL HEROINE GRID */}
        <div className="grid grid-cols-4 place-items-center gap-3">
          {sortedAllies
            .filter((f) => !showOwnedOnly || ownedIds.has(f.id))
            .map((f) => {
              const isOwned = ownedIds.has(f.id);

              if (isOwned) {
                const ownedAlly = userAllies.find((a) => a.allyId == f.id)!;
                return (
                  <div className="w-full" key={f.id}>
                    <AllyCardModal
                      ally={f}
                      userAlly={ownedAlly}
                      lineup={lineup}
                    />
                  </div>
                );
              }

              return (
                <div className="w-full" key={f.id}>
                  <AllyCardModal ally={f} lineup={lineup} />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}
