"use client";

import { Button, Select, SelectItem } from "@heroui/react";
import { useState } from "react";
import { api } from "~/trpc/react";

export default function CheatGiveAlly() {
  const { data: allies } = api.ally.list.useQuery();
  const [allyId, setAllyId] = useState<string | null>(null);
  const utils = api.useUtils();

  const giveAlly = api.ally.giveToCurrentUser.useMutation({
    onSuccess: () => {
      void utils.user.invalidate();
      alert("✅ Ally given!");
    },
  });

  if (!allies) return <p>Loading allies...</p>;

  return (
    <div className="p-5">
      <h3 className="mb-3 text-xl font-bold">Cheat: Give Ally</h3>

      <Select
        label="Select Ally"
        selectedKeys={allyId ? [allyId] : []}
        onSelectionChange={(keys) => {
          const id = Array.from(keys)[0] as string | undefined;
          setAllyId(id ?? null);
        }}
      >
        {allies.map((a) => (
          <SelectItem key={a.id}>
            {a.name} ({a.rarity})
          </SelectItem>
        ))}
      </Select>

      <Button
        className="mt-3"
        onPress={() => allyId && giveAlly.mutate({ allyId })}
        isDisabled={!allyId || giveAlly.isPending}
      >
        {giveAlly.isPending ? "Giving..." : "Give Ally"}
      </Button>
    </div>
  );
}
