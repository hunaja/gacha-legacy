"use client";

import { useEffect, useState } from "react";
import { addToast, Button, Input, Switch } from "@heroui/react";
import { api } from "~//trpc/react";

export default function CreateMap() {
  const [maps] = api.map.list.useSuspenseQuery();
  const [name, setName] = useState("");
  const [level, setLevel] = useState<number | "">("");
  const [file, setFile] = useState<File | null>(null);
  const [battleFile, setBattleFile] = useState<File | null>(null);
  const [campaign, setCampaign] = useState<boolean>(false);

  const createUploadUrl = api.map.createUploadUrl.useMutation();
  const utils = api.useUtils();

  // TODO Paskaa koodia
  useEffect(() => {
    const maxLevel = maps
      .filter((m) => m.campaign === campaign)
      .slice()
      .sort((a, b) => b.level - a.level)
      .at(0)?.level;

    if (maxLevel) {
      setLevel(maxLevel + 1);
    } else {
      setLevel(1);
    }
  }, [campaign, maps]);

  const handleSubmit = async () => {
    if (!file || !battleFile || !name || !level) return;

    // 1. Luo map + hae upload url
    const { uploadUrl, battleBgUploadUrl, map } =
      await createUploadUrl.mutateAsync({ name, campaign, level });

    // 2. Upload tiedosto Minioon
    await Promise.all([
      fetch(battleBgUploadUrl, {
        method: "PUT",
        body: battleFile,
        headers: { "Content-Type": battleFile.type },
      }),
      fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      }),
    ]);

    await utils.map.invalidate();

    addToast({
      title: "New Map",
      description: `Added map ${map.name}`,
    });
    setName("");
    setFile(null);
  };

  return (
    <>
      <h3 className="mt-5 mb-2 text-xl font-semibold">Create a Map</h3>

      <Input
        label="Name"
        placeholder="Map Name"
        className="mb-2 w-96"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <Switch
        isSelected={campaign}
        onValueChange={setCampaign}
        className="mb-2"
      >
        In Campaign
      </Switch>

      <Input
        label="Map Level"
        placeholder="1"
        className="my-2 w-96"
        value={level + ""}
        onChange={(e) =>
          setLevel(e.target.value === "" ? "" : Number(e.target.value))
        }
      />

      <label className="mb-2 block">
        Map Artwork (png):
        <br />
        <input
          className="file:mr-5 file:border-[1px] file:bg-stone-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-stone-700 hover:file:cursor-pointer hover:file:bg-blue-50 hover:file:text-blue-700"
          type="file"
          accept="image/png"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setFile(e.target.files[0]);
            }
          }}
        />
      </label>

      <label className="mb-2 block">
        Battle Artwork (png):
        <br />
        <input
          className="file:mr-5 file:border-[1px] file:bg-stone-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-stone-700 hover:file:cursor-pointer hover:file:bg-blue-50 hover:file:text-blue-700"
          type="file"
          accept="image/png"
          onChange={(e) => {
            if (e.target.files?.[0]) {
              setBattleFile(e.target.files[0]);
            }
          }}
        />
      </label>

      <Button
        className="mt-2"
        onPress={handleSubmit}
        isDisabled={createUploadUrl.isPending}
        color="primary"
      >
        {createUploadUrl.isPending ? "Submitting..." : "Submit Map"}
      </Button>
    </>
  );
}
