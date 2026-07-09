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
  homeGoals: number;
  awayGoals: number;
  date: string;
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
    return JSON.parse(raw);
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

  const api = {
    state: s,
    activeTournament: s.tournaments.find((t) => t.id === s.activeId) || null,

    setActive: useCallback((id: string | null) => {
      state!.activeId = id;
      save();
    }, []),

    addTournament: (name: string, description?: string) => {
      state!.tournaments.push({
        id: crypto.randomUUID(),
        name,
        description,
        createdAt: new Date().toISOString(),
        teams: [],
        matches: [],
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

    updateTeam: (tid: string, teamId: string, patch: Partial<Team>) => {
      const team = state!.tournaments.find((x) => x.id === tid)?.teams.find((t) => t.id === teamId);
      if (team) Object.assign(team, patch);
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

    addMatch: (tid: string, homeId: string, awayId: string, homeGoals: number, awayGoals: number, scorers: { playerId: string; teamId: string }[]) => {
      const t = state!.tournaments.find((x) => x.id === tid);
      if (!t) return;
      t.matches.push({
        id: crypto.randomUUID(),
        homeId, awayId, homeGoals, awayGoals,
        date: new Date().toISOString(),
        scorers,
      });
      scorers.forEach(({ playerId, teamId }) => {
        const p = t.teams.find((x) => x.id === teamId)?.players.find((pl) => pl.id === playerId);
        if (p) p.goals += 1;
      });
      save();
    },

    deleteMatch: (tid: string, matchId: string) => {
      const t = state!.tournaments.find((x) => x.id === tid);
      if (!t) return;
      const m = t.matches.find((x) => x.id === matchId);
      if (m) {
        m.scorers.forEach(({ playerId, teamId }) => {
          const p = t.teams.find((x) => x.id === teamId)?.players.find((pl) => pl.id === playerId);
          if (p) p.goals = Math.max(0, p.goals - 1);
        });
      }
      t.matches = t.matches.filter((x) => x.id !== matchId);
      save();
    },
  };

  return api;
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
  t.matches.forEach((m) => {
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
