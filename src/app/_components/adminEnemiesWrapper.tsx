import Image from "next/image";
import { api } from "~/trpc/react";
import { useState } from "react";
import { Button } from "@heroui/react";
import CreateEnemy from "./createEnemy";
import EditEnemy from "./editEnemy";

export default function AdminEnemiesWrapper() {
  const [enemies] = api.enemy.list.useSuspenseQuery();
  const [editingEnemy, setEditingEnemy] = useState<string>("");

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="mb-2 text-xl font-semibold">All Enemies</h3>
      </div>
      {enemies.length > 0 && (
        <ul className="list-disc p-5">
          {enemies.map((e) => (
            <li key={e.id} className="my-2 flex items-center">
              <Image
                src={e.spriteUrl}
                width={100}
                height={100}
                alt={`Portait of ${e.name}`}
              />
              <span className="ml-2">{e.name}</span>
              <Button className="ml-5" onPress={() => setEditingEnemy(e.id)}>
                Edit
              </Button>
            </li>
          ))}
        </ul>
      )}
      {enemies.length === 0 && <p className="mb-2">No enemies yet.</p>}

      {!editingEnemy && <CreateEnemy />}
      {editingEnemy && (
        <>
          <EditEnemy enemyId={editingEnemy} />
          <Button
            onPress={() => setEditingEnemy("")}
            color="danger"
            className="mt-2"
          >
            Stop Editing
          </Button>
        </>
      )}
    </>
  );
}
