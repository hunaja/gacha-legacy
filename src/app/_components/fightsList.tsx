"use client";

import { api } from "~/trpc/react";
import moment from "moment";

export default function FightsList() {
  const [fights] = api.fight.getOwn.useSuspenseQuery();

  if (fights.length === 0)
    return (
      <p className="text-center">You have not participated in fights yet.</p>
    );

  return (
    <ul>
      {fights.map((f) => (
        <li key={f.id}>
          Fight {moment(f.createdAt).fromNow()}: {f.result ?? "not completed"}
        </li>
      ))}
    </ul>
  );
}
