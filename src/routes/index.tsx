import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useFutsalStore,
  computeStandings,
  type PlayerLimit,
  type Team,
  type Tournament,
  type Match,
} from "@/lib/futsal-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FutsalPro — Gerenciador de Torneios de Futsal" },
      { name: "description", content: "Organize ligas, times, jogadores, partidas, classificação, artilharia e mata-mata de futsal em um só lugar." },
      { property: "og:title", content: "FutsalPro — Gerenciador de Torneios de Futsal" },
      { property: "og:description", content: "Ligas, classificação, artilharia e mata-mata em uma interface moderna." },
    ],
  }),
  component: App,
});

type Tab = "torneios" | "times" | "jogadores" | "partidas" | "classificacao" | "artilharia" | "matamata";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "torneios", label: "Torneios", icon: "🏆" },
  { id: "times", label: "Times", icon: "🛡️" },
  { id: "jogadores", label: "Jogadores", icon: "👥" },
  { id: "partidas", label: "Partidas", icon: "⚽" },
  { id: "classificacao", label: "Classificação", icon: "📊" },
  { id: "artilharia", label: "Artilharia", icon: "🥅" },
  { id: "matamata", label: "Mata-mata", icon: "🎯" },
];

function App() {
  const [tab, setTab] = useState<Tab>("torneios");
  const store = useFutsalStore();
  const active = store.activeTournament;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow text-xl">
              ⚽
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">FutsalPro</h1>
              <p className="text-xs text-muted-foreground hidden sm:block">Gerenciador de torneios</p>
            </div>
          </div>
          {active && (
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Torneio ativo</div>
              <div className="font-semibold text-sm truncate max-w-[180px] sm:max-w-none">{active.name}</div>
            </div>
          )}
        </div>
        <nav className="max-w-7xl mx-auto px-2 pb-2 flex gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === t.id
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <span className="mr-1.5">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 pb-24">
        {!active && tab !== "torneios" && (
          <EmptyState
            title="Nenhum torneio selecionado"
            message="Crie ou selecione um torneio na aba Torneios para começar."
            action={() => setTab("torneios")}
            actionLabel="Ir para Torneios"
          />
        )}
        {tab === "torneios" && <TournamentsView store={store} />}
        {tab === "times" && active && <TeamsView store={store} tournament={active} />}
        {tab === "jogadores" && active && <PlayersView store={store} tournament={active} />}
        {tab === "partidas" && active && <MatchesView store={store} tournament={active} />}
        {tab === "classificacao" && active && <StandingsView tournament={active} />}
        {tab === "artilharia" && active && <ScorersView tournament={active} />}
        {tab === "matamata" && active && <BracketView tournament={active} />}
      </main>
    </div>
  );
}

/* ---------- Shared UI ---------- */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-gradient-surface border border-border rounded-2xl shadow-card ${className}`}>{children}</div>
  );
}

function Button({
  children, onClick, variant = "primary", type = "button", disabled, className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger" | "accent" | "outline";
  type?: "button" | "submit";
  disabled?: boolean;
  className?: string;
}) {
  const styles = {
    primary: "bg-gradient-primary text-primary-foreground shadow-glow hover:brightness-110",
    accent: "bg-gradient-accent text-accent-foreground hover:brightness-110",
    ghost: "bg-transparent text-foreground hover:bg-secondary",
    outline: "border border-border bg-transparent hover:bg-secondary",
    danger: "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition ${props.className || ""}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition ${props.className || ""}`}
    />
  );
}

function EmptyState({ title, message, action, actionLabel }: { title: string; message: string; action?: () => void; actionLabel?: string }) {
  return (
    <Card className="p-8 text-center">
      <div className="text-5xl mb-3">⚽</div>
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4">{message}</p>
      {action && actionLabel && <Button onClick={action}>{actionLabel}</Button>}
    </Card>
  );
}

function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------- Tournaments ---------- */

function TournamentsView({ store }: { store: ReturnType<typeof useFutsalStore> }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  return (
    <div className="space-y-6">
      <SectionHeader title="Torneios" subtitle="Crie e gerencie suas ligas de futsal" />

      <Card className="p-4 sm:p-6">
        <h3 className="font-semibold mb-3">Novo torneio</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            store.addTournament(name.trim(), desc.trim() || undefined);
            setName(""); setDesc("");
          }}
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <Input placeholder="Nome do torneio" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Descrição (opcional)" value={desc} onChange={(e) => setDesc(e.target.value)} />
          <Button type="submit">Criar</Button>
        </form>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {store.state.tournaments.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState title="Nenhum torneio ainda" message="Crie seu primeiro torneio acima." />
          </div>
        )}
        {store.state.tournaments.map((t) => {
          const isActive = store.state.activeId === t.id;
          return (
            <Card key={t.id} className={`p-4 flex flex-col gap-3 ${isActive ? "ring-2 ring-primary" : ""}`}>
              {editing === t.id ? (
                <div className="flex gap-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <Button onClick={() => { store.updateTournament(t.id, { name: editName }); setEditing(null); }}>OK</Button>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-lg">{t.name}</h4>
                    {isActive && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">ATIVO</span>}
                  </div>
                  {t.description && <p className="text-sm text-muted-foreground mt-1">{t.description}</p>}
                </div>
              )}
              <div className="text-xs text-muted-foreground flex gap-3">
                <span>{t.teams.length} times</span>
                <span>{t.matches.length} partidas</span>
                <span>{new Date(t.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-auto">
                {!isActive && <Button variant="primary" onClick={() => store.setActive(t.id)}>Selecionar</Button>}
                <Button variant="outline" onClick={() => { setEditing(t.id); setEditName(t.name); }}>Editar</Button>
                <Button variant="danger" onClick={() => { if (confirm("Excluir torneio?")) store.deleteTournament(t.id); }}>Excluir</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Teams ---------- */

const TEAM_COLORS = ["#22c55e", "#ef4444", "#3b82f6", "#f59e0b", "#a855f7", "#ec4899", "#14b8a6", "#f97316"];

function TeamsView({ store, tournament }: { store: ReturnType<typeof useFutsalStore>; tournament: Tournament }) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [limit, setLimit] = useState<PlayerLimit>(5);

  return (
    <div className="space-y-6">
      <SectionHeader title="Times" subtitle={`Gerencie os times de ${tournament.name}`} />

      <Card className="p-4 sm:p-6">
        <h3 className="font-semibold mb-3">Novo time</h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            store.addTeam(tournament.id, name.trim(), color, limit);
            setName("");
          }}
          className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]"
        >
          <Input placeholder="Nome do time" value={name} onChange={(e) => setName(e.target.value)} />
          <div className="flex gap-1 items-center">
            {TEAM_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition ${color === c ? "ring-2 ring-offset-2 ring-offset-background ring-white scale-110" : ""}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <Select value={limit} onChange={(e) => setLimit(Number(e.target.value) as PlayerLimit)}>
            <option value={5}>5 jogadores</option>
            <option value={6}>6 jogadores</option>
            <option value={7}>7 jogadores</option>
          </Select>
          <Button type="submit">Adicionar</Button>
        </form>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tournament.teams.length === 0 && (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState title="Nenhum time cadastrado" message="Adicione o primeiro time acima." />
          </div>
        )}
        {tournament.teams.map((team) => (
          <Card key={team.id} className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-lg" style={{ backgroundColor: team.color }}>
                {team.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold truncate">{team.name}</h4>
                <p className="text-xs text-muted-foreground">{team.players.length}/{team.limit} jogadores</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="danger" className="flex-1" onClick={() => { if (confirm("Excluir time?")) store.deleteTeam(tournament.id, team.id); }}>Excluir</Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ---------- Players ---------- */

function PlayersView({ store, tournament }: { store: ReturnType<typeof useFutsalStore>; tournament: Tournament }) {
  const [teamId, setTeamId] = useState<string>(tournament.teams[0]?.id || "");
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [position, setPosition] = useState("");
  const [err, setErr] = useState("");

  const team = tournament.teams.find((t) => t.id === teamId);

  if (tournament.teams.length === 0) {
    return <EmptyState title="Cadastre um time primeiro" message="Adicione times antes de cadastrar jogadores." />;
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Jogadores" subtitle="Fichário de jogadores por time" />

      <Card className="p-4 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-4">
          <Select value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            {tournament.teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Select>
          <Input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <Input placeholder="Nº camisa" type="number" value={number} onChange={(e) => setNumber(e.target.value)} />
          <Input placeholder="Posição (opcional)" value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <div className="flex items-center justify-between mt-3 gap-2">
          <span className="text-xs text-muted-foreground">{team && `${team.players.length}/${team.limit} jogadores`}</span>
          <Button onClick={() => {
            setErr("");
            if (!name.trim() || !number) return;
            const r = store.addPlayer(tournament.id, teamId, name.trim(), Number(number), position.trim() || undefined);
            if (!r.ok) { setErr(r.error!); return; }
            setName(""); setNumber(""); setPosition("");
          }}>Adicionar jogador</Button>
        </div>
        {err && <p className="text-xs text-destructive mt-2">{err}</p>}
      </Card>

      {team && (
        <Card className="p-4 sm:p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: team.color }} />
            Fichário — {team.name}
          </h3>
          {team.players.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum jogador cadastrado.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2">
              {team.players.sort((a, b) => a.number - b.number).map((p) => (
                <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
                  <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center font-bold text-primary-foreground">
                    {p.number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground">{p.position || "—"} · {p.goals} gol{p.goals !== 1 ? "s" : ""}</div>
                  </div>
                  <button onClick={() => { if (confirm("Excluir jogador?")) store.deletePlayer(tournament.id, team.id, p.id); }}
                    className="text-destructive hover:bg-destructive/10 w-8 h-8 rounded-lg">✕</button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

/* ---------- Matches ---------- */

function MatchesView({ store, tournament }: { store: ReturnType<typeof useFutsalStore>; tournament: Tournament }) {
  if (tournament.teams.length < 2) {
    return <EmptyState title="Cadastre ao menos 2 times" message="Adicione times para gerar a tabela de jogos." />;
  }

  const grouped = useMemo(() => {
    const map = new Map<number, Match[]>();
    tournament.matches.forEach((m) => {
      if (!map.has(m.round)) map.set(m.round, []);
      map.get(m.round)!.push(m);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [tournament.matches]);

  const total = tournament.matches.length;
  const done = tournament.matches.filter((m) => m.played).length;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Partidas"
        subtitle={total > 0 ? `${done}/${total} jogos concluídos` : "Todos contra todos"}
        action={
          <div className="flex gap-2">
            {total === 0 ? (
              <Button onClick={() => store.generateSchedule(tournament.id)}>Gerar tabela</Button>
            ) : (
              <Button variant="danger" onClick={() => {
                if (confirm("Regenerar a tabela? Todos os resultados e gols serão apagados.")) {
                  store.generateSchedule(tournament.id);
                }
              }}>Regenerar</Button>
            )}
          </div>
        }
      />

      {total === 0 && (
        <EmptyState
          title="Tabela não gerada"
          message='Clique em "Gerar tabela" para criar automaticamente todos os confrontos (todos contra todos), organizados sem que um time jogue duas partidas seguidas.'
        />
      )}

      <div className="space-y-6">
        {grouped.map(([round, matches]) => (
          <div key={round}>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Rodada {round}</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="space-y-2">
              {matches.map((m) => (
                <MatchRow key={m.id} match={m} tournament={tournament} store={store} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MatchRow({ match, tournament, store }: { match: Match; tournament: Tournament; store: ReturnType<typeof useFutsalStore> }) {
  const h = tournament.teams.find((t) => t.id === match.homeId);
  const a = tournament.teams.find((t) => t.id === match.awayId);
  const [open, setOpen] = useState(false);
  const [hg, setHg] = useState(match.homeGoals);
  const [ag, setAg] = useState(match.awayGoals);
  const initialHome = match.scorers.filter((s) => s.teamId === match.homeId).map((s) => s.playerId);
  const initialAway = match.scorers.filter((s) => s.teamId === match.awayId).map((s) => s.playerId);
  const [homeScorers, setHomeScorers] = useState<string[]>(initialHome);
  const [awayScorers, setAwayScorers] = useState<string[]>(initialAway);

  if (!h || !a) return null;

  const resize = (arr: string[], size: number) => {
    if (size > arr.length) return [...arr, ...Array(size - arr.length).fill("")];
    return arr.slice(0, size);
  };

  const canSubmit =
    hg >= 0 && ag >= 0 &&
    (hg === 0 || (h.players.length > 0 && homeScorers.length === hg && homeScorers.every(Boolean))) &&
    (ag === 0 || (a.players.length > 0 && awayScorers.length === ag && awayScorers.every(Boolean)));

  return (
    <Card className={`p-3 ${match.played ? "border-primary/40" : ""}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 text-left"
      >
        <div className="flex-1 flex items-center gap-2 justify-end min-w-0">
          <span className="font-semibold truncate">{h.name}</span>
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
        </div>
        <div className={`font-bold text-lg tabular-nums px-3 py-1 rounded-lg min-w-[70px] text-center ${match.played ? "bg-gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
          {match.played ? `${match.homeGoals} : ${match.awayGoals}` : "vs"}
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
          <span className="font-semibold truncate">{a.name}</span>
        </div>
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-border space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <ScorerBlock
              team={h}
              goals={hg}
              setGoals={(v) => { setHg(v); setHomeScorers(resize(homeScorers, v)); }}
              scorers={homeScorers}
              setScorers={setHomeScorers}
            />
            <ScorerBlock
              team={a}
              goals={ag}
              setGoals={(v) => { setAg(v); setAwayScorers(resize(awayScorers, v)); }}
              scorers={awayScorers}
              setScorers={setAwayScorers}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={!canSubmit}
              onClick={() => {
                const scorers = [
                  ...homeScorers.map((pid) => ({ playerId: pid, teamId: h.id })),
                  ...awayScorers.map((pid) => ({ playerId: pid, teamId: a.id })),
                ];
                store.recordResult(tournament.id, match.id, hg, ag, scorers);
                setOpen(false);
              }}
            >
              {match.played ? "Atualizar resultado" : "Salvar resultado"}
            </Button>
            {match.played && (
              <Button variant="danger" onClick={() => {
                if (confirm("Desfazer resultado?")) {
                  store.resetMatch(tournament.id, match.id);
                  setHg(0); setAg(0); setHomeScorers([]); setAwayScorers([]);
                }
              }}>Desfazer</Button>
            )}
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          </div>
          {!canSubmit && (hg > 0 || ag > 0) && (
            <p className="text-xs text-warning">Selecione o jogador que marcou cada gol.</p>
          )}
        </div>
      )}
    </Card>
  );
}

function ScorerBlock({
  team, goals, setGoals, scorers, setScorers,
}: {
  team: Team; goals: number; setGoals: (n: number) => void;
  scorers: string[]; setScorers: (s: string[]) => void;
}) {
  return (
    <div className="p-3 rounded-lg bg-secondary space-y-2">
      <div className="flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: team.color }} />
        <span className="text-sm font-semibold truncate flex-1">{team.name}</span>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setGoals(Math.max(0, goals - 1))}
          className="w-8 h-8 rounded-lg bg-background font-bold hover:bg-destructive/20">−</button>
        <div className="flex-1 text-center text-2xl font-bold tabular-nums">{goals}</div>
        <button type="button" onClick={() => setGoals(goals + 1)}
          className="w-8 h-8 rounded-lg bg-background font-bold hover:bg-primary/20">+</button>
      </div>
      {goals > 0 && (
        <div className="space-y-1.5">
          {team.players.length === 0 ? (
            <p className="text-xs text-destructive">Cadastre jogadores neste time.</p>
          ) : (
            Array.from({ length: goals }).map((_, i) => (
              <Select
                key={i}
                value={scorers[i] || ""}
                onChange={(e) => {
                  const next = [...scorers];
                  next[i] = e.target.value;
                  setScorers(next);
                }}
                className="text-xs"
              >
                <option value="">Gol {i + 1} — selecione o jogador</option>
                {team.players.map((p) => (
                  <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                ))}
              </Select>
            ))
          )}
        </div>
      )}
    </div>
  );
}


/* ---------- Standings ---------- */

function StandingsView({ tournament }: { tournament: Tournament }) {
  const rows = useMemo(() => computeStandings(tournament), [tournament]);

  if (rows.length === 0) return <EmptyState title="Sem times" message="Cadastre times para ver a classificação." />;

  return (
    <div className="space-y-6">
      <SectionHeader title="Classificação" subtitle="Pontuação FIFA: V=3, E=1, D=0" />
      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary">
            <tr className="text-left">
              <th className="px-3 py-3 font-semibold">#</th>
              <th className="px-3 py-3 font-semibold">Time</th>
              <th className="px-2 py-3 font-bold text-primary">P</th>
              <th className="px-2 py-3 font-semibold">J</th>
              <th className="px-2 py-3 font-semibold">V</th>
              <th className="px-2 py-3 font-semibold">E</th>
              <th className="px-2 py-3 font-semibold">D</th>
              <th className="px-2 py-3 font-semibold">GP</th>
              <th className="px-2 py-3 font-semibold">GC</th>
              <th className="px-2 py-3 font-semibold">SG</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.team.id} className="border-t border-border hover:bg-secondary/50">
                <td className="px-3 py-3 font-bold text-muted-foreground">{i + 1}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: r.team.color }} />
                    <span className="font-semibold">{r.team.name}</span>
                  </div>
                </td>
                <td className="px-2 py-3 font-bold text-primary tabular-nums">{r.points}</td>
                <td className="px-2 py-3 tabular-nums">{r.played}</td>
                <td className="px-2 py-3 tabular-nums">{r.wins}</td>
                <td className="px-2 py-3 tabular-nums">{r.draws}</td>
                <td className="px-2 py-3 tabular-nums">{r.losses}</td>
                <td className="px-2 py-3 tabular-nums">{r.gf}</td>
                <td className="px-2 py-3 tabular-nums">{r.ga}</td>
                <td className="px-2 py-3 tabular-nums font-semibold">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ---------- Scorers ---------- */

function ScorersView({ tournament }: { tournament: Tournament }) {
  const ranking = useMemo(() => {
    const list: { player: { name: string; number: number; goals: number }; team: Team }[] = [];
    tournament.teams.forEach((t) => t.players.forEach((p) => {
      if (p.goals > 0) list.push({ player: p, team: t });
    }));
    return list.sort((a, b) => b.player.goals - a.player.goals);
  }, [tournament]);

  return (
    <div className="space-y-6">
      <SectionHeader title="Artilharia" subtitle="Ranking de goleadores" />
      {ranking.length === 0 ? (
        <EmptyState title="Nenhum gol registrado" message="Registre partidas com marcadores para ver a artilharia." />
      ) : (
        <Card className="divide-y divide-border">
          {ranking.map((r, i) => (
            <div key={`${r.team.id}-${r.player.number}`} className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                i === 0 ? "bg-gradient-accent text-accent-foreground" : "bg-secondary"
              }`}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{r.player.name}</div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.team.color }} />
                  {r.team.name} · Nº {r.player.number}
                </div>
              </div>
              <div className="text-2xl font-bold text-primary tabular-nums">{r.player.goals}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

/* ---------- Bracket ---------- */

function BracketView({ tournament }: { tournament: Tournament }) {
  const standings = useMemo(() => computeStandings(tournament), [tournament]);
  const [qty, setQty] = useState(4);

  const bracket = useMemo(() => {
    const seeds = standings.slice(0, qty);
    if (seeds.length < 2) return [];
    const rounds: { home: string | null; away: string | null; label: string }[][] = [];
    const first: { home: string | null; away: string | null; label: string }[] = [];
    for (let i = 0; i < seeds.length / 2; i++) {
      const home = seeds[i];
      const away = seeds[seeds.length - 1 - i];
      first.push({ home: home ? `${i + 1}º ${home.team.name}` : null, away: away ? `${seeds.length - i}º ${away.team.name}` : null, label: labelFor(seeds.length) });
    }
    rounds.push(first);
    let count = first.length;
    while (count > 1) {
      count = Math.ceil(count / 2);
      const size = count * 2;
      rounds.push(Array.from({ length: count }, () => ({ home: null, away: null, label: labelFor(size) })));
    }
    return rounds;
  }, [standings, qty]);

  if (standings.length < 2) return <EmptyState title="Times insuficientes" message="Cadastre pelo menos 2 times." />;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Mata-mata"
        subtitle="Chaveamento a partir da classificação atual"
        action={
          <Select value={qty} onChange={(e) => setQty(Number(e.target.value))} className="w-auto">
            {[2, 4, 8, 16].filter((n) => n <= standings.length).map((n) => (
              <option key={n} value={n}>{n} times</option>
            ))}
          </Select>
        }
      />

      <div className="overflow-x-auto">
        <div className="flex gap-6 min-w-max pb-4">
          {bracket.map((round, ri) => (
            <div key={ri} className="flex flex-col justify-around gap-4 min-w-[220px]">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold text-center">
                {round[0]?.label}
              </div>
              {round.map((m, mi) => (
                <Card key={mi} className="p-3 space-y-2">
                  <div className="px-2 py-1.5 rounded-md bg-secondary text-sm truncate">
                    {m.home || <span className="text-muted-foreground italic">A definir</span>}
                  </div>
                  <div className="text-[10px] text-muted-foreground text-center">vs</div>
                  <div className="px-2 py-1.5 rounded-md bg-secondary text-sm truncate">
                    {m.away || <span className="text-muted-foreground italic">A definir</span>}
                  </div>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function labelFor(n: number): string {
  if (n === 2) return "Final";
  if (n === 4) return "Semifinal";
  if (n === 8) return "Quartas";
  if (n === 16) return "Oitavas";
  return `Fase de ${n}`;
}
