"use client";

import { Avatar, Input, Link, Progress, ScrollShadow } from "@heroui/react";
import { Patrick_Hand_SC } from "next/font/google";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { xpToNext } from "~/lib/leveling";

const font = Patrick_Hand_SC({
  weight: "400",
});

export default function FrontPageWrapper({
  username,
}: {
  username?: string | null;
}) {
  const [balance] = api.user.getBalance.useSuspenseQuery();
  const [playableCampaignMap] = api.map.nextPlayableMap.useSuspenseQuery({});
  const router = useRouter();

  const xpRequired = xpToNext(balance.level);

  return (
    <div className="flex grow">
      <div className="flex w-96 flex-col">
        <div className="mx-5 mt-5 flex grow flex-col">
          <h2 className="mb-2 text-center text-3xl">Hi {username}!</h2>
          <div className="flex items-center gap-2">
            <Avatar src={balance.posterAlly?.portraitUrl} size="lg" />
            <Progress
              color="default"
              showValueLabel={true}
              label={
                <div className="text-lg text-black">
                  Player Level {balance.level}
                </div>
              }
              valueLabel={
                <div className="text-lg text-gray-600">
                  {Math.min(balance.xp, xpRequired)}/{xpRequired} XP
                </div>
              }
              maxValue={10}
              className=""
              value={balance.xp}
            />
          </div>
          <div className="mt-2 mr-0 ml-auto flex gap-2">
            <button
              className={`text-shadow-lg ${font.className} block bg-[url(/buttons/1Button.png)] bg-contain bg-center bg-no-repeat px-5 py-3 text-lg font-bold text-gray-200 transition-transform hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
              onClick={() => router.push("/api/auth/signout")}
            >
              Sign Out
            </button>
            <button
              disabled={balance.level === 60 || balance.xp < xpRequired}
              className={`text-shadow-lg ${font.className} block bg-[url(/buttons/2Button.png)] bg-contain bg-center bg-no-repeat px-5 py-3 text-lg font-bold text-gray-200 transition-transform hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Level Up
            </button>
          </div>
        </div>
        <div className="grow text-center italic">
          <b>{balance.posterAlly?.name}</b>
          <br />
          {balance.posterAlly?.description}
        </div>
      </div>
      <div
        className="grow place-content-end"
        style={{
          background: balance.posterAlly
            ? `url(${balance.posterAlly.spriteUrl}) no-repeat center center fixed`
            : "",
          backgroundSize: "contain",
        }}
      >
        <div className="mb-5 flex place-content-center items-center">
          <button
            disabled={true}
            className={`${font.className} block bg-[url(/buttons/1Button.png)] bg-contain bg-center bg-no-repeat px-10 py-6 text-3xl font-bold text-gray-200 transition-transform hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Play Event
          </button>
          <button
            onClick={() =>
              router.push("/map/" + playableCampaignMap?.id ?? "paska")
            }
            className={`${font.className} block bg-[url(/buttons/Button.png)] bg-contain bg-center bg-no-repeat px-10 py-6 text-3xl font-bold text-gray-200 transition-transform hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Play Campaign
          </button>
        </div>
      </div>
      <div className="flex w-96 flex-col justify-between">
        <div className="my-5 flex grow flex-col place-content-center">
          <h2 className="mb-5 text-center text-2xl">Global Chat</h2>
          <ScrollShadow className="h-[220px] w-full" size={50}>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris
              pellentesque gravida tincidunt.
              <br />
              Curabitur vulputate felis a elit iaculis, vitae tincidunt eros
              euismod.
              <br />
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris
              pellentesque gravida tincidunt.
              <br />
              Curabitur vulputate felis a elit iaculis, vitae tincidunt eros
              euismod.
              <br />
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris
              pellentesque gravida tincidunt.
              <br />
              Curabitur vulputate felis a elit iaculis, vitae tincidunt eros
              euismod.
              <br />
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris
              pellentesque gravida tincidunt.
              <br />
              Curabitur vulputate felis a elit iaculis, vitae tincidunt eros
              euismod.
            </p>
          </ScrollShadow>

          <div className="mx-2 mt-4">
            <Input label="Click Enter To Send" />
          </div>
        </div>
        <div className="">
          <Link href="/heroines">
            <div className={`relative h-[100px] w-full ${font.className}`}>
              <Image
                src="/banners/premiumBanner.png"
                alt="Allies Banner"
                width={500}
                height={60}
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-bold text-white drop-shadow-2xl">
                  Heroines
                </span>
              </div>
            </div>
          </Link>
          <Link href="/shop">
            <div className={`relative h-[100px] w-full ${font.className}`}>
              <Image
                src="/banners/basicErBanner.png"
                alt="Enemies Banner"
                width={500}
                height={60}
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-bold text-white drop-shadow-2xl">
                  Shop
                </span>
              </div>
            </div>
          </Link>

          <Link href="/roll">
            <div className={`relative h-[100px] w-full ${font.className} mb-2`}>
              <Image
                src="/banners/basicBanner.png"
                alt="Allies Banner"
                width={500}
                height={60}
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl font-bold text-white drop-shadow-2xl">
                  Roll a Gacha
                </span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
