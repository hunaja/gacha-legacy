"use client";

import { useState, useEffect } from "react";
import { addToast, Button, Input, Textarea } from "@heroui/react";
import { api } from "~/trpc/react";

interface EditSpellProps {
  spellId: string;
}

export default function EditSpell({ spellId }: EditSpellProps) {
  // hae kaikki spellit
  const [spells] = api.spell.list.useSuspenseQuery();
  const spell = spells.find((s) => s.name === spellId);

  const [description, setDescription] = useState(spell?.description ?? "");
  const [requiredMana, setRequiredMana] = useState(
    spell?.requiredMana?.toString() ?? "",
  );
  const [manaIncrease, setManaIncrease] = useState(
    spell?.manaIncrease?.toString() ?? "",
  );
  const [maxMana, setMaxMana] = useState(spell?.maxMana?.toString() ?? "");
  const [duration, setDuration] = useState(spell?.duration?.toString() ?? "");
  const [targetPosition, setTargetPosition] = useState(
    spell?.targetPosition?.toString() ?? "",
  );

  // jos spell muuttuu (kun query valmistuu), täytetään kentät
  useEffect(() => {
    if (spell) {
      setDescription(spell.description ?? "");
      setRequiredMana(spell.requiredMana?.toString() ?? "");
      setManaIncrease(spell.manaIncrease?.toString() ?? "");
      setMaxMana(spell.maxMana?.toString() ?? "");
      setDuration(spell.duration?.toString() ?? "");
      setTargetPosition(spell.targetPosition?.toString() ?? "");
    }
  }, [spell]);

  const updateSpell = api.spell.edit.useMutation();
  const utils = api.useUtils();

  const handleSubmit = async () => {
    if (!spellId) return null;

    const updated = await updateSpell.mutateAsync({
      name: spellId,
      description,
      requiredMana: Number(requiredMana),
      manaIncrease: Number(manaIncrease),
      maxMana: Number(maxMana),
      duration: duration ? Number(duration) : undefined,
      targetPosition: targetPosition ? Number(targetPosition) : undefined,
    });

    addToast({
      title: "Spell Updated",
      description: `Updated spell ${updated.name}`,
    });

    await utils.spell.invalidate();
  };

  if (!spell) {
    return <div>Spell not found.</div>;
  }

  return (
    <div>
      <h3 className="my-2 text-xl">Edit Spell</h3>
      <Input label="Name" className="mb-2 w-96" value={spellId} isDisabled />
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
        Update Spell
      </Button>
    </div>
  );
}
