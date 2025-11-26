"use client";

import { useState } from "react";
import {
  addToast,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";
import { api } from "~/trpc/react";

type ClassType = "DPS" | "TANK" | "HEALER" | "BUFF";

export default function CreateEnemy() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hp, setHp] = useState("");
  const [atk, setAtk] = useState("");
  const [mAtk, setMAtk] = useState("");
  const [def, setDef] = useState("");
  const [mDef, setMDef] = useState("");
  const [critAtk, setCritAtk] = useState("");
  const [critChance, setCritChance] = useState("");
  const [dodgeChance, setDodgeChance] = useState("");
  const [enemyClass, setEnemyClass] = useState<ClassType>("DPS");

  const [spriteFile, setSpriteFile] = useState<File | null>(null);

  const createUploadUrl = api.enemy.createUploadUrl.useMutation();
  const utils = api.useUtils();

  // fetch spells
  const [activeSpells] = api.spell.list.useSuspenseQuery();

  const [activeSpellName, setActiveSpellName] = useState("");

  const handleSubmit = async () => {
    if (!spriteFile) {
      alert("Please select a sprite file.");
      return;
    }

    const { enemy, uploadUrl } = await createUploadUrl.mutateAsync({
      name,
      description,
      class: enemyClass,
      hp: Number(hp),
      def: Number(def),
      mDef: Number(mDef),
      atk: Number(atk),
      mAtk: Number(mAtk),
      critAtk: Number(critAtk),
      critChance: Number(critChance),
      dodgeChance: Number(dodgeChance),
      activeSpellName: activeSpellName || undefined,
    });

    // Upload sprite
    await fetch(uploadUrl, {
      method: "PUT",
      body: spriteFile,
      headers: { "Content-Type": "image/png" },
    });

    addToast({
      title: "New Enemy",
      description: `Created new enemy ${enemy.name}`,
    });

    await utils.enemy.invalidate();

    // reset form
    setName("");
    setDescription("");
    setHp("");
    setAtk("");
    setMAtk("");
    setDef("");
    setMDef("");
    setCritAtk("");
    setCritChance("");
    setDodgeChance("");
    setSpriteFile(null);
    setActiveSpellName("");
  };

  return (
    <div className="w-96">
      <h3 className="my-2 text-xl font-semibold">Create Enemy</h3>

      <Input
        label="Name"
        placeholder="Enemy Name"
        className="mb-2"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Textarea
        label="Description"
        placeholder="Describe the enemy"
        className="mb-2"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        label="HP"
        placeholder="100"
        type="number"
        className="mb-2"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
      />

      <Input
        label="ATK"
        placeholder="30"
        type="number"
        className="mb-2"
        value={atk}
        onChange={(e) => setAtk(e.target.value)}
      />

      <Input
        label="Magical ATK (mATK)"
        placeholder="20"
        type="number"
        className="mb-2"
        value={mAtk}
        onChange={(e) => setMAtk(e.target.value)}
      />

      <Input
        label="DEF"
        placeholder="15"
        type="number"
        className="mb-2"
        value={def}
        onChange={(e) => setDef(e.target.value)}
      />

      <Input
        label="Magical DEF (mDEF)"
        placeholder="10"
        type="number"
        className="mb-2"
        value={mDef}
        onChange={(e) => setMDef(e.target.value)}
      />

      <Input
        label="Crit ATK"
        placeholder="50"
        type="number"
        className="mb-2"
        value={critAtk}
        onChange={(e) => setCritAtk(e.target.value)}
      />

      <Input
        label="Crit Chance %"
        placeholder="10"
        type="number"
        className="mb-2"
        value={critChance}
        onChange={(e) => setCritChance(e.target.value)}
      />

      <Input
        label="Dodge Chance %"
        placeholder="5"
        type="number"
        className="mb-2"
        value={dodgeChance}
        onChange={(e) => setDodgeChance(e.target.value)}
      />

      <Select
        label="Class"
        className="mb-2"
        selectedKeys={[enemyClass]}
        onChange={(e) => setEnemyClass(e.target.value as ClassType)}
      >
        <SelectItem key="DPS">DPS</SelectItem>
        <SelectItem key="TANK">Tank</SelectItem>
        <SelectItem key="HEALER">Healer</SelectItem>
        <SelectItem key="BUFF">Buff</SelectItem>
      </Select>

      <Select
        label="Active Spell"
        className="mb-2"
        selectedKeys={[activeSpellName]}
        onChange={(e) => setActiveSpellName(e.target.value)}
      >
        {activeSpells?.map((s) => (
          <SelectItem key={s.name}>{s.name}</SelectItem>
        ))}
      </Select>

      <label className="mb-2 block">
        Sprite (png):
        <input
          type="file"
          className="file:mr-5 file:border-[1px] file:bg-stone-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-stone-700 hover:file:cursor-pointer hover:file:bg-blue-50 hover:file:text-blue-700"
          accept="image/png"
          onChange={(e) => {
            if (e.target.files?.[0]) setSpriteFile(e.target.files[0]);
          }}
        />
      </label>

      <Button
        className="mt-2"
        onPress={handleSubmit}
        isDisabled={createUploadUrl.isPending}
      >
        {createUploadUrl.isPending ? "Submitting..." : "Submit Enemy"}
      </Button>
    </div>
  );
}
