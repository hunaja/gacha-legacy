"use client";

import type { AllyRarity } from "@prisma/client";
import Image from "next/image";
import AscensionStars from "./ascensionStars";

import { Patrick_Hand_SC } from "next/font/google";

const font = Patrick_Hand_SC({
  weight: "400",
});

const getRarityText = (rarity: AllyRarity) => {
  switch (rarity) {
    case "COMMON":
      return "C";
    case "RARE":
      return "R";
    default:
      return rarity;
  }
};

export default function AllyCard({
  ally,
  userAlly,
}: {
  ally: {
    bgUrl: string;
    portraitUrl: string;
    rarity: AllyRarity;
    name: string;
  };
  userAlly?: { ascension: number; level: number };
}) {
  return (
    <div
      className={`rounded-2xl p-0.5 shadow-2xl ${font.className} ${userAlly ? "" : "brightness-50"}`}
      style={{
        background: `url(${ally.bgUrl})`,
      }}
    >
      <div className="relative m-2 h-80 w-64 flex-col justify-end text-center">
        <Image
          src={ally.portraitUrl}
          alt={`${ally.name} portrait`}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
        <div className="absolute top-2 left-2 p-2 text-5xl text-zinc-200 italic">
          {getRarityText(ally.rarity)}
        </div>
        {userAlly && (
          <div className="absolute top-2 right-0 p-2 text-zinc-300 italic">
            <AscensionStars f={userAlly} />
          </div>
        )}
        <div className="absolute right-2 bottom-2 p-2 text-5xl text-zinc-200 italic">
          Lv. {userAlly?.level ?? 1}
        </div>
      </div>
    </div>
  );
}
