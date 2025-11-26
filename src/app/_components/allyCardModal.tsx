"use client";

import {
  addToast,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Progress,
  useDisclosure,
} from "@heroui/react";
import type { ActiveSpell, Ally, UserAlly } from "@prisma/client";
import AllyCard from "./allyCard";
import Image from "next/image";
import { calculateAllyStat } from "~/lib/leveling";
import { Patrick_Hand_SC } from "next/font/google";
import { api } from "~/trpc/react";

const font = Patrick_Hand_SC({
  weight: "400",
});

export default function AllyCardModal({
  ally,
  userAlly,
  lineup,
}: {
  ally: Ally & {
    portraitUrl: string;
    bgUrl: string;
    spriteUrl: string;
    activeSpell: ActiveSpell | null;
  };
  userAlly?: {
    level: number;
    ascension: number;
    tokens: number;
    xp: number;
  };
  lineup: UserAlly[];
}) {
  const [balance] = api.user.getBalance.useSuspenseQuery();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const utils = api.useUtils();
  const selectAlly = api.user.selectAlly.useMutation({
    async onSuccess() {
      await utils.user.invalidate();
      addToast({
        title: "Lineup Updated",
        description: `Added ${ally.name} to lineup!`,
      });
    },
  });
  const deselectAlly = api.user.deselectAlly.useMutation({
    async onSuccess() {
      await utils.user.invalidate();
      addToast({
        title: "Lineup Updated",
        description: `Removed ${ally.name} from lineup!`,
      });
    },
  });
  const setPosterAlly = api.user.setPosterAlly.useMutation({
    async onSuccess() {
      await utils.user.invalidate();
      addToast({
        title: "Poster Ally Set",
        description: `Set poster ally to ${ally.name}.`,
      });
    },
  });

  const inLineup = lineup.find((ua) => ua.allyId === ally.id);

  return (
    <>
      <button onClick={onOpen} className="cursor-pointer">
        <AllyCard ally={ally} userAlly={userAlly} />
      </button>
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          <ModalHeader className="place-content-center">
            <h3 className="text-2xl">{ally.name}</h3>
          </ModalHeader>
          <ModalBody className="flex flex-row p-0">
            <div
              className="flex items-center px-5 py-12"
              style={{
                background: `url(${ally.bgUrl})`,
              }}
            >
              <Image
                alt={`Sprite of ${ally.name}`}
                width={400}
                height={400}
                src={ally.spriteUrl}
              />
            </div>
            <div className="flex grow flex-col place-content-between">
              <div>
                <p className="mb-5">{ally.description}</p>
                <div className="mb-5 place-content-center uppercase">
                  <div className="">
                    <b className="mr-2 text-sm font-semibold">Class</b>
                    {ally.class}
                  </div>
                  <div className="">
                    <b className="mr-2 text-sm font-semibold">Health Points</b>
                    {calculateAllyStat(
                      ally.hp,
                      userAlly?.level ?? 1,
                      userAlly?.ascension ?? 1,
                    )}
                  </div>
                  <div className="mr-5">
                    <b className="mr-2 text-sm font-semibold">Defense</b>
                    {calculateAllyStat(
                      ally.def,
                      userAlly?.level ?? 1,
                      userAlly?.ascension ?? 1,
                    )}
                    <b className="mx-2 text-sm font-semibold">
                      Magical Defense
                    </b>
                    {calculateAllyStat(
                      ally.mDef,
                      userAlly?.level ?? 1,
                      userAlly?.ascension ?? 1,
                    )}
                  </div>
                  <div className="">
                    <b className="mr-2 text-sm font-semibold">Attack</b>
                    {calculateAllyStat(
                      ally.atk,
                      userAlly?.level ?? 1,
                      userAlly?.ascension ?? 1,
                    )}
                    <b className="mx-2 text-sm font-semibold">Magical Attack</b>
                    {calculateAllyStat(
                      ally.mAtk,
                      userAlly?.level ?? 1,
                      userAlly?.ascension ?? 1,
                    )}
                  </div>
                  <div className="">
                    <b className="mr-2 text-sm font-semibold">Critical</b>
                    {"+" +
                      calculateAllyStat(
                        ally.critAtk,
                        userAlly?.level ?? 1,
                        userAlly?.ascension ?? 1,
                      ) +
                      "%"}
                    <span className="ml-2 text-sm">
                      with{" "}
                      <span className="text-base">
                        {calculateAllyStat(
                          ally.critChance,
                          userAlly?.level ?? 1,
                          userAlly?.ascension ?? 1,
                        )}
                        %
                      </span>{" "}
                      chance
                    </span>
                  </div>
                </div>
              </div>

              {ally.activeSpell && (
                <div className="mr-5 mb-5">
                  <b className="text-sm font-semibold uppercase">
                    {ally.activeSpell.name}
                  </b>{" "}
                  {ally.activeSpell.description}
                </div>
              )}

              <div className="mx-auto mb-5 flex place-content-between">
                <button
                  disabled={
                    !userAlly ||
                    lineup.length > 4 ||
                    selectAlly.isPending ||
                    deselectAlly.isPending
                  }
                  className={`mr-5 text-shadow-lg ${font.className} ${inLineup ? "text-sm" : "text-lg"} block bg-[url(/buttons/3Button.png)] bg-contain bg-center bg-no-repeat px-5 py-3 text-lg font-bold text-gray-200 transition-transform hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
                  onClick={() =>
                    userAlly && inLineup
                      ? deselectAlly.mutate({ allyId: ally.id })
                      : selectAlly.mutate({ allyId: ally.id })
                  }
                >
                  {inLineup ? "Remove From Lineup" : "Add To Lineup"}
                </button>
                {ally.settableAsPortrait && (
                  <button
                    disabled={!userAlly || balance.posterAllyId === ally.id}
                    onClick={() =>
                      userAlly && setPosterAlly.mutate({ allyId: ally.id })
                    }
                    className={`text-shadow-lg ${font.className} block bg-[url(/buttons/3Button.png)] bg-contain bg-center bg-no-repeat px-5 py-3 text-lg font-bold text-gray-200 transition-transform hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Set As Portrait
                  </button>
                )}
              </div>

              <div
                className={`my-5 text-center ${!userAlly ? "opacity-50" : ""}`}
              >
                <div className="mr-5 mb-5">
                  <Progress
                    color="default"
                    label={`Level ${userAlly?.ascension ?? 1}`}
                    showValueLabel={true}
                    valueLabel={
                      <span className="text-gray-600">
                        {userAlly?.xp ?? 0}/10 XP
                      </span>
                    }
                    maxValue={10}
                    className=""
                    value={userAlly?.xp ?? 0}
                  />
                  <button
                    disabled={(userAlly?.tokens ?? 0) < 10}
                    className={`text-shadow-lg ${font.className} mt-2 mr-0 ml-auto block bg-[url(/buttons/2Button.png)] bg-contain bg-center bg-no-repeat px-5 py-3 text-lg font-bold text-gray-200 transition-transform hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Level Up
                  </button>
                </div>
                <div className="mr-5">
                  <Progress
                    color="default"
                    label={`Ascension ${userAlly?.ascension ?? 0}`}
                    showValueLabel={true}
                    valueLabel={
                      <span className="text-gray-600">
                        {userAlly?.tokens ?? 0}/10 tokens
                      </span>
                    }
                    maxValue={10}
                    className=""
                    value={userAlly?.tokens ?? 0}
                  />
                  <button
                    disabled={(userAlly?.tokens ?? 0) < 10}
                    className={`${font.className} mt-2 mr-0 ml-auto block bg-[url(/buttons/Button.png)] bg-contain bg-center bg-no-repeat px-5 py-3 text-lg font-bold text-gray-200 transition-transform text-shadow-lg hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    Ascend
                  </button>
                </div>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
