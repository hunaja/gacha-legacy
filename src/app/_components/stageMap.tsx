"use client";

import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { api } from "~/trpc/react";
import StageButton from "./stageButton";
import Link from "next/link";
import { Patrick_Hand_SC } from "next/font/google";
import { Chip } from "@heroui/react";

const font = Patrick_Hand_SC({ weight: "400" });

const getMapStatus = (nextPlayableMap: number, mapLevel: number) => {
  if (nextPlayableMap < mapLevel) return "Locked";
  else if (nextPlayableMap === mapLevel) return "In Progress";
  else return "Cleared";
};

export default function StageMap({ mapId }: { mapId: string }) {
  const [map] = api.map.getMap.useSuspenseQuery({ mapId });
  const [mapList] = api.map.listForEvent.useSuspenseQuery({});
  const [nextPlayableMap] = api.map.nextPlayableMap.useSuspenseQuery({});
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imageBox, setImageBox] = useState<DOMRect | null>(null);

  // Watch for image resize to recalc visible area
  useEffect(() => {
    const updateBox = () => {
      if (imgRef.current) {
        setImageBox(imgRef.current.getBoundingClientRect());
      }
    };
    updateBox();
    window.addEventListener("resize", updateBox);
    return () => window.removeEventListener("resize", updateBox);
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar */}
      <div className="flex h-full w-96 shrink-0 flex-col justify-between">
        <div className="my-5">
          <h2 className="mb-1 text-center text-3xl">{map.name}</h2>
          <h3 className="mb-2 text-center text-sm uppercase">Campaign</h3>
          <ul className="mx-5">
            {mapList.map((m) => {
              const mapStatus = getMapStatus(
                nextPlayableMap?.level ?? 100,
                m.level,
              );
              const clickable =
                mapStatus === "In Progress" || mapStatus === "Cleared";

              return (
                <li key={m.id} className="mb-2">
                  {clickable ? (
                    <Link href={`/map/${m.id}`}>
                      <div className="flex items-center">
                        <Chip
                          size="md"
                          color={clickable ? "primary" : "default"}
                        >
                          {m.level}
                        </Chip>
                        <div className="ml-2">
                          <strong className="font-semibold">{m.name}</strong>
                          <br />
                          <span className="text-sm uppercase">{mapStatus}</span>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex items-center hover:cursor-not-allowed">
                      <Chip size="md">{m.level}</Chip>
                      <div className="ml-2">
                        <strong className="font-semibold text-gray-700">
                          {m.name}
                        </strong>
                        <br />
                        <span className="text-sm text-gray-600 uppercase">
                          {mapStatus}
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <button
            className={`mx-auto mb-5 ${font.className} block bg-[url(/buttons/2Button.png)] bg-contain bg-center bg-no-repeat px-10 py-6 text-4xl font-bold text-gray-200 transition-transform hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Achievements
          </button>

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
        </div>
      </div>

      {/* Map area */}
      <div className="relative h-full flex-grow overflow-hidden bg-black/50">
        <div className="relative flex h-full w-full items-center justify-center">
          {/* The map image */}
          <Image
            ref={imgRef}
            src={map.bgUrl}
            alt={`Map of ${map.name}`}
            fill
            className="object-contain"
            priority
          />

          {/* Stage buttons positioned relative to the image visible area */}
          {imageBox &&
            map.stages.map((s) => (
              <StageButton
                key={s.id}
                s={s}
                recordLevel={map.recordLevel}
                map={map}
                imageBox={imageBox}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
