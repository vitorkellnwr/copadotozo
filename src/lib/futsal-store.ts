import { useEffect, useState, useCallback } from "react";

export type PlayerLimit = 5 | 6 | 7;

export interface Player {
  id: string;
  name: string;
  number: number;
  position?: string;
  goals: number;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  limit: PlayerLimit;
  players: Player[];
}

export interface Match {
  id: string;
  homeId: string;
  awayId: string;
  round: number;
  played: boolean;
  homeGoals: number;
  awayGoals: number;
  date?: string;
  scorers: { playerId: string; teamId: string }[];
}

export interface Tournament {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  teams: Team[];
  matches: Match[];
}

interface StoreShape {
  tournaments: Tournament[];
  activeId: string | null;
}

const KEY = "futsal_manager_v1";

function load(): StoreShape {
  if (typeof window === "undefined") return { tournaments: [], activeId: null };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { tournaments: [], activeId: null };
    const parsed = JSON.parse(raw) as StoreShape;
    // migrate old matches
    parsed.tournaments?.forEach((t) => {
      t.matches?.forEach((m: any) => {
        if (typeof m.round !== "number") m.round = 1;
        if (typeof m.played !== "boolean") m.played = true;
      });
    });
    return parsed;
  } catch {
    return { tournaments: [], activeId: null };
  }
}

const listeners = new Set<() => void>();
let state: StoreShape | null = null;

function ensure(): StoreShape {
  if (!state) state = load();
  return state;
}

function save() {
  if (!state) return;
  localStorage.setItem(KEY, JSON.stringify(state));
  listeners.forEach((l) => l());
}

/** Round-robin schedule using the circle method, then reorder within
 * each round so the last team of one round doesn't open the next. */
function buildSchedule(teamIds: string[]): { homeId: string; awayId: string; round: number }[] {
  const ids = [...teamIds];
  const hasBye = ids.length % 2 === 1;
  if (hasBye) ids.push("__BYE__");
  const n = ids.length;
  const rounds = n - 1;
  const half = n / 2;
  const rotating = ids.slice(1);
  const roundsList: { homeId: string; awayId: string }[][] = [];

  for (let r = 0; r < rounds; r++) {
    const arr = [ids[0], ...rotating];
    const pairs: { homeId: string; awayId: string }[] = [];
    for (let i = 0; i < half; i++) {
      const h = arr[i];
      const a = arr[n - 1 - i];
      if (h !== "__BYE__" && a !== "__BYE__") {
        // alternate home/away by round for fairness
        pairs.push(r % 2 === 0 ? { homeId: h, awayId: a } : { homeId: a, awayId: h });
      }
    }
    roundsList.push(pairs);
    rotating.unshift(rotating.pop()!);
  }

  // Reorder within rounds to avoid the "closing team" also being the "opener" of the next round.
  const out: { homeId: string; awayId: string; round: number }[] = [];
  for (let r = 0; r < roundsList.length; r++) {
    const round = roundsList[r];
    if (r > 0) {
      const prevLast = out[out.length - 1];
      const conflict = new Set([prevLast.homeId, prevLast.awayId]);
      const idx = round.findIndex((m) => !conflict.has(m.homeId) && !conflict.has(m.awayId));
      if (idx > 0) {
        const [pick] = round.splice(idx, 1);
        round.unshift(pick);
      }
    }
    round.forEach((m) => out.push({ ...m, round: r + 1 }));
  }
  return out;
}

export function useFutsalStore() {
  const [, force] = useState(0);
  useEffect(() => {
    if (!state) state = load();
    force((n) => n + 1);
    const l = () => force((n) => n + 1);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);

  const s = ensure();

  return {
    state: s,
    activeTournament: s.tournaments.find((t) => t.id === s.activeId) || null,

    setActive: useCallback((id: string | null) => {
      state!.activeId = id; save();
    }, []),

    addTournament: (name: string, description?: string) => {
      state!.tournaments.push({
        id: crypto.randomUUID(), name, description,
        createdAt: new Date().toISOString(), teams: [], matches: [],
      });
      if (!state!.activeId) state!.activeId = state!.tournaments[state!.tournaments.length - 1].id;
      save();
    },
    updateTournament: (id: string, patch: Partial<Tournament>) => {
      const t = state!.tournaments.find((x) => x.id === id);
      if (t) Object.assign(t, patch);
      save();
    },
    deleteTournament: (id: string) => {
      state!.tournaments = state!.tournaments.filter((t) => t.id !== id);
      if (state!.activeId === id) state!.activeId = state!.tournaments[0]?.id || null;
      save();
    },

    addTeam: (tid: string, name: string, color: string, limit: PlayerLimit) => {
      const t = state!.tournaments.find((x) => x.id === tid);
      if (!t) return;
      t.teams.push({ id: crypto.randomUUID(), name, color, limit, players: [] });
      save();
    },
    deleteTeam: (tid: string, teamId: string) => {
      const t = state!.tournaments.find((x) => x.id === tid);
      if (!t) return;
      t.teams = t.teams.filter((x) => x.id !== teamId);
      t.matches = t.matches.filter((m) => m.homeId !== teamId && m.awayId !== teamId);
      save();
    },

    addPlayer: (tid: string, teamId: string, name: string, number: number, position?: string) => {
      const team = state!.tournaments.find((x) => x.id === tid)?.teams.find((t) => t.id === teamId);
      if (!team) return { ok: false, error: "Time não encontrado" };
      if (team.players.length >= team.limit) return { ok: false, error: `Limite de ${team.limit} jogadores atingido` };
      team.players.push({ id: crypto.randomUUID(), name, number, position, goals: 0 });
      save();
      return { ok: true };
    },
    deletePlayer: (tid: string, teamId: string, pid: string) => {
      const team = state!.tournaments.find((x) => x.id === tid)?.teams.find((t) => t.id === teamId);
      if (!team) return;
      team.players = team.players.filter((p) => p.id !== pid);
      save();
    },

    generateSchedule: (tid: string) => {
      const t = state!.tournaments.find((x) => x.id === tid);
      if (!t || t.teams.length < 2) return;
      const pairs = buildSchedule(t.teams.map((tm) => tm.id));
      t.matches = pairs.map((p) => ({
        id: crypto.randomUUID(),
        homeId: p.homeId, awayId: p.awayId, round: p.round,
        played: false, homeGoals: 0, awayGoals: 0, scorers: [],
      }));
      // clear player goals
      t.teams.forEach((tm) => tm.players.forEach((p) => (p.goals = 0)));
      save();
    },

    recordResult: (
      tid: string, matchId: string,
      homeGoals: number, awayGoals: number,
      scorers: { playerId: string; teamId: string }[]
    ) => {
      const t = state!.tournaments.find((x) => x.id === tid);
      if (!t) return;
      const m = t.matches.find((x) => x.id === matchId);
      if (!m) return;
      // rollback previous scorers if replaying
      if (m.played) {
        m.scorers.forEach(({ playerId, teamId }) => {
          const p = t.teams.find((x) => x.id === teamId)?.players.find((pl) => pl.id === playerId);
          if (p) p.goals = Math.max(0, p.goals - 1);
        });
      }
      m.homeGoals = homeGoals;
      m.awayGoals = awayGoals;
      m.scorers = scorers;
      m.played = true;
      m.date = new Date().toISOString();
      scorers.forEach(({ playerId, teamId }) => {
        const p = t.teams.find((x) => x.id === teamId)?.players.find((pl) => pl.id === playerId);
        if (p) p.goals += 1;
      });
      save();
    },

    resetMatch: (tid: string, matchId: string) => {
      const t = state!.tournaments.find((x) => x.id === tid);
      if (!t) return;
      const m = t.matches.find((x) => x.id === matchId);
      if (!m || !m.played) return;
      m.scorers.forEach(({ playerId, teamId }) => {
        const p = t.teams.find((x) => x.id === teamId)?.players.find((pl) => pl.id === playerId);
        if (p) p.goals = Math.max(0, p.goals - 1);
      });
      m.played = false; m.homeGoals = 0; m.awayGoals = 0; m.scorers = [];
      save();
    },

    clearSchedule: (tid: string) => {
      const t = state!.tournaments.find((x) => x.id === tid);
      if (!t) return;
      t.matches = [];
      t.teams.forEach((tm) => tm.players.forEach((p) => (p.goals = 0)));
      save();
    },
  };
}

export interface Standing {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export function computeStandings(t: Tournament): Standing[] {
  const map = new Map<string, Standing>();
  t.teams.forEach((team) => {
    map.set(team.id, { team, played: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, gd: 0, points: 0 });
  });
  t.matches.filter((m) => m.played).forEach((m) => {
    const h = map.get(m.homeId);
    const a = map.get(m.awayId);
    if (!h || !a) return;
    h.played++; a.played++;
    h.gf += m.homeGoals; h.ga += m.awayGoals;
    a.gf += m.awayGoals; a.ga += m.homeGoals;
    if (m.homeGoals > m.awayGoals) { h.wins++; h.points += 3; a.losses++; }
    else if (m.homeGoals < m.awayGoals) { a.wins++; a.points += 3; h.losses++; }
    else { h.draws++; a.draws++; h.points++; a.points++; }
  });
  map.forEach((s) => { s.gd = s.gf - s.ga; });
  return Array.from(map.values()).sort((a, b) =>
    b.points - a.points || b.gd - a.gd || b.gf - a.gf || a.team.name.localeCompare(b.team.name)
  );
}
