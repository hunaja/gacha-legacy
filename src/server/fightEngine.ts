export type RolledTurnSide = "ally" | "enemy";
export type SpellName = "Pick Punch" | "Powered Heal" | "Battle Cry";
export type CharacterClass = "DPS" | "TANK" | "HEALER";
export type BuffStat = "atk" | "mAtk" | "def" | "mDef" | "hp" | "maxHp";

export type Buff = {
  id: string;
  name: string;
  stat: BuffStat;
  value: number; // Percentage
  duration: number; // Turns remaining
  sourceId: string;
};

export type BuffWithoutId = Omit<Buff, "id">;

export type ActiveSpell = {
  type: "active";
  name: SpellName;
  currentMana: number;
  requiredMana: number;
  manaIncrease: number;
  maxMana: number;
};

export type PassiveSpell = {
  type: "passive";
  name: string;
  duration: number;
};

export type CharacterState = {
  side: "enemy" | "ally";
  fightId: string;
  id: string;
  name: string;
  class: "HEALER" | "TANK" | "DPS" | "BUFF";
  maxHp: number;
  hp: number;
  atk: number;
  mAtk: number;
  def: number;
  mDef: number;
  position: number;
  imageUrl: string;
  activeSpell?: ActiveSpell;
  buffs: Buff[];
};

export type GameOverFightEvent = {
  action: "victory" | "defeat";
};

export type BasicFightEvent = {
  action: "attack" | "heal";
  actor: string;
  castName: SpellName | "Basic Attack" | "Basic Heal";
  amount: number;
  targets: string[];
};

export type BuffFightEvent = {
  action: "buff";
  actor: string;
  castName: SpellName;
  buff: Omit<Buff, "sourceId" | "id">;
  targets: string[];
};

export type BuffExpiredFightEvent = {
  action: "buffExpired";
  actor: string;
  buffName: string;
  buff: Omit<Buff, "sourceId" | "id">;
  targets: string[];
};

export type FightEvent =
  | GameOverFightEvent
  | BasicFightEvent
  | BuffFightEvent
  | BuffExpiredFightEvent;

export type FightState = {
  turn: number;
  order: { id: string; roll: number }[];
  events: FightEvent[];
  latestEventsIndex: number;
  characters: CharacterState[];
  status: "active" | "win" | "lose";
  bgUrl: string;
  magicalCritsEnabled: boolean;
};

const rand10 = () => Math.floor(Math.random() * 10) + 1;

export const getBuffedStat = (
  entity: CharacterState,
  stat: BuffStat,
): number => {
  const baseStat = entity[stat];
  const buffModifier = entity.buffs
    .filter((b) => b.stat === stat)
    .reduce((sum, buff) => sum + buff.value, 0);

  return Math.floor(baseStat * (1 + buffModifier / 100));
};

export const clampHp = (ally: CharacterState) => {
  ally.hp = Math.min(ally.hp, getBuffedStat(ally, "maxHp"));
};

export const applyBuff = (
  target: CharacterState,
  buff: Omit<Buff, "id">,
): Buff => {
  const newBuff: Buff = {
    ...buff,
    id: `${buff.sourceId}-${buff.name}-${Date.now()}`,
  };
  target.buffs.push(newBuff);
  return newBuff;
};

export const tickBuffs = (
  characters: CharacterState[],
  events: FightEvent[],
): void => {
  for (const character of characters) {
    const expired: Buff[] = [];
    character.buffs = character.buffs
      .map((b) => ({ ...b, duration: b.duration - 1 }))
      .filter((b) => {
        if (b.duration <= 0) {
          expired.push(b);
          return false;
        }
        return true;
      });

    for (const buff of expired) {
      events.push({
        action: "buffExpired",
        actor: buff.sourceId,
        buff: buff,
        buffName: buff.name,
        targets: [character.fightId],
      });
    }
    clampHp(character);
  }
};

export type SpellFn = (
  actor: CharacterState,
  state: FightState,
) => FightEvent | null;

const getOpposingSide = (character: CharacterState) =>
  character.side === "ally" ? "enemy" : "ally";

// TODO Implement crit atks for spell fns. The crit must be enabled with `state.criticalAtk` = true flag
export const spellFns: Record<SpellName, SpellFn> = {
  "Pick Punch": (actor, state) => {
    const target = state.characters
      .filter((c) => c.side === getOpposingSide(actor))
      .find((e) => e.hp > 0);
    if (!target) return null;

    const damage = getBuffedStat(actor, "mAtk");
    target.hp = Math.max(
      0,
      getBuffedStat(target, "hp") + getBuffedStat(target, "mDef") - damage,
    );

    return {
      castName: "Pick Punch",
      action: "attack",
      amount: damage,
      actor: actor.fightId,
      targets: [target.fightId],
    };
  },
  "Powered Heal": (actor, state) => {
    const target = state.characters
      .filter((c) => c.side == actor.side)
      .find((a) => a.hp > 0);
    if (!target) return null;

    const heal = getBuffedStat(actor, "mAtk");
    target.hp = Math.min(
      getBuffedStat(target, "hp") + heal,
      getBuffedStat(target, "maxHp"),
    );

    return {
      castName: "Powered Heal",
      action: "heal",
      actor: actor.fightId,
      amount: heal,
      targets: [target.fightId],
    };
  },
  "Battle Cry": (actor, state) => {
    const livingOnSameSide = state.characters.filter(
      (c) => c.side === actor.side && c.hp > 0,
    );
    if (livingOnSameSide.length === 0) return null;

    const buff: BuffWithoutId = {
      name: "Battle Cry",
      stat: "atk",
      value: 5,
      duration: 3,
      sourceId: actor.id,
    };

    for (const ally of livingOnSameSide) {
      applyBuff(ally, buff);
    }

    return {
      castName: "Battle Cry",
      action: "buff",
      actor: actor.fightId,
      buff,
      targets: livingOnSameSide.map((a) => a.fightId),
    };
  },
};

export const implementedSpellFns = Object.keys(spellFns) as SpellName[];

// TODO:
export const basicAction = (
  actor: CharacterState,
  state: FightState,
): BasicFightEvent | null => {
  if (actor.class === "HEALER") {
    const target = state.characters
      .filter((c) => c.side == actor.side && c.fightId !== actor.fightId)
      .find((a) => a.hp > 0);
    if (!target) return null;

    const heal = getBuffedStat(actor, "atk");
    target.hp = Math.min(
      getBuffedStat(target, "hp") + heal,
      getBuffedStat(target, "maxHp"),
    );

    return {
      castName: "Basic Heal",
      action: "heal",
      actor: actor.fightId,
      amount: heal,
      targets: [target.fightId],
    };
  } else {
    const target = state.characters
      .filter((c) => c.side === getOpposingSide(actor))
      .find((e) => e.hp > 0);
    if (!target) return null;

    // FIX: Use actor's attack, not target's attack
    const damage = getBuffedStat(actor, "atk");
    const actualDamage = Math.max(0, damage - getBuffedStat(target, "def"));

    // Apply damage to target
    target.hp = Math.max(0, target.hp - actualDamage);

    // Return the actual damage dealt (after defense reduction)
    return {
      castName: "Basic Attack",
      action: "attack",
      amount: actualDamage, // This is the actual damage dealt
      actor: actor.fightId,
      targets: [target.fightId],
    };
  }
};

export const resolveTurn = (state: FightState): FightState => {
  const newEvents: FightEvent[] = [];

  const rolls = state.characters
    .filter((a) => a.hp > 0)
    .map((a) => ({
      id: a.fightId,
      side: a.side,
      roll: rand10(),
    }));

  rolls.sort((a, b) => b.roll - a.roll);
  state.order = rolls.map((r) => ({ id: r.id, roll: r.roll }));

  for (const roll of rolls) {
    if (state.status !== "active") break;

    // The ally can only act if it is alive
    const actor = state.characters.find(
      (c) => c.fightId === roll.id && c.hp > 0,
    );
    if (!actor) continue;

    if (actor.activeSpell) {
      if (actor.activeSpell.currentMana >= actor.activeSpell.requiredMana) {
        const event = spellFns[actor.activeSpell.name](actor, state);
        if (event) {
          actor.activeSpell.currentMana -= actor.activeSpell.requiredMana;
          newEvents.push(event);
        }
        continue;
      } else {
        actor.activeSpell.currentMana += actor.activeSpell.manaIncrease;
      }
    }

    const event = basicAction(actor, state);
    if (event) newEvents.push(event);

    if (state.characters.every((c) => c.hp <= 0)) {
      state.status = "lose";
      newEvents.push({ action: "defeat" });
    } else if (
      state.characters.filter((c) => c.side === "enemy").every((e) => e.hp <= 0)
    ) {
      state.status = "win";
      newEvents.push({ action: "victory" });
    } else if (
      state.characters.filter((c) => c.side === "ally").every((a) => a.hp <= 0)
    ) {
      state.status = "lose";
      newEvents.push({ action: "defeat" });
    }
  }

  if (state.status === "active") {
    tickBuffs(state.characters, newEvents);
    state.turn += 1;
  }

  state.events = [...state.events, ...newEvents];
  return state;
};
