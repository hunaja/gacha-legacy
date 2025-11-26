"use client";

import { api } from "~/trpc/react";
import Image from "next/image";
import CreateAllyBackground from "./createBackground";

export default function AdminBackgroundsWrapper() {
  const [allyBackgrounds] = api.allyBackgrounds.list.useSuspenseQuery();

  return (
    <>
      <h3 className="mb-2 text-xl font-semibold">Ally Backgrounds List</h3>

      {allyBackgrounds.length > 0 && (
        <ul className="list-disc p-5">
          <>
            <h3 className="mb-2 text-xl font-semibold">Event Maps</h3>
            {allyBackgrounds.map((m) => (
              <li key={m.id} className="my-2 flex items-center">
                <Image
                  src={m.bgUrl}
                  width={100}
                  height={100}
                  alt={`Background of ${m.id}`}
                  className="ml-2"
                />
                <span className="ml-2">{m.id}</span>
              </li>
            ))}
          </>
        </ul>
      )}
      {allyBackgrounds.length === 0 && (
        <p className="mb-2">No ally backgrounds yet.</p>
      )}

      <CreateAllyBackground />
    </>
  );
}
