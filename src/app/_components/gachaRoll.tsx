"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Progress,
  Tooltip,
  useDisclosure,
} from "@heroui/react";
import type { Ally } from "@prisma/client";
import { useState, useRef, useEffect } from "react";
import { api } from "~/trpc/react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import AscensionStars from "./ascensionStars";

type AllyWithSprite = Ally & { spriteUrl: string };

export default function GachaRoll({ bannerId }: { bannerId: string }) {
  const [banner] = api.banner.get.useSuspenseQuery({ bannerId });
  const [banners] = api.banner.list.useSuspenseQuery();

  const [rewards, setRewards] = useState<AllyWithSprite[] | null>(null);
  const [videoStopped, setVideoStopped] = useState(false);
  const [animationsDone, setAnimationsDone] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [balance] = api.user.getBalance.useSuspenseQuery();
  const utils = api.useUtils();

  const roll = api.ally.roll.useMutation({
    async onSuccess(data) {
      await utils.user.invalidate();
      setRewards(data);
      setVideoStopped(false);
      setAnimationsDone(false); // reset for next roll
    },
  });

  useEffect(() => {
    if (rewards && videoRef.current) {
      void videoRef.current.play();
    }
  }, [rewards]);

  if (!banner) return <p>This banner was not found.</p>;

  const allAllies = banner.allies.map((ba) => ba.ally);
  const posterAlly = allAllies.find((a) => a.id === banner.posterAllyId)!;
  const otherPullable = allAllies
    .filter((a) => a.id !== posterAlly.id)
    .slice(0, 4);

  return (
    <div
      className={`relative flex w-screen grow ${rewards ? "items-center justify-center" : ""} overflow-hidden bg-[url(/backgrounds/bg1.png)] bg-cover`}
    >
      {/* Fullscreen background video */}
      {rewards && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="auto"
          onEnded={() => setVideoStopped(true)}
          style={{ objectFit: "cover" }}
        >
          <source src="/gachaPull.mp4" type="video/mp4" />
        </video>
      )}

      {/* Overlay */}
      <div
        className={`relative z-10 flex ${rewards ? "flex-col" : "w-screen flex-row"}`}
      >
        {!rewards && (
          <>
            <div className="w-96">
              {banners.map((b) =>
                bannerId !== b.id ? (
                  <Link href={`/roll/${b.id}`} key={b.id}>
                    <Image
                      src={b.bgUrl}
                      width={500}
                      height={60}
                      key={b.id}
                      alt={`Banner for ${b.name}`}
                      className={"brightness-50"}
                    />
                  </Link>
                ) : (
                  <Image
                    src={b.bgUrl}
                    width={500}
                    height={60}
                    key={b.id}
                    alt={`Banner for ${b.name}`}
                  />
                ),
              )}
            </div>
            <div className="flex grow">
              <div
                className="flex grow flex-col items-center justify-end p-10"
                style={{
                  background: `url(${posterAlly.portraitUrl})`,
                  backgroundSize: "cover",
                }}
              >
                <div>
                  <Button size="lg" color="primary" onPress={onOpen}>
                    Roll a Gacha
                  </Button>
                  <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
                    <ModalContent>
                      {(closeModal) => (
                        <>
                          <ModalHeader className="flex flex-col gap-1">
                            Roll a Gacha
                          </ModalHeader>
                          <ModalBody>
                            <p className="text-center">
                              Rolling a gacha from the <b>{banner.name}</b>{" "}
                              pool.
                            </p>
                            <div className="my-5 flex justify-between">
                              {banner.acceptedPayments.map((a) => (
                                <Button
                                  color="primary"
                                  className="mx-2 flex flex-1"
                                  isDisabled={
                                    a.currency === "DIAMONDS"
                                      ? balance.diamonds < a.amount
                                      : balance.gold < a.amount
                                  }
                                  key={a.id}
                                  onPress={() => {
                                    closeModal();
                                    roll.mutate({
                                      bannerId,
                                      paymentMethod: a.currency,
                                    });
                                  }}
                                >
                                  <span className="flex-1">Roll</span>
                                  <div className="flex place-items-center">
                                    <Image
                                      src={
                                        a.currency === "DIAMONDS"
                                          ? "/diamondCropped.png"
                                          : "/goldCropped.png"
                                      }
                                      alt={
                                        a.currency === "DIAMONDS"
                                          ? "Diamonds"
                                          : "Gold"
                                      }
                                      height={25}
                                      className="mr-2"
                                      width={25}
                                    />
                                    {a.amount}
                                  </div>
                                </Button>
                              ))}
                            </div>
                          </ModalBody>
                        </>
                      )}
                    </ModalContent>
                  </Modal>

                  <Button size="lg" color="primary" className="ml-5" isDisabled>
                    Roll 10 Gachas
                  </Button>
                </div>
              </div>
              <div className="flex flex-col p-5">
                <div className="flex grow flex-col place-content-between">
                  <div className="">
                    <Image
                      src={posterAlly.spriteUrl}
                      height={150}
                      width={150}
                      alt="SSR Gacha spriteUrl"
                      className="mx-auto"
                    />
                    <h3 className="mb-2 text-center text-xl">
                      {posterAlly.name}
                    </h3>
                    <div className="mb-2 flex place-content-center">
                      <AscensionStars f={posterAlly} />
                    </div>
                    <p className="mb-2 text-center">
                      HP {posterAlly.hp} ATK {posterAlly.atk}
                    </p>
                    <p>Lorem impsum... loredumppia</p>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg">Other Pullable Gachas</h3>
                    <div className="flex">
                      {otherPullable.map((a) => (
                        <Tooltip key={a.id} content={a.name} placement="bottom">
                          <Image
                            src={a.spriteUrl}
                            width={100}
                            key={a.id}
                            height={100}
                            alt={`Sprite of ${a.name}`}
                          />
                        </Tooltip>
                      ))}
                    </div>
                    <Button className="mt-5">View All</Button>
                    <div className="my-5">
                      <h3 className="text-lg">Pity Tracker</h3>
                      <Progress
                        color="default"
                        label={`${banner.pity}/70`}
                        maxValue={70}
                        className=""
                        value={banner.pity}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Show rewards after video stops */}
        {rewards && videoStopped && (
          <div className="text-center">
            <ul className="">
              <AnimatePresence>
                {rewards.map((r, i) => {
                  const isLast = i === rewards.length - 1;
                  return (
                    <motion.li
                      key={r.id}
                      initial={{ opacity: 0, scale: 0.8, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        delay: i * 0.2,
                        type: "spring",
                        stiffness: 120,
                      }}
                      onAnimationComplete={() => {
                        if (isLast) {
                          setAnimationsDone(true);
                        }
                      }}
                      className="relative h-96 w-64 flex-col justify-end rounded-4xl text-center shadow-2xl"
                    >
                      <Image
                        src={r.spriteUrl}
                        alt={`${r.name} sprite`}
                        fill
                        className="rounded object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <div className="absolute right-0 bottom-2 left-0 p-2 font-bold text-zinc-300">
                        {r.name} <br />{" "}
                        <span className="text-sm font-normal">
                          {r.rarity}
                          <br />
                          <span className="mt-2">
                            HP {r.hp} ATK {r.atk}
                          </span>
                        </span>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>

            {/* Collect button appears only after last animation completes */}
            {animationsDone && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-4"
              >
                <Button
                  color="primary"
                  size="lg"
                  onPress={() => setRewards(null)}
                >
                  Collect
                </Button>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
