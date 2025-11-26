"use client";

import { useState, useEffect } from "react";
import {
  addToast,
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from "@heroui/react";
import { api } from "~/trpc/react";

type Rarity = "COMMON" | "RARE" | "SR" | "SSR" | "SSSR";
type ClassType = "DPS" | "TANK" | "HEALER" | "BUFF";

interface EditAllyProps {
  allyId: string;
}

export default function EditAlly({ allyId }: EditAllyProps) {
  // hae ally-listasta
  const [allies] = api.ally.list.useSuspenseQuery();
  const ally = allies.find((a) => allyId === a.id);

  // lomakkeen statet (täytetään ally-arvoilla kun ally löytyy)
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
  const [rarity, setRarity] = useState<Rarity>("COMMON");
  const [allyClass, setAllyClass] = useState<ClassType>("DPS");
  const [settableAsPortrait, setSettableAsPortrait] = useState(false);
  const [starterAlly, setStarterAlly] = useState(false);
  const [spellId, setSpellId] = useState("");

  const updateAlly = api.ally.update.useMutation();
  const utils = api.useUtils();

  // hae spellit selectiin
  const [spells] = api.spell.list.useSuspenseQuery();

  // kun ally latautuu, aseta kenttiin arvot
  useEffect(() => {
    if (!ally) return;
    setName(ally.name);
    setDescription(ally.description);
    setHp(String(ally.hp));
    setAtk(String(ally.atk));
    setMAtk(String(ally.mAtk));
    setDef(String(ally.def));
    setMDef(String(ally.mDef));
    setCritAtk(String(ally.critAtk));
    setCritChance(String(ally.critChance));
    setDodgeChance(String(ally.dodgeChance));
    setRarity(ally.rarity as Rarity);
    setAllyClass(ally.class as ClassType);
    setSpellId(ally.activeSpellName ?? "");
    setSettableAsPortrait(ally.settableAsPortrait);
    setStarterAlly(ally.starterAlly);
  }, [ally]);

  const handleSubmit = async () => {
    if (!ally) return;

    await updateAlly.mutateAsync({
      id: ally.id,
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
      rarity,
      class: allyClass,
      activeSpellName: spellId || undefined,
      settableAsPortrait,
      starterAlly,
    });

    addToast({
      title: "Ally updated",
      description: `Updated ally ${name}`,
    });

    await utils.ally.invalidate();
  };

  if (!ally) {
    return <p>Ally not found.</p>;
  }

  return (
    <div>
      <h3 className="my-2 text-xl">Edit Ally</h3>
      <Input
        label="Name"
        className="mb-2 w-96"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Textarea
        label="Description"
        className="mb-2 w-96"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Switch
        isSelected={settableAsPortrait}
        onValueChange={setSettableAsPortrait}
        className="mr-5 mb-2"
      >
        Settable as Portrait
      </Switch>
      <Switch
        isSelected={starterAlly}
        onValueChange={setStarterAlly}
        className="mb-2"
      >
        Starter Ally
      </Switch>
      <Input
        label="HP"
        className="mb-2 w-96"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
      />
      <Input
        label="ATK"
        className="mb-2 w-96"
        value={atk}
        onChange={(e) => setAtk(e.target.value)}
      />
      <Input
        label="Magical ATK (mATK)"
        className="mb-2 w-96"
        value={mAtk}
        onChange={(e) => setMAtk(e.target.value)}
      />
      <Input
        label="Defense"
        className="mb-2 w-96"
        value={def}
        onChange={(e) => setDef(e.target.value)}
      />
      <Input
        label="Magical DEF (mDEF)"
        className="mb-2 w-96"
        value={mDef}
        onChange={(e) => setMDef(e.target.value)}
      />
      <Input
        label="Crit ATK %"
        className="mb-2 w-96"
        value={critAtk}
        onChange={(e) => setCritAtk(e.target.value)}
      />
      <Input
        label="Crit Chance %"
        className="mb-2 w-96"
        value={critChance}
        onChange={(e) => setCritChance(e.target.value)}
      />
      <Input
        label="Dodge Chance %"
        className="mb-2 w-96"
        value={dodgeChance}
        onChange={(e) => setDodgeChance(e.target.value)}
      />

      <Select
        label="Select Rarity"
        selectedKeys={[rarity]}
        onChange={(e) => setRarity(e.target.value as Rarity)}
        className="mb-2 w-96"
      >
        <SelectItem key="COMMON">Common</SelectItem>
        <SelectItem key="RARE">Rare</SelectItem>
        <SelectItem key="SR">SR</SelectItem>
        <SelectItem key="SSR">SSR</SelectItem>
        <SelectItem key="SSSR">SSSR</SelectItem>
      </Select>
      <br />

      <Select
        label="Select Class"
        selectedKeys={[allyClass]}
        onChange={(e) => setAllyClass(e.target.value as ClassType)}
        className="mb-2 w-96"
      >
        <SelectItem key="DPS">DPS</SelectItem>
        <SelectItem key="TANK">Tank</SelectItem>
        <SelectItem key="HEALER">Healer</SelectItem>
        <SelectItem key="BUFF">Buff</SelectItem>
      </Select>

      <br />

      <Select
        label="Select Spell"
        className="mb-2 w-96"
        selectedKeys={[spellId]}
        onChange={(e) => setSpellId(e.target.value)}
      >
        {spells?.map((spell) => (
          <SelectItem key={spell.name}>{spell.name}</SelectItem>
        ))}
      </Select>
      <br />

      <Button className="mt-2" onPress={handleSubmit} color="primary">
        Save Changes
      </Button>
    </div>
  );
}
