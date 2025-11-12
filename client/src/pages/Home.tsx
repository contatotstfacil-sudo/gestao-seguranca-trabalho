import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar, CalendarDays, Clock, ListChecks, Repeat, Sparkles, Trash2 } from "lucide-react";
import { nanoid } from "nanoid";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type NotaPrioridade = "alta" | "media" | "baixa";

type Nota = {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: NotaPrioridade;
  createdAt: string;
};

const HOME_NOTAS_STORAGE_KEY = "home-painel-notas";
const HOME_ROTINAS_STORAGE_KEY = "home-painel-rotinas";

const prioridadeEstilos: Record<NotaPrioridade, { label: string; badgeClass: string; containerClass: string; dotClass: string }> = {
  alta: {
    label: "Alta prioridade",
    badgeClass: "bg-red-100 text-red-700 border border-red-200",
    containerClass: "border-red-200/80 bg-red-50/80",
    dotClass: "bg-red-500",
  },
  media: {
    label: "Prioridade média",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    containerClass: "border-amber-200/80 bg-amber-50/70",
    dotClass: "bg-amber-500",
  },
  baixa: {
    label: "Prioridade baixa",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    containerClass: "border-emerald-200/80 bg-emerald-50/70",
    dotClass: "bg-emerald-500",
  },
};

const prioridadePeso: Record<NotaPrioridade, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
};

type Recorrencia = "unica" | "diaria" | "semanal" | "mensal";

type Rotina = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  hora: string;
  recorrencia: Recorrencia;
  createdAt: string;
};

const recorrenciaLabels: Record<Recorrencia, string> = {
  unica: "Única",
  diaria: "Diária",
  semanal: "Semanal",
  mensal: "Mensal",
};

export default function Home() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [now, setNow] = useState(() => new Date());
  const [anotacoes, setAnotacoes] = useState<Nota[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(HOME_NOTAS_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed as Nota[];
    } catch (error) {
      console.error("[Home] Erro ao carregar anotações:", error);
      return [];
    }
  });
  const [notaTitulo, setNotaTitulo] = useState("");
  const [notaDescricao, setNotaDescricao] = useState("");
  const [notaPrioridade, setNotaPrioridade] = useState<NotaPrioridade>("media");
  const [filtroNotas, setFiltroNotas] = useState<"todas" | NotaPrioridade>("todas");
  const [rotinas, setRotinas] = useState<Rotina[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(HOME_ROTINAS_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed as Rotina[];
    } catch (error) {
      console.error("[Home] Erro ao carregar rotinas:", error);
      return [];
    }
  });
  const [rotinaTitulo, setRotinaTitulo] = useState("");
  const [rotinaDescricao, setRotinaDescricao] = useState("");
  const [rotinaData, setRotinaData] = useState("");
  const [rotinaHora, setRotinaHora] = useState("");
  const [rotinaRecorrencia, setRotinaRecorrencia] = useState<Recorrencia>("unica");
  const [filtroRecorrencia, setFiltroRecorrencia] = useState<"todas" | Recorrencia>("todas");

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HOME_NOTAS_STORAGE_KEY, JSON.stringify(anotacoes));
  }, [anotacoes]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(HOME_ROTINAS_STORAGE_KEY, JSON.stringify(rotinas));
  }, [rotinas]);

  const primeiroNome = useMemo(() => {
    if (!user?.name) return "Usuário";
    const [first] = user.name.trim().split(" ");
    return first || user.name;
  }, [user?.name]);

  const saudacao = useMemo(() => {
    const hora = now.getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  }, [now]);

  const dataCompleta = useMemo(() => {
    const texto = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(now);
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }, [now]);

  const horaAtual = useMemo(() => {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(now);
  }, [now]);

  const notasFiltradas = useMemo(() => {
    const base =
      filtroNotas === "todas"
        ? anotacoes
        : anotacoes.filter((nota) => nota.prioridade === filtroNotas);
    return [...base].sort((a, b) => {
      if (prioridadePeso[a.prioridade] === prioridadePeso[b.prioridade]) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return prioridadePeso[a.prioridade] - prioridadePeso[b.prioridade];
    });
  }, [anotacoes, filtroNotas]);

  const handleAdicionarNota = () => {
    if (!notaTitulo.trim() && !notaDescricao.trim()) {
      toast.error("Informe ao menos um título ou descrição para a anotação.");
      return;
    }

    const novaNota: Nota = {
      id: nanoid(),
      titulo: notaTitulo.trim() || "Anotação sem título",
      descricao: notaDescricao.trim(),
      prioridade: notaPrioridade,
      createdAt: new Date().toISOString(),
    };

    setAnotacoes((prev) => [novaNota, ...prev]);
    setNotaTitulo("");
    setNotaDescricao("");
    setNotaPrioridade("media");
  };

  const handleRemoverNota = (id: string) => {
    setAnotacoes((prev) => prev.filter((nota) => nota.id !== id));
  };

  const rotinasOrdenadas = useMemo(() => {
    const lista =
      filtroRecorrencia === "todas"
        ? rotinas
        : rotinas.filter((rotina) => rotina.recorrencia === filtroRecorrencia);

    return [...lista].sort((a, b) => {
      const dataHoraA = new Date(`${a.data || "1970-01-01"}T${a.hora || "00:00"}:00`).getTime();
      const dataHoraB = new Date(`${b.data || "1970-01-01"}T${b.hora || "00:00"}:00`).getTime();
      if (dataHoraA === dataHoraB) {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return dataHoraA - dataHoraB;
    });
  }, [rotinas, filtroRecorrencia]);

  const formatoDataCurta = (dataStr: string) => {
    if (!dataStr) return "Sem data";
    const data = new Date(dataStr);
    if (Number.isNaN(data.getTime())) return "Sem data";
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleAdicionarRotina = () => {
    if (!rotinaTitulo.trim()) {
      toast.error("Defina um título para a rotina.");
      return;
    }

    const novaRotina: Rotina = {
      id: nanoid(),
      titulo: rotinaTitulo.trim(),
      descricao: rotinaDescricao.trim(),
      data: rotinaData,
      hora: rotinaHora,
      recorrencia: rotinaRecorrencia,
      createdAt: new Date().toISOString(),
    };

    setRotinas((prev) => [novaRotina, ...prev]);
    setRotinaTitulo("");
    setRotinaDescricao("");
    setRotinaData("");
    setRotinaHora("");
    setRotinaRecorrencia("unica");
  };

  const handleRemoverRotina = (id: string) => {
    setRotinas((prev) => prev.filter((rotina) => rotina.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border bg-gradient-to-r from-sky-600 via-sky-500 to-blue-500 text-white shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.35),_transparent_60%)]" />
          <div className="relative z-10 flex flex-col gap-6 p-8 lg:p-12">
            <div className="flex flex-col gap-2">
              <span className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-white/80">
                <Sparkles className="h-4 w-4" />
                {saudacao}, {primeiroNome}
              </span>
              <h1 className="text-3xl font-bold md:text-4xl lg:text-5xl">
                Bem-vindo(a) de volta ao seu painel de SST
              </h1>
              <p className="max-w-2xl text-base text-white/85 md:text-lg">
                Organize suas rotinas de segurança do trabalho, acompanhe prazos críticos e mantenha o controle das obrigações da sua equipe em um só lugar.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm font-medium">
              <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
                <CalendarDays className="h-4 w-4" />
                <span>{dataCompleta}</span>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-2 backdrop-blur">
                <Clock className="h-4 w-4" />
                <span>{horaAtual}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-2xl bg-white text-sky-600 hover:bg-white/90"
                onClick={() => setLocation("/gestao-asos")}
              >
                Acessar Gestão de ASOs
              </Button>
            </div>
          </div>
        </section>

        <Card className="border-muted bg-white/90 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl font-semibold text-slate-900">Anotações de prioridades</CardTitle>
              <p className="text-sm text-muted-foreground">
                Centralize lembretes importantes para sua rotina de SST e organize as próximas ações por prioridade.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[minmax(0,320px)_1fr]">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="notaTitulo">Título</Label>
                  <Input
                    id="notaTitulo"
                    placeholder="Ex.: Renovar ASO periódico do setor X"
                    value={notaTitulo}
                    onChange={(e) => setNotaTitulo(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notaPrioridade">Prioridade</Label>
                  <Select value={notaPrioridade} onValueChange={(value) => setNotaPrioridade(value as NotaPrioridade)}>
                    <SelectTrigger id="notaPrioridade">
                      <SelectValue placeholder="Defina a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta prioridade</SelectItem>
                      <SelectItem value="media">Prioridade média</SelectItem>
                      <SelectItem value="baixa">Prioridade baixa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notaDescricao">Descrição</Label>
                  <Textarea
                    id="notaDescricao"
                    placeholder="Detalhe próximos passos, responsáveis ou datas importantes."
                    value={notaDescricao}
                    onChange={(e) => setNotaDescricao(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={handleAdicionarNota} className="w-full">
                  Adicionar anotação
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "todas" as const, label: "Todas" },
                    { id: "alta" as const, label: "Alta" },
                    { id: "media" as const, label: "Média" },
                    { id: "baixa" as const, label: "Baixa" },
                  ].map((opcao) => (
                    <Button
                      key={opcao.id}
                      size="sm"
                      variant={filtroNotas === opcao.id ? "default" : "outline"}
                      className={cn(
                        "rounded-full",
                        opcao.id !== "todas" && filtroNotas === opcao.id
                          ? prioridadeEstilos[opcao.id].badgeClass
                          : undefined
                      )}
                      onClick={() => setFiltroNotas(opcao.id)}
                    >
                      {opcao.label}
                    </Button>
                  ))}
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {notasFiltradas.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                      Nenhuma anotação criada ainda. Use o formulário para planejar suas próximas ações.
                    </div>
                  ) : (
                    notasFiltradas.map((nota) => {
                      const dataCriacao = (() => {
                        const data = new Date(nota.createdAt);
                        if (Number.isNaN(data.getTime())) return "-";
                        return data.toLocaleString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        });
                      })();

                      return (
                        <div
                          key={nota.id}
                          className={cn(
                            "rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md",
                            prioridadeEstilos[nota.prioridade].containerClass,
                            "max-w-xl"
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className={cn("h-2.5 w-2.5 rounded-full", prioridadeEstilos[nota.prioridade].dotClass)}
                                />
                                <h3 className="text-sm font-semibold text-foreground">
                                  {nota.titulo}
                                </h3>
                              </div>
                              <Badge className={cn("w-fit", prioridadeEstilos[nota.prioridade].badgeClass)}>
                                {prioridadeEstilos[nota.prioridade].label}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                              onClick={() => handleRemoverNota(nota.id)}
                              title="Remover anotação"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          {nota.descricao && (
                            <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                              {nota.descricao}
                            </p>
                          )}

                          <p className="mt-3 text-xs text-muted-foreground">
                            Criada em {dataCriacao}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-muted bg-white/90 shadow-sm">
          <CardHeader>
            <div className="flex flex-col gap-1">
              <CardTitle className="text-xl font-semibold text-slate-900">Rotina de trabalho & programações</CardTitle>
              <p className="text-sm text-muted-foreground">
                Planeje atividades, horários e recorrências para manter sua equipe alinhada com as prioridades de SST.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-[minmax(0,340px)_1fr]">
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="rotinaTitulo">Título</Label>
                  <Input
                    id="rotinaTitulo"
                    placeholder="Ex.: Checklist de inspeção semanal"
                    value={rotinaTitulo}
                    onChange={(e) => setRotinaTitulo(e.target.value)}
                  />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="rotinaData">Data inicial</Label>
                    <Input
                      id="rotinaData"
                      type="date"
                      value={rotinaData}
                      onChange={(e) => setRotinaData(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rotinaHora">Horário</Label>
                    <Input
                      id="rotinaHora"
                      type="time"
                      value={rotinaHora}
                      onChange={(e) => setRotinaHora(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rotinaRecorrencia">Recorrência</Label>
                  <Select
                    value={rotinaRecorrencia}
                    onValueChange={(value) => setRotinaRecorrencia(value as Recorrencia)}
                  >
                    <SelectTrigger id="rotinaRecorrencia">
                      <SelectValue placeholder="Periodicidade das atividades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unica">Única</SelectItem>
                      <SelectItem value="diaria">Diária</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rotinaDescricao">Detalhes</Label>
                  <Textarea
                    id="rotinaDescricao"
                    placeholder="Inclua checklist de tarefas, responsáveis ou documentos necessários."
                    value={rotinaDescricao}
                    onChange={(e) => setRotinaDescricao(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={handleAdicionarRotina} className="w-full">
                  Registrar programação
                </Button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "todas" as const, label: "Todas" },
                    { id: "unica" as const, label: "Única" },
                    { id: "diaria" as const, label: "Diária" },
                    { id: "semanal" as const, label: "Semanal" },
                    { id: "mensal" as const, label: "Mensal" },
                  ].map((opcao) => (
                    <Button
                      key={opcao.id}
                      size="sm"
                      variant={filtroRecorrencia === opcao.id ? "default" : "outline"}
                      className="rounded-full"
                      onClick={() => setFiltroRecorrencia(opcao.id)}
                    >
                      {opcao.label}
                    </Button>
                  ))}
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {rotinasOrdenadas.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                      Nenhuma programação registrada. Cadastre rotinas para estruturar o fluxo de trabalho.
                    </div>
                  ) : (
                    rotinasOrdenadas.map((rotina) => (
                      <div
                        key={rotina.id}
                        className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md max-w-xl"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <ListChecks className="h-4 w-4 text-sky-600" />
                              {rotina.titulo}
                            </div>
                            <Badge variant="outline" className="flex items-center gap-1 border-sky-200 text-sky-700">
                              <Repeat className="h-3.5 w-3.5" />
                              {recorrenciaLabels[rotina.recorrencia]}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoverRotina(rotina.id)}
                            title="Remover programação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-600" />
                            {formatoDataCurta(rotina.data)}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                            <Clock className="h-3.5 w-3.5 text-slate-600" />
                            {rotina.hora || "Sem horário"}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                            Criada em {new Date(rotina.createdAt).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {rotina.descricao && (
                          <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap">
                            {rotina.descricao}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
    </DashboardLayout>
  );
}
