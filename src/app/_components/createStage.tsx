"use client";

import { useEffect, useState } from "react";
import { addToast, Button, Input, Select, SelectItem } from "@heroui/react";
import { api } from "~/trpc/react";
import StagePointPicker from "./stagePointPicker";

export default function CreateStage() {
  const [enemies] = api.enemy.list.useSuspenseQuery();
  const [maps] = api.map.list.useSuspenseQuery();
  const createStage = api.stage.create.useMutation();

  const [name, setName] = useState("");
  const [mapId, setMapId] = useState("");
  const [mapLevel, setMapLevel] = useState<number | "">("");
  const [xPercent, setXPercent] = useState<number | "">("");
  const [yPercent, setYPercent] = useState<number | "">("");
  const [enemy1Id, setEnemy1Id] = useState<string | null>(null);
  const [enemy1Level, setEnemy1Level] = useState<number | "">("");
  const [enemy2Id, setEnemy2Id] = useState<string | null>(null);
  const [enemy2Level, setEnemy2Level] = useState<number | "">("");
  const [enemy3Id, setEnemy3Id] = useState<string | null>(null);
  const [enemy3Level, setEnemy3Level] = useState<number | "">("");

  const selectedMap = maps.find((m) => m.id === mapId);

  // TODO paskaa koodia
  useEffect(() => {
    if (!selectedMap) return;

    const maxLevel = selectedMap.stages
      .slice()
      .sort((a, b) => b.mapLevel - a.mapLevel)
      .at(0)?.mapLevel;

    if (maxLevel !== undefined) {
      setMapLevel(maxLevel + 1);
    } else {
      setMapLevel(1);
    }
  }, [selectedMap]);

  const handleSubmit = async () => {
    if (
      !name ||
      !mapId ||
      mapLevel === "" ||
      xPercent === "" ||
      yPercent === "" ||
      enemy1Id === null ||
      enemy1Level === ""
    ) {
      alert("Please fill all required fields");
      return;
    }

    const enemies: { enemyId: string; position: number; level: number }[] = [
      {
        enemyId: enemy1Id,
        position: 0,
        level: enemy1Level,
      },
    ];

    if (enemy2Id && enemy2Level) {
      enemies.push({
        enemyId: enemy2Id,
        position: 1,
        level: enemy2Level,
      });
    }

    if (enemy3Id && enemy3Level) {
      enemies.push({
        enemyId: enemy3Id,
        position: enemies.length,
        level: enemy3Level,
      });
    }

    const data = {
      name,
      mapId,
      mapLevel: Number(mapLevel),
      xPercent: Number(xPercent),
      yPercent: Number(yPercent),
      enemies,
    };

    await createStage.mutateAsync(data);

    addToast({
      title: "New Stage",
      description: `Stage ${data.name} created`,
    });

    setName("");
    setMapId("");
    setMapLevel("");
    setXPercent("");
    setYPercent("");
    setEnemy1Id(null);
    setEnemy2Id(null);
    setEnemy3Id(null);
  };

  return (
    <div className="w-96">
      <h3 className="my-2 text-xl font-semibold">Create a Stage</h3>

      <Input
        label="Name"
        placeholder="Stage Name"
        className="mb-2"
        value={name}
        isRequired
        onChange={(e) => setName(e.target.value)}
      />

      <Select
        label="Select Map"
        isRequired
        className="my-2"
        selectedKeys={mapId ? [mapId] : []}
        onSelectionChange={(keys) =>
          keys.currentKey && setMapId(keys.currentKey)
        }
      >
        {maps.map((m) => (
          <SelectItem key={m.id}>{m.name}</SelectItem>
        ))}
      </Select>

      {selectedMap && (
        <Input
          label="Map Level"
          placeholder="1"
          type="number"
          isRequired
          value={mapLevel + ""}
          onChange={(e) =>
            setMapLevel(e.target.value === "" ? "" : Number(e.target.value))
          }
        />
      )}

      {selectedMap && (
        <StagePointPicker
          selectedMap={selectedMap}
          onClick={({ xPercent, yPercent }) => {
            setYPercent(yPercent);
            setXPercent(xPercent);
          }}
        />
      )}

      <Select
        label="First Enemy"
        className="my-2"
        selectedKeys={enemy1Id ? [enemy1Id] : []}
        isRequired
        onSelectionChange={(keys) =>
          keys.currentKey && setEnemy1Id(keys.currentKey)
        }
      >
        {enemies.map((e) => (
          <SelectItem key={e.id}>{e.name}</SelectItem>
        ))}
      </Select>

      <Input
        label="First Enemy Level"
        placeholder="1"
        isRequired
        className="my-2"
        value={enemy1Level + ""}
        onChange={(e) =>
          setEnemy1Level(e.target.value === "" ? "" : Number(e.target.value))
        }
      />

      <Select
        label="Second Enemy"
        className="my-2"
        selectedKeys={enemy2Id ? [enemy2Id] : []}
        onSelectionChange={(keys) =>
          keys.currentKey && setEnemy2Id(keys.currentKey)
        }
      >
        {enemies.map((e) => (
          <SelectItem key={e.id}>{e.name}</SelectItem>
        ))}
      </Select>

      <Input
        label="Second Enemy Level"
        placeholder="1"
        className="my-2"
        value={enemy2Level + ""}
        onChange={(e) =>
          setEnemy2Level(e.target.value === "" ? "" : Number(e.target.value))
        }
      />

      <Select
        label="Third Enemy"
        className="my-2"
        selectedKeys={enemy3Id ? [enemy3Id] : []}
        onSelectionChange={(keys) =>
          keys.currentKey && setEnemy3Id(keys.currentKey)
        }
      >
        {enemies.map((e) => (
          <SelectItem key={e.id}>{e.name}</SelectItem>
        ))}
      </Select>

      <Input
        label="Third Enemy Level"
        placeholder="1"
        className="my-2"
        value={enemy3Level + ""}
        onChange={(e) =>
          setEnemy3Level(e.target.value === "" ? "" : Number(e.target.value))
        }
      />

      <Button
        className="mt-2"
        onPress={handleSubmit}
        isDisabled={createStage.isPending}
      >
        {createStage.isPending ? "Submitting..." : "Submit Stage"}
      </Button>
    </div>
  );
}
