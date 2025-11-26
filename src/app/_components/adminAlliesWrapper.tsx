import Image from "next/image";
import { api } from "~/trpc/react";
import CreateAlly from "./createAlly";
import { useState } from "react";
import EditAlly from "./editAlly";
import { Button } from "@heroui/react";

export default function AdminAlliesWrapper() {
  const [allies] = api.ally.list.useSuspenseQuery();
  const [editingAlly, setEditingAlly] = useState<string>("");

  return (
    <>
      <div className="mx-5 flex items-center justify-between">
        <h3 className="mb-2 text-xl font-semibold">All Allies</h3>
      </div>
      {allies.length > 0 && (
        <ul className="list-disc p-5">
          {allies.map((a) => (
            <li key={a.id} className="my-2 flex items-center">
              <Image
                src={a.portraitUrl}
                width={100}
                height={100}
                alt={`Portait of ${a.name}`}
              />
              <Image
                src={a.spriteUrl}
                width={100}
                height={100}
                alt={`Sprite of ${a.name}`}
                className="ml-2"
              />
              <span className="ml-2">{a.name}</span>
              <Button className="ml-5" onPress={() => setEditingAlly(a.id)}>
                Edit
              </Button>
            </li>
          ))}
        </ul>
      )}
      {allies.length === 0 && <p className="mb-2">No allies yet.</p>}

      {!editingAlly && <CreateAlly />}
      {editingAlly && (
        <>
          <EditAlly allyId={editingAlly} />
          <Button
            onPress={() => setEditingAlly("")}
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
