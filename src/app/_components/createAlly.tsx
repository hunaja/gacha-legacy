"use client";

import { useState } from "react";
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
import Image from "next/image";

type Rarity = "COMMON" | "RARE" | "SR" | "SSR" | "SSSR";
type ClassType = "DPS" | "TANK" | "HEALER" | "BUFF";

export default function CreateAlly() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hp, setHp] = useState("");
  const [atk, setAtk] = useState("");
  const [mAtk, setMAtk] = useState("");
  const [settableAsPortrait, setSettableAsPortrait] = useState(false);
  const [starterAlly, setStarterAlly] = useState(false);
  const [def, setDef] = useState("");
  const [mDef, setMDef] = useState("");
  const [critAtk, setCritAtk] = useState("");
  const [critChange, setCritChange] = useState("");
  const [dodgeChance, setDodgeChance] = useState("");
  const [rarity, setRarity] = useState<Rarity>("COMMON");
  const [allyClass, setAllyClass] = useState<ClassType>("DPS");
  const [spellId, setSpellId] = useState("");
  const [allyBackgroundId, setAllyBackgroundId] = useState("");

  const [spriteFile, setSpriteFile] = useState<File | null>(null);
  const [portraitFile, setPortraitFile] = useState<File | null>(null);

  const createUploadUrls = api.ally.createUploadUrls.useMutation();
  const utils = api.useUtils();

  // fetch spells for select
  const [spells] = api.spell.list.useSuspenseQuery();
  const [allyBackgrounds] = api.allyBackgrounds.list.useSuspenseQuery();

  const handleSubmit = async () => {
    if (!spriteFile || !portraitFile) {
      alert("Please select both sprite and portrait files.");
      return;
    }

    const { ally, spriteUploadUrl, portraitUploadUrl } =
      await createUploadUrls.mutateAsync({
        name,
        description,
        hp: Number(hp),
        atk: Number(atk),
        mAtk: Number(mAtk),
        def: Number(def),
        mDef: Number(mDef),
        critAtk: Number(critAtk),
        critChance: Number(critChange),
        dodgeChance: Number(dodgeChance),
        settableAsPortrait,
        starterAlly,
        rarity,
        class: allyClass,
        activeSpellName: spellId ?? undefined,
        backgroundId: allyBackgroundId,
      });

    // Upload sprite
    await fetch(spriteUploadUrl, {
      method: "PUT",
      body: spriteFile,
      headers: { "Content-Type": "image/png" },
    });

    // Upload portrait
    await fetch(portraitUploadUrl, {
      method: "PUT",
      body: portraitFile,
      headers: { "Content-Type": "image/png" },
    });

    addToast({
      title: "New Ally",
      description: `Created new ally ${ally.name}`,
    });

    await utils.ally.invalidate();
  };

  return (
    <div>
      <h3 className="my-2 text-xl">Create Ally</h3>
      <Input
        label="Name"
        placeholder="Gacha Name"
        className="mb-2 w-96"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Textarea
        label="Description"
        placeholder="Describe the ally"
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
        placeholder="100"
        className="mb-2 w-96"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
      />
      <Input
        label="ATK"
        placeholder="30"
        className="mb-2 w-96"
        value={atk}
        onChange={(e) => setAtk(e.target.value)}
      />
      <Input
        label="Magical ATK (mATK)"
        placeholder="25"
        className="mb-2 w-96"
        value={mAtk}
        onChange={(e) => setMAtk(e.target.value)}
      />
      <Input
        label="Defense"
        placeholder="10"
        className="mb-2 w-96"
        value={def}
        onChange={(e) => setDef(e.target.value)}
      />
      <Input
        label="Magical DEF (mDEF)"
        placeholder="8"
        className="mb-2 w-96"
        value={mDef}
        onChange={(e) => setMDef(e.target.value)}
      />
      <Input
        label="Crit ATK %"
        placeholder="50"
        className="mb-2 w-96"
        value={critAtk}
        onChange={(e) => setCritAtk(e.target.value)}
      />
      <Input
        label="Crit Chance %"
        placeholder="10"
        className="mb-2 w-96"
        value={critChange}
        onChange={(e) => setCritChange(e.target.value)}
      />
      <Input
        label="Dodge Chance %"
        placeholder="10"
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
        className="mb-2 w-96"
        selectedKeys={[allyClass]}
        onChange={(e) => setAllyClass(e.target.value as ClassType)}
      >
        <SelectItem key="DPS">DPS</SelectItem>
        <SelectItem key="TANK">Tank</SelectItem>
        <SelectItem key="HEALER">Healer</SelectItem>
        <SelectItem key="BUFF">Buff</SelectItem>
      </Select>

      <br />
      <Select
        label="Select Background"
        className="mb-2 w-96"
        selectedKeys={[allyBackgroundId]}
        onChange={(e) => setAllyBackgroundId(e.target.value)}
      >
        {allyBackgrounds.map((background, i) => (
          <SelectItem key={background.id} textValue={`${i + 1}. background`}>
            <div className="flex place-items-center">
              <Image
                src={background.bgUrl}
                width={25}
                height={25}
                alt={`Background of ${background.id}`}
                className="mr-2"
              />
              <span>{i + 1}. background</span>
            </div>
          </SelectItem>
        ))}
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

      <label className="mb-2 block">
        Sprite (png)
        <br />
        <input
          type="file"
          className="file:mr-5 file:border-[1px] file:bg-stone-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-stone-700 hover:file:cursor-pointer hover:file:bg-blue-50 hover:file:text-blue-700"
          accept="image/png"
          onChange={(e) => setSpriteFile(e.target.files?.[0] ?? null)}
        />
      </label>
      <label className="mb-2 block">
        Portrait (png)
        <br />
        <input
          type="file"
          accept="image/png"
          className="file:mr-5 file:border-[1px] file:bg-stone-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-stone-700 hover:file:cursor-pointer hover:file:bg-blue-50 hover:file:text-blue-700"
          onChange={(e) => setPortraitFile(e.target.files?.[0] ?? null)}
        />
      </label>

      <Button className="mt-2" onPress={handleSubmit} color="primary">
        Submit Ally
      </Button>
    </div>
  );
}
