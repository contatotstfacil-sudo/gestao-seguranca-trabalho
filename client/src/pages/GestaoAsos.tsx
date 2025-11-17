import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Plus, Pencil, Trash2, Search, X, FileText, AlertTriangle, TrendingUp, CalendarClock, PieChart, Building2, LayoutDashboard, ClipboardList, History } from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import type { KeyboardEvent } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { nanoid } from "nanoid";

type TipoAso = "admissional" | "periodico" | "retorno_trabalho" | "mudanca_funcao" | "demissional";
type SituacaoApto = "sim" | "nao" | "apto_com_restricoes";
type DashboardMetrics = {
  totalAsos: number;
  totalAtivos: number;
  totalVencidos: number;
  totalAVencer30: number;
  totalAVencer5: number;
  cobertura: {
    totalColaboradores: number;
    colaboradoresCobertos: number;
    colaboradoresSemAso: number;
    percentual: number;
  };
  porTipo: { tipo: string; total: number }[];
  vencimentosPorMes: { mes: string; total: number }[];
  topEmpresasVencidos: { empresaId: number; empresaNome: string; total: number }[];
  proximosVencimentos: {
    id: number;
    numeroAso: string | null;
    dataValidade: string | null;
    tipoAso: TipoAso;
    colaboradorId: number | null;
    colaboradorNome: string | null;
    empresaId: number | null;
    empresaNome: string | null;
  }[];
  asosVencidosRecentes: {
    id: number;
    numeroAso: string | null;
    dataValidade: string | null;
    tipoAso: TipoAso;
    colaboradorId: number | null;
    colaboradorNome: string | null;
    empresaId: number | null;
    empresaNome: string | null;
  }[];
  ultimaAtualizacao: string;
};

type AsoFormState = {
  colaboradorId: string;
  empresaId: string;
  numeroAso: string;
  tipoAso: TipoAso;
  dataEmissao: string;
  dataValidade: string;
  medicoResponsavel: string;
  clinicaMedica: string;
  crmMedico: string;
  apto: SituacaoApto;
  restricoes: string;
  observacoes: string;
  anexoUrl: string;
};

type AsoFiltersState = {
  searchTerm: string;
  colaboradorId: string;
  empresaId: string;
  tipoAso: string;
  status: string;
  vencidos: boolean;
  aVencerEmDias: string;
  cpf: string;
  dataValidadeInicio: string;
  dataValidadeFim: string;
};

const defaultFilters: AsoFiltersState = {
  searchTerm: "",
  colaboradorId: "all",
  empresaId: "all",
  tipoAso: "all",
  status: "all",
  vencidos: false,
  aVencerEmDias: "",
  cpf: "",
  dataValidadeInicio: "",
  dataValidadeFim: "",
};

type NotaPrioridade = "alta" | "media" | "baixa";

type Nota = {
  id: string;
  titulo: string;
  descricao: string;
  prioridade: NotaPrioridade;
  createdAt: string;
};

const NOTAS_STORAGE_KEY = "gestao-asos-notas";

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

type GestaoAsoSection = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  path: string;
};

const asoSections: GestaoAsoSection[] = [
  {
    id: "painel",
    label: "Dashboard",
    description: "Resumo geral dos ASOs e indicadores críticos.",
    icon: LayoutDashboard,
    path: "/gestao-asos",
  },
  {
    id: "lista",
    label: "Lista de ASOs",
    description: "Consulte e filtre o histórico completo de ASOs.",
    icon: ClipboardList,
    path: "/gestao-asos/lista",
  },
  {
    id: "relatorios",
    label: "Relatórios & Histórico",
    description: "Central de relatórios e exportações de ASOs.",
    icon: History,
    path: "/gestao-asos/relatorios",
  },
];

export default function GestaoAsos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AsoFormState>({
    colaboradorId: "",
    empresaId: "",
    numeroAso: "",
    tipoAso: "admissional",
    dataEmissao: "",
    dataValidade: "",
    medicoResponsavel: "",
    clinicaMedica: "",
    crmMedico: "",
    apto: "sim",
    restricoes: "",
    observacoes: "",
    anexoUrl: "",
  });

  const [filters, setFilters] = useState<AsoFiltersState>(defaultFilters);
  const [mostrarHistorico, setMostrarHistorico] = useState(false);
  const [filtroRapidoAtivo, setFiltroRapidoAtivo] = useState<
    "todos" | "ativos" | "vencidos" | "aVencer30" | "aVencer5"
  >("todos");
  const [colaboradorRelatorioId, setColaboradorRelatorioId] = useState("");
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const [anotacoes, setAnotacoes] = useState<Nota[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = window.localStorage.getItem(NOTAS_STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed as Nota[];
    } catch (error) {
      console.error("[GestaoAsos] Erro ao carregar anotações:", error);
      return [];
    }
  });
  const [notaTitulo, setNotaTitulo] = useState("");
  const [notaDescricao, setNotaDescricao] = useState("");
  const [notaPrioridade, setNotaPrioridade] = useState<NotaPrioridade>("media");
  const [filtroNotas, setFiltroNotas] = useState<"todas" | NotaPrioridade>("todas");

  const [location, setLocation] = useLocation();

  const normalizedLocation = location.startsWith("/gestao-asos")
    ? location
    : "/gestao-asos";
  const isPainel =
    normalizedLocation === "/gestao-asos" ||
    normalizedLocation === "/gestao-asos/painel";
  const isLista = normalizedLocation === "/gestao-asos/lista";
  const isRelatorios = normalizedLocation === "/gestao-asos/relatorios";

  const utils = trpc.useUtils();
  const { data: dashboardData, isLoading: dashboardLoading } = trpc.asos.dashboard.useQuery(undefined, {
    refetchInterval: 1000 * 60,
  });
  const { data: asosData, isLoading } = trpc.asos.list.useQuery({
    colaboradorId: filters.colaboradorId !== "all" ? Number(filters.colaboradorId) : undefined,
    empresaId: filters.empresaId !== "all" ? Number(filters.empresaId) : undefined,
    tipoAso: filters.tipoAso !== "all" ? (filters.tipoAso as any) : undefined,
    status: filters.status !== "all" ? (filters.status as any) : undefined,
    vencidos: filters.vencidos ? true : undefined,
    aVencerEmDias: filters.aVencerEmDias ? Number(filters.aVencerEmDias) : undefined,
  });
  const asos = (asosData ?? []) as any[];
  const { data: colaboradores = [] } = trpc.colaboradores.list.useQuery();
  const { data: empresas = [] } = trpc.empresas.list.useQuery();

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(NOTAS_STORAGE_KEY, JSON.stringify(anotacoes));
  }, [anotacoes]);

  const createMutation = trpc.asos.create.useMutation({
    onSuccess: () => {
      utils.asos.list.invalidate();
      utils.asos.dashboard.invalidate();
      toast.success("ASO cadastrado com sucesso!");
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao cadastrar ASO");
    },
  });

  const updateMutation = trpc.asos.update.useMutation({
    onSuccess: () => {
      utils.asos.list.invalidate();
      utils.asos.dashboard.invalidate();
      toast.success("ASO atualizado com sucesso!");
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar ASO");
    },
  });

  const deleteMutation = trpc.asos.delete.useMutation({
    onSuccess: () => {
      utils.asos.list.invalidate();
      utils.asos.dashboard.invalidate();
      toast.success("ASO excluído com sucesso!");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao excluir ASO");
    },
  });

  const atualizarStatusMutation = trpc.asos.atualizarStatusVencidos.useMutation({
    onSuccess: () => {
      utils.asos.list.invalidate();
      utils.asos.dashboard.invalidate();
    },
  });

  const statusSyncTriggered = useRef(false);

  useEffect(() => {
    if (statusSyncTriggered.current) return;
    statusSyncTriggered.current = true;
    atualizarStatusMutation.mutate();
  }, [atualizarStatusMutation]);

  useEffect(() => {
    if (normalizedLocation === "/gestao-asos" || normalizedLocation === "/gestao-asos/painel") {
      setFiltroRapidoAtivo("todos");
    }
  }, [normalizedLocation]);

  const handleGerarRelatorio = async () => {
    if (!colaboradorRelatorioId) {
      toast.error("Selecione um colaborador para gerar o relatório.");
      return;
    }

    setGerandoRelatorio(true);
    try {
      const colaboradorIdNumber = Number(colaboradorRelatorioId);
      const historicoOrdenado = asos
        .filter((aso: any) => aso.colaboradorId === colaboradorIdNumber)
        .sort((a: any, b: any) => {
          const aDate = a.dataEmissao ? new Date(a.dataEmissao).getTime() : 0;
          const bDate = b.dataEmissao ? new Date(b.dataEmissao).getTime() : 0;
          return aDate - bDate;
        });

      if (historicoOrdenado.length === 0) {
        toast.info("Este colaborador não possui ASOs registrados até o momento.");
        setGerandoRelatorio(false);
        return;
      }

      const colaboradorInfo = colaboradores.find((colaborador: any) => colaborador.id === colaboradorIdNumber);
      const empresaInfo = colaboradorInfo
        ? empresas.find((empresa: any) => empresa.id === colaboradorInfo.empresaId)
        : null;

      const dayMs = 1000 * 60 * 60 * 24;
      let somaValidade = 0;
      let countValidade = 0;
      let somaAntecedencia = 0;
      let countAntecedencia = 0;
      let somaAtraso = 0;
      let countAtraso = 0;
      let totalAposVencimento = 0;

      const historicoDetalhado = historicoOrdenado.map((aso: any, index: number) => {
        const dataEmissao = aso.dataEmissao ? new Date(aso.dataEmissao) : null;
        const dataValidade = aso.dataValidade ? new Date(aso.dataValidade) : null;
        const anterior = historicoOrdenado[index - 1];
        const dataValidadeAnterior = anterior?.dataValidade ? new Date(anterior.dataValidade) : null;
        const dataEmissaoAnterior = anterior?.dataEmissao ? new Date(anterior.dataEmissao) : null;

        let diasDeValidade: number | null = null;
        let diasAntesVencimento: number | null = null;
        let diasAposVencimento: number | null = null;
        let diasEntreAsos: number | null = null;

        if (dataEmissao && dataValidade) {
          diasDeValidade = Math.round((dataValidade.getTime() - dataEmissao.getTime()) / dayMs);
          somaValidade += diasDeValidade;
          countValidade += 1;
        }

        if (dataEmissao && dataValidadeAnterior) {
          const diff = Math.round((dataEmissao.getTime() - dataValidadeAnterior.getTime()) / dayMs);
          if (diff < 0) {
            diasAntesVencimento = Math.abs(diff);
            somaAntecedencia += Math.abs(diff);
            countAntecedencia += 1;
          } else if (diff > 0) {
            diasAposVencimento = diff;
            somaAtraso += diff;
            countAtraso += 1;
            totalAposVencimento += 1;
          }
        }

        if (dataEmissao && dataEmissaoAnterior) {
          diasEntreAsos = Math.round((dataEmissao.getTime() - dataEmissaoAnterior.getTime()) / dayMs);
        }

        return {
          ...aso,
          dataEmissao,
          dataValidade,
          diasDeValidade,
          diasAntesVencimento,
          diasAposVencimento,
          diasEntreAsos,
          realizadoAposVencimento: !!diasAposVencimento && diasAposVencimento > 0,
        };
      });

      const data = {
        colaborador: {
          id: colaboradorInfo?.id ?? colaboradorIdNumber,
          nome: colaboradorInfo?.nomeCompleto || getColaboradorName(colaboradorIdNumber),
          cpf: colaboradorInfo?.cpf || "",
          funcao: colaboradorInfo?.funcao || "",
          dataAdmissao: colaboradorInfo?.dataAdmissao || null,
        },
        empresa: empresaInfo
          ? {
              id: empresaInfo.id,
              nome: empresaInfo.razaoSocial,
            }
          : null,
        resumo: {
          total: historicoDetalhado.length,
          ativos: historicoDetalhado.filter((item) => item.status === "ativo").length,
          vencidos: historicoDetalhado.filter((item) => item.status === "vencido").length,
          realizadosAposVencimento: totalAposVencimento,
          mediaDiasDeValidade: countValidade ? Math.round(somaValidade / countValidade) : null,
          mediaDiasAntecedencia: countAntecedencia ? Math.round(somaAntecedencia / countAntecedencia) : null,
          mediaDiasAtraso: countAtraso ? Math.round(somaAtraso / countAtraso) : null,
          primeiroAso: historicoDetalhado[0]?.dataEmissao || null,
          ultimoAso: historicoDetalhado[historicoDetalhado.length - 1]?.dataEmissao || null,
        },
        historico: historicoDetalhado,
      };

      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const titulo = `Relatório de ASOs`;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(titulo, 14, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      let y = 30;

      doc.text(`Colaborador: ${data.colaborador.nome}`, 14, y);
      y += 6;
      if (data.colaborador.cpf) {
        doc.text(`CPF: ${data.colaborador.cpf}`, 14, y);
        y += 6;
      }
      if (data.colaborador.funcao) {
        doc.text(`Função: ${data.colaborador.funcao}`, 14, y);
        y += 6;
      }
      if (data.empresa?.nome) {
        doc.text(`Empresa: ${data.empresa.nome}`, 14, y);
        y += 6;
      }
      if (data.colaborador.dataAdmissao) {
        doc.text(`Admissão: ${formatDateForPdf(data.colaborador.dataAdmissao)}`, 14, y);
        y += 6;
      }

      y += 4;
      doc.setFont("helvetica", "bold");
      doc.text(`Resumo`, 14, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const resumoLinhas = [
        `Total de ASOs: ${data.resumo.total}`,
        `Ativos: ${data.resumo.ativos} | Vencidos: ${data.resumo.vencidos}`,
        `Emitidos após vencimento: ${data.resumo.realizadosAposVencimento}`,
        `Média de validade: ${data.resumo.mediaDiasDeValidade ?? '-'} dia(s)`,
        `Média de antecedência: ${data.resumo.mediaDiasAntecedencia ?? '-'} dia(s)`,
        `Média de atraso: ${data.resumo.mediaDiasAtraso ?? '-'} dia(s)`,
      ];

      resumoLinhas.forEach((linha) => {
        doc.text(linha, 14, y);
        y += 5;
      });

      if (data.resumo.primeiroAso || data.resumo.ultimoAso) {
        doc.text(
          `Primeiro registro: ${formatDateForPdf(data.resumo.primeiroAso)} | Último registro: ${formatDateForPdf(
            data.resumo.ultimoAso
          )}`,
          14,
          y
        );
        y += 6;
      }

      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(`Histórico completo`, 14, y);
      y += 8;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      data.historico.forEach((item, index) => {
        if (y > pageHeight - 20) {
          doc.addPage();
          y = 20;
        }

        const tipoLabel = getTipoAsoLabel(item.tipoAso);
        doc.setFont("helvetica", "bold");
        doc.text(`${index + 1}. ${tipoLabel}`, 14, y);
        y += 5;

        doc.setFont("helvetica", "normal");
        const linhaDatas = `Emissão: ${formatDateForPdf(item.dataEmissao)}  |  Validade: ${formatDateForPdf(
          item.dataValidade
        )}  |  Status: ${item.status.toUpperCase()}`;
        doc.text(linhaDatas, 14, y);
        y += 4;

        const validadeStr = `Validade do ASO: ${item.diasDeValidade ?? "-"} dia(s)`;
        let tempoRelacionamento = "Primeiro ASO registrado";
        if (item.realizadoAposVencimento && item.diasAposVencimento) {
          tempoRelacionamento = `Emitido ${item.diasAposVencimento} dia(s) após o vencimento anterior`;
        } else if (item.diasAntesVencimento !== null) {
          tempoRelacionamento = `Emitido ${item.diasAntesVencimento} dia(s) antes do vencimento anterior`;
        }
        doc.text(`${validadeStr}  |  ${tempoRelacionamento}`, 14, y);
        y += 4;

        if (item.diasEntreAsos !== null) {
          doc.text(`Intervalo desde o ASO anterior: ${item.diasEntreAsos} dia(s)`, 14, y);
          y += 4;
        }

        if (item.observacoes) {
          const observacaoTexto = doc.splitTextToSize(`Observações: ${item.observacoes}`, pageWidth - 28);
          doc.text(observacaoTexto, 14, y);
          y += observacaoTexto.length * 4;
        }

        y += 2;
        doc.setDrawColor(230, 230, 230);
        doc.line(14, y, pageWidth - 14, y);
        y += 6;
      });

      const slug = slugify(`${data.colaborador.nome}-${data.colaborador.id}`);
      doc.save(`relatorio-asos-${slug}.pdf`);
      toast.success("Relatório gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível gerar o relatório em PDF.");
    } finally {
      setGerandoRelatorio(false);
    }
  };

  const resetForm = () => {
    setFormData({
      colaboradorId: "",
      empresaId: "",
      numeroAso: "",
      tipoAso: "admissional",
      dataEmissao: "",
      dataValidade: "",
      medicoResponsavel: "",
      clinicaMedica: "",
      crmMedico: "",
      apto: "sim",
      restricoes: "",
      observacoes: "",
      anexoUrl: "",
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.colaboradorId || !formData.empresaId || !formData.dataEmissao || !formData.dataValidade) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
        colaboradorId: Number(formData.colaboradorId),
        empresaId: Number(formData.empresaId),
      });
    } else {
      createMutation.mutate({
        ...formData,
        colaboradorId: Number(formData.colaboradorId),
        empresaId: Number(formData.empresaId),
      });
    }
  };

  const handleEdit = (aso: {
    id: number;
    colaboradorId: number;
    empresaId: number;
    numeroAso?: string | null;
    tipoAso: string;
    dataEmissao: string | Date;
    dataValidade: string | Date;
    medicoResponsavel?: string | null;
    clinicaMedica?: string | null;
    crmMedico?: string | null;
    apto: string;
    restricoes?: string | null;
    observacoes?: string | null;
    anexoUrl?: string | null;
  }) => {
    setEditingId(aso.id);
    setFormData({
      colaboradorId: String(aso.colaboradorId),
      empresaId: String(aso.empresaId),
      numeroAso: aso.numeroAso || "",
      tipoAso: aso.tipoAso as TipoAso,
      dataEmissao: aso.dataEmissao ? new Date(aso.dataEmissao).toISOString().split("T")[0] : "",
      dataValidade: aso.dataValidade ? new Date(aso.dataValidade).toISOString().split("T")[0] : "",
      medicoResponsavel: aso.medicoResponsavel || "",
      clinicaMedica: aso.clinicaMedica || "",
      crmMedico: aso.crmMedico || "",
      apto: aso.apto as SituacaoApto,
      restricoes: aso.restricoes || "",
      observacoes: aso.observacoes || "",
      anexoUrl: aso.anexoUrl || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este ASO?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getColaboradorName = (id: number) => {
    const colaborador = colaboradores.find((c: any) => c.id === id);
    if (!colaborador) {
      return colaboradores.length === 0 ? "Sem colaboradores cadastrados" : "Colaborador excluído";
    }
    return colaborador.nomeCompleto;
  };

  const getEmpresaName = (id: number) => {
    return empresas.find((e: any) => e.id === id)?.razaoSocial || "N/A";
  };

  const getTipoAsoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      admissional: "Admissional",
      periodico: "Periódico",
      retorno_trabalho: "Retorno ao Trabalho",
      mudanca_funcao: "Mudança de Função",
      demissional: "Demissional",
    };
    return labels[tipo] || tipo;
  };

  const getAptoLabel = (apto: string) => {
    const labels: Record<string, string> = {
      sim: "Apto",
      nao: "Inapto",
      apto_com_restricoes: "Apto com Restrições",
    };
    return labels[apto] || apto;
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "N/A";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleDateString("pt-BR");
  };

  const formatDateForPdf = (date: string | Date | null) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString("pt-BR");
  };

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "relatorio";

  const formatDateTime = (date: string | Date | null) => {
    if (!date) return "-";
    const d = typeof date === "string" ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatNumber = (value: number | undefined) => {
    return new Intl.NumberFormat("pt-BR").format(value ?? 0);
  };

  const formatMonthLabel = (mes: string) => {
    if (!mes) return "";
    const [ano, numeroMes] = mes.split("-");
    const data = new Date(Number(ano), Number(numeroMes) - 1);
    return data.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
  };

  const coveragePercent = Math.round(dashboardData?.cobertura?.percentual ?? 0);
  const colaboradoresSemAso = dashboardData?.cobertura?.colaboradoresSemAso ?? 0;
  const totalColaboradores = dashboardData?.cobertura?.totalColaboradores ?? 0;
  const colaboradoresCobertos = dashboardData?.cobertura?.colaboradoresCobertos ?? 0;
  const porTipo = (dashboardData?.porTipo ?? []) as DashboardMetrics["porTipo"];
  const vencimentosPorMes = (dashboardData?.vencimentosPorMes ?? []) as DashboardMetrics["vencimentosPorMes"];
  const topEmpresasVencidos = (dashboardData?.topEmpresasVencidos ?? []) as DashboardMetrics["topEmpresasVencidos"];
  const proximosVencimentos = (dashboardData?.proximosVencimentos ?? []) as DashboardMetrics["proximosVencimentos"];
  const asosVencidosRecentes = (dashboardData?.asosVencidosRecentes ?? []) as DashboardMetrics["asosVencidosRecentes"];
  const maxPorTipo = porTipo.reduce<number>((max, item) => Math.max(max, item.total), 0) || 1;
  const maxVencimentosMes = vencimentosPorMes.reduce<number>((max, item) => Math.max(max, item.total), 0) || 1;
  const totalAVencer5 = dashboardData?.totalAVencer5 ?? 0; // Assuming totalAVencer5 is the same as totalAVencer30 for now

  const getStatusBadge = (aso: any) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const validade = new Date(aso.dataValidade);
    validade.setHours(0, 0, 0, 0);
    const diasRestantes = Math.ceil((validade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (validade < hoje) {
      return <Badge variant="destructive">Vencido</Badge>;
    } else if (diasRestantes <= 30) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Vence em {diasRestantes} dias</Badge>;
    } else {
      return <Badge variant="outline" className="bg-green-100 text-green-800">Válido</Badge>;
    }
  };

  const filteredAsos = useMemo(() => {
    let lista = asos as any[];

    if (filters.colaboradorId !== "all") {
      const idFiltro = Number(filters.colaboradorId);
      lista = lista.filter((aso) => aso.colaboradorId === idFiltro);
    }

    if (filters.empresaId !== "all") {
      const empresaFiltro = Number(filters.empresaId);
      lista = lista.filter((aso) => aso.empresaId === empresaFiltro);
    }

    if (filters.tipoAso !== "all") {
      lista = lista.filter((aso) => aso.tipoAso === filters.tipoAso);
    }

    if (filters.status !== "all") {
      lista = lista.filter((aso) => aso.status === filters.status);
    }

    if (filters.cpf.trim()) {
      const cpfFiltro = filters.cpf.replace(/\D/g, "");
      lista = lista.filter((aso) =>
        (aso.cpf ? String(aso.cpf).replace(/\D/g, "") : "").includes(cpfFiltro)
      );
    }

    if (filters.dataValidadeInicio) {
      const inicio = new Date(filters.dataValidadeInicio);
      inicio.setHours(0, 0, 0, 0);
      lista = lista.filter((aso) => {
        const validade = aso.dataValidade ? new Date(aso.dataValidade) : null;
        return validade ? validade >= inicio : true;
      });
    }

    if (filters.dataValidadeFim) {
      const fim = new Date(filters.dataValidadeFim);
      fim.setHours(23, 59, 59, 999);
      lista = lista.filter((aso) => {
        const validade = aso.dataValidade ? new Date(aso.dataValidade) : null;
        return validade ? validade <= fim : true;
      });
    }

    if (!filters.searchTerm) return lista;

    const searchLower = filters.searchTerm.toLowerCase();
    return lista.filter((aso: any) => {
      const colaboradorNome = getColaboradorName(aso.colaboradorId).toLowerCase();
      const empresaNome = getEmpresaName(aso.empresaId).toLowerCase();
      const numeroAso = (aso.numeroAso || "").toLowerCase();
      const medico = (aso.medicoResponsavel || "").toLowerCase();

      return (
        colaboradorNome.includes(searchLower) ||
        empresaNome.includes(searchLower) ||
        numeroAso.includes(searchLower) ||
        medico.includes(searchLower)
      );
    });
  }, [asos, filters, colaboradores, empresas]);

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
      toast.error("Preencha ao menos o título ou a descrição da anotação.");
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

  const asosAgrupados = useMemo(() => {
    const agrupados = new Map<number, any>();

    filteredAsos.forEach((aso: any) => {
      const atual = agrupados.get(aso.colaboradorId);
      if (!atual) {
        agrupados.set(aso.colaboradorId, aso);
        return;
      }

      const validadeAtual = new Date(atual.dataValidade || atual.createdAt || 0).getTime();
      const validadeNovo = new Date(aso.dataValidade || aso.createdAt || 0).getTime();

      if (validadeNovo >= validadeAtual) {
        agrupados.set(aso.colaboradorId, aso);
      }
    });

    return Array.from(agrupados.values());
  }, [filteredAsos]);

  const asosParaTabela = mostrarHistorico ? filteredAsos : asosAgrupados;

  const aplicarFiltroRapido = (
    tipo: "todos" | "ativos" | "vencidos" | "aVencer30" | "aVencer5"
  ) => {
    setFiltroRapidoAtivo(tipo);

    switch (tipo) {
      case "vencidos":
        setMostrarHistorico(true);
        setFilters({
          ...defaultFilters,
          status: "vencido",
          vencidos: true,
        });
        break;
      case "aVencer30":
        setMostrarHistorico(false);
        setFilters({
          ...defaultFilters,
          status: "ativo",
          aVencerEmDias: "30",
        });
        break;
      case "aVencer5":
        setMostrarHistorico(false);
        setFilters({
          ...defaultFilters,
          status: "ativo",
          aVencerEmDias: "5",
        });
        break;
      case "ativos":
        setMostrarHistorico(false);
        setFilters({
          ...defaultFilters,
          status: "ativo",
        });
        break;
      default:
        setMostrarHistorico(false);
        setFilters(defaultFilters);
        break;
    }

    if (normalizedLocation !== "/gestao-asos/lista") {
      setLocation("/gestao-asos/lista");
    }
  };

  const handleCardKeyDown = (
    tipo: "todos" | "ativos" | "vencidos" | "aVencer30" | "aVencer5"
  ) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      aplicarFiltroRapido(tipo);
    }
  };

  const dashboardCardClass =
    "h-full border border-border bg-white/95 shadow-sm hover:shadow-lg transition-all duration-200 rounded-xl";
  const cardHeaderClass = "pb-2 space-y-1";
  const cardTitleClass = "text-xs font-semibold uppercase tracking-wide text-muted-foreground";

  const renderActions = () => (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={resetForm}>
          <Plus className="mr-2 h-4 w-4" />
          Novo ASO
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? "Editar ASO" : "Cadastrar Novo ASO"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="colaboradorId">Colaborador *</Label>
              <Select
                value={formData.colaboradorId}
                onValueChange={(value) => {
                  setFormData({ ...formData, colaboradorId: value });
                  const colaborador = colaboradores.find((c: any) => c.id === Number(value));
                  if (colaborador) {
                    setFormData((prev) => ({
                      ...prev,
                      colaboradorId: value,
                      empresaId: String(colaborador.empresaId),
                    }));
                  }
                }}
                disabled={colaboradores.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={colaboradores.length === 0 ? "Nenhum colaborador cadastrado" : "Selecione o colaborador"} />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhum colaborador cadastrado. Cadastre colaboradores primeiro.
                    </div>
                  ) : (
                    colaboradores.map((colaborador: any) => (
                      <SelectItem key={colaborador.id} value={String(colaborador.id)}>
                        {colaborador.nomeCompleto}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {colaboradores.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Você precisa cadastrar pelo menos um colaborador antes de criar um ASO.
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="empresaId">Empresa *</Label>
              <Select
                value={formData.empresaId}
                onValueChange={(value) => setFormData({ ...formData, empresaId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa: any) => (
                    <SelectItem key={empresa.id} value={String(empresa.id)}>
                      {empresa.razaoSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="numeroAso">Número do ASO</Label>
              <Input
                id="numeroAso"
                value={formData.numeroAso}
                onChange={(e) => setFormData({ ...formData, numeroAso: e.target.value })}
                placeholder="Ex: ASO-2024-001"
              />
            </div>

            <div>
              <Label htmlFor="tipoAso">Tipo de ASO *</Label>
              <Select
                value={formData.tipoAso}
                onValueChange={(value) => setFormData({ ...formData, tipoAso: value as TipoAso })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admissional">Admissional</SelectItem>
                  <SelectItem value="periodico">Periódico</SelectItem>
                  <SelectItem value="retorno_trabalho">Retorno ao Trabalho</SelectItem>
                  <SelectItem value="mudanca_funcao">Mudança de Função</SelectItem>
                  <SelectItem value="demissional">Demissional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dataEmissao">Data de Emissão *</Label>
              <Input
                id="dataEmissao"
                type="date"
                value={formData.dataEmissao}
                onChange={(e) => setFormData({ ...formData, dataEmissao: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="dataValidade">Data de Validade *</Label>
              <Input
                id="dataValidade"
                type="date"
                value={formData.dataValidade}
                onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="medicoResponsavel">Médico Responsável</Label>
              <Input
                id="medicoResponsavel"
                value={formData.medicoResponsavel}
                onChange={(e) => setFormData({ ...formData, medicoResponsavel: e.target.value })}
                placeholder="Nome do médico"
              />
            </div>

            <div>
              <Label htmlFor="crmMedico">CRM</Label>
              <Input
                id="crmMedico"
                value={formData.crmMedico}
                onChange={(e) => setFormData({ ...formData, crmMedico: e.target.value })}
                placeholder="Ex: CRM-12345"
              />
            </div>

            <div>
              <Label htmlFor="clinicaMedica">Clínica Médica</Label>
              <Input
                id="clinicaMedica"
                value={formData.clinicaMedica}
                onChange={(e) => setFormData({ ...formData, clinicaMedica: e.target.value })}
                placeholder="Nome da clínica"
              />
            </div>

            <div>
              <Label htmlFor="apto">Apto para Trabalho *</Label>
              <Select
                value={formData.apto}
                onValueChange={(value) => setFormData({ ...formData, apto: value as SituacaoApto })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Apto</SelectItem>
                  <SelectItem value="nao">Inapto</SelectItem>
                  <SelectItem value="apto_com_restricoes">Apto com Restrições</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.apto === "apto_com_restricoes" && (
              <div className="md:col-span-2">
                <Label htmlFor="restricoes">Restrições</Label>
                <Textarea
                  id="restricoes"
                  value={formData.restricoes}
                  onChange={(e) => setFormData({ ...formData, restricoes: e.target.value })}
                  placeholder="Descreva as restrições médicas"
                  rows={3}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais"
                rows={3}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="anexoUrl">URL do Anexo (PDF)</Label>
              <Input
                id="anexoUrl"
                type="url"
                value={formData.anexoUrl}
                onChange={(e) => setFormData({ ...formData, anexoUrl: e.target.value })}
                placeholder="https://exemplo.com/aso.pdf"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createMutation.isPending || updateMutation.isPending || colaboradores.length === 0}
            >
              {editingId ? "Atualizar" : "Cadastrar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );

  const renderPainel = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Visão geral dos ASOs, cobertura e alertas prioritários.
          </p>
        </div>
        {renderActions()}
      </div>

      {colaboradores.length === 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">
                  Nenhum colaborador cadastrado
                </p>
                <p className="text-xs text-amber-800 mt-1">
                  Não há colaboradores cadastrados no sistema. Os dados de cobertura não podem ser calculados. 
                  Cadastre colaboradores na página de <strong>Colaboradores</strong> para começar a gerenciar ASOs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {dashboardLoading ? (
        <Card className={dashboardCardClass}>
          <CardContent className="py-6">
            <div className="flex items-center gap-3 text-muted-foreground">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-transparent" />
              <span>Carregando painel de ASOs...</span>
            </div>
          </CardContent>
        </Card>
      ) : dashboardData ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            <Card
              className={cn(
                dashboardCardClass,
                "cursor-pointer",
                filtroRapidoAtivo === "todos" && "ring-2 ring-primary"
              )}
              onClick={() => aplicarFiltroRapido("todos")}
              role="button"
              tabIndex={0}
              onKeyDown={handleCardKeyDown("todos")}
            >
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center justify-between">
                  <CardTitle className={cardTitleClass}>Total de ASOs</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 text-2xl font-bold">{formatNumber(dashboardData.totalAsos)}</div>
                <p className="text-xs text-muted-foreground">
                  Ativos: {formatNumber(dashboardData.totalAtivos)} • Vencidos: {formatNumber(dashboardData.totalVencidos)}
                </p>
              </CardHeader>
            </Card>

            <Card
              className={cn(
                dashboardCardClass,
                "cursor-pointer",
                filtroRapidoAtivo === "ativos" && "ring-2 ring-primary",
                colaboradores.length === 0 && "opacity-60 cursor-not-allowed"
              )}
              onClick={() => colaboradores.length > 0 && aplicarFiltroRapido("ativos")}
              role="button"
              tabIndex={0}
              onKeyDown={colaboradores.length > 0 ? handleCardKeyDown("ativos") : undefined}
            >
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center justify-between">
                  <CardTitle className={cardTitleClass}>Cobertura dos colaboradores</CardTitle>
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                </div>
              </CardHeader>
              <CardContent>
                {colaboradores.length === 0 ? (
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-muted-foreground">-</div>
                    <p className="text-xs text-muted-foreground">
                      Nenhum colaborador cadastrado
                    </p>
                    <div className="mt-3 h-2 w-full rounded-full bg-muted">
                      <div className="h-full rounded-full bg-muted" style={{ width: "0%" }} />
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                      <AlertTriangle className="h-4 w-4" />
                      <span>Cadastre colaboradores para calcular a cobertura</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{coveragePercent}%</div>
                    <p className="text-xs text-muted-foreground">
                      Cobertos: {formatNumber(colaboradoresCobertos)} / {formatNumber(totalColaboradores)}
                    </p>
                    <div className="mt-3 h-2 w-full rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.min(coveragePercent, 100)}%` }}
                      />
                    </div>
                    {colaboradoresSemAso > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{formatNumber(colaboradoresSemAso)} colaborador(es) sem ASO válido</span>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card
              className={cn(
                dashboardCardClass,
                "cursor-pointer",
                filtroRapidoAtivo === "vencidos" && "ring-2 ring-primary"
              )}
              onClick={() => aplicarFiltroRapido("vencidos")}
              role="button"
              tabIndex={0}
              onKeyDown={handleCardKeyDown("vencidos")}
            >
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center justify-between">
                  <CardTitle className={cardTitleClass}>ASOs vencidos</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-red-600">{formatNumber(dashboardData.totalVencidos)}</div>
                <p className="text-xs text-muted-foreground">Revise os casos críticos na lista abaixo</p>
              </CardHeader>
            </Card>

            <Card
              className={cn(
                dashboardCardClass,
                "cursor-pointer",
                filtroRapidoAtivo === "aVencer30" && "ring-2 ring-primary"
              )}
              onClick={() => aplicarFiltroRapido("aVencer30")}
              role="button"
              tabIndex={0}
              onKeyDown={handleCardKeyDown("aVencer30")}
            >
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center justify-between">
                  <CardTitle className={cardTitleClass}>Vencem em 30 dias</CardTitle>
                  <CalendarClock className="h-4 w-4 text-orange-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-orange-500">{formatNumber(dashboardData.totalAVencer30)}</div>
                <p className="text-xs text-muted-foreground">Antecipe renovações para manter a conformidade</p>
              </CardHeader>
            </Card>

            <Card
              className={cn(
                dashboardCardClass,
                "cursor-pointer",
                filtroRapidoAtivo === "aVencer5" && "ring-2 ring-primary"
              )}
              onClick={() => aplicarFiltroRapido("aVencer5")}
              role="button"
              tabIndex={0}
              onKeyDown={handleCardKeyDown("aVencer5")}
            >
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center justify-between">
                  <CardTitle className={cardTitleClass}>Vencem em 5 dias</CardTitle>
                  <CalendarClock className="h-4 w-4 text-amber-500" />
                </div>
                <div className="mt-2 text-2xl font-bold text-amber-500">{formatNumber(totalAVencer5)}</div>
                <p className="text-xs text-muted-foreground">Atenção imediata para renovações urgentes</p>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Card className={dashboardCardClass}>
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Distribuição por tipo</CardTitle>
                  <PieChart className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {porTipo.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum ASO cadastrado ainda.</p>
                ) : (
                  porTipo.map((item) => (
                    <div key={item.tipo} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{getTipoAsoLabel(item.tipo)}</span>
                        <span className="font-semibold">{formatNumber(item.total)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(item.total / maxPorTipo) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className={dashboardCardClass}>
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Vencimentos por mês</CardTitle>
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {vencimentosPorMes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum vencimento planejado.</p>
                ) : (
                  vencimentosPorMes.map((item) => (
                    <div key={item.mes} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{formatMonthLabel(item.mes)}</span>
                        <span className="font-semibold">{formatNumber(item.total)}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-blue-500"
                          style={{ width: `${(item.total / maxVencimentosMes) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className={dashboardCardClass}>
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Empresas com mais ASOs vencidos</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {topEmpresasVencidos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma empresa com ASOs vencidos.</p>
                ) : (
                  topEmpresasVencidos.map((empresa) => (
                    <div key={empresa.empresaId} className="flex items-center justify-between text-sm">
                      <span>{empresa.empresaNome}</span>
                      <Badge variant="secondary">{formatNumber(empresa.total)}</Badge>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <Card className={dashboardCardClass}>
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">Próximos vencimentos</CardTitle>
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {proximosVencimentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum ASO próximo de vencer.</p>
                ) : (
                  proximosVencimentos.map((item) => {
                    const colaboradorExiste = item.colaboradorId ? colaboradores.some((c: any) => c.id === item.colaboradorId) : false;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between gap-4 rounded-lg border border-border p-3",
                          !colaboradorExiste && colaboradores.length > 0 && "bg-orange-50 border-orange-200"
                        )}
                      >
                        <div>
                          <p className={cn(
                            "font-medium",
                            !colaboradorExiste && colaboradores.length > 0 && "text-orange-700"
                          )}>
                            {item.colaboradorNome || (colaboradores.length === 0 ? "Sem colaboradores cadastrados" : "Colaborador excluído")}
                          </p>
                          <p className="text-sm text-muted-foreground">{item.empresaNome || "Empresa não informada"}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-1">
                            {getTipoAsoLabel(item.tipoAso)}
                          </Badge>
                          <div className="text-sm text-muted-foreground">{formatDate(item.dataValidade)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            <Card className={dashboardCardClass}>
              <CardHeader className={cardHeaderClass}>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold">ASOs vencidos recentemente</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {asosVencidosRecentes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum ASO vencido recentemente.</p>
                ) : (
                  asosVencidosRecentes.map((item) => {
                    const colaboradorExiste = item.colaboradorId ? colaboradores.some((c: any) => c.id === item.colaboradorId) : false;
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center justify-between gap-4 rounded-lg border border-border p-3",
                          !colaboradorExiste && colaboradores.length > 0 && "bg-orange-50 border-orange-200"
                        )}
                      >
                        <div>
                          <p className={cn(
                            "font-medium",
                            !colaboradorExiste && colaboradores.length > 0 && "text-orange-700"
                          )}>
                            {item.colaboradorNome || (colaboradores.length === 0 ? "Sem colaboradores cadastrados" : "Colaborador excluído")}
                          </p>
                          <p className="text-sm text-muted-foreground">{item.empresaNome || "Empresa não informada"}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive" className="mb-1">
                            {getTipoAsoLabel(item.tipoAso)}
                          </Badge>
                          <div className="text-sm text-muted-foreground">{formatDate(item.dataValidade)}</div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          <Card className={dashboardCardClass}>
            <CardHeader className={cardHeaderClass}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">Anotações rápidas</CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Registre lembretes, pendências e atividades prioritárias para sua equipe.
                  </p>
                </div>
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
                    <Select
                      value={notaPrioridade}
                      onValueChange={(value) => setNotaPrioridade(value as NotaPrioridade)}
                    >
                      <SelectTrigger id="notaPrioridade">
                        <SelectValue placeholder="Selecione a prioridade" />
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
                      placeholder="Acrescente detalhes, responsáveis ou datas importantes."
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
                        Nenhuma anotação ainda. Crie lembretes para se organizar melhor.
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
                              "rounded-xl border p-4 shadow-sm transition hover:shadow-md",
                              prioridadeEstilos[nota.prioridade].containerClass
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
        </>
      ) : (
        <Card className={dashboardCardClass}>
          <CardContent className="py-6">
            <p className="text-sm text-muted-foreground">
              Cadastre o primeiro ASO para visualizar o painel de controle.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderLista = () => {
    const asosSemColaborador = asosParaTabela.filter((aso: any) => {
      const colaborador = colaboradores.find((c: any) => c.id === aso.colaboradorId);
      return !colaborador;
    });

    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Lista de ASOs</h2>
            <p className="text-sm text-muted-foreground">
              Consulte rapidamente os ASOs com filtros avançados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm">
              <label htmlFor="toggle-historico" className="font-medium">
                Mostrar histórico completo
              </label>
              <input
                id="toggle-historico"
                type="checkbox"
                checked={mostrarHistorico}
                onChange={(e) => setMostrarHistorico(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
            {renderActions()}
          </div>
        </div>

        {colaboradores.length === 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-900">
                    Nenhum colaborador cadastrado
                  </p>
                  <p className="text-xs text-amber-800 mt-1">
                    Não há colaboradores cadastrados no sistema. Os ASOs existentes podem estar vinculados a colaboradores que foram excluídos. 
                    Cadastre colaboradores na página de <strong>Colaboradores</strong> para criar novos ASOs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {colaboradores.length > 0 && asosSemColaborador.length > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-orange-900">
                    {asosSemColaborador.length} ASO(s) sem colaborador vinculado
                  </p>
                  <p className="text-xs text-orange-800 mt-1">
                    Alguns ASOs estão vinculados a colaboradores que foram excluídos. Estes registros aparecerão com "Colaborador excluído" na lista.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={dashboardCardClass}>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="searchTerm">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  id="searchTerm"
                  placeholder="Buscar por colaborador, empresa, número..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="pl-8"
                />
                {filters.searchTerm && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setFilters({ ...filters, searchTerm: "" })}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="filterColaborador">Colaborador</Label>
              <Select
                value={filters.colaboradorId}
                onValueChange={(value) => setFilters({ ...filters, colaboradorId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {colaboradores.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhum colaborador cadastrado
                    </div>
                  ) : (
                    colaboradores.map((colaborador: any) => (
                      <SelectItem key={colaborador.id} value={String(colaborador.id)}>
                        {colaborador.nomeCompleto}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filterEmpresa">Empresa</Label>
              <Select
                value={filters.empresaId}
                onValueChange={(value) => setFilters({ ...filters, empresaId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {empresas.map((empresa: any) => (
                    <SelectItem key={empresa.id} value={String(empresa.id)}>
                      {empresa.razaoSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filterTipoAso">Tipo de ASO</Label>
              <Select
                value={filters.tipoAso}
                onValueChange={(value) => setFilters({ ...filters, tipoAso: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="admissional">Admissional</SelectItem>
                  <SelectItem value="periodico">Periódico</SelectItem>
                  <SelectItem value="retorno_trabalho">Retorno ao Trabalho</SelectItem>
                  <SelectItem value="mudanca_funcao">Mudança de Função</SelectItem>
                  <SelectItem value="demissional">Demissional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filterStatus">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="vencido">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="filterCpf">CPF</Label>
              <Input
                id="filterCpf"
                placeholder="Apenas números"
                value={filters.cpf}
                onChange={(e) => setFilters({ ...filters, cpf: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="dataValidadeInicio">Validade (início)</Label>
              <Input
                id="dataValidadeInicio"
                type="date"
                value={filters.dataValidadeInicio}
                onChange={(e) => setFilters({ ...filters, dataValidadeInicio: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="dataValidadeFim">Validade (fim)</Label>
              <Input
                id="dataValidadeFim"
                type="date"
                value={filters.dataValidadeFim}
                onChange={(e) => setFilters({ ...filters, dataValidadeFim: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="vencidos"
                checked={filters.vencidos}
                onChange={(e) => setFilters({ ...filters, vencidos: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="vencidos" className="cursor-pointer">
                Apenas vencidos
              </Label>
            </div>

            <div>
              <Label htmlFor="aVencerEmDias">A vencer em (dias)</Label>
              <Input
                id="aVencerEmDias"
                type="number"
                placeholder="Ex: 30"
                value={filters.aVencerEmDias}
                onChange={(e) => setFilters({ ...filters, aVencerEmDias: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={dashboardCardClass}>
        <CardHeader>
          <CardTitle>
            Lista de ASOs ({asosParaTabela.length})
            {!mostrarHistorico && <span className="ml-2 text-xs text-muted-foreground">(mostrando o registro mais recente por colaborador)</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {asosParaTabela.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>Nenhum ASO encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Emissão</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Médico</TableHead>
                    <TableHead>Apto</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {asosParaTabela.map((aso: any) => {
                    const colaboradorExiste = colaboradores.some((c: any) => c.id === aso.colaboradorId);
                    const colaboradorNome = getColaboradorName(aso.colaboradorId);
                    return (
                      <TableRow 
                        key={aso.id} 
                        className={!colaboradorExiste && colaboradores.length > 0 ? "bg-orange-50/50" : ""}
                      >
                        <TableCell className="font-medium">{aso.numeroAso || "N/A"}</TableCell>
                        <TableCell>
                          {!colaboradorExiste && colaboradores.length > 0 ? (
                            <span className="text-orange-600 font-medium">{colaboradorNome}</span>
                          ) : colaboradores.length === 0 ? (
                            <span className="text-amber-600 font-medium">{colaboradorNome}</span>
                          ) : (
                            colaboradorNome
                          )}
                        </TableCell>
                        <TableCell>{getEmpresaName(aso.empresaId)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{getTipoAsoLabel(aso.tipoAso)}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(aso.dataEmissao)}</TableCell>
                        <TableCell>{formatDate(aso.dataValidade)}</TableCell>
                        <TableCell>
                          {aso.medicoResponsavel || "N/A"}
                          {aso.crmMedico && ` (${aso.crmMedico})`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              aso.apto === "sim"
                                ? "default"
                                : aso.apto === "nao"
                                ? "destructive"
                                : "outline"
                            }
                          >
                            {getAptoLabel(aso.apto)}
                          </Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(aso)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(aso)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(aso.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    );
  };

  const renderRelatorios = () => (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Relatórios & Histórico</h2>
        <p className="text-sm text-muted-foreground">
          Gere relatórios completos em PDF com o histórico de ASOs de cada colaborador.
        </p>
      </div>

      <Card className={dashboardCardClass}>
        <CardHeader>
          <CardTitle>Emissão de Relatório em PDF</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="relatorio-colaborador">Colaborador</Label>
              <Select
                value={colaboradorRelatorioId}
                onValueChange={(value) => setColaboradorRelatorioId(value)}
              >
                <SelectTrigger id="relatorio-colaborador">
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      Nenhum colaborador cadastrado
                    </div>
                  ) : (
                    colaboradores.map((colaborador: any) => (
                      <SelectItem key={colaborador.id} value={String(colaborador.id)}>
                        {colaborador.nomeCompleto}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                className="w-full md:w-auto"
                onClick={handleGerarRelatorio}
                disabled={!colaboradorRelatorioId || gerandoRelatorio || colaboradores.length === 0}
              >
                {gerandoRelatorio ? "Gerando PDF..." : "Gerar PDF"}
              </Button>
            </div>
            {colaboradores.length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  <strong>Atenção:</strong> Não há colaboradores cadastrados. Cadastre colaboradores na página de Colaboradores antes de gerar relatórios.
                </p>
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>O relatório inclui:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Datas de emissão e validade de todos os ASOs</li>
              <li>Tipo (admissional, periódico, mudança de função, etc.) e status de cada registro</li>
              <li>Dias emitidos antes ou após o vencimento anterior e duração de cada ASO</li>
              <li>Resumo com totais, médias e indicadores de cobertura</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando ASOs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de ASOs</h1>
          <p className="text-gray-600 mt-1">Gerencie os Atestados de Saúde Ocupacional</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <Card className="border border-border shadow-sm">
              <CardContent className="p-2">
                <nav className="space-y-2">
                  {asoSections.map((section) => {
                    const Icon = section.icon;
                    const isActive =
                      normalizedLocation === section.path ||
                      normalizedLocation.startsWith(`${section.path}/`);
                    return (
                      <button
                        key={section.id}
                        onClick={() => setLocation(section.path)}
                        className={cn(
                          "w-full rounded-lg px-3 py-3 text-left transition-all border border-transparent",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "hover:bg-accent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={cn(
                              "mt-1 rounded-md p-2",
                              isActive ? "bg-primary-foreground/20" : "bg-primary/10"
                            )}
                          >
                            <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-primary")} />
                          </span>
                          <div>
                            <div className="font-semibold leading-tight">{section.label}</div>
                            <p
                              className={cn(
                                "text-xs mt-1 leading-snug",
                                isActive ? "text-primary-foreground/80" : "text-muted-foreground"
                              )}
                            >
                              {section.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {isPainel && renderPainel()}
            {isLista && renderLista()}
            {isRelatorios && renderRelatorios()}
            {!isPainel && !isLista && !isRelatorios && renderPainel()}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
