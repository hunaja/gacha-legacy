"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure,
} from "@heroui/react";
import StageModalBody from "./stageModalBody";
import { cn } from "~/lib/utils";

export default function StageButton({
  s,
  recordLevel,
  map,
  imageBox,
}: {
  s: {
    mapLevel: number;
    name: string;
    xPercent: number;
    yPercent: number;
    id: string;
    boss: boolean;
  };
  map: { name: string };
  recordLevel: number;
  imageBox: DOMRect;
}) {
  const {
    isOpen: isModalOpen,
    onOpen: onModalOpen,
    onOpenChange: onModalOpenChange,
  } = useDisclosure();

  const getStatus = ():
    | "doneOpen"
    | "open"
    | "closed"
    | "bossOpen"
    | "bossClosed" => {
    if (s.mapLevel == recordLevel + 1) return s.boss ? "bossOpen" : "open";
    if (s.mapLevel > recordLevel) return s.boss ? "bossClosed" : "closed";
    return "doneOpen";
  };
  const status = getStatus();

  // Convert % coordinates to pixel positions inside imageBox
  const left = imageBox.left + (s.xPercent / 100) * imageBox.width;
  const top = imageBox.top + (s.yPercent / 100) * imageBox.height;

  return (
    <>
      <button
        onClick={onModalOpen}
        className={cn(
          "absolute z-20 rounded bg-cover px-5 py-3 text-white shadow-lg",
          {
            "bg-[url(/buttons/stageButton.png)]":
              status === "doneOpen" || status === "open",
            "bg-[url(/buttons/stageButtonLocked.png)]":
              status === "closed" || status === "bossClosed",
            "cursor-pointer": status === "bossOpen" || status === "open",
            "opacity-60": status === "doneOpen",
          },
        )}
        style={{
          left,
          top,
          transform: "translate(-50%, -50%)",
        }}
        disabled={status !== "open" && status !== "bossOpen"}
      >
        {s.name}
      </button>

      <Modal isOpen={isModalOpen} onOpenChange={onModalOpenChange} size="xl">
        <ModalContent>
          {() => (
            <>
              <ModalHeader className="flex flex-col place-items-center gap-1 text-xl">
                Map {map.name}: Stage {s.name}
              </ModalHeader>
              <ModalBody>
                <StageModalBody stageId={s.id} />
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
