"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { api } from "~/trpc/react";
import { useEffect, useState } from "react";
import type {
  FightState,
  FightEvent,
  CharacterState,
  Buff,
  BuffStat,
} from "~/server/fightEngine";

import "../../../public/recovery1.css";
import "../../../public/Gun1.css";

const shake = {
  x: [0, -10, 10, -10, 10, 0],
  transition: { duration: 0.4 },
};

// Compute buffed stat value
function getBuffedStatClient(entity: CharacterState, stat: BuffStat): number {
  const baseStat = entity[stat];
  const buffModifier = (entity.buffs ?? [])
    .filter((b) => b.stat === stat)
    .reduce((sum, buff) => sum + buff.value, 0);
  return Math.floor(baseStat * (1 + buffModifier / 100));
}

// Clamp hp to buffed maxHp
function clampHpClient(entity: CharacterState): CharacterState {
  const maxHp = getBuffedStatClient(entity, "maxHp");
  return { ...entity, hp: Math.min(entity.hp, maxHp) };
}

// Generate client-only id for buffs
function makeClientBuffId(sourceId: string, name: string) {
  return `${sourceId}-${name}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getBuffTotalForStat(entity: CharacterState, stat: BuffStat): number {
  return (entity.buffs ?? [])
    .filter((b) => b.stat === stat)
    .reduce((sum, buff) => sum + buff.value, 0);
}

function applyEventToState(prev: FightState, event: FightEvent): FightState {
  const chars = prev.characters.map((c) => ({
    ...c,
    buffs: [...(c.buffs ?? [])],
  }));

  const updateChar = (
    id: string,
    cb: (c: CharacterState) => CharacterState,
  ) => {
    const idx = chars.findIndex((c) => c.fightId === id);
    if (idx >= 0) chars[idx] = cb(chars[idx]!);
  };

  let newStatus = prev.status; // 👈 track status locally

  switch (event.action) {
    case "attack":
      for (const t of event.targets) {
        updateChar(t, (c) => ({ ...c, hp: Math.max(0, c.hp - event.amount) }));
      }
      break;

    case "heal":
      for (const t of event.targets) {
        updateChar(t, (c) => ({
          ...c,
          hp: Math.min(getBuffedStatClient(c, "maxHp"), c.hp + event.amount),
        }));
      }
      break;

    case "buff":
      for (const t of event.targets) {
        updateChar(t, (c) => {
          const newBuff: Buff = {
            id: makeClientBuffId(event.actor, event.buff.name),
            name: event.buff.name,
            stat: event.buff.stat,
            value: event.buff.value,
            duration: event.buff.duration,
            sourceId: event.actor,
          };
          return { ...c, buffs: [...c.buffs, newBuff] };
        });
      }
      break;

    case "buffExpired":
      for (const t of event.targets) {
        updateChar(t, (c) => {
          const newBuffs = c.buffs.filter((b) => b.name !== event.buffName);
          const clamped = clampHpClient({ ...c, buffs: newBuffs });
          return { ...clamped, buffs: newBuffs };
        });
      }
      break;

    case "victory":
      newStatus = "win";
      break;

    case "defeat":
      newStatus = "lose";
      break;
  }

  // 👇 use newStatus instead of prev.status
  return { ...prev, characters: chars, status: newStatus };
}

// ============================================================
// 🔹 FightView Component
// ============================================================

export function FightView({ fightId }: { fightId: string }) {
  // Initial state from backend
  const [initialState] = api.fight.getState.useSuspenseQuery({ fightId });
  const [fullState, setFullState] = useState<FightState | null>(null);
  const [uiState, setUiState] = useState<FightState | null>(null);

  const [eventIndex, setEventIndex] = useState(0);
  const [currentEvent, setCurrentEvent] = useState<FightEvent | null>(null);

  const updateLatestEventIndex =
    api.fight.updateLatestEventsIndex.useMutation();
  const resolveTurn = api.fight.resolveTurn.useMutation({
    onSuccess(newState) {
      setFullState(newState);
      setEventIndex(newState.latestEventsIndex);
    },
  });

  // Sync initial state
  useEffect(() => {
    if (!initialState) return;
    setFullState(initialState);
    setUiState(structuredClone(initialState));
    setEventIndex(initialState.latestEventsIndex);
  }, [initialState]);

  // Playback events one by one
  useEffect(() => {
    if (!fullState || !uiState) return;

    if (eventIndex >= fullState.events.length) {
      setCurrentEvent(null);
      updateLatestEventIndex.mutate({ fightId, index: eventIndex });
      return;
    }

    const event = fullState.events[eventIndex]!;
    setCurrentEvent(event);

    setUiState((prev) => (prev ? applyEventToState(prev, event) : prev));

    const t = setTimeout(() => setEventIndex((i) => i + 1), 800);
    return () => clearTimeout(t);
  }, [eventIndex, fullState]);

  if (!uiState) return <div>Loading fight...</div>;

  const allies = uiState.characters.filter((c) => c.side === "ally");
  const enemies = uiState.characters.filter((c) => c.side === "enemy");

  // Render a single character card
  function renderChar(c: CharacterState) {
    const totals = {
      hp: getBuffTotalForStat(c, "hp"),
      atk: getBuffTotalForStat(c, "atk"),
      def: getBuffTotalForStat(c, "def"),
      mAtk: getBuffTotalForStat(c, "mAtk"),
      mDef: getBuffTotalForStat(c, "mDef"),
      maxHp: getBuffTotalForStat(c, "maxHp"),
    };

    console.log("Totals", totals);

    const isDead = c.hp <= 0;
    const attacked =
      currentEvent?.action === "attack" &&
      currentEvent.targets.includes(c.fightId);
    const healed =
      currentEvent?.action === "heal" &&
      currentEvent?.targets.includes(c.fightId);

    const centerEnemy =
      c.side === "enemy" && c.position === 1 && enemies.length === 3;

    const border = 5;

    return (
      <div
        key={c.fightId}
        className={`text-center ${isDead ? "bg-amber-200" : ""}}`}
        style={{
          marginTop: c.side === "ally" ? 20 * -c.position : undefined,
        }}
      >
        {c.side === "enemy" && <div className="pt-5 text-lg">{c.hp}</div>}

        <div
          className={`relative inline-block ${isDead ? "brightness-50" : ""}`}
        >
          {c.side === "ally" && (
            <>
              <div
                className="relative inline-block bg-gradient-to-r from-red-500 via-red-600 to-red-800"
                style={{
                  width: "150px",
                  height: "225px",
                  backgroundColor: "red",
                  clipPath: "polygon(0 0, 100% 0, 100% 85%, 0 100%)",
                }}
              >
                <Image
                  src={c.imageUrl}
                  alt={c.name}
                  width={150 - border} // width minus left border
                  height={225 - border} // height minus bottom border
                  style={{
                    position: "absolute",
                    top: 0,
                    left: border, // leave space for left border
                    width: `${150 - border}px`,
                    height: `${225 - border}px`,
                    clipPath: "polygon(0 0, 100% 0, 100% 85%, 0 100%)",
                  }}
                  unoptimized
                />
              </div>

              <div className={"absolute bottom-0 left-1/5 text-lg"}>{c.hp}</div>
            </>
          )}

          {c.side === "enemy" && (
            <>
              <Image
                src="/enemyPlatform.png"
                alt="platform"
                width={centerEnemy ? 300 : 80}
                height={centerEnemy ? 50 : 20}
                className="absolute left-1/2 z-0 -translate-x-1/2"
                style={{
                  bottom: centerEnemy ? -25 : -20,
                }}
                unoptimized
              />
              <Image
                src={c.imageUrl}
                width={centerEnemy ? 150 : 100}
                height={centerEnemy ? 150 : 100}
                alt={c.name}
                className={`${c.side === "enemy" ? "relative" : ""} mx-auto`}
                unoptimized
              />
            </>
          )}

          <div
            className={`absolute top-0 ${c.side === "enemy" ? "w-30" : "w-96"}`}
          >
            {healed && (
              <div className="Recovery1-animation bottom bottom-0 left-1/5 z-30"></div>
            )}
            {attacked && (
              <div className="Gun1-animation bottom bottom-0 left-1/5 z-30"></div>
            )}
          </div>
        </div>

        {/* Buff summary */}
        <div className="mt-1 text-xs text-gray-400">
          {Object.entries(totals).map(([stat, total]) =>
            total ? (
              <div key={stat}>
                {total > 0 ? "⬆️" : "⬇️"} {Math.abs(total)}% {stat}
              </div>
            ) : null,
          )}
        </div>

        {/* Individual buffs */}
        <div className="mt-1 text-xs">
          {c.buffs.map((b) => (
            <div key={b.id}>
              {b.name}: {b.value > 0 ? "+" : ""}
              {b.value}% {b.stat} ({b.duration})
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex grow flex-col justify-between"
      style={{
        background: `url(${initialState.bgUrl}) no-repeat center center fixed`,
        backgroundSize: "contain",
      }}
    >
      <div className="flex shrink flex-col place-content-center">
        <h3 className="mt-2 text-center text-2xl font-bold text-gray-100 shadow-2xl">
          Turn {fullState?.turn ?? uiState.turn}
        </h3>

        <div className="flex place-content-center items-center justify-center text-gray-200">
          {enemies.map(renderChar)}
        </div>

        <button
          disabled={
            resolveTurn.isPending ||
            uiState.status !== "active" ||
            eventIndex < fullState!.events.length
          }
          onClick={() => resolveTurn.mutate({ fightId })}
          className={`mt-5 block bg-[url(/buttons/Button.png)] bg-contain bg-center bg-no-repeat px-10 py-6 text-lg font-bold text-gray-200 transition-transform hover:cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Play Turn
        </button>
      </div>

      {currentEvent && (
        <div className="fixed bottom-0 rounded bg-gray-800 p-2 text-center text-white">
          {JSON.stringify(currentEvent)}
        </div>
      )}

      <div className="flex shrink justify-center text-gray-200">
        {allies.map(renderChar)}
      </div>
    </div>
  );
}
