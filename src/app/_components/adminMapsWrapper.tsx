"use client";

import { api } from "~/trpc/react";
import CreateMap from "./createMap";
import Image from "next/image";

export default function AdminMapsWrapper() {
  const [maps] = api.map.list.useSuspenseQuery();

  const campaignMaps = maps.filter((m) => m.campaign);
  const eventMaps = maps.filter((m) => !m.campaign);

  return (
    <>
      {maps.length > 0 && (
        <ul className="list-disc p-5">
          {campaignMaps.length > 0 && (
            <>
              <h3 className="mb-2 text-xl font-semibold">Campaign Maps</h3>
              {campaignMaps.map((m) => (
                <li key={m.id} className="my-2 flex items-center">
                  <span>{m.level}.</span>
                  <Image
                    src={m.bgUrl}
                    width={100}
                    height={100}
                    alt={`Map of ${m.name}`}
                    className="ml-2"
                  />
                  <Image
                    src={m.battleBgUrl}
                    width={100}
                    height={100}
                    alt={`Battle Bg of ${m.name}`}
                    className="ml-2"
                  />
                  <span className="ml-2">{m.name}</span>
                </li>
              ))}
            </>
          )}
          {eventMaps.length > 0 && (
            <>
              <h3 className="mb-2 text-xl font-semibold">Event Maps</h3>
              {eventMaps.map((m) => (
                <li key={m.id} className="my-2 flex items-center">
                  <span>{m.level}.</span>
                  <Image
                    src={m.bgUrl}
                    width={100}
                    height={100}
                    alt={`Map of ${m.name}`}
                    className="ml-2"
                  />
                  <Image
                    src={m.battleBgUrl}
                    width={100}
                    height={100}
                    alt={`Battle Bg of ${m.name}`}
                    className="ml-2"
                  />
                  <span className="ml-2">{m.name}</span>
                </li>
              ))}
            </>
          )}
        </ul>
      )}
      {maps.length === 0 && (
        <>
          <h3 className="mb-2 text-xl font-semibold">Map List</h3>
          <p className="mb-2">No maps yet.</p>
        </>
      )}

      <CreateMap />
    </>
  );
}
