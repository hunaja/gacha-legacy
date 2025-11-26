"use client";

import { api } from "~/trpc/react";
import CreateSpell from "./createActiveSpell";
import { useState } from "react";
import EditSpell from "./editSpell";
import { Button } from "@heroui/react";

export default function AdminSpellsWrapper() {
  const [spells] = api.spell.list.useSuspenseQuery();
  const [editingSpellId, setEditingSpellId] = useState("");

  return (
    <>
      <h3 className="mb-2 text-xl font-semibold">Spell List</h3>
      {spells.length > 0 && (
        <ul className="list-disc p-5">
          {spells.map((s) => (
            <li key={s.name} className="my-2 flex items-center">
              <b className="mr-2">{s.name}</b>{" "}
              <span className="mr-5">{s.description}</span>
              <Button onPress={() => setEditingSpellId(s.name)}>Edit</Button>
            </li>
          ))}
        </ul>
      )}
      {spells.length === 0 && <p className="mb-2">No maps yet.</p>}

      {!editingSpellId && <CreateSpell />}
      {editingSpellId && (
        <>
          <EditSpell spellId={editingSpellId} />
          <Button
            onPress={() => setEditingSpellId("")}
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
