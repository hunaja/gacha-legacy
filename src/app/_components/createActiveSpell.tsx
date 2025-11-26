"use client";

import { useState } from "react";
import {
  addToast,
  Button,
  Input,
  Select,
  SelectItem,
  type Selection,
  Textarea,
} from "@heroui/react";
import { api } from "~/trpc/react";

export default function CreateSpell() {
  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [requiredMana, setRequiredMana] = useState("");
  const [manaIncrease, setManaIncrease] = useState("");
  const [maxMana, setMaxMana] = useState("");
  const [duration, setDuration] = useState("");
  const [targetPosition, setTargetPosition] = useState("");
  const [spellNames] = api.spell.getCreatableActiveSpells.useSuspenseQuery();

  const createSpell = api.spell.createActiveSpell.useMutation();
  const utils = api.useUtils();

  const handleSubmit = async () => {
    console.log("Name:", name);
    if (!name) return null;

    const spell = await createSpell.mutateAsync({
      name,
      description,
      requiredMana: Number(requiredMana),
      manaIncrease: Number(manaIncrease),
      maxMana: Number(maxMana),
      duration: duration ? Number(duration) : undefined,
      targetPosition: targetPosition ? Number(targetPosition) : undefined,
    });

    addToast({
      title: "New Spell",
      description: `Created new spell ${spell.name}`,
    });

    await utils.spell.invalidate();

    // reset form
    setDescription("");
    setRequiredMana("");
    setManaIncrease("");
    setMaxMana("");
    setDuration("");
    setTargetPosition("");
    setName(name);
  };

  return (
    <div>
      <h3 className="my-2 text-xl">Create Spell</h3>
      <Select
        label="Select Spell"
        className="mb-2 w-96"
        selectedKeys={name ? [name] : []}
        onSelectionChange={(keys) =>
          keys.currentKey && setName(keys.currentKey)
        }
      >
        {spellNames?.map((spell) => (
          <SelectItem key={spell}>{spell}</SelectItem>
        ))}
      </Select>
      <Textarea
        label="Description"
        placeholder="Describe the spell"
        className="mb-2 w-96"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        label="Required Mana"
        placeholder="20"
        className="mb-2 w-96"
        value={requiredMana}
        onChange={(e) => setRequiredMana(e.target.value)}
      />
      <Input
        label="Mana Increase per Turn"
        placeholder="5"
        className="mb-2 w-96"
        value={manaIncrease}
        onChange={(e) => setManaIncrease(e.target.value)}
      />
      <Input
        label="Max Mana"
        placeholder="100"
        className="mb-2 w-96"
        value={maxMana}
        onChange={(e) => setMaxMana(e.target.value)}
      />
      <Input
        label="Duration (optional)"
        placeholder="3"
        className="mb-2 w-96"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
      />
      <Input
        label="Target Position (optional)"
        placeholder="1"
        className="mb-2 w-96"
        value={targetPosition}
        onChange={(e) => setTargetPosition(e.target.value)}
      />

      <Button className="mt-2" onPress={handleSubmit} color="primary">
        Submit Spell
      </Button>
    </div>
  );
}
