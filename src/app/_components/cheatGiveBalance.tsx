"use client";

import { Button } from "@heroui/react";
import { api } from "~/trpc/react";

export default function CheatGiveBalance() {
  const utils = api.useUtils();
  const giveGold = api.user.giveGold.useMutation({
    onSuccess() {
      void utils.user.invalidate();
    },
  });

  return (
    <Button isDisabled={giveGold.isPending} onPress={() => giveGold.mutate()}>
      Give 100 gold
    </Button>
  );
}
