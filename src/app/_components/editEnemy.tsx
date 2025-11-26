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

interface EditEnemyProps {
  enemyId: string;
}

export default function EditEnemy({ enemyId }: EditEnemyProps) {
  const [enemies] = api.enemy.list.useSuspenseQuery();
  const enemy = enemies.find((e) => e.id === enemyId);

  // fetch spells for selects
  const [activeSpells] = api.spell.list.useSuspenseQuery();

  const [name, setName] = useState(enemy?.name ?? "");
  const [description, setDescription] = useState(enemy?.description ?? "");
  const [hp, setHp] = useState(enemy?.hp.toString() ?? "");
  const [atk, setAtk] = useState(enemy?.atk.toString() ?? "");
  const [mAtk, setMAtk] = useState(enemy?.mAtk.toString() ?? "");
  const [def, setDef] = useState(enemy?.def.toString() ?? "");
  const [mDef, setMDef] = useState(enemy?.mDef.toString() ?? "");
  const [critAtk, setCritAtk] = useState(enemy?.critAtk.toString() ?? "");
  const [critChance, setCritChance] = useState(
    enemy?.critChance.toString() ?? "",
  );
  const [dodgeChance, setDodgeChance] = useState(
    enemy?.dodgeChance.toString() ?? "",
  );
  const [enemyClass, setEnemyClass] = useState<ClassType>(
    enemy?.class ?? "DPS",
  );
  const [activeSpellName, setActiveSpellName] = useState(
    enemy?.activeSpellName ?? "",
  );
  const [passiveSpellName, setPassiveSpellName] = useState(
    enemy?.passiveSpellName ?? "",
  );

  const updateEnemy = api.enemy.update.useMutation();
  const utils = api.useUtils();

  const handleSubmit = async () => {
    if (!enemy) return;

    await updateEnemy.mutateAsync({
      id: enemy.id,
      name,
      description,
      hp: Number(hp),
      atk: Number(atk),
      mAtk: Number(mAtk),
      def: Number(def),
      mDef: Number(mDef),
      critAtk: Number(critAtk),
      critChance: Number(critChance),
      dodgeChance: Number(dodgeChance),
      class: enemyClass,
      activeSpellName: activeSpellName || undefined,
      passiveSpellName: passiveSpellName || undefined,
    });

    addToast({
      title: "Enemy Updated",
      description: `Enemy ${name} updated successfully.`,
    });

    await utils.enemy.invalidate();
  };

  if (!enemy) {
    return <p>Enemy not found</p>;
  }

  return (
    <div>
      <h3 className="my-2 text-xl">Edit Enemy</h3>
      <Input
        label="Name"
        value={name}
        className="mb-2 w-96"
        onChange={(e) => setName(e.target.value)}
      />
      <Textarea
        label="Description"
        value={description}
        className="mb-2 w-96"
        onChange={(e) => setDescription(e.target.value)}
      />
      <Input
        label="HP"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        className="mb-2 w-96"
      />
      <Input
        label="ATK"
        value={atk}
        onChange={(e) => setAtk(e.target.value)}
        className="mb-2 w-96"
      />
      <Input
        label="mATK"
        value={mAtk}
        onChange={(e) => setMAtk(e.target.value)}
        className="mb-2 w-96"
      />
      <Input
        label="DEF"
        value={def}
        onChange={(e) => setDef(e.target.value)}
        className="mb-2 w-96"
      />
      <Input
        label="mDEF"
        value={mDef}
        onChange={(e) => setMDef(e.target.value)}
        className="mb-2 w-96"
      />
      <Input
        label="Crit ATK"
        value={critAtk}
        onChange={(e) => setCritAtk(e.target.value)}
        className="mb-2 w-96"
      />
      <Input
        label="Crit Chance %"
        value={critChance}
        onChange={(e) => setCritChance(e.target.value)}
        className="mb-2 w-96"
      />
      <Input
        label="Dodge Chance %"
        value={dodgeChance}
        onChange={(e) => setDodgeChance(e.target.value)}
        className="mb-2 w-96"
      />

      <Select
        label="Class"
        selectedKeys={[enemyClass]}
        onChange={(e) => setEnemyClass(e.target.value as ClassType)}
        className="mb-2 w-96"
      >
        <SelectItem key="DPS">DPS</SelectItem>
        <SelectItem key="TANK">Tank</SelectItem>
        <SelectItem key="HEALER">Healer</SelectItem>
        <SelectItem key="BUFF">Buff</SelectItem>
      </Select>
      <br />

      <Select
        label="Active Spell"
        selectedKeys={activeSpellName ? [activeSpellName] : []}
        onChange={(e) => setActiveSpellName(e.target.value)}
        className="mb-2 w-96"
      >
        {activeSpells?.map((s) => (
          <SelectItem key={s.name}>{s.name}</SelectItem>
        ))}
      </Select>
      <br />

      <Button className="mt-2" color="primary" onPress={handleSubmit}>
        Save Changes
      </Button>
    </div>
  );
}
