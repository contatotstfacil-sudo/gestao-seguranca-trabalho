
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, VerticalAlign, Header, Footer, InternalHyperlink, PageBreak, ExternalHyperlink, XmlComponent, Media, ImageRun } from "docx";
import { saveAs } from "file-saver";
import { useAuth } from "@/_core/hooks/useAuth";

// Nota: A biblioteca docx não suporta campos dinâmicos de página nativamente
// Por enquanto, usamos texto fixo "Página 1 de 2"
// O usuário pode atualizar manualmente no Word se necessário
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";
import {
  Building2,
  Check,
  ChevronsUpDown,
  CopyPlus,
  Edit,
  FileDown,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserCheck,
  X,
  Filter,
  FileText,
  File,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Lista de estados brasileiros
const ESTADOS_BRASIL = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import jsPDF from "jspdf";

type EmpresaResumo = {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
  descricaoAtividade?: string | null;
  tipoLogradouro?: string | null;
  nomeLogradouro?: string | null;
  numeroEndereco?: string | null;
  complementoEndereco?: string | null;
  cidadeEndereco?: string | null;
  estadoEndereco?: string | null;
  cep?: string | null;
  emailContato?: string | null;
  cnae?: string | null;
  grauRisco?: string | null;
};

type ResponsavelResumo = {
  id: string;
  nomeCompleto: string;
  funcao?: string | null;
  registroProfissional?: string | null;
};

type CargoResumo = {
  id: string;
  nomeCargo: string;
  descricao?: string | null;
  codigoCbo?: string | null;
  empresaId?: string | null;
};

type SetorResumo = {
  id: string;
  nomeSetor: string;
  descricao?: string | null;
  empresaId?: string | null;
};

type CargoPlanoItem = {
  id: string;
  cargoId: string;
  cargoNome: string;
  cargoOpen: boolean;
  cargoSearch: string;
  setorId: string;
  setorNome: string;
  setorOpen: boolean;
  setorSearch: string;
  cbo: string;
};

type EmissaoPgroCargo = {
  id: string;
  cargoId: string;
  cargoNome: string;
  setorId: string;
  setorNome: string;
  cbo: string;
};

type CronogramaAcao = {
  id: string;
  descricao: string;
  metaDiaria: boolean;
  metaMensal: boolean;
  metaTrimestral: boolean;
  metaAnual: boolean;
  estrategiaMetodologia: string;
};

// Componente para buscar e exibir total de cargos da empresa
function TotalCargosEmpresa({ empresaId }: { empresaId?: string }) {
  const utils = trpc.useUtils();
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (empresaId) {
      const empresaIdNumber = parseInt(empresaId);
      if (!isNaN(empresaIdNumber)) {
        setLoading(true);
        utils.colaboradores.list.fetch({ empresaId: empresaIdNumber })
          .then((colaboradores: any[]) => {
            const cargosUnicos = new Set(
              colaboradores
                .filter((c: any) => c.cargoId && c.status === 'ativo')
                .map((c: any) => c.cargoId)
            );
            setTotal(cargosUnicos.size);
            setLoading(false);
          })
          .catch(() => {
            setTotal(null);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [empresaId, utils]);

  if (loading) return <span className="text-lg">...</span>;
  if (total === null) return <span className="text-lg">—</span>;
  return <span>{total}</span>;
}

type EmissaoPgro = {
  id: string;
  empresaId: string;
  empresaNome: string;
  responsavelId: string;
  responsavelNome: string;
  responsavelFuncao?: string | null;
  responsavelRegistro?: string | null;
  vigenciaInicio: string;
  vigenciaFim: string;
  observacoes: string;
  cargos: EmissaoPgroCargo[];
  cronogramaAcoes?: CronogramaAcao[];
  cidadeEmissao?: string;
  estadoEmissao?: string;
  dataEmissao?: string;
  criadoEm: string;
  atualizadoEm: string;
};

export default function LaudoPgro() {
  const createEmptyCargoItem = useCallback((): CargoPlanoItem => {
    const gerarId = (): string => {
      if (typeof window !== "undefined" && window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
      }
      return Math.random().toString(36).slice(2, 10);
    };

    return {
      id: gerarId(),
      cargoId: "",
      cargoNome: "",
      cargoOpen: false,
      cargoSearch: "",
      setorId: "",
      setorNome: "",
      setorOpen: false,
      setorSearch: "",
      cbo: "",
    };
  }, []);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [empresaOpen, setEmpresaOpen] = useState(false);
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaResumo | null>(null);
  const [vigenciaInicio, setVigenciaInicio] = useState<string>("");
  const [vigenciaFim, setVigenciaFim] = useState<string>("");
  const [responsavelOpen, setResponsavelOpen] = useState(false);
  const [responsavelSearch, setResponsavelSearch] = useState("");
  const [responsavelSelecionado, setResponsavelSelecionado] =
    useState<ResponsavelResumo | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [cargosPlano, setCargosPlano] = useState<CargoPlanoItem[]>(() => [createEmptyCargoItem()]);
  const [cronogramaAcoes, setCronogramaAcoes] = useState<CronogramaAcao[]>([]);
  const [cidadeEmissao, setCidadeEmissao] = useState<string>("");
  const [estadoEmissao, setEstadoEmissao] = useState<string>("");
  const [dataEmissao, setDataEmissao] = useState<string>("");
  const [emissaoEditandoId, setEmissaoEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [gerandoWord, setGerandoWord] = useState(false);
  // Obter tenantId do usuário logado para isolar dados no localStorage
  const { user } = useAuth();
  const tenantId = useMemo(() => {
    return user?.tenantId || user?.id || "default"; // Usar ID como fallback se não tiver tenantId
  }, [user?.tenantId, user?.id]);
  
  const [emissoesSelecionadas, setEmissoesSelecionadas] = useState<string[]>([]);
  const [emissoes, setEmissoes] = useState<EmissaoPgro[]>([]);
  
  // Carregar emissões do localStorage quando o tenantId estiver disponível
  useEffect(() => {
    if (typeof window === "undefined" || !tenantId) return;
    try {
      // ISOLAMENTO POR TENANT: Usar chave específica do tenant
      const storageKey = `pgro-emissoes-${tenantId}`;
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setEmissoes([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Filtrar apenas dados do tenant correto (segurança extra)
        const filtered = parsed.filter((e: any) => {
          // Se a emissão tiver tenantId, verificar
          if (e.tenantId !== undefined) {
            return e.tenantId === tenantId || (user?.role === "admin" || user?.role === "super_admin");
          }
          // Se não tiver tenantId, assumir que é do tenant atual (dados antigos)
          return true;
        });
        setEmissoes(filtered);
      } else {
        setEmissoes([]);
      }
    } catch (error) {
      console.error("Erro ao carregar emissões do localStorage", error);
      setEmissoes([]);
    }
  }, [tenantId, user?.role]);

  const [buscaEmissao, setBuscaEmissao] = useState("");
  const [empresaFiltroEmissao, setEmpresaFiltroEmissao] = useState<string>("__all__");

  const empresaIdNumber = useMemo(() => {
    if (!selectedEmpresa?.id) return undefined;
    const parsed = Number(selectedEmpresa.id);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [selectedEmpresa]);

  const utils = trpc.useUtils();

  // Buscar todas as empresas sem filtro (o filtro é feito no frontend)
  const { data: empresasData = [], isLoading: isLoadingEmpresas } = trpc.empresas.list.useQuery(
    undefined,
    {
      // Garantir que sempre busca todas as empresas
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
    }
  );
  const { data: responsaveisData = [], isLoading: isLoadingResponsaveis } =
    trpc.responsaveis.list.useQuery();
  const queryEnabled = !!empresaIdNumber;
  const cargosQueryInput = empresaIdNumber ? { empresaId: empresaIdNumber } : undefined;
  const setoresQueryInput = empresaIdNumber ? { empresaId: empresaIdNumber } : undefined;
  const { data: cargosData = [], isLoading: isLoadingCargos } = trpc.cargos.list.useQuery(
    cargosQueryInput,
    { enabled: queryEnabled }
  );
  const { data: setoresData = [], isLoading: isLoadingSetores } = trpc.setores.list.useQuery(
    setoresQueryInput,
    { enabled: queryEnabled }
  );

  const empresas: EmpresaResumo[] = useMemo(
    () =>
      empresasData.map((empresa: any) => ({
        id: empresa.id?.toString?.() ?? "",
        razaoSocial: empresa.razaoSocial ?? "",
        nomeFantasia: empresa.nomeFantasia ?? "",
        cnpj: empresa.cnpj ?? "",
        descricaoAtividade: empresa.descricaoAtividade ?? "",
        tipoLogradouro: empresa.tipoLogradouro ?? "",
        nomeLogradouro: empresa.nomeLogradouro ?? "",
        numeroEndereco: empresa.numeroEndereco ?? "",
        complementoEndereco: empresa.complementoEndereco ?? "",
        cidadeEndereco: empresa.cidadeEndereco ?? "",
        estadoEndereco: empresa.estadoEndereco ?? "",
        cep: empresa.cep ?? "",
        emailContato: empresa.emailContato ?? "",
        cnae: empresa.cnae ?? null,
        grauRisco: empresa.grauRisco ?? null,
      })),
    [empresasData]
  );

  const empresasFiltradas = useMemo(() => {
    // Se não há empresas, retorna vazio
    if (!empresas || empresas.length === 0) return [];
    
    // Se não há termo de busca, retorna todas
    if (!empresaSearch || !empresaSearch.trim()) return empresas;
    
    const termo = empresaSearch.toLowerCase().trim();
    
    // Se o termo é muito curto (menos de 1 caractere), retorna todas
    if (termo.length < 1) return empresas;
    
    // Remove caracteres especiais do CNPJ para busca mais flexível
    const termoSemFormatacao = termo.replace(/[^\d]/g, '');
    
    const resultados = empresas.filter((empresa) => {
      const razaoSocial = (empresa.razaoSocial || '').toLowerCase();
      const nomeFantasia = (empresa.nomeFantasia || '').toLowerCase();
      const cnpj = (empresa.cnpj || '').toLowerCase();
      const cnpjSemFormatacao = cnpj.replace(/[^\d]/g, '');
      
      // Busca por razão social
      if (razaoSocial.includes(termo)) return true;
      
      // Busca por nome fantasia
      if (nomeFantasia && nomeFantasia.includes(termo)) return true;
      
      // Busca por CNPJ (com ou sem formatação)
      if (cnpj && cnpj.includes(termo)) return true;
      if (termoSemFormatacao && cnpjSemFormatacao && cnpjSemFormatacao.includes(termoSemFormatacao)) return true;
      
      // Busca por palavras individuais (divide o termo em palavras)
      const palavras = termo.split(/\s+/).filter(p => p.length > 0);
      if (palavras.length > 1) {
        const todasPalavrasEncontradas = palavras.every(palavra =>
          razaoSocial.includes(palavra) || (nomeFantasia && nomeFantasia.includes(palavra))
        );
        if (todasPalavrasEncontradas) return true;
      }
      
      // Busca por caracteres iniciais (ex: "na" encontra "Nacional")
      if (razaoSocial.startsWith(termo)) return true;
      if (nomeFantasia && nomeFantasia.startsWith(termo)) return true;
      
      return false;
    });
    
    // Debug: log dos resultados
    if (termo.length >= 2) {
      console.log(`[PGRO] Busca por "${termo}": ${resultados.length} resultado(s) de ${empresas.length} empresa(s)`);
    }
    
    return resultados;
  }, [empresas, empresaSearch]);

  const cargosDisponiveis: CargoResumo[] = useMemo(
    () => {
      if (!queryEnabled) return [];

      const mapped = cargosData.map((cargo: any) => ({
        id: cargo.id?.toString?.() ?? "",
        nomeCargo: cargo.nomeCargo ?? "",
        descricao: cargo.descricao ?? "",
        codigoCbo: cargo.codigoCbo ?? cargo.cbo ?? "",
        empresaId: cargo.empresaId?.toString?.() ?? null,
      }));

      if (!empresaIdNumber) return mapped;
      const empresaIdStr = empresaIdNumber.toString();
      return mapped.filter((cargo: { empresaId: string | null }) => cargo.empresaId === null || cargo.empresaId === empresaIdStr);
    },
    [cargosData, empresaIdNumber, queryEnabled]
  );

  const setoresDisponiveis: SetorResumo[] = useMemo(
    () => {
      if (!queryEnabled) return [];

      const mapped = setoresData.map((setor: any) => ({
        id: setor.id?.toString?.() ?? "",
        nomeSetor: setor.nomeSetor ?? "",
        descricao: setor.descricao ?? "",
        empresaId: setor.empresaId?.toString?.() ?? null,
      }));

      if (!empresaIdNumber) return mapped;
      const empresaIdStr = empresaIdNumber.toString();
      return mapped.filter((setor: SetorResumo) => setor.empresaId === null || setor.empresaId === empresaIdStr);
    },
    [setoresData, empresaIdNumber, queryEnabled]
  );

  const podeSelecionarCargos = queryEnabled && cargosDisponiveis.length > 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      // ISOLAMENTO POR TENANT: Usar chave específica do tenant
      const storageKey = `pgro-emissoes-${tenantId}`;
      // Garantir que todas as emissões tenham tenantId
      const emissoesComTenant = emissoes.map(e => ({
        ...e,
        tenantId: e.tenantId || tenantId
      }));
      window.localStorage.setItem(storageKey, JSON.stringify(emissoesComTenant));
    } catch (error) {
      console.error("Erro ao salvar emissões do PGRO", error);
    }
  }, [emissoes, tenantId]);

  const handleSelectEmpresa = (empresa: EmpresaResumo) => {
    setSelectedEmpresa(empresa);
    setEmpresaOpen(false);
    setCargosPlano([createEmptyCargoItem()]);
  };

  const resetDialogState = useCallback(() => {
    setEmpresaOpen(false);
    setEmpresaSearch("");
    setSelectedEmpresa(null);
    setVigenciaInicio("");
    setVigenciaFim("");
    setResponsavelOpen(false);
    setResponsavelSearch("");
    setResponsavelSelecionado(null);
    setObservacoes("");
    setCronogramaAcoes([]);
    setCargosPlano([createEmptyCargoItem()]);
    setCidadeEmissao("");
    setEstadoEmissao("");
    setDataEmissao("");
    setEmissaoEditandoId(null);
    setSalvando(false);
  }, [createEmptyCargoItem]);

  const handleDialogToggle = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open && !emissaoEditandoId) {
        // Só resetar se não estiver editando
        setTimeout(() => {
        resetDialogState();
        }, 100);
      }
    },
    [resetDialogState, emissaoEditandoId]
  );

  const handleDialogClose = useCallback(() => {
    setDialogOpen(false);
    setTimeout(() => {
      resetDialogState();
    }, 100);
  }, [resetDialogState]);

  const nomeEmpresaSelecionada = selectedEmpresa
    ? selectedEmpresa.nomeFantasia?.trim() || selectedEmpresa.razaoSocial
    : "";

  const responsaveis: ResponsavelResumo[] = useMemo(
    () =>
      responsaveisData.map((responsavel: any) => ({
        id: responsavel.id?.toString?.() ?? "",
        nomeCompleto: responsavel.nomeCompleto ?? "",
        funcao: responsavel.funcao ?? "",
        registroProfissional: responsavel.registroProfissional ?? "",
      })),
    [responsaveisData]
  );

  const responsaveisFiltrados = useMemo(() => {
    if (!responsavelSearch.trim()) return responsaveis;
    const termo = responsavelSearch.toLowerCase();
    return responsaveis.filter((responsavel) =>
      responsavel.nomeCompleto.toLowerCase().includes(termo) ||
      (responsavel.funcao?.toLowerCase().includes(termo) ?? false) ||
      (responsavel.registroProfissional?.toLowerCase().includes(termo) ?? false)
    );
  }, [responsaveis, responsavelSearch]);

  const handleSelectResponsavel = (responsavel: ResponsavelResumo) => {
    setResponsavelSelecionado(responsavel);
    setResponsavelOpen(false);
  };

  const filtroCargos = useCallback(
    (termo: string) => {
      if (!termo.trim()) return cargosDisponiveis;
      const busca = termo.toLowerCase();
      return cargosDisponiveis.filter((cargo) =>
        cargo.nomeCargo.toLowerCase().includes(busca) ||
        (cargo.codigoCbo?.toLowerCase().includes(busca) ?? false)
      );
    },
    [cargosDisponiveis]
  );

  const filtroSetores = useCallback(
    (termo: string) => {
      if (!termo.trim()) return setoresDisponiveis;
      const busca = termo.toLowerCase();
      return setoresDisponiveis.filter((setor) =>
        setor.nomeSetor.toLowerCase().includes(busca) ||
        (setor.descricao?.toLowerCase().includes(busca) ?? false)
      );
    },
    [setoresDisponiveis]
  );

  const atualizarItemCargo = useCallback((itemId: string, partial: Partial<CargoPlanoItem>) => {
    setCargosPlano((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...partial,
            }
          : item
      )
    );
  }, []);

  const handleSelectCargoPlano = useCallback(
    async (itemId: string, cargo: CargoResumo) => {
      atualizarItemCargo(itemId, {
        cargoId: cargo.id,
        cargoNome: cargo.nomeCargo,
        cbo: cargo.codigoCbo ?? "",
        cargoOpen: false,
        cargoSearch: "",
      });

      try {
        const cargoIdNumber = Number(cargo.id);
        if (!Number.isNaN(cargoIdNumber) && cargoIdNumber > 0) {
          const setoresRelacionados = await utils.cargoSetores.getByCargo.fetch({ cargoId: cargoIdNumber });
          if (setoresRelacionados && setoresRelacionados.length > 0) {
            const primeiroSetor = setoresRelacionados[0];
            const setorEncontrado = setoresDisponiveis.find(
              (setor) => setor.id === primeiroSetor.setorId?.toString?.()
            );

            atualizarItemCargo(itemId, {
              setorId: setorEncontrado?.id ?? primeiroSetor.setorId?.toString?.() ?? "",
              setorNome:
                setorEncontrado?.nomeSetor ??
                (typeof primeiroSetor.setorId === "number"
                  ? `Setor #${primeiroSetor.setorId}`
                  : ""),
            });
          } else {
            atualizarItemCargo(itemId, { setorId: "", setorNome: "" });
          }
        }
      } catch (error) {
        console.error("Erro ao carregar setor do cargo:", error);
      }
    },
    [atualizarItemCargo, setoresDisponiveis, utils]
  );

  const handleSelectSetorPlano = useCallback(
    (itemId: string, setor: SetorResumo) => {
      atualizarItemCargo(itemId, {
        setorId: setor.id,
        setorNome: setor.nomeSetor,
        setorOpen: false,
        setorSearch: "",
      });
    },
    [atualizarItemCargo]
  );

  const handleAdicionarCargoPlano = useCallback(() => {
    if (!podeSelecionarCargos) return;
    setCargosPlano((prev) => {
      const lista = prev.length === 1 && !prev[0].cargoId ? prev : [...prev];
      return [...lista, createEmptyCargoItem()];
    });
  }, [createEmptyCargoItem, podeSelecionarCargos]);

  const handleAdicionarTodosCargosPlano = useCallback(() => {
    if (!podeSelecionarCargos || cargosDisponiveis.length === 0) return;

    const novos: Array<{ cargo: CargoResumo; item: CargoPlanoItem }> = [];

    setCargosPlano((prev) => {
      const existentes = new Set(prev.map((item) => item.cargoId).filter((id) => !!id));
      const paraAdicionar = cargosDisponiveis.filter(
        (cargo) => cargo.id && !existentes.has(cargo.id)
      );

      if (paraAdicionar.length === 0) {
        return prev.length === 0 ? [createEmptyCargoItem()] : prev;
      }

      const baseExistentes = prev.filter((item) => item.cargoId);

      paraAdicionar.forEach((cargo) => {
        const item = {
          ...createEmptyCargoItem(),
          cargoId: cargo.id,
          cargoNome: cargo.nomeCargo,
          cbo: cargo.codigoCbo ?? "",
        };
        novos.push({ cargo, item });
      });

      const resultado = [...baseExistentes, ...novos.map(({ item }) => item)];
      return resultado.length === 0 ? [createEmptyCargoItem()] : resultado;
    });

    if (novos.length > 0) {
      setTimeout(() => {
        novos.forEach(({ cargo, item }) => {
          void handleSelectCargoPlano(item.id, cargo);
        });
      }, 0);
    }
  }, [cargosDisponiveis, createEmptyCargoItem, handleSelectCargoPlano, podeSelecionarCargos]);

  const formularioValido = useMemo(() => {
    if (!selectedEmpresa?.id) return false;
    if (!responsavelSelecionado?.id) return false;
    if (!vigenciaInicio || !vigenciaFim) return false;
    if (!cargosPlano.some((item) => item.cargoId)) return false;
    return true;
  }, [selectedEmpresa?.id, responsavelSelecionado?.id, vigenciaInicio, vigenciaFim, cargosPlano]);

  const emissoesFiltradas = useMemo(() => {
    const termo = buscaEmissao.trim().toLowerCase();
    return emissoes
      .filter((emissao) => {
        if (empresaFiltroEmissao !== "__all__" && empresaFiltroEmissao) {
          if (emissao.empresaId !== empresaFiltroEmissao) return false;
        }
        if (!termo) return true;
        return (
          emissao.empresaNome.toLowerCase().includes(termo) ||
          emissao.responsavelNome.toLowerCase().includes(termo) ||
          emissao.cargos.some((cargo) =>
            cargo.cargoNome.toLowerCase().includes(termo) ||
            cargo.cbo.toLowerCase().includes(termo) ||
            cargo.setorNome.toLowerCase().includes(termo)
          )
        );
      })
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  }, [emissoes, buscaEmissao, empresaFiltroEmissao]);

  const totaisPainel = useMemo(() => {
    const total = emissoes.length;
    const totalFiltrado = emissoesFiltradas.length;
    const empresasUnicas = new Set(emissoes.map((item) => item.empresaId)).size;
    return {
      total,
      totalFiltrado,
      empresasUnicas,
    };
  }, [emissoes, emissoesFiltradas]);

  const handleToggleSelecionado = useCallback((emissaoId: string) => {
    setEmissoesSelecionadas((prev) =>
      prev.includes(emissaoId)
        ? prev.filter((id) => id !== emissaoId)
        : [...prev, emissaoId]
    );
  }, []);

  const handleSelecionarTodos = useCallback(() => {
    if (emissoesSelecionadas.length === emissoesFiltradas.length) {
      setEmissoesSelecionadas([]);
    } else {
      setEmissoesSelecionadas(emissoesFiltradas.map((emissao) => emissao.id));
    }
  }, [emissoesFiltradas, emissoesSelecionadas.length]);


  // Garantir que os valores de emissão sejam carregados quando o diálogo abrir
  useEffect(() => {
    if (dialogOpen && emissaoEditandoId) {
      const emissao = emissoes.find((e) => e.id === emissaoEditandoId);
      if (emissao) {
        // Forçar atualização dos valores
        setCidadeEmissao(emissao.cidadeEmissao || "");
        setEstadoEmissao(emissao.estadoEmissao || "");
        setDataEmissao(emissao.dataEmissao || "");
      }
    }
  }, [dialogOpen, emissaoEditandoId, emissoes]);

  const salvarEmissoesLocal = useCallback(
    (lista: EmissaoPgro[]) => {
      setEmissoes(lista);
      if (typeof window !== "undefined") {
        try {
          // ISOLAMENTO POR TENANT: Usar chave específica do tenant
          const storageKey = `pgro-emissoes-${tenantId}`;
          // Garantir que todas as emissões tenham tenantId
          const listaComTenant = lista.map(e => ({
            ...e,
            tenantId: e.tenantId || tenantId
          }));
          window.localStorage.setItem(storageKey, JSON.stringify(listaComTenant));
        } catch (error) {
          console.error("Erro ao persistir emissões do PGRO", error);
        }
      }
    },
    []
  );

  const handleExcluirEmissao = useCallback(
    (id: string) => {
      const atualizadas = emissoes.filter((emissao) => emissao.id !== id);
      salvarEmissoesLocal(atualizadas);
      setEmissoesSelecionadas((prev) => prev.filter((item) => item !== id));
      toast.success("Emissão removida.");
    },
    [emissoes, salvarEmissoesLocal]
  );

  const handleExcluirSelecionados = useCallback(() => {
    if (emissoesSelecionadas.length === 0) return;
    const atualizadas = emissoes.filter((emissao) => !emissoesSelecionadas.includes(emissao.id));
    salvarEmissoesLocal(atualizadas);
    setEmissoesSelecionadas([]);
    toast.success("Emissões selecionadas foram excluídas.");
  }, [emissoes, emissoesSelecionadas, salvarEmissoesLocal]);

  // Modelo padrão PGRO - Capa em branco em formato retrato com margens estreitas (1,27 cm) e cabeçalho
  const gerarTemplatePGROPadrao = useCallback((emissao: EmissaoPgro) => {
    // Buscar dados da empresa
    const empresa = empresas.find((e) => e.id === emissao.empresaId);
    const empresaCnpj = empresa?.cnpj || '';
    const empresaAtividade = empresa?.descricaoAtividade || '';
    
    // Formatar datas corretamente (evitar problemas de timezone)
    const formatarData = (dataString: string) => {
      if (!dataString) return '';
      // Se já está no formato YYYY-MM-DD, usar diretamente
      if (dataString.match(/^\d{4}-\d{2}-\d{2}/)) {
        const [ano, mes, dia] = dataString.split('-');
        return `${dia}/${mes}/${ano}`;
      }
      // Caso contrário, tentar formatar com date-fns
      try {
        return format(new Date(dataString), "dd/MM/yyyy");
      } catch {
        return dataString;
      }
    };
    
    const dataEmissao = formatarData(emissao.vigenciaInicio);
    const dataVencimento = formatarData(emissao.vigenciaFim);
    
    // Formatar mês/ano da data de vencimento em maiúsculo
    const formatarMesAno = (dataString: string) => {
      if (!dataString) return '';
      try {
        let data: Date;
        // Se está no formato YYYY-MM-DD, criar Date corretamente
        if (dataString.match(/^\d{4}-\d{2}-\d{2}/)) {
          const [ano, mes, dia] = dataString.split('-').map(Number);
          data = new Date(ano, mes - 1, dia);
        } else {
          data = new Date(dataString);
        }
        return format(data, "MMMM / yyyy", { locale: ptBR }).toUpperCase();
      } catch {
        return '';
      }
    };
    
    const mesAnoVencimento = formatarMesAno(emissao.vigenciaFim);
    
    // Formatar endereço completo da empresa
    const formatarEndereco = () => {
      if (!empresa) return '';
      
      const partes: string[] = [];
      
      // Tipo de logradouro + Nome do logradouro
      if (empresa.tipoLogradouro && empresa.nomeLogradouro) {
        partes.push(`${empresa.tipoLogradouro.toUpperCase()} ${empresa.nomeLogradouro.toUpperCase()}`);
      } else if (empresa.nomeLogradouro) {
        partes.push(empresa.nomeLogradouro.toUpperCase());
      }
      
      // Número
      if (empresa.numeroEndereco && partes.length > 0) {
        partes[partes.length - 1] += `, Nº ${empresa.numeroEndereco}`;
      }
      
      // Complemento (se houver)
      if (empresa.complementoEndereco) {
        partes.push(empresa.complementoEndereco.toUpperCase());
      }
      
      // Cidade - Estado
      if (empresa.cidadeEndereco && empresa.estadoEndereco) {
        partes.push(`${empresa.cidadeEndereco.toUpperCase()}-${empresa.estadoEndereco.toUpperCase()}`);
      } else if (empresa.cidadeEndereco) {
        partes.push(empresa.cidadeEndereco.toUpperCase());
      }
      
      // CEP
      if (empresa.cep) {
        const cepFormatado = empresa.cep.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2-$3');
        partes.push(`CEP ${cepFormatado}`);
      }
      
      return partes.join(', ');
    };
    
    const enderecoCompleto = formatarEndereco();
    const telefoneEmpresa = empresa?.emailContato || '';

    // Buscar modelo salvo (primeiro modelo em localStorage) para preencher corpo
    const modeloSalvo = (() => {
      try {
        const raw = typeof window !== "undefined" ? localStorage.getItem("modelos-pgro") : null;
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed) || parsed.length === 0) return null;
        return parsed[0];
      } catch {
        return null;
      }
    })();

    const formatarTexto = (texto: string) => {
      if (!texto) return "";
      if (texto.includes("<img") || texto.includes("<table") || texto.includes("<div")) {
        return texto;
      }
      return texto.replace(/\n/g, "<br>");
    };

    const buildPaginaConteudo = (numero: number, titulo: string, conteudo: string) => `
      <div class="pagina" style="padding: 25px; font-family: 'Calibri Light', Calibri, sans-serif; line-height: 1.6;">
        <table style="width: 100%; border: 1px solid #000000; border-collapse: collapse; margin: 0 0 20px 0; font-size: 11pt;">
          <tr>
            <td style="width: 70%; padding: 8px 12px; vertical-align: middle; border-right: 1px solid #000000; font-weight: bold; text-transform: uppercase; white-space: nowrap; text-align: center;">PGRO – PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</td>
            <td style="width: 30%; padding: 8px 12px; vertical-align: middle; text-align: center; white-space: nowrap;">Página ${numero}</td>
          </tr>
        </table>

        <div style="background-color: #f5f5f5; padding: 12px 14px; border: 1px solid #dcdcdc; margin-bottom: 18px; text-transform: uppercase; font-weight: bold; color: #003366; font-size: 13pt; text-align: center;">
          ${titulo}
        </div>

        <div style="font-size: 12pt; text-align: justify;">
          ${formatarTexto(conteudo || "Conteúdo não informado.")}
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #000; padding-top: 14px; text-align: center; font-size: 10pt; color: #666;">
          ${enderecoCompleto || ""} ${telefoneEmpresa || ""}
        </div>
      </div>
    `;

    const paginasConteudo = modeloSalvo
      ? [
          { titulo: "1. Objetivos", conteudo: modeloSalvo.objetivos },
          { titulo: "2. Fundamentação Legal", conteudo: modeloSalvo.fundamentacaoLegal },
          { titulo: "3. Informação/Divulgação dos Dados", conteudo: modeloSalvo.informacaoDivulgacao },
          { titulo: "4. Periodicidade e Análise Global do PGR", conteudo: modeloSalvo.periodicidadeAnalise },
          { titulo: "5. Monitoramento da Exposição aos Riscos", conteudo: modeloSalvo.monitoramentoExposicao },
          { titulo: "6. Análise de Exposição dos Riscos", conteudo: modeloSalvo.analiseExposicao },
          { titulo: "7. Responsabilidades", conteudo: modeloSalvo.responsabilidades },
          { titulo: "8. Inventário de Reconhecimento Avaliação e Controle", conteudo: modeloSalvo.inventarioReconhecimento },
        ]
          .map((sec, idx) => buildPaginaConteudo(idx + 2, sec.titulo, sec.conteudo || ""))
          .join("")
      : "";
    
    return `
      <!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns:v="urn:schemas-microsoft-com:vml" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <meta name="ProgId" content="Word.Document">
          <meta name="Generator" content="Microsoft Word">
          <meta name="Originator" content="Microsoft Word">
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word">
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
            <o:DocumentProperties xmlns:o="urn:schemas-microsoft-com:office:office">
              <o:Version>12.00</o:Version>
            </o:DocumentProperties>
          </xml>
          <![endif]-->
          <style>
            @page {
              size: A4 portrait;
              margin-top: 1.27cm;
              margin-bottom: 1.27cm;
              margin-left: 1.27cm;
              margin-right: 1.27cm;
            }
            body {
              font-family: "Calibri Light", Calibri, sans-serif;
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              background-color: #ffffff;
            }
            .capa {
              width: 100%;
              height: 100%;
              min-height: calc(100vh - 60px);
              background-color: #ffffff;
              page-break-after: always;
            }
            .pagina {
              page-break-after: always;
            }
            .pagina:last-child {
              page-break-after: auto;
            }
          </style>
          <!--[if gte mso 9]>
          <style>
            @page Section1 {
              size: 21.0cm 29.7cm;
              margin: 1.27cm 1.27cm 1.27cm 1.27cm;
              mso-header-margin: 0.635cm;
              mso-footer-margin: 0.635cm;
              mso-paper-source: 0;
            }
            div.Section1 {
              page: Section1;
            }
            table {
              mso-displayed-decimal-separator: "\\,";
              mso-displayed-thousand-separator: "\\.";
            }
          </style>
          <![endif]-->
        </head>
        <body>
          <!--[if gte mso 9]>
          <div class="Section1">
          <![endif]-->
          <!-- Cabeçalho que se repete em todas as páginas -->
          <table style="width: 100%; border: 1px solid #000000; border-collapse: collapse; margin: 0; padding: 0; font-family: 'Calibri Light', Calibri, sans-serif;">
            <tr>
              <td style="width: 70%; padding: 8px 12px; vertical-align: middle; border-right: 1px solid #000000; font-weight: bold; text-transform: uppercase; white-space: nowrap; text-align: center; font-family: 'Calibri Light', Calibri, sans-serif;">PGRO – PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</td>
              <td style="width: 30%; padding: 8px 12px; vertical-align: middle; text-align: center; white-space: nowrap; font-family: 'Calibri Light', Calibri, sans-serif;">
                Página <span style="mso-field-code: ' PAGE '"></span> de <span style="mso-field-code: ' NUMPAGES '"></span>
              </td>
            </tr>
          </table>
          <div style="line-height: 1.5; font-family: 'Calibri Light', Calibri, sans-serif;">
            <br/><br/><br/><br/><br/><br/><br/><br/>
            <div style="text-align: center; font-family: 'Calibri Light', Calibri, sans-serif;">
              <div style="font-size: 20pt; font-weight: bold; font-family: 'Calibri Light', Calibri, sans-serif;">PROGRAMA DE GERENCIAMENTO DE RISCO</div>
              <div style="font-size: 20pt; font-weight: bold; font-family: 'Calibri Light', Calibri, sans-serif;">OCUPACIONAIS</div>
              <div style="font-size: 12pt; font-weight: bold; font-family: 'Calibri Light', Calibri, sans-serif; margin-top: 20px;">Referencias Normativas: NR01 – NR09</div>
              <br/><br/>
              <div style="font-size: 15pt; font-weight: bold; font-family: 'Calibri Light', Calibri, sans-serif; color: #003366;">${emissao.empresaNome || ''}</div>
              <div style="font-size: 15pt; font-weight: bold; font-family: 'Calibri Light', Calibri, sans-serif; color: #003366;">CNPJ: ${empresaCnpj}</div>
              <br/><br/><br/><br/><br/><br/><br/><br/><br/>
              <div style="font-size: 10pt; font-family: 'Calibri Light', Calibri, sans-serif; color: #000000; text-align: left;"><span style="font-weight: bold;">Descrição de atividades:</span> ${empresaAtividade}</div>
              <br/><br/><br/><br/>
              <div style="text-align: right; font-family: 'Calibri Light', Calibri, sans-serif;">
                <table style="margin-left: auto; margin-right: 0; border-collapse: collapse; font-size: 10pt; font-family: 'Calibri Light', Calibri, sans-serif;">
                  <tr>
                    <td style="padding-right: 15px; text-align: right; font-family: 'Calibri Light', Calibri, sans-serif; font-weight: bold;">Data de emissão do programa:</td>
                    <td style="text-align: left; font-family: 'Calibri Light', Calibri, sans-serif;">${dataEmissao}</td>
                  </tr>
                  <tr>
                    <td style="padding-right: 15px; text-align: right; font-family: 'Calibri Light', Calibri, sans-serif; font-weight: bold;">Data vencimento programa:</td>
                    <td style="text-align: left; font-family: 'Calibri Light', Calibri, sans-serif;">${dataVencimento}</td>
                  </tr>
                </table>
              </div>
              <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>
              <div style="text-align: center; font-family: 'Calibri Light', Calibri, sans-serif;">
                <div style="font-size: 23pt; font-weight: bold; color: #FF0000; text-transform: uppercase; font-family: 'Calibri Light', Calibri, sans-serif;">- ${mesAnoVencimento} -</div>
              </div>
              <br/><br/>
              <div style="text-align: center; font-family: 'Calibri Light', Calibri, sans-serif; width: 100%;">
                <hr style="border: none; border-top: 1px solid #CCCCCC; width: 100%; margin: 10px 0;" />
                ${enderecoCompleto ? `<div style="font-size: 10pt; color: #808080; font-family: 'Calibri Light', Calibri, sans-serif; margin-top: 10px; text-align: center;">${enderecoCompleto}</div>` : ''}
                ${telefoneEmpresa ? `<div style="font-size: 10pt; color: #808080; font-family: 'Calibri Light', Calibri, sans-serif; margin-top: 5px; text-align: center;">${telefoneEmpresa}</div>` : ''}
              </div>
            </div>
          </div>

          ${paginasConteudo}
          <!--[if gte mso 9]>
          </div>
          <![endif]-->
        </body>
      </html>
    `;
  }, [empresas]);

  // Código antigo removido - modelo completo desconsiderado
  /*
    let modelo = modeloPgro;
    if (!modelo) {
      const modelosSalvos = typeof window !== "undefined" ? localStorage.getItem("modelos-pgro") : null;
      if (modelosSalvos) {
        try {
          const modelos = JSON.parse(modelosSalvos);
          modelo = modelos.length > 0 ? modelos[0] : null; // Usar o primeiro modelo
        } catch (e) {
          console.error("Erro ao carregar modelo:", e);
        }
      }
    }

    const dataInicio = format(new Date(emissao.vigenciaInicio), "dd/MM/yyyy", { locale: ptBR });
    const dataFim = format(new Date(emissao.vigenciaFim), "dd/MM/yyyy", { locale: ptBR });
    const dataAtual = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
    const mesAno = format(new Date(emissao.vigenciaFim), "MMMM/yyyy", { locale: ptBR }).toUpperCase();
    const cidade = empresa?.cidade || "Campinas";
    const estado = empresa?.estado || "SP";

    // Função para formatar texto do modelo
    const formatarTexto = (texto: string) => {
      if (!texto) return "";
      if (texto.includes("<img") || texto.includes("<table") || texto.includes("<div")) {
        return texto;
      }
      return texto.replace(/\n/g, "<br>");
    };

    // PÁGINA 1 - CAPA
    const pagina1 = `
      <div class="page" style="font-family: Arial, sans-serif;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 30%; vertical-align: top; padding-right: 10px;">
              <div style="border: 1px solid #000; padding: 10px; background-color: #E6F3FF; text-align: center;">
                <div style="font-weight: bold; font-size: 14px; color: #0066CC;">${empresa?.nomeFantasia?.split(" ")[0] || "EMPRESA"}</div>
                <div style="font-weight: bold; font-size: 12px; color: #0066CC; margin-top: 5px;">${empresa?.nomeFantasia?.split(" ").slice(1).join(" ") || "MAQUINAS"}</div>
              </div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="border: 1px solid #000; padding: 15px; background-color: #fff;">
                <div style="font-weight: bold; font-size: 16px; text-transform: uppercase;">PGRO - PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</div>
              </div>
            </td>
            <td style="width: 20%; text-align: right; vertical-align: top; padding-left: 10px;">
              <div style="border: 1px solid #000; padding: 10px; text-align: center;">
                <div style="font-size: 12px;">Página 1 de 21</div>
              </div>
            </td>
          </tr>
        </table>

        <div style="text-align: center; margin: 60px 0;">
          <div style="font-size: 48px; font-weight: bold; margin-bottom: 20px;">PGRO</div>
          <div style="font-size: 24px; font-weight: bold; margin-bottom: 30px;">PROGRAMA DE GERENCIAMENTO DE RISCO OCUPACIONAIS</div>
          <div style="font-size: 14px; margin-bottom: 40px;">Referencias Normativas: NR01 - NR09</div>
          <div style="font-size: 28px; font-weight: bold; color: #FF6600; margin-bottom: 20px;">${emissao.responsavelNome.toUpperCase()}</div>
          <div style="font-size: 24px; font-weight: bold; color: #FF6600; margin-bottom: 40px;">${empresa?.razaoSocial || empresa?.nomeFantasia || emissao.empresaNome}</div>
          <div style="font-size: 14px; margin-bottom: 20px;"><strong>DESCRIÇÃO DAS ATIVIDADES:</strong></div>
          <div style="font-size: 14px;">${empresa?.atividade || "Obras de terraplenagem"}</div>
        </div>

        <div style="margin-top: 80px;">
          <table style="width: 60%; margin: 0 auto; border-collapse: collapse;">
            <tr>
              <td style="border: 1px solid #000; padding: 8px; font-weight: bold; width: 50%;">INÍCIO DO INVENTÁRIO:</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${dataInicio}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">LEVANTAMENTO DE RISCOS:</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${dataInicio}</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">VENCIMENTO DO INVENTÁRIO:</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">${dataFim}</td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 60px; border-top: 2px solid #000; padding-top: 20px; text-align: center;">
          <div style="font-size: 20px; font-weight: bold; color: #CC0000;">– ${mesAno} –</div>
          <div style="margin-top: 20px; font-size: 11px;">
            ${empresa?.endereco || "R ANTONIO MALAQUIAS PAES, Nº 321, JARDIM GUANABARA, MONTE MOR-SP, CEP 13.190-656"} ${empresa?.telefone || "(19) 99791-5106"}
          </div>
        </div>
      </div>
    `;

    // PÁGINA 2 - CONTROLE DE REVISÕES
    const pagina2 = `
      <div class="page" style="font-family: Arial, sans-serif;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 30%; vertical-align: top; padding-right: 10px;">
              <div style="border: 1px solid #000; padding: 10px; background-color: #E6F3FF; text-align: center;">
                <div style="font-weight: bold; font-size: 14px; color: #0066CC;">${empresa?.nomeFantasia?.split(" ")[0] || "EMPRESA"}</div>
                <div style="font-weight: bold; font-size: 12px; color: #0066CC; margin-top: 5px;">${empresa?.nomeFantasia?.split(" ").slice(1).join(" ") || "MAQUINAS"}</div>
              </div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="border: 1px solid #000; padding: 15px; background-color: #fff;">
                <div style="font-weight: bold; font-size: 16px; text-transform: uppercase;">PGRO - PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</div>
              </div>
            </td>
            <td style="width: 20%; text-align: right; vertical-align: top; padding-left: 10px;">
              <div style="border: 1px solid #000; padding: 10px; text-align: center;">
                <div style="font-size: 12px;">Página 2 de 21</div>
              </div>
            </td>
          </tr>
        </table>

        <div style="background-color: #808080; padding: 15px; margin-bottom: 30px;">
          <div style="color: #fff; font-weight: bold; font-size: 18px; text-align: center; text-transform: uppercase;">CONTROLE DE REVISÕES</div>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #D3D3D3;">
            <td style="border: 1px solid #000; padding: 10px; font-weight: bold; text-align: center; width: 15%;">REV</td>
            <td style="border: 1px solid #000; padding: 10px; font-weight: bold; text-align: center; width: 60%;">DESCRIÇÃO</td>
            <td style="border: 1px solid #000; padding: 10px; font-weight: bold; text-align: center; width: 25%;">DATA</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 10px; text-align: center;">00</td>
            <td style="border: 1px solid #000; padding: 10px;">Emissão Geral</td>
            <td style="border: 1px solid #000; padding: 10px; color: #CC0000;">preencher</td>
          </tr>
          ${Array.from({ length: 10 }, (_, i) => `
            <tr>
              <td style="border: 1px solid #000; padding: 10px; text-align: center;"></td>
              <td style="border: 1px solid #000; padding: 10px;"></td>
              <td style="border: 1px solid #000; padding: 10px;"></td>
            </tr>
          `).join("")}
        </table>

        <div style="margin-top: 60px; border-top: 2px solid #000; padding-top: 20px; text-align: center; font-size: 11px;">
          ${empresa?.endereco || "R ANTONIO MALAQUIAS PAES, Nº 321, JARDIM GUANABARA, MONTE MOR-SP, CEP 13.190-656"} ${empresa?.telefone || "(19) 99791-5106"}
        </div>
      </div>
    `;

    // PÁGINA 3 - IDENTIFICAÇÃO DA EMPRESA
    const pagina3 = `
      <div class="page" style="font-family: Arial, sans-serif;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 30%; vertical-align: top; padding-right: 10px;">
              <div style="border: 1px solid #000; padding: 10px; background-color: #E6F3FF; text-align: center;">
                <div style="font-weight: bold; font-size: 14px; color: #0066CC;">${empresa?.nomeFantasia?.split(" ")[0] || "EMPRESA"}</div>
                <div style="font-weight: bold; font-size: 12px; color: #0066CC; margin-top: 5px;">${empresa?.nomeFantasia?.split(" ").slice(1).join(" ") || "MAQUINAS"}</div>
              </div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="border: 1px solid #000; padding: 15px; background-color: #fff;">
                <div style="font-weight: bold; font-size: 16px; text-transform: uppercase;">PGRO - PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</div>
              </div>
            </td>
            <td style="width: 20%; text-align: right; vertical-align: top; padding-left: 10px;">
              <div style="border: 1px solid #000; padding: 10px; text-align: center;">
                <div style="font-size: 12px;">Página 3 de 21</div>
              </div>
            </td>
          </tr>
        </table>

        <div style="background-color: #808080; padding: 15px; margin-bottom: 30px;">
          <div style="color: #fff; font-weight: bold; font-size: 18px; text-align: center; text-transform: uppercase;">IDENTIFICAÇÃO DA EMPRESA</div>
        </div>

        <div style="line-height: 2;">
          <p><strong>Razão Social:</strong> ${empresa?.razaoSocial || emissao.empresaNome}</p>
          <p><strong>Cnpj:</strong> ${empresa?.cnpj || "00.000.000/0000-00"}</p>
          <p><strong>Atividade:</strong> ${empresa?.atividade || "Obra de Terraplenagem"}</p>
          <p><strong>Cnae principal:</strong> ${empresa?.cnae || "43.13-4-00"}</p>
          <p><strong>Grau de Risco:</strong> ${empresa?.grauRisco || "03"}</p>
          <p><strong>Rua:</strong> ${empresa?.endereco || "R ANTONIO MALAQUIAS PAES, Nº 321, JARDIM GUANABARA, MONTE MOR-SP, CEP 13.190-656"}</p>
          <p><strong>Total de Empregado:</strong> ${empresa?.totalFuncionarios || "04"}</p>
          <p><strong>Empregados Homens:</strong> ${empresa?.funcionariosHomens || "04"}</p>
          <p><strong>Empregados Mulheres:</strong> ${empresa?.funcionariosMulheres || "00"}</p>
          <p><strong>Horário de Trabalho:</strong> ${empresa?.horarioTrabalho || "De segunda a quinta feira das 07h às 17h de sexta das 07h às 16h."}</p>
        </div>

        <div style="margin-top: 60px; border-top: 2px solid #000; padding-top: 20px; text-align: center; font-size: 11px;">
          ${empresa?.endereco || "R ANTONIO MALAQUIAS PAES, Nº 321, JARDIM GUANABARA, MONTE MOR-SP, CEP 13.190-656"} ${empresa?.telefone || "(19) 99791-5106"}
        </div>
      </div>
    `;

    // PÁGINA 4 - ÍNDICE
    const pagina4 = `
      <div class="page" style="font-family: Arial, sans-serif;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 30%; vertical-align: top; padding-right: 10px;">
              <div style="border: 1px solid #000; padding: 10px; background-color: #E6F3FF; text-align: center;">
                <div style="font-weight: bold; font-size: 14px; color: #0066CC;">${empresa?.nomeFantasia?.split(" ")[0] || "EMPRESA"}</div>
                <div style="font-weight: bold; font-size: 12px; color: #0066CC; margin-top: 5px;">${empresa?.nomeFantasia?.split(" ").slice(1).join(" ") || "MAQUINAS"}</div>
              </div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="border: 1px solid #000; padding: 15px; background-color: #fff;">
                <div style="font-weight: bold; font-size: 16px; text-transform: uppercase;">PGRO - PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</div>
              </div>
            </td>
            <td style="width: 20%; text-align: right; vertical-align: top; padding-left: 10px;">
              <div style="border: 1px solid #000; padding: 10px; text-align: center;">
                <div style="font-size: 12px;">Página 4 de 21</div>
              </div>
            </td>
          </tr>
        </table>

        <div style="background-color: #808080; padding: 15px; margin-bottom: 30px;">
          <div style="color: #fff; font-weight: bold; font-size: 18px; text-align: center; text-transform: uppercase;">ÍNDICE</div>
        </div>

        <div style="line-height: 2.5;">
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #000; padding: 5px 0;">
            <span><strong>1. objetivos.</strong></span>
            <span>05</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #000; padding: 5px 0;">
            <span><strong>2. Fundamentação legal.</strong></span>
            <span>06</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #000; padding: 5px 0;">
            <span><strong>3. Informação/Divulgação dos dados.</strong></span>
            <span>07</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #000; padding: 5px 0;">
            <span><strong>4. Periodicidade e analise global do PGR.</strong></span>
            <span>08</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #000; padding: 5px 0;">
            <span><strong>5. Monitoramento da Exposição aos riscos.</strong></span>
            <span>09</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #000; padding: 5px 0;">
            <span><strong>6. Analise de exposição dos riscos.</strong></span>
            <span>10</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #000; padding: 5px 0;">
            <span><strong>7. CIPA.</strong></span>
            <span>11</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #000; padding: 5px 0;">
            <span><strong>8. Responsabilidades.</strong></span>
            <span>12</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #000; padding: 5px 0;">
            <span><strong>9. Inventario de reconhecimento avaliação e controle.</strong></span>
            <span>13</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #000; padding: 5px 0;">
            <span><strong>10. Cronograma de ações.</strong></span>
            <span>20</span>
          </div>
          <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #000; padding: 5px 0;">
            <span><strong>11. Termino do Programa.</strong></span>
            <span>21</span>
          </div>
        </div>

        <div style="margin-top: 60px; border-top: 2px solid #000; padding-top: 20px; text-align: center; font-size: 11px;">
          ${empresa?.endereco || "R ANTONIO MALAQUIAS PAES, Nº 321, JARDIM GUANABARA, MONTE MOR-SP, CEP 13.190-656"} ${empresa?.telefone || "(19) 99791-5106"}
        </div>
      </div>
    `;

    // PÁGINAS 5-12 - CONTEÚDO DO MODELO
    const gerarPaginaConteudo = (numero: number, titulo: string, conteudo: string) => {
      return `
        <div class="page" style="font-family: Arial, sans-serif;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="width: 30%; vertical-align: top; padding-right: 10px;">
                <div style="border: 1px solid #000; padding: 10px; background-color: #E6F3FF; text-align: center;">
                  <div style="font-weight: bold; font-size: 14px; color: #0066CC;">${empresa?.nomeFantasia?.split(" ")[0] || "EMPRESA"}</div>
                  <div style="font-weight: bold; font-size: 12px; color: #0066CC; margin-top: 5px;">${empresa?.nomeFantasia?.split(" ").slice(1).join(" ") || "MAQUINAS"}</div>
                </div>
              </td>
              <td style="width: 50%; text-align: center; vertical-align: top;">
                <div style="border: 1px solid #000; padding: 15px; background-color: #fff;">
                  <div style="font-weight: bold; font-size: 16px; text-transform: uppercase;">PGRO - PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</div>
                </div>
              </td>
              <td style="width: 20%; text-align: right; vertical-align: top; padding-left: 10px;">
                <div style="border: 1px solid #000; padding: 10px; text-align: center;">
                  <div style="font-size: 12px;">Página ${numero} de 21</div>
                </div>
              </td>
            </tr>
          </table>

          <div style="background-color: #808080; padding: 15px; margin-bottom: 30px;">
            <div style="color: #fff; font-weight: bold; font-size: 18px; text-align: center; text-transform: uppercase;">${titulo}</div>
          </div>

          <div style="line-height: 1.8; text-align: justify;">
            ${formatarTexto(conteudo)}
          </div>

          <div style="margin-top: 60px; border-top: 2px solid #000; padding-top: 20px; text-align: center; font-size: 11px;">
            ${empresa?.endereco || "R ANTONIO MALAQUIAS PAES, Nº 321, JARDIM GUANABARA, MONTE MOR-SP, CEP 13.190-656"} ${empresa?.telefone || "(19) 99791-5106"}
          </div>
        </div>
      `;
    };

    const pagina5 = gerarPaginaConteudo(5, "1. OBJETIVOS", modelo?.objetivos || "");
    const pagina6 = gerarPaginaConteudo(6, "2. FUNDAMENTO LEGAL", modelo?.fundamentacaoLegal || "");
    const pagina7 = gerarPaginaConteudo(7, "3. INFORMAÇÃO/DIVULGAÇÃO DOS DADOS", modelo?.informacaoDivulgacao || "");
    const pagina8 = gerarPaginaConteudo(8, "4. PERIODICIDADE E ANALISE GLOBAL DO PPRA", modelo?.periodicidadeAnalise || "");
    const pagina9 = gerarPaginaConteudo(9, "5. MONITORAMENTO DA EXPOSIÇÃO AOS RISCOS", modelo?.monitoramentoExposicao || "");
    const pagina10 = gerarPaginaConteudo(10, "6. ANALISE DE EXPOSIÇÃO DOS TRABALHADORES", modelo?.analiseExposicao || "");
    
    // PÁGINA 11 - CIPA
    const pagina11 = `
      <div class="page" style="font-family: Arial, sans-serif;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 30%; vertical-align: top; padding-right: 10px;">
              <div style="border: 1px solid #000; padding: 10px; background-color: #E6F3FF; text-align: center;">
                <div style="font-weight: bold; font-size: 14px; color: #0066CC;">${empresa?.nomeFantasia?.split(" ")[0] || "EMPRESA"}</div>
                <div style="font-weight: bold; font-size: 12px; color: #0066CC; margin-top: 5px;">${empresa?.nomeFantasia?.split(" ").slice(1).join(" ") || "MAQUINAS"}</div>
              </div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="border: 1px solid #000; padding: 15px; background-color: #fff;">
                <div style="font-weight: bold; font-size: 16px; text-transform: uppercase;">PGRO - PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</div>
              </div>
            </td>
            <td style="width: 20%; text-align: right; vertical-align: top; padding-left: 10px;">
              <div style="border: 1px solid #000; padding: 10px; text-align: center;">
                <div style="font-size: 12px;">Página 11 de 21</div>
              </div>
            </td>
          </tr>
        </table>

        <div style="background-color: #808080; padding: 15px; margin-bottom: 30px;">
          <div style="color: #fff; font-weight: bold; font-size: 18px; text-align: center; text-transform: uppercase;">7. COMISSÃO INTERNA DE PREVENÇÃO DE ACIDENTES – CIPA NR 05</div>
        </div>

        <div style="line-height: 1.8; text-align: justify; margin-bottom: 30px;">
          <p>
            Comissão Interna de Prevenção de Acidentes (CIPA) é, segundo a legislação brasileira, uma comissão constituída por representantes indicados pelo empregador e membros eleitos pelos trabalhadores, de forma partidária, em cada estabelecimento da empresa, que tem a finalidade de prevenir acidentes e doenças decorrentes da vila laboral de cada trabalhador.
          </p>
        </div>

        <div style="margin-bottom: 30px;">
          <div style="font-weight: bold; margin-bottom: 10px;">QUADRO I</div>
          <div style="font-weight: bold; margin-bottom: 10px;">NÚMERO DE FUNCIONÁRIOS NA EMPRESA</div>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #D3D3D3;">
              <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">GRUPOS</td>
              <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">ELEITOS DA CIPA</td>
              <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">0 a 19</td>
              <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">20 a 29</td>
              <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">30 a 50</td>
              <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">51 a 80</td>
              <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">81 a 100</td>
              <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">101 a 120</td>
            </tr>
            <tr>
              <td rowspan="2" style="border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle;">C-18</td>
              <td style="border: 1px solid #000; padding: 8px;">Titulares</td>
              <td style="border: 1px solid #000; padding: 8px;"></td>
              <td style="border: 1px solid #000; padding: 8px;"></td>
              <td style="border: 1px solid #000; padding: 8px;"></td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">2</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">2</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">4</td>
            </tr>
            <tr>
              <td style="border: 1px solid #000; padding: 8px;">Suplentes</td>
              <td style="border: 1px solid #000; padding: 8px;"></td>
              <td style="border: 1px solid #000; padding: 8px;"></td>
              <td style="border: 1px solid #000; padding: 8px;"></td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">2</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">2</td>
              <td style="border: 1px solid #000; padding: 8px; text-align: center;">3</td>
            </tr>
          </table>
        </div>

        <div style="line-height: 1.8; text-align: justify;">
          <p>
            De acordo com o quadro I da NR 05, as empresas que não atingirem o quadro de CIPA é necessário designar um empregado para representante da empresa para o cumprimento das atribuições da NR 05.
          </p>
        </div>

        <div style="margin-top: 60px; border-top: 2px solid #000; padding-top: 20px; text-align: center; font-size: 11px;">
          ${empresa?.endereco || "R ANTONIO MALAQUIAS PAES, Nº 321, JARDIM GUANABARA, MONTE MOR-SP, CEP 13.190-656"} ${empresa?.telefone || "(19) 99791-5106"}
        </div>
      </div>
    `;
    
    const pagina12 = gerarPaginaConteudo(12, "8. DAS RESPONSABILIDADES", modelo?.responsabilidades || "");

    // PÁGINA 13 - INVENTÁRIO DE RISCOS
    const pagina13 = `
      <div class="page" style="font-family: Arial, sans-serif;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 30%; vertical-align: top; padding-right: 10px;">
              <div style="border: 1px solid #000; padding: 10px; background-color: #E6F3FF; text-align: center;">
                <div style="font-weight: bold; font-size: 14px; color: #0066CC;">${empresa?.nomeFantasia?.split(" ")[0] || "EMPRESA"}</div>
                <div style="font-weight: bold; font-size: 12px; color: #0066CC; margin-top: 5px;">${empresa?.nomeFantasia?.split(" ").slice(1).join(" ") || "MAQUINAS"}</div>
              </div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="border: 1px solid #000; padding: 15px; background-color: #fff;">
                <div style="font-weight: bold; font-size: 16px; text-transform: uppercase;">PGRO - PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</div>
              </div>
            </td>
            <td style="width: 20%; text-align: right; vertical-align: top; padding-left: 10px;">
              <div style="border: 1px solid #000; padding: 10px; text-align: center;">
                <div style="font-size: 12px;">Página 13 de 21</div>
              </div>
            </td>
          </tr>
        </table>

        <div style="background-color: #808080; padding: 15px; margin-bottom: 30px;">
          <div style="color: #fff; font-weight: bold; font-size: 18px; text-align: center; text-transform: uppercase;">9. INVENTARIO DE RISCOS: RECONHECIMENTOS, AVALIAÇÃO E CONTROLE</div>
        </div>

        <p style="margin-bottom: 20px; text-align: justify;">
          Nesta etapa foi feito análise qualitativa através de inspeção "in loco" e quantitativa com utilização de equipamentos de dados que foi possível obter através da visita técnica, segue abaixo quadro de riscos por função. No reconhecimento foi montada a planilha da seguinte forma:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td colspan="2" style="border: 1px solid #000; padding: 10px; background-color: #ADD8E6; font-weight: bold; text-align: center; color: #000;">Agente Ambiental</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 10px; background-color: #228B22; color: #fff; width: 50%;">Grupo 1 - Riscos Físicos</td>
            <td style="border: 1px solid #000; padding: 10px; background-color: #228B22; color: #fff; width: 50%;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 10px; background-color: #DC143C; color: #fff; width: 50%;">Grupo 2 - Riscos Químicos</td>
            <td style="border: 1px solid #000; padding: 10px; background-color: #DC143C; color: #fff; width: 50%;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 10px; background-color: #6B8E23; color: #fff; width: 50%;">Grupo 3 - Riscos Biológicos</td>
            <td style="border: 1px solid #000; padding: 10px; background-color: #6B8E23; color: #fff; width: 50%;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 10px; background-color: #FFD700; color: #000; width: 50%;">Grupo 4 - Riscos Ergonômicos</td>
            <td style="border: 1px solid #000; padding: 10px; background-color: #FFD700; color: #000; width: 50%;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 10px; background-color: #87CEEB; color: #000; width: 50%;">Grupo 5 - Riscos de Acidentes</td>
            <td style="border: 1px solid #000; padding: 10px; background-color: #87CEEB; color: #000; width: 50%;"></td>
          </tr>
        </table>

        ${formatarTexto(modelo?.inventarioReconhecimento || "")}

        <div style="margin-top: 60px; border-top: 2px solid #000; padding-top: 20px; text-align: center; font-size: 11px;">
          ${empresa?.endereco || "R ANTONIO MALAQUIAS PAES, Nº 321, JARDIM GUANABARA, MONTE MOR-SP, CEP 13.190-656"} ${empresa?.telefone || "(19) 99791-5106"}
        </div>
      </div>
    `;

    // PÁGINAS 14-19 - QUADROS DE RISCOS (serão preenchidas com dados dos cargos)
    const paginasRiscos = emissao.cargos.map((cargo, index) => `
      <div class="page" style="font-family: Arial, sans-serif;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 30%; vertical-align: top; padding-right: 10px;">
              <div style="border: 1px solid #000; padding: 10px; background-color: #E6F3FF; text-align: center;">
                <div style="font-weight: bold; font-size: 14px; color: #0066CC;">${empresa?.nomeFantasia?.split(" ")[0] || "EMPRESA"}</div>
                <div style="font-weight: bold; font-size: 12px; color: #0066CC; margin-top: 5px;">${empresa?.nomeFantasia?.split(" ").slice(1).join(" ") || "MAQUINAS"}</div>
              </div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="border: 1px solid #000; padding: 15px; background-color: #fff;">
                <div style="font-weight: bold; font-size: 16px; text-transform: uppercase;">PGRO - PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</div>
              </div>
            </td>
            <td style="width: 20%; text-align: right; vertical-align: top; padding-left: 10px;">
              <div style="border: 1px solid #000; padding: 10px; text-align: center;">
                <div style="font-size: 12px;">Página ${14 + index} de 21</div>
              </div>
            </td>
          </tr>
        </table>

        <div style="background-color: #808080; padding: 15px; margin-bottom: 30px;">
          <div style="color: #fff; font-weight: bold; font-size: 18px; text-align: center; text-transform: uppercase;">QUADRO DE RECONHECIMENTO DOS RISCOS</div>
          <div style="color: #fff; font-weight: bold; font-size: 14px; text-align: center; margin-top: 5px;">ANÁLISE QUALITATIVA DOS RISCOS AMBIENTAIS</div>
        </div>

        <div style="margin-bottom: 20px;">
          <p><strong>Setor:</strong> ${cargo.setorNome || "Obras"}</p>
          <p><strong>Função:</strong> ${cargo.cargoNome}</p>
          <p><strong>CBO:</strong> ${cargo.cbo || "-"}</p>
        </div>

        <p style="margin-bottom: 20px; text-align: justify;">
          Descrição do cargo e riscos identificados para esta função serão preenchidos aqui.
        </p>

        <div style="margin-top: 60px; border-top: 2px solid #000; padding-top: 20px; text-align: center; font-size: 11px;">
          ${empresa?.endereco || "R ANTONIO MALAQUIAS PAES, Nº 321, JARDIM GUANABARA, MONTE MOR-SP, CEP 13.190-656"} ${empresa?.telefone || "(19) 99791-5106"}
        </div>
      </div>
    `).join("");

    // PÁGINA 20 - CRONOGRAMA DE AÇÕES
    const pagina20 = `
      <div class="page" style="font-family: Arial, sans-serif;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 30%; vertical-align: top; padding-right: 10px;">
              <div style="border: 1px solid #000; padding: 10px; background-color: #E6F3FF; text-align: center;">
                <div style="font-weight: bold; font-size: 14px; color: #0066CC;">${empresa?.nomeFantasia?.split(" ")[0] || "EMPRESA"}</div>
                <div style="font-weight: bold; font-size: 12px; color: #0066CC; margin-top: 5px;">${empresa?.nomeFantasia?.split(" ").slice(1).join(" ") || "MAQUINAS"}</div>
              </div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="border: 1px solid #000; padding: 15px; background-color: #fff;">
                <div style="font-weight: bold; font-size: 16px; text-transform: uppercase;">PGRO - PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</div>
              </div>
            </td>
            <td style="width: 20%; text-align: right; vertical-align: top; padding-left: 10px;">
              <div style="border: 1px solid #000; padding: 10px; text-align: center;">
                <div style="font-size: 12px;">Página 20 de 21</div>
              </div>
            </td>
          </tr>
        </table>

        <div style="background-color: #808080; padding: 15px; margin-bottom: 30px;">
          <div style="color: #fff; font-weight: bold; font-size: 18px; text-align: center; text-transform: uppercase;">10. Cronograma de Ações</div>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
          <tr style="background-color: #D3D3D3;">
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 5%;">Item</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 25%;">Ação</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 15%;">Meta</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 30%;">Estratégia e Metodologia</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 3%;">MAI</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 3%;">JUN</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 3%;">JUL</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 3%;">AGO</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 3%;">SET</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 3%;">OUT</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 3%;">NOV</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 3%;">DEZ</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 3%;">JAN</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 3%;">FEV</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 3%;">MAR</td>
            <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center; width: 3%;">ABR</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">01</td>
            <td style="border: 1px solid #000; padding: 8px;">Instruir os Empregados dos Riscos Existentes No PGR.</td>
            <td style="border: 1px solid #000; padding: 8px;">2 vezes no ano</td>
            <td style="border: 1px solid #000; padding: 8px;">Realizar instrução dos riscos através de DDS e recolher assinatura e lista de presença.</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">02</td>
            <td style="border: 1px solid #000; padding: 8px;">Treinamento Admissional.</td>
            <td style="border: 1px solid #000; padding: 8px;">1 vez ao ano</td>
            <td style="border: 1px solid #000; padding: 8px;">Realizar treinamento admissional, com carga horaria predefinia em lista de presença sobre consulta da NR18.</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">03</td>
            <td style="border: 1px solid #000; padding: 8px;">Emitir Ordem de Serviço.</td>
            <td style="border: 1px solid #000; padding: 8px;">Anual</td>
            <td style="border: 1px solid #000; padding: 8px;">Emitir ordem de serviço sempre que necessário, ou quando houver mudança de riscos e função.</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">04</td>
            <td style="border: 1px solid #000; padding: 8px;">Elaborar e manter atualizadas fichas de epi.</td>
            <td style="border: 1px solid #000; padding: 8px;">Mensal</td>
            <td style="border: 1px solid #000; padding: 8px;">Entregar e sempre deixar as fichas de EPI atualizadas.</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">05</td>
            <td style="border: 1px solid #000; padding: 8px;">Elaborar PGR ou Análise Global do inventario de risco</td>
            <td style="border: 1px solid #000; padding: 8px;">Anual</td>
            <td style="border: 1px solid #000; padding: 8px;">Realizar encerramento e anexar as tarefas que foram executadas dentro deste programa.</td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
            <td style="border: 1px solid #000; padding: 8px;"></td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">06</td>
            <td style="border: 1px solid #000; padding: 8px;">Fazer Checklists de máquinas e Equipamentos.</td>
            <td style="border: 1px solid #000; padding: 8px;">Mensal</td>
            <td style="border: 1px solid #000; padding: 8px;">Inspecionar os equipamentos.</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
            <td style="border: 1px solid #000; padding: 8px; text-align: center;">X</td>
          </tr>
        </table>

        <div style="margin-top: 60px; border-top: 2px solid #000; padding-top: 20px; text-align: center; font-size: 11px;">
          ${empresa?.endereco || "R ANTONIO MALAQUIAS PAES, Nº 321, JARDIM GUANABARA, MONTE MOR-SP, CEP 13.190-656"} ${empresa?.telefone || "(19) 99791-5106"}
        </div>
      </div>
    `;

    // PÁGINA 21 - ENCERRAMENTO
    const pagina21 = `
      <div class="page" style="font-family: Arial, sans-serif;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="width: 30%; vertical-align: top; padding-right: 10px;">
              <div style="border: 1px solid #000; padding: 10px; background-color: #E6F3FF; text-align: center;">
                <div style="font-weight: bold; font-size: 14px; color: #0066CC;">${empresa?.nomeFantasia?.split(" ")[0] || "EMPRESA"}</div>
                <div style="font-weight: bold; font-size: 12px; color: #0066CC; margin-top: 5px;">${empresa?.nomeFantasia?.split(" ").slice(1).join(" ") || "MAQUINAS"}</div>
              </div>
            </td>
            <td style="width: 50%; text-align: center; vertical-align: top;">
              <div style="border: 1px solid #000; padding: 15px; background-color: #fff;">
                <div style="font-weight: bold; font-size: 16px; text-transform: uppercase;">PGRO - PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS</div>
              </div>
            </td>
            <td style="width: 20%; text-align: right; vertical-align: top; padding-left: 10px;">
              <div style="border: 1px solid #000; padding: 10px; text-align: center;">
                <div style="font-size: 12px;">Página 21 de 21</div>
              </div>
            </td>
          </tr>
        </table>

        <div style="background-color: #808080; padding: 15px; margin-bottom: 30px;">
          <div style="color: #fff; font-weight: bold; font-size: 18px; text-align: center; text-transform: uppercase;">11. ENCERRAMENTO</div>
        </div>

        <div style="line-height: 1.8; text-align: justify; margin-bottom: 40px;">
          <p style="margin-bottom: 15px;">
            Tendo cumprido a solicitação da empresa: ${empresa?.razaoSocial || emissao.empresaNome}, com base no levantamento "in loco" realizado no cliente, elaboramos o presente Programa de Prevenção de Riscos Ambientais.
          </p>
          <p style="margin-bottom: 15px;">
            O presente documento deverá sofrer Analise Global e Anual, para avaliação do seu desenvolvimento e realização de seus ajustes necessários, bem como, o estabelecimento de novas metas e prioridades.
          </p>
          <p style="margin-bottom: 15px;">
            As medidas aqui propostas deverão obrigatoriamente estar vinculadas ao PCMSO a fim de que, seja possível descobrir o nexo causal de possíveis problemas ocupacionais, as medidas de proteção aos empregados sejam imediatamente revistas.
          </p>
          <p style="margin-bottom: 15px;">
            Ainda neste programa contempla a planilha de reconhecimento de riscos e em anexo está o complemento da analise ergonômica
          </p>
          <p style="margin-bottom: 15px;">
            E por fim formalizamos este programa através de assinatura abaixo reconhecendo que o programa e composto por 21 páginas totais (desde a capa até seus anexos).
          </p>
        </div>

        <div style="text-align: center; margin: 40px 0;">
          <p style="margin-bottom: 30px;">${cidade} - ${estado}, dia ${dataAtual}.</p>
          <div style="margin: 40px 0; min-height: 60px;">
            <div style="border-bottom: 1px solid #000; width: 300px; margin: 0 auto; padding-bottom: 5px;"></div>
            <p style="margin-top: 10px; font-weight: bold;">${emissao.responsavelNome}</p>
            <p style="margin-top: 5px;">Técnico de Segurança do Trabalho</p>
            <p style="margin-top: 5px;">MTE: ${emissao.responsavelRegistro || "50002/SP"}</p>
          </div>
        </div>

        <div style="margin-top: 60px; border-top: 2px solid #000; padding-top: 20px;">
          <div style="text-align: center; font-weight: bold; margin-bottom: 10px;">${empresa?.razaoSocial || emissao.empresaNome}</div>
          <div style="text-align: center; margin-bottom: 20px;">Cnpj: ${empresa?.cnpj || "00.000.000/0000-00"}</div>
          <div style="border-top: 1px solid #000; padding-top: 20px; text-align: center; font-size: 11px;">
            ${empresa?.endereco || "R ANTONIO MALAQUIAS PAES, Nº 321, JARDIM GUANABARA, MONTE MOR-SP, CEP 13.190-656"} ${empresa?.telefone || "(19) 99791-5106"}
          </div>
        </div>
      </div>
    `;

    // Montar documento completo
    return `
      <!DOCTYPE html>
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta charset="UTF-8">
          <meta name="ProgId" content="Word.Document">
          <meta name="Generator" content="Microsoft Word">
          <meta name="Originator" content="Microsoft Word">
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>100</w:Zoom>
              <w:DoNotOptimizeForBrowser/>
            </w:WordDocument>
          </xml>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .page {
              page-break-after: always;
              min-height: 297mm;
              padding: 20mm;
              box-sizing: border-box;
            }
            .page:last-child {
              page-break-after: auto;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            td, th {
              border: 1px solid #000;
              padding: 8px;
            }
          </style>
        </head>
        <body>
          ${pagina1}
          ${pagina2}
          ${pagina3}
          ${pagina4}
          ${pagina5}
          ${pagina6}
          ${pagina7}
          ${pagina8}
          ${pagina9}
          ${pagina10}
          ${pagina11}
          ${pagina12}
          ${pagina13}
          ${paginasRiscos}
          ${pagina20}
          ${pagina21}
        </body>
      </html>
    `;
  }, []);
  */

  const gerarPDF = useCallback(
    (emissao: EmissaoPgro) => {
      try {
        // Gerar HTML com modelo padrão (capa em branco)
        const htmlContent = gerarTemplatePGROPadrao(emissao);
        
        // Abrir em nova janela para impressão
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          try {
            printWindow.document.open();
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            
            // Aguardar o carregamento completo antes de imprimir
            printWindow.onload = () => {
              setTimeout(() => {
                try {
                  printWindow.print();
                } catch (printError) {
                  console.error("Erro ao imprimir:", printError);
                  toast.error("Erro ao abrir diálogo de impressão");
                }
              }, 500);
            };
            
            toast.success("PDF pronto para impressão!");
          } catch (error) {
            console.error("Erro ao escrever no documento:", error);
            printWindow.close();
            toast.error("Erro ao gerar janela de impressão");
          }
        } else {
          toast.error("Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desativado.");
        }
      } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        toast.error("Erro ao gerar PDF");
      }
    },
    [gerarTemplatePGROPadrao]
  );

  const gerarWord = useCallback(async (emissao: EmissaoPgro) => {
    if (gerandoWord) {
      toast.info("Já existe uma geração em andamento. Aguarde...");
      return;
    }
    
    setGerandoWord(true);
    try {
      // Debug: verificar data de emissão antes de gerar
      console.log("=== DEBUG GERAR WORD - DATA ===");
      console.log("Data de Emissão RAW:", emissao.dataEmissao);
      console.log("Tipo:", typeof emissao.dataEmissao);
      console.log("Valor após trim:", emissao.dataEmissao ? String(emissao.dataEmissao).trim() : "VAZIO");
      console.log("===============================");
      
      // Buscar dados da empresa
      const empresa = empresas.find((e) => e.id === emissao.empresaId);
      const empresaCnpj = empresa?.cnpj || '';
      const empresaAtividade = empresa?.descricaoAtividade || '';
      
      // Buscar colaboradores da empresa para calcular totais
      const empresaIdNumber = empresa?.id ? parseInt(empresa.id) : null;
      let totalEmpregados = 0;
      let empregadosHomens = 0;
      let empregadosMulheres = 0;
      
      if (empresaIdNumber) {
        try {
          const colaboradoresData = await utils.colaboradores.list.fetch({
            empresaId: empresaIdNumber,
          });
          
          // Filtrar apenas colaboradores ativos
          const colaboradoresAtivos = (colaboradoresData || []).filter((c: any) => c.status === 'ativo');
          
          totalEmpregados = colaboradoresAtivos.length;
          empregadosHomens = colaboradoresAtivos.filter((c: any) => c.sexo === 'masculino').length;
          empregadosMulheres = colaboradoresAtivos.filter((c: any) => c.sexo === 'feminino').length;
        } catch (error) {
          console.error("Erro ao buscar colaboradores:", error);
          // Usar valores padrão em caso de erro
          totalEmpregados = 0;
          empregadosHomens = 0;
          empregadosMulheres = 0;
        }
      }
      
      // Formatar datas corretamente (evitar problemas de timezone)
      const formatarData = (dataString: string) => {
        if (!dataString) return '';
        // Se já está no formato YYYY-MM-DD, usar diretamente
        if (dataString.match(/^\d{4}-\d{2}-\d{2}/)) {
          const [ano, mes, dia] = dataString.split('-');
          return `${dia}/${mes}/${ano}`;
        }
        // Caso contrário, tentar formatar com date-fns
        try {
          return format(new Date(dataString), "dd/MM/yyyy");
        } catch {
          return dataString;
        }
      };
      
      const dataEmissao = formatarData(emissao.vigenciaInicio);
      const dataVencimento = formatarData(emissao.vigenciaFim);
      
      // Formatar mês/ano da data de vencimento em maiúsculo
      const formatarMesAno = (dataString: string) => {
        if (!dataString) return '';
        try {
          let data: Date;
          // Se está no formato YYYY-MM-DD, criar Date corretamente
          if (dataString.match(/^\d{4}-\d{2}-\d{2}/)) {
            const [ano, mes, dia] = dataString.split('-').map(Number);
            data = new Date(ano, mes - 1, dia);
          } else {
            data = new Date(dataString);
          }
          return format(data, "MMMM / yyyy", { locale: ptBR }).toUpperCase();
        } catch {
          return '';
        }
      };
      
      const mesAnoVencimento = formatarMesAno(emissao.vigenciaFim);
      
      // Formatar endereço completo da empresa
      const formatarEndereco = () => {
        if (!empresa) return '';
        
        const partes: string[] = [];
        
        // Tipo de logradouro + Nome do logradouro
        if (empresa.tipoLogradouro && empresa.nomeLogradouro) {
          partes.push(`${empresa.tipoLogradouro.toUpperCase()} ${empresa.nomeLogradouro.toUpperCase()}`);
        } else if (empresa.nomeLogradouro) {
          partes.push(empresa.nomeLogradouro.toUpperCase());
        }
        
        // Número
        if (empresa.numeroEndereco) {
          partes[partes.length - 1] += `, Nº ${empresa.numeroEndereco}`;
        }
        
        // Complemento (se houver)
        if (empresa.complementoEndereco) {
          partes.push(empresa.complementoEndereco.toUpperCase());
        }
        
        // Cidade - Estado
        if (empresa.cidadeEndereco && empresa.estadoEndereco) {
          partes.push(`${empresa.cidadeEndereco.toUpperCase()}-${empresa.estadoEndereco.toUpperCase()}`);
        } else if (empresa.cidadeEndereco) {
          partes.push(empresa.cidadeEndereco.toUpperCase());
        }
        
        // CEP
        if (empresa.cep) {
          const cepFormatado = empresa.cep.replace(/(\d{2})(\d{3})(\d{3})/, '$1.$2-$3');
          partes.push(`CEP ${cepFormatado}`);
        }
        
        return partes.join(', ');
      };
      
      const enderecoCompleto = formatarEndereco();
      const telefoneEmpresa = empresa?.emailContato || '';
      

      // Função para criar tabela do cabeçalho com numeração específica
      const criarHeaderTable = (numeroPagina: number, totalPaginas: number) => {
        return new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 75, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: "PGRO – PROGRAMA DE GERENCIAMENTO DE RISCOS OCUPACIONAIS",
                          font: "Calibri Light",
                          size: 28,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                      keepLines: true,
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                  borders: {
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  },
                }),
                new TableCell({
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({ 
                          text: `Página ${numeroPagina} de ${totalPaginas}`,
                          font: "Calibri Light",
                          size: 28,
                        }),
                      ],
                      alignment: AlignmentType.CENTER,
                    }),
                  ],
                  verticalAlign: VerticalAlign.CENTER,
                }),
              ],
            }),
          ],
        });
      };

      // Criar conteúdo da capa
      const coverContent = [
        new Paragraph({ text: "", spacing: { before: 1200, after: 0 } }),
        new Paragraph({
          children: [
            new TextRun({ text: "PROGRAMA DE GERENCIAMENTO", font: "Calibri Light", size: 40, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "DE RISCO OCUPACIONAIS", font: "Calibri Light", size: 40, bold: true }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Referencias Normativas: NR01 – NR09", font: "Calibri Light", bold: true }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: emissao.empresaNome || '', font: "Calibri Light", size: 28, color: "003366", bold: true }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `CNPJ: ${empresaCnpj}`, font: "Calibri Light", size: 28, color: "003366", bold: true }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 2000 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Descrição de atividades: ", bold: true, font: "Calibri Light" }),
            new TextRun({ text: empresaAtividade, font: "Calibri Light" }),
          ],
          spacing: { after: 2000 },
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "Data de emissão do programa: ", bold: true, font: "Calibri Light" }),
            new TextRun({ text: dataEmissao, font: "Calibri Light" }),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [
            new TextRun({ text: "Data vencimento programa: ", bold: true, font: "Calibri Light" }),
            new TextRun({ text: dataVencimento, font: "Calibri Light" }),
          ],
          spacing: { after: 2000 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: `- ${mesAnoVencimento} -`, font: "Calibri Light", size: 60, bold: true, color: "FF0000" }),
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 0 },
        }),
      ];

      // Criar rodapé reutilizável
      const criarFooter = () => {
        const footerParagraphs = [
          new Paragraph({
            children: [
              new TextRun({ text: "________________________________________________________________________________", font: "Calibri Light" }),
            ],
            alignment: AlignmentType.CENTER,
          }),
        ];
        if (enderecoCompleto) {
          footerParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: enderecoCompleto, font: "Calibri Light" }),
              ],
              alignment: AlignmentType.CENTER,
            })
          );
        }
        if (telefoneEmpresa) {
          footerParagraphs.push(
            new Paragraph({
              children: [
                new TextRun({ text: telefoneEmpresa, font: "Calibri Light" }),
              ],
              alignment: AlignmentType.CENTER,
            })
          );
        }
        return footerParagraphs;
      };

      // Função auxiliar para criar linha de 8 colunas de cabeçalho
      const criarLinha8Colunas = () => {
        return new TableRow({
          children: [
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "FONTE GERADORA", 
                      font: "Calibri Light", 
                      bold: true,
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "TIPO", 
                      font: "Calibri Light", 
                      bold: true,
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "MEIO DE PROPAGAÇÃO", 
                      font: "Calibri Light", 
                      bold: true,
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "MEIO DE CONTATO", 
                      font: "Calibri Light", 
                      bold: true,
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "POSSIVEIS DANOS A SAÚDE", 
                      font: "Calibri Light", 
                      bold: true,
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "Tipo Análise", 
                      font: "Calibri Light", 
                      bold: true,
                      size: 18, // 9pt
                    }),
                    new TextRun({
                      text: "\nQualitativa / Quantitativa",
                      font: "Calibri Light",
                      bold: true,
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "*GRADAÇÃO EFEITOS", 
                      font: "Calibri Light", 
                      bold: true,
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "*GRADAÇÃO EXPOSIÇÃO", 
                      font: "Calibri Light", 
                      bold: true,
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        });
      };

      // Função auxiliar para criar linha de dados de risco
      const criarLinhaRisco = (risco: any) => {
        return new TableRow({
          children: [
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: risco.fonteGeradora || "-", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: risco.tipo || "-", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: risco.meioPropagacao || "-", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: risco.meioContato || "-", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: risco.possiveisDanosSaude || "-", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: risco.tipoAnalise === "Quantitativa" && risco.valorAnaliseQuantitativa 
                        ? risco.valorAnaliseQuantitativa 
                        : risco.tipoAnalise || "-", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: risco.gradacaoEfeitos || "-", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
            new TableCell({
              width: { size: 12.5, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: risco.gradacaoExposicao || "-", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.TOP,
            }),
          ],
        });
      };

      // Função auxiliar para criar linha de "Ausente de Riscos"
      const criarLinhaAusenteRiscos = () => {
        return new TableRow({
          children: [
            new TableCell({
              columnSpan: 8,
              children: [
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "Ausente de Riscos/Riscos Não Identificados", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  alignment: AlignmentType.CENTER,
                }),
              ],
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              },
              verticalAlign: VerticalAlign.CENTER,
            }),
          ],
        });
      };

      // Função auxiliar para criar tabela de inventário de riscos para um cargo
      const criarTabelaInventarioRiscos = async (cargo: any, pageNumber: number, totalPages: number, cargosCompletosMap: { [key: string]: any }, cargoIndex: number, totalCargos: number) => {
        const cargoNome = cargo.cargoNome || "-";
        const setorNome = cargo.setorNome || "-";
        // Buscar descrição do cargo completo
        const cargoCompleto = cargosCompletosMap[cargo.cargoId];
        const descricaoCargo = cargoCompleto?.descricao || cargo.descricao || cargo.descricaoCargo || "-";
        
        // Calcular número da planilha (começa em 01)
        const numeroPlanilha = (cargoIndex + 1).toString().padStart(2, '0');
        const textoPlanilha = `${numeroPlanilha} de ${totalCargos.toString().padStart(2, '0')}`;

        // Buscar riscos do cargo
        let riscosDoCargo: any[] = [];
        try {
          const cargoId = parseInt(cargo.cargoId);
          if (!isNaN(cargoId)) {
            riscosDoCargo = await utils.cargoRiscos.getByCargo.fetch({ cargoId });
            console.log(`[LaudoPgro] Riscos encontrados para cargo ${cargoId}:`, riscosDoCargo);
          }
        } catch (error) {
          console.error("Erro ao buscar riscos do cargo:", error);
        }

        // Mapear tipo de agente para chave de agrupamento
        const mapearTipoAgente = (tipoAgente: string): string => {
          if (!tipoAgente) return "outros";
          
          // Normalizar removendo acentos e convertendo para minúsculas
          const normalizar = (str: string) => {
            return str
              .toLowerCase()
              .trim()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
          };
          
          const tipoNormalizado = normalizar(tipoAgente);
          
          // Mapear variações de Físico
          if (tipoNormalizado === "fisico" || tipoNormalizado.includes("fisico")) {
            return "fisico";
          }
          // Mapear variações de Químico
          if (tipoNormalizado === "quimico" || tipoNormalizado.includes("quimico")) {
            return "quimico";
          }
          // Mapear variações de Biológico
          if (tipoNormalizado === "biologico" || tipoNormalizado.includes("biologico")) {
            return "biologico";
          }
          // Mapear variações de Ergonômico
          if (tipoNormalizado === "ergonomico" || tipoNormalizado.includes("ergonomico")) {
            return "ergonomico";
          }
          // Mapear variações de Mecânico/Acidente
          if (tipoNormalizado === "mecanico" || tipoNormalizado.includes("mecanico") || 
              tipoNormalizado.includes("acidente") || tipoNormalizado.includes("agentes mecanicos")) {
            return "mecanico";
          }
          
          console.warn(`[LaudoPgro] Tipo de agente não mapeado: "${tipoAgente}" (normalizado: "${tipoNormalizado}")`);
          return "outros";
        };

        // Agrupar riscos por tipo de agente
        const riscosPorTipo: { [key: string]: any[] } = {
          fisico: [],
          quimico: [],
          biologico: [],
          ergonomico: [],
          mecanico: [],
        };

        riscosDoCargo.forEach((risco) => {
          // Tentar mapear usando tipoAgente primeiro, depois nomeRisco, depois tipoRisco
          const tipoAgenteValue = risco.tipoAgente || risco.nomeRisco || risco.tipoRisco || "";
          const tipo = mapearTipoAgente(tipoAgenteValue);
          console.log(`[LaudoPgro] Risco: ${risco.fonteGeradora || "N/A"}, tipoAgente: "${risco.tipoAgente}", nomeRisco: "${risco.nomeRisco}", tipoRisco: "${risco.tipoRisco}", mapeado para: "${tipo}"`);
          
          if (riscosPorTipo[tipo]) {
            riscosPorTipo[tipo].push(risco);
          } else if (tipo !== "outros") {
            // Se não encontrou o tipo mas não é "outros", adicionar ao tipo mais próximo
            riscosPorTipo.fisico.push(risco);
          }
        });

        console.log(`[LaudoPgro] Riscos agrupados:`, riscosPorTipo);

        return [
          // Espaçamento antes do título
          new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
          // Título com fundo cinza (usando tabela)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 8,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "8.1 QUADRO DE INVENTARIO DE RISCOS", 
                            font: "Calibri Light", 
                            bold: true,
                            size: 18, // 9pt
                            color: "000000", // Preto
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: {
                      fill: "808080", // Cinza
                      type: "clear",
                    },
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                  }),
                ],
              }),
              // Segunda linha com três colunas
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 4,
                    width: { size: 50, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "Cargos: ", 
                            font: "Calibri Light", 
                            bold: true,
                            size: 18, // 9pt
                          }),
                          new TextRun({ 
                            text: cargoNome, 
                            font: "Calibri Light", 
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  new TableCell({
                    columnSpan: 2,
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "Setor: ", 
                            font: "Calibri Light", 
                            bold: true,
                            size: 18, // 9pt
                          }),
                          new TextRun({ 
                            text: setorNome, 
                            font: "Calibri Light", 
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  new TableCell({
                    columnSpan: 2,
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "Planilha: ", 
                            font: "Calibri Light", 
                            bold: true,
                            size: 18, // 9pt
                          }),
                          new TextRun({ 
                            text: textoPlanilha, 
                            font: "Calibri Light", 
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                ],
              }),
              // Terceira linha com uma única coluna
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 8,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "Descrição do Cargo: ", 
                            font: "Calibri Light", 
                            bold: true,
                            size: 18, // 9pt
                          }),
                          new TextRun({ 
                            text: descricaoCargo, 
                            font: "Calibri Light", 
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.JUSTIFIED,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.TOP,
                  }),
                ],
              }),
              // AGENTES FÍSICOS (fundo verde)
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 8,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "AGENTES FÍSICOS", 
                            font: "Calibri Light", 
                            bold: true,
                            size: 18, // 9pt
                            color: "000000", // Preto
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: {
                      fill: "00B050", // Verde
                      type: "clear",
                    },
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                  }),
                ],
              }),
              criarLinha8Colunas(),
              // Linhas de dados para AGENTES FÍSICOS
              ...(riscosPorTipo.fisico.length > 0 
                ? riscosPorTipo.fisico.map((risco) => criarLinhaRisco(risco))
                : [criarLinhaAusenteRiscos()]
              ),
              // AGENTES QUÍMICOS (fundo vermelho)
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 8,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "AGENTES QUÍMICOS", 
                            font: "Calibri Light", 
                            bold: true,
                            size: 18, // 9pt
                            color: "000000", // Preto
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: {
                      fill: "FF0000", // Vermelho
                      type: "clear",
                    },
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                  }),
                ],
              }),
              criarLinha8Colunas(),
              // Linhas de dados para AGENTES QUÍMICOS
              ...(riscosPorTipo.quimico.length > 0 
                ? riscosPorTipo.quimico.map((risco) => criarLinhaRisco(risco))
                : [criarLinhaAusenteRiscos()]
              ),
              // AGENTES BIOLÓGICOS (fundo marrom)
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 8,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "AGENTES BIOLÓGICOS", 
                            font: "Calibri Light", 
                            bold: true,
                            size: 18, // 9pt
                            color: "000000", // Preto
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: {
                      fill: "8B4513", // Marrom
                      type: "clear",
                    },
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                  }),
                ],
              }),
              criarLinha8Colunas(),
              // Linhas de dados para AGENTES BIOLÓGICOS
              ...(riscosPorTipo.biologico.length > 0 
                ? riscosPorTipo.biologico.map((risco) => criarLinhaRisco(risco))
                : [criarLinhaAusenteRiscos()]
              ),
              // AGENTES ERGONÔMICO (fundo amarelo)
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 8,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "AGENTES ERGONÔMICO", 
                            font: "Calibri Light", 
                            bold: true,
                            size: 18, // 9pt
                            color: "000000", // Preto
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: {
                      fill: "FFC000", // Amarelo
                      type: "clear",
                    },
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                  }),
                ],
              }),
              criarLinha8Colunas(),
              // Linhas de dados para AGENTES ERGONÔMICO
              ...(riscosPorTipo.ergonomico.length > 0 
                ? riscosPorTipo.ergonomico.map((risco) => criarLinhaRisco(risco))
                : [criarLinhaAusenteRiscos()]
              ),
              // AGENTES ACIDENTES / MECANICOS (fundo azul claro)
              new TableRow({
                children: [
                  new TableCell({
                    columnSpan: 8,
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ 
                            text: "AGENTES ACIDENTES / MECANICOS", 
                            font: "Calibri Light", 
                            bold: true,
                            size: 18, // 9pt
                            color: "000000", // Preto
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: {
                      fill: "4FC3F7", // Azul claro
                      type: "clear",
                    },
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                  }),
                ],
              }),
              criarLinha8Colunas(),
              // Linhas de dados para AGENTES ACIDENTES / MECANICOS
              ...(riscosPorTipo.mecanico.length > 0 
                ? riscosPorTipo.mecanico.map((risco) => criarLinhaRisco(risco))
                : [criarLinhaAusenteRiscos()]
              ),
            ],
          }),
          // Espaçamento antes das tabelas de gradação
          new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
          // Tabela de Gradação Efeitos à Saúde e Gradação Qualitativa de Exposição (lado a lado)
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
            },
            rows: [
              // Linha de cabeçalho com 4 colunas
              new TableRow({
                children: [
                  // Coluna 1: Categoria (Efeitos à Saúde)
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Categoria",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                            color: "FFFFFF", // Branco
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: {
                      fill: "808080", // Cinza escuro
                      type: "clear",
                    },
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                  }),
                  // Coluna 2: Gradação Efeitos à Saúde
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "*Gradação Efeitos à Saúde",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                            color: "000000", // Preto
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: {
                      fill: "D3D3D3", // Cinza claro
                      type: "clear",
                    },
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                  }),
                  // Coluna 3: Categoria (Exposição)
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Categoria",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                            color: "FFFFFF", // Branco
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: {
                      fill: "808080", // Cinza escuro
                      type: "clear",
                    },
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                  }),
                  // Coluna 4: Gradação Qualitativa de Exposição
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "*Gradação Qualitativa de Exposição",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                            color: "000000", // Preto
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    shading: {
                      fill: "D3D3D3", // Cinza claro
                      type: "clear",
                    },
                    verticalAlign: VerticalAlign.CENTER,
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                  }),
                ],
              }),
              // Linha 00 - Efeitos à Saúde e Exposição
              new TableRow({
                children: [
                  // Categoria 00 - Efeitos
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "00",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Descrição 00 - Efeitos
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Efeitos reversíveis e pequenos",
                            font: "Calibri Light",
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Categoria 00 - Exposição
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "00",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Descrição 00 - Exposição
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Nenhum contato com o agente ou desprezível",
                            font: "Calibri Light",
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                ],
              }),
              // Linha 01 - Efeitos à Saúde e Exposição
              new TableRow({
                children: [
                  // Categoria 01 - Efeitos
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "01",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Descrição 01 - Efeitos
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Efeitos reversíveis à saúde, preocupante.",
                            font: "Calibri Light",
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Categoria 01 - Exposição
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "01",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Descrição 01 - Exposição
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Contatos esporádicos com o agente",
                            font: "Calibri Light",
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                ],
              }),
              // Linha 02 - Efeitos à Saúde e Exposição
              new TableRow({
                children: [
                  // Categoria 02 - Efeitos
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "02",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Descrição 02 - Efeitos
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Efeitos severos à saúde, preocupante.",
                            font: "Calibri Light",
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Categoria 02 - Exposição
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "02",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Descrição 02 - Exposição
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Contato frequente c/ o agente à baixa concentração",
                            font: "Calibri Light",
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                ],
              }),
              // Linha 03 - Efeitos à Saúde e Exposição
              new TableRow({
                children: [
                  // Categoria 03 - Efeitos
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "03",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Descrição 03 - Efeitos
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Efeitos irreversíveis à saúde, preocupante.",
                            font: "Calibri Light",
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Categoria 03 - Exposição
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "03",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Descrição 03 - Exposição
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Contato frequente c/ o agente a altas concentrações",
                            font: "Calibri Light",
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                ],
              }),
              // Linha 04 - Efeitos à Saúde e Exposição
              new TableRow({
                children: [
                  // Categoria 04 - Efeitos
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "04",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Descrição 04 - Efeitos
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Ameaça à vida, lesão incapacitante ocupacional.",
                            font: "Calibri Light",
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Categoria 04 - Exposição
                  new TableCell({
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "04",
                            font: "Calibri Light",
                            bold: true,
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.CENTER,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                  // Descrição 04 - Exposição
                  new TableCell({
                    width: { size: 40, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: "Contato frequente à altíssima concentração",
                            font: "Calibri Light",
                            size: 18, // 9pt
                          }),
                        ],
                        alignment: AlignmentType.LEFT,
                      }),
                    ],
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    },
                    verticalAlign: VerticalAlign.CENTER,
                  }),
                ],
              }),
            ],
          }),
        ];
      };

      // Buscar dados completos dos cargos para obter descrições
      const cargosCompletos: { [key: string]: any } = {};
      if (emissao.cargos && emissao.cargos.length > 0) {
        try {
          const todosCargos = await utils.cargos.list.fetch();
          emissao.cargos.forEach((cargoEmissao: any) => {
            const cargoId = parseInt(cargoEmissao.cargoId);
            if (!isNaN(cargoId)) {
              const cargoCompleto = todosCargos.find((c: any) => c.id === cargoId);
              if (cargoCompleto) {
                cargosCompletos[cargoEmissao.cargoId] = cargoCompleto;
              }
            }
          });
        } catch (error) {
          console.error("Erro ao buscar dados completos dos cargos:", error);
        }
      }

      // Calcular total de páginas (11 páginas fixas + número de cargos + 1 página de cronograma + 1 página de encerramento)
      const totalPages = 11 + (emissao.cargos?.length || 0) + 2;

      // Preparar páginas dinâmicas para cada cargo
      const totalCargos = emissao.cargos?.length || 0;
      const paginasCargos = await Promise.all(
        (emissao.cargos || []).map(async (cargo: any, index: number) => {
          const pageNumber = 12 + index; // Começa na página 12
          const tabelaContent = await criarTabelaInventarioRiscos(cargo, pageNumber, totalPages, cargosCompletos, index, totalCargos);
          return {
            properties: {
              page: {
                size: {
                  orientation: "portrait" as const,
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(pageNumber, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: tabelaContent,
          };
        })
      );

      // Criar documento Word
      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                },
                margin: {
                  top: 720, // 1.27cm in twips
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(1, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: coverContent,
          },
          {
            // Segunda página com informações da empresa
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(2, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: (() => {
              const page2Content = [
                // Espaçamento antes da tabela de identificação (reduzido)
                new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
                // Título com fundo cinza (usando tabela)
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "IDENTIFICAÇÃO DA EMPRESA", 
                                  font: "Calibri Light", 
                                  bold: true,
                                  size: 24, // 12pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "D3D3D3", // Cinza claro
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 300 } }),
                // Razão Social
                new Paragraph({
                  children: [
                    new TextRun({ text: "Razão Social: ", font: "Calibri Light", bold: true, size: 24 }), // 12pt
                    new TextRun({ text: empresa?.razaoSocial || emissao.empresaNome || '-', font: "Calibri Light", size: 24 }), // 12pt
                  ],
                  spacing: { after: 200 },
                }),
                // CNPJ
                new Paragraph({
                  children: [
                    new TextRun({ text: "Cnpj: ", font: "Calibri Light", bold: true, size: 24 }), // 12pt
                    new TextRun({ text: empresaCnpj || '-', font: "Calibri Light", size: 24 }), // 12pt
                  ],
                  spacing: { after: 200 },
                }),
                // Atividade
                new Paragraph({
                  children: [
                    new TextRun({ text: "Atividade: ", font: "Calibri Light", bold: true, size: 24 }), // 12pt
                    new TextRun({ text: empresaAtividade || '-', font: "Calibri Light", size: 24 }), // 12pt
                  ],
                  spacing: { after: 200 },
                }),
                // CNAE principal (usando valor padrão se não existir)
                new Paragraph({
                  children: [
                    new TextRun({ text: "Cnae principal: ", font: "Calibri Light", bold: true, size: 24 }), // 12pt
                    new TextRun({ text: empresa?.cnae || "43.13-4-00", font: "Calibri Light", size: 24 }), // 12pt
                  ],
                  spacing: { after: 200 },
                }),
                // Grau de Risco
                new Paragraph({
                  children: [
                    new TextRun({ text: "Grau de Risco: ", font: "Calibri Light", bold: true, size: 24 }), // 12pt
                    new TextRun({ text: empresa?.grauRisco || "03", font: "Calibri Light", size: 24 }), // 12pt
                  ],
                  spacing: { after: 200 },
                }),
                // Rua (Endereço completo)
                new Paragraph({
                  children: [
                    new TextRun({ text: "Rua: ", font: "Calibri Light", bold: true, size: 24 }), // 12pt
                    new TextRun({ text: enderecoCompleto || '-', font: "Calibri Light", size: 24 }), // 12pt
                  ],
                  spacing: { after: 200 },
                }),
                // Total de Empregados (calculado dos colaboradores cadastrados)
                new Paragraph({
                  children: [
                    new TextRun({ text: "Total de Empregado: ", font: "Calibri Light", bold: true, size: 24 }), // 12pt
                    new TextRun({ text: totalEmpregados.toString().padStart(2, '0'), font: "Calibri Light", size: 24 }), // 12pt
                  ],
                  spacing: { after: 200 },
                }),
                // Empregados Homens (calculado dos colaboradores cadastrados)
                new Paragraph({
                  children: [
                    new TextRun({ text: "Empregados Homens: ", font: "Calibri Light", bold: true, size: 24 }), // 12pt
                    new TextRun({ text: empregadosHomens.toString().padStart(2, '0'), font: "Calibri Light", size: 24 }), // 12pt
                  ],
                  spacing: { after: 200 },
                }),
                // Empregados Mulheres (calculado dos colaboradores cadastrados)
                new Paragraph({
                  children: [
                    new TextRun({ text: "Empregados Mulheres: ", font: "Calibri Light", bold: true, size: 24 }), // 12pt
                    new TextRun({ text: empregadosMulheres.toString().padStart(2, '0'), font: "Calibri Light", size: 24 }), // 12pt
                  ],
                  spacing: { after: 200 },
                }),
              ];
              return page2Content;
            })(),
          },
          {
            // Terceira página com índice
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(3, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: (() => {
              const page3Content = [
                // Espaçamento antes da tabela de índice
                new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
                // Título com fundo cinza (usando tabela)
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "ÍNDICE", 
                                  font: "Calibri Light", 
                                  bold: true,
                                  size: 24, // 12pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "D3D3D3", // Cinza claro
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 300 } }),
                // Itens do índice
                ...(() => {
                  const itensIndice = [
                    { numero: 1, texto: "objetivos", pagina: 5 },
                    { numero: 2, texto: "Fundamentação legal", pagina: 6 },
                    { numero: 3, texto: "Informação/Divulgação dos dados", pagina: 7 },
                    { numero: 4, texto: "Periodicidade e analise global do PGR", pagina: 8 },
                    { numero: 5, texto: "Monitoramento da Exposição aos riscos", pagina: 9 },
                    { numero: 6, texto: "Analise de exposição dos riscos", pagina: 10 },
                    { numero: 7, texto: "CIPA", pagina: 11 },
                    { numero: 8, texto: "Responsabilidades", pagina: 12 },
                    { numero: 9, texto: "Inventario de reconhecimento avaliação e controle", pagina: 13 },
                    { numero: 10, texto: "Cronograma de ações", pagina: 20 },
                    { numero: 11, texto: "Termino do Programa", pagina: 21 },
                  ];

                  return itensIndice.map((item) => {
                    // Criar parágrafo simples apenas com número e texto
                    return new Paragraph({
                      children: [
                        new TextRun({ 
                          text: `${item.numero}. ${item.texto}`, 
                          font: "Calibri Light", 
                          size: 24,
                        }),
                      ],
                      spacing: { after: 120 },
                      alignment: AlignmentType.LEFT,
                    });
                  });
                })(),
              ];
              return page3Content;
            })(),
          },
          {
            // Quarta página com 1. OBJETIVOS
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(4, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: (() => {
              const page4Content = [
                // Espaçamento antes do título
                new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
                // Título com fundo cinza (usando tabela)
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                            new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "1. OBJETIVOS", 
                                  font: "Calibri Light", 
                                  bold: true,
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "808080", // Cinza
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 300 } }),
                // Texto principal
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "Fornece um levantamento técnico sobre condições ambientais de trabalho, indicando a prestação de serviço em condições insalubres e/ou periculosas, além da especificação da exposição a fatores de riscos e respectivas medidas de controle, que irá orientar o preenchimento do Perfil Profissiográfico Previdenciário (PPP), processos de aposentadoria especial e atender à exigência legal da NR 09 - Programa de Prevenção de Riscos Ambientais, E (PGR) da Construção Civil NR18 - Programa de Gerenciamento de Riscos, do Ministério do Trabalho e Emprego e do Decreto 3.048/99 e suas alterações e Instrução normativa 77/2015 e suas atualizações e dos requisitos do E-Social.", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 400 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
                // Seção NOTA
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "NOTA: ", 
                      font: "Calibri Light", 
                      bold: true,
                      size: 18, // 9pt
                    }),
                    new TextRun({ 
                      text: "O E-Social tem por objetivo, informações trabalhistas, previdenciárias, tributárias e fiscais relativas à contratação e utilização de mão obra, com ou sem vínculo empregatício e também de outras informações previdenciárias e fiscais previstas na lei 8.212, de 1991.", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
              ];
              return page4Content;
            })(),
          },
          {
            // Quinta página com 2. FUNDAMENTO LEGAL
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(5, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: (() => {
              const page5Content = [
                // Espaçamento antes do título
                new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
                // Título com fundo cinza (usando tabela)
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "2. FUNDAMENTO LEGAL", 
                                  font: "Calibri Light", 
                                  bold: true,
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "808080", // Cinza
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 300 } }),
                // Texto principal
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "Em 29 de dezembro de 1994, a Portaria N. º25 aprovaram o texto da Norma Regulamentadora, NR-09 que estabelece a obrigatoriedade da elaboração e implantação, por parte de todos os empregadores e instituições que admitam trabalhadores como empregados, visando à preservação da saúde e da integridade dos trabalhadores. As ações do PPRA (Programa de Prevenção de Riscos Ambientais) devem ser desenvolvidas no âmbito de cada estabelecimento da empresa, sob a responsabilidade de empregador, com a participação dos trabalhadores e deverá ser efetuada, sempre que necessário e ao menos uma vez ao ano a sua atualização.", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 400 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
                // Seção NOTA
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "Nota: ", 
                      font: "Calibri Light", 
                      bold: true,
                      size: 18, // 9pt
                    }),
                    new TextRun({ 
                      text: "Este documento serve de base para a elaboração do Programa de Controle Médico e Saúde Ocupacional – PCMSO, obrigatório pela NR-07.", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
              ];
              return page5Content;
            })(),
          },
          {
            // Sexta página com 3. INFORMAÇÃO/DIVULGAÇÃO DOS DADOS
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(6, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: (() => {
              const page6Content = [
                // Espaçamento antes do título
                new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
                // Título com fundo cinza (usando tabela)
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "3. INFORMAÇÃO/DIVULGAÇÃO DOS DADOS", 
                                  font: "Calibri Light", 
                                  bold: true,
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "808080", // Cinza
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 300 } }),
                // Texto principal
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "As informações técnicas e administrativas, tais como: Laudos Ambientais, Mapas de Risco, relação de funcionários expostos a agentes nocivos com as respectivas funções e setores, bem como outros dados pertinentes permanecerão disponíveis no estabelecimento para consulta pela CIPA, trabalhadores e demais interessados, como também, para eventual fiscalização pelas autoridades.", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 400 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
                // Seção NOTA
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "Nota: ", 
                      font: "Calibri Light", 
                      bold: true,
                      size: 18, // 9pt
                    }),
                    new TextRun({ 
                      text: "Serão mantidas no setor administrativo da empresa, que fará a divulgação das informações e soluções através dos meios de comunicação existentes na empresa e/ou através de boletins, palestras e por meios eletrônicos.", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
              ];
              return page6Content;
            })(),
          },
          {
            // Sétima página com 4. PERIODICIDADE E ANÁLISE GLOBAL DO PGR
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(7, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: (() => {
              const page7Content = [
                // Espaçamento antes do título
                new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
                // Título com fundo cinza (usando tabela)
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "4. PERIODICIDADE E ANÁLISE GLOBAL DO PGR", 
                                  font: "Calibri Light", 
                                  bold: true,
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "808080", // Cinza
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 300 } }),
                // Texto principal
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "O PGR deverá ser atualizado anualmente ou sempre que ocorrerem mudanças significativas no ambiente de trabalho, nos processos produtivos, na organização do trabalho, na introdução de novas tecnologias ou quando houver alterações nas condições de trabalho que possam afetar a saúde e segurança dos trabalhadores. A análise global do PGR será realizada periodicamente, considerando os resultados das avaliações, as ações corretivas implementadas e a eficácia das medidas de controle adotadas.", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 400 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
                // Seção NOTA
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "Nota: ", 
                      font: "Calibri Light", 
                      bold: true,
                      size: 18, // 9pt
                    }),
                    new TextRun({ 
                      text: "A atualização do PGR deve ser documentada e comunicada a todos os trabalhadores envolvidos, garantindo a continuidade das ações de prevenção e controle dos riscos ocupacionais.", 
                      font: "Calibri Light", 
                      size: 18, // 9pt
                    }),
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
              ];
              return page7Content;
            })(),
          },
          {
            // Oitava página com 5. MONITORAMENTO DA EXPOSIÇÃO AOS RISCOS
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(8, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: (() => {
              const page8Content = [
                // Espaçamento antes do título
                new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
                // Título com fundo cinza (usando tabela)
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "5. MONITORAMENTO DA EXPOSIÇÃO AOS RISCOS", 
                                  font: "Calibri Light", 
                                  bold: true,
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "808080", // Cinza
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 300 } }),
                // Primeiro bullet
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "• ", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                    new TextRun({ 
                      text: "Avaliações quantitativas da exposição aos riscos, quando aplicável: (LAUDOS E OUTROS).", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
                // Segundo bullet
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "• ", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                    new TextRun({ 
                      text: "As inspeções de monitoramento devem incluir:", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
                // Sub-item a)
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "a) ", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                    new TextRun({ 
                      text: "Exemplos concretos de não conformidade ou deficiências encontradas, devidamente documentadas (fotografadas se possível), indicando através de relatórios suas possíveis causas ou razões.", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { left: 567, firstLine: 567 }, // 1cm de indentação + 1cm de recuo primeira linha
                }),
                // Sub-item b)
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "b) ", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                    new TextRun({ 
                      text: "Os relatórios de monitoramento devem incluir as ações corretivas que são sugeridas para corrigir as deficiências encontradas.", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { left: 567, firstLine: 567 }, // 1cm de indentação + 1cm de recuo primeira linha
                }),
              ];
              return page8Content;
            })(),
          },
          {
            // Nona página com 6. ANALISE DE EXPOSIÇÃO DOS TRABALHADORES
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(9, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: (() => {
              const page9Content: any[] = [
                // Espaçamento antes do título
                new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
                // Título com fundo cinza (usando tabela)
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "6. ANALISE DE EXPOSIÇÃO DOS TRABALHADORES", 
                                  font: "Calibri Light", 
                                  bold: true,
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "D3D3D3", // Cinza claro
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 300 } }),
                // Parágrafo introdutório
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "A análise é feita com base em informações e parâmetros internacionais e nacionais:", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 300 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
                // Primeiro bullet
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "• ", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                    new TextRun({ 
                      text: "Monitoramento ambiental físico, químico biológico (exames médicos) dos expostos, para detecção de agravos à saúde em virtude de exposição aos riscos.", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 120 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
                // Segundo bullet
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "• ", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                    new TextRun({ 
                      text: "Acompanhamento dos relatórios de inspeção quanto a realização das ações sugeridas.", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 120 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
                // Terceiro bullet
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "• ", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                    new TextRun({ 
                      text: "Análise crítica por ocasião de reedição anual do PPRA.", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 300 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
                // Tabela única com fonte na primeira linha e 6 colunas na segunda linha
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    // Linha 1: Fonte (célula única mesclada em todas as 6 colunas)
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          columnSpan: 6,
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Fonte: AIHA – AMERICAN INDUSTRIAL HYGIENE ASSOCIATION * Gradação",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000", // Texto preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                              keepLines: true,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          shading: {
                            fill: "7A7A7A", // Cinza escuro
                            type: "clear",
                          },
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 2: 6 colunas vazias
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Categoria",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000", // Texto preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          shading: {
                            fill: "DCE6F1", // Azul claro
                            type: "clear",
                          },
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "*Gradação Efeitos à Saúde",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000", // Texto preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          shading: {
                            fill: "7A7A7A", // Cinza escuro
                            type: "clear",
                          },
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Categoria",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000", // Texto preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          shading: {
                            fill: "DCE6F1", // Azul claro
                            type: "clear",
                          },
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "*Gradação Qualitativa de Exposição",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000", // Texto preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          shading: {
                            fill: "7A7A7A", // Cinza escuro
                            type: "clear",
                          },
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Situação da Exposição",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000", // Texto preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          shading: {
                            fill: "DCE6F1", // Azul claro
                            type: "clear",
                          },
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Ação",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000", // Texto preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          shading: {
                            fill: "7A7A7A", // Cinza escuro
                            type: "clear",
                          },
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 3: Primeira linha de dados
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "0",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Efeitos reversíveis e pequenos",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "0",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Nenhum contato com o agente ou desprezível",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Comum",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Sem ação",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 4: Segunda linha de dados
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "1",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Efeitos reversíveis à saúde, preocupante",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "1",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Contatos esporádicos com o agente",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Aceitável",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Baixa",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 5: Terceira linha de dados
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "2",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Efeitos severos à saúde, preocupante",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "2",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Contato frequente c/ o agente à baixa concentração",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "De atenção",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Média",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 6: Quarta linha de dados
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "3",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Efeitos irreversíveis à saúde, preocupante",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "3",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Contato frequente c/ o agente a altas concentrações",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Crítica",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Alta",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 7: Quinta linha de dados
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "4",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Ameaça à vida, lesão incapacitante ocupacional",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "4",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  bold: true,
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Contato frequente à altíssima concentração",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "De emergência",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({
                                  text: "Imediatamente",
                                  font: "Calibri Light",
                                  size: 18, // 9pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                  ],
                }),
                /* REMOVIDO: Tabela completa - fonte + cabeçalhos + dados
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  borders: {
                    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                    insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  },
                  rows: [
                    // Linha 1: Fonte (mesclada - ocupa todas as 6 colunas, texto centralizado)
                    new TableRow({
                      children: [
                        // Célula 1 com o texto centralizado (ocupa toda a largura visualmente)
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "Fonte: AIHA – AMERICAN INDUSTRIAL HYGIENE ASSOCIATION * Gradação", 
                                  font: "Calibri", 
                                  size: 20, // 10pt
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                              keepLines: true,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.NONE, size: 0, color: "000000" }, // Sem borda direita para mesclar
                          },
                        }),
                        // Células 2-6 vazias para completar a mesclagem visual
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.NONE, size: 0, color: "000000" },
                            right: { style: BorderStyle.NONE, size: 0, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.NONE, size: 0, color: "000000" },
                            right: { style: BorderStyle.NONE, size: 0, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.NONE, size: 0, color: "000000" },
                            right: { style: BorderStyle.NONE, size: 0, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.NONE, size: 0, color: "000000" },
                            right: { style: BorderStyle.NONE, size: 0, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [],
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.NONE, size: 0, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 2: Cabeçalho principal (cinza escuro #7A7A7A)
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "CATEGORIA", 
                                  font: "Calibri", 
                                  bold: true,
                                  size: 20, // 10pt
                                  color: "FFFFFF",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: { fill: "7A7A7A", type: "clear" },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "*Graduação Efeitos à Saúde", 
                                  font: "Calibri", 
                                  bold: true,
                                  size: 20, // 10pt
                                  color: "FFFFFF",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: { fill: "7A7A7A", type: "clear" },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "CATEGORIA", 
                                  font: "Calibri", 
                                  bold: true,
                                  size: 20, // 10pt
                                  color: "FFFFFF",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: { fill: "7A7A7A", type: "clear" },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "*Graduação Qualitativa de Exposição", 
                                  font: "Calibri", 
                                  bold: true,
                                  size: 20, // 10pt
                                  color: "FFFFFF",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: { fill: "7A7A7A", type: "clear" },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "Situação da Exposição", 
                                  font: "Calibri", 
                                  bold: true,
                                  size: 20, // 10pt
                                  color: "FFFFFF",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: { fill: "7A7A7A", type: "clear" },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "Ação", 
                                  font: "Calibri", 
                                  bold: true,
                                  size: 20, // 10pt
                                  color: "FFFFFF",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: { fill: "7A7A7A", type: "clear" },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 3: Cabeçalhos internos (cinza claro #D9D9D9)
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "CATEGORIA", 
                                  font: "Calibri", 
                                  bold: true,
                                  size: 20, // 10pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: { fill: "D9D9D9", type: "clear" },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "*Graduação Efeitos à Saúde", 
                                  font: "Calibri", 
                                  bold: true,
                                  size: 20, // 10pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: { fill: "D9D9D9", type: "clear" },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 10, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "CATEGORIA", 
                                  font: "Calibri", 
                                  bold: true,
                                  size: 20, // 10pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: { fill: "D9D9D9", type: "clear" },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 25, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "*Graduação Qualitativa de Exposição", 
                                  font: "Calibri", 
                                  bold: true,
                                  size: 20, // 10pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: { fill: "D9D9D9", type: "clear" },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "Situação da Exposição", 
                                  font: "Calibri", 
                                  bold: true,
                                  size: 20, // 10pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: { fill: "D9D9D9", type: "clear" },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          width: { size: 15, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "Ação", 
                                  font: "Calibri", 
                                  bold: true,
                                  size: 20, // 10pt
                                  color: "000000",
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: { fill: "D9D9D9", type: "clear" },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 4: Categoria 0
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "0", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Efeitos reversíveis e pequenos", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "0", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Nenhum contato com o agente ou desprezível", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Comum", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Sem ação", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 3: Categoria 1
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "1", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Efeitos reversíveis à saúde, preocupante.", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "1", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Contatos esporádicos com o agente", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Aceitável", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Baixa", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 4: Categoria 2
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "2", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Efeitos severos à saúde, preocupante.", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "2", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Contato frequente c/ o agente à baixa concentração", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "De atenção", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Média", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 5: Categoria 3
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "3", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Efeitos irreversíveis à saúde, preocupante.", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "3", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Contato frequente c/ o agente a altas concentrações", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Crítica", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Alta", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 6: Categoria 4
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "4", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Ameaça à vida, lesão incapacitante ocupacional.", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "4", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Contato frequente à altíssima concentração", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.LEFT,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "De emergência", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                        new TableCell({
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ text: "Imediatamente", font: "Calibri Light", size: 24, color: "000000" }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                  ],
                }),
                */
              ];
              return page9Content;
            })(),
          },
          {
            // Décima página com 7. RESPONSABILIDADES
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(10, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: (() => {
              const page10Content: any[] = [
                // Espaçamento antes do título
                new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
                // Título com fundo cinza (usando tabela)
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "7. RESPONSABILIDADES", 
                                  font: "Calibri Light", 
                                  bold: true,
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "808080", // Cinza
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 300 } }),
                // Primeiro item: Implantação do PGRO
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "• ", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                    new TextRun({ 
                      text: "Implantação do PGRO do Sócio-Diretor ou preposto da empresa:", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.LEFT,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "O Sócio-Diretor da empresa ou seu preposto ou representante legal na empresa ficará inteiramente responsável pelos seus comandados, respondendo civil e criminalmente por quaisquer atos contrários às normas de higiene e segurança do trabalho estabelecido por este Programa.", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 400 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
                // Segundo item: Operacional do PGRO
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "• ", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                    new TextRun({ 
                      text: "Operacional do PGRO Designado pelo empregador, treinado nas ações de prevenção de acidentes:", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.LEFT,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "Colaborar e participar na manutenção e execução das ações previstas no PGRO. Cumprir as disposições legais e regulares sobre Segurança e Medicina do Trabalho inclusive as ordens de serviços de segurança expedidas pelo Empregador (item 1.7 da NR-01 da Portaria 3.214/78). Seguir as orientações recebidas nos treinamentos do Programa. Informar ao superior hierárquico direto as ocorrências ou situações que, a seu julgamento, possam implicar em riscos à saúde e a integridade física dos trabalhadores.", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 200 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
              ];
              return page10Content;
            })(),
          },
          {
            // Décima primeira página com 8. INVENTARIO DE RISCOS
            properties: {
              page: {
                size: {
                  orientation: "portrait",
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(11, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: (() => {
              const page11Content: any[] = [
                // Espaçamento antes do título
                new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
                // Título com fundo cinza escuro (usando tabela)
                new Table({
                  width: { size: 100, type: WidthType.PERCENTAGE },
                  rows: [
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "8. INVENTARIO DE RISCOS: RECONHECIMENTOS, AVALIAÇÃO E CONTROLE", 
                                  font: "Calibri Light", 
                                  bold: true,
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "808080", // Cinza escuro
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                        }),
                      ],
                    }),
                  ],
                }),
                new Paragraph({ text: "", spacing: { after: 300 } }),
                // Parágrafo introdutório
                new Paragraph({
                  children: [
                    new TextRun({ 
                      text: "Nesta etapa foi feito análise qualitativa através de inspeção \"in loco\" e quantitativa com utilização de equipamentos de dados que foi possível obter através da visita técnica, segue abaixo quadro de riscos por função. No reconhecimento foi montada a planilha da seguinte forma:", 
                      font: "Calibri Light", 
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 400 },
                  alignment: AlignmentType.JUSTIFIED,
                  indent: { firstLine: 1134 }, // 2cm em twips (2 * 567)
                }),
                // Tabela de Agente Ambiental
                new Table({
                  width: { size: 50, type: WidthType.PERCENTAGE },
                  alignment: AlignmentType.CENTER,
                  rows: [
                    // Linha 1: Cabeçalho
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "Agente Ambiental", 
                                  font: "Calibri Light", 
                                  bold: true,
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "DCE6F1", // Azul claro
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 2: Grupo 1 - Riscos Físicos
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "Grupo 1 - Riscos Físicos", 
                                  font: "Calibri Light", 
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "00B050", // Verde
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 3: Grupo 2 - Riscos Químicos
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "Grupo 2 - Riscos Químicos", 
                                  font: "Calibri Light", 
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "FF0000", // Vermelho
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 4: Grupo 3 - Riscos Biológicos
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "Grupo 3 - Riscos Biológicos", 
                                  font: "Calibri Light", 
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "8B8B45", // Verde oliva escuro
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 5: Grupo 4 - Riscos Ergonômicos
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "Grupo 4 - Riscos Ergonômicos", 
                                  font: "Calibri Light", 
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "FFFF00", // Amarelo
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                    // Linha 6: Grupo 5 - Riscos de Acidentes
                    new TableRow({
                      children: [
                        new TableCell({
                          width: { size: 100, type: WidthType.PERCENTAGE },
                          children: [
                            new Paragraph({
                              children: [
                                new TextRun({ 
                                  text: "Grupo 5 - Riscos de Acidentes", 
                                  font: "Calibri Light", 
                                  size: 24, // 12pt
                                  color: "000000", // Preto
                                }),
                              ],
                              alignment: AlignmentType.CENTER,
                            }),
                          ],
                          shading: {
                            fill: "DCE6F1", // Azul claro
                            type: "clear",
                          },
                          verticalAlign: VerticalAlign.CENTER,
                          borders: {
                            top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                            right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          },
                        }),
                      ],
                    }),
                  ],
                }),
              ];
              return page11Content;
            })(),
          },
          // Páginas dinâmicas para cada cargo (começando na página 12)
          ...paginasCargos,
          // Página de Cronograma de Ações
          {
            properties: {
              page: {
                size: {
                  orientation: "portrait" as const,
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(12 + totalCargos, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: [
              new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                  insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        columnSpan: 3,
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "9. CRONOGRAMA DE AÇÕES",
                                font: "Calibri Light",
                                bold: true,
                                size: 24, // 12pt
                                color: "000000", // Preto
                              }),
                            ],
                            alignment: AlignmentType.CENTER,
                          }),
                        ],
                        shading: {
                          fill: "808080", // Cinza
                          type: "clear",
                        },
                        verticalAlign: VerticalAlign.CENTER,
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                      }),
                    ],
                  }),
                  // Linha de cabeçalho das colunas
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 25, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Descrição da Ação",
                                font: "Calibri Light",
                                bold: true,
                                size: 18, // 9pt
                              }),
                            ],
                            alignment: AlignmentType.CENTER,
                          }),
                        ],
                        shading: {
                          fill: "D3D3D3", // Cinza claro
                          type: "clear",
                        },
                        verticalAlign: VerticalAlign.CENTER,
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                      }),
                      new TableCell({
                        width: { size: 20, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Meta",
                                font: "Calibri Light",
                                bold: true,
                                size: 18, // 9pt
                              }),
                            ],
                            alignment: AlignmentType.CENTER,
                          }),
                        ],
                        shading: {
                          fill: "D3D3D3", // Cinza claro
                          type: "clear",
                        },
                        verticalAlign: VerticalAlign.CENTER,
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                      }),
                      new TableCell({
                        width: { size: 55, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "Estratégia da Metodologia",
                                font: "Calibri Light",
                                bold: true,
                                size: 18, // 9pt
                              }),
                            ],
                            alignment: AlignmentType.CENTER,
                          }),
                        ],
                        shading: {
                          fill: "D3D3D3", // Cinza claro
                          type: "clear",
                        },
                        verticalAlign: VerticalAlign.CENTER,
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                      }),
                    ],
                  }),
                  // Linhas dinâmicas baseadas nas ações do cronograma
                  ...(emissao.cronogramaAcoes && emissao.cronogramaAcoes.length > 0
                    ? emissao.cronogramaAcoes.map((acao) => (
                        new TableRow({
                          children: [
                            // Descrição da Ação
                            new TableCell({
                              width: { size: 25, type: WidthType.PERCENTAGE },
                              children: [
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text: acao.descricao || "",
                                      font: "Calibri Light",
                                      size: 18, // 9pt
                                    }),
                                  ],
                                  alignment: AlignmentType.LEFT,
                                }),
                              ],
                              borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                              },
                              verticalAlign: VerticalAlign.TOP,
                            }),
                            // Meta (preenchida automaticamente)
                            new TableCell({
                              width: { size: 20, type: WidthType.PERCENTAGE },
                              children: [
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text: (() => {
                                        if (acao.metaDiaria) return "Diária";
                                        if (acao.metaMensal) return "Mensal";
                                        if (acao.metaTrimestral) return "Trimestral";
                                        if (acao.metaAnual) return "Anual";
                                        return "";
                                      })(),
                                      font: "Calibri Light",
                                      size: 18, // 9pt
                                    }),
                                  ],
                                  alignment: AlignmentType.CENTER,
                                }),
                              ],
                              borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                              },
                              verticalAlign: VerticalAlign.CENTER,
                            }),
                            // Estratégia da Metodologia
                            new TableCell({
                              width: { size: 55, type: WidthType.PERCENTAGE },
                              children: [
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text: acao.estrategiaMetodologia || "",
                                      font: "Calibri Light",
                                      size: 18, // 9pt
                                    }),
                                  ],
                                  alignment: AlignmentType.LEFT,
                                }),
                              ],
                              borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                              },
                              verticalAlign: VerticalAlign.TOP,
                            }),
                          ],
                        })
                      ))
                    : [
                        // Linha vazia se não houver ações
                        new TableRow({
                          children: [
                            new TableCell({
                              width: { size: 25, type: WidthType.PERCENTAGE },
                              children: [
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text: "",
                                      font: "Calibri Light",
                                      size: 18, // 9pt
                                    }),
                                  ],
                                  alignment: AlignmentType.LEFT,
                                }),
                              ],
                              borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                              },
                              verticalAlign: VerticalAlign.TOP,
                            }),
                            new TableCell({
                              width: { size: 20, type: WidthType.PERCENTAGE },
                              children: [
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text: "",
                                      font: "Calibri Light",
                                      size: 18, // 9pt
                                    }),
                                  ],
                                  alignment: AlignmentType.CENTER,
                                }),
                              ],
                              borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                              },
                              verticalAlign: VerticalAlign.CENTER,
                            }),
                            new TableCell({
                              width: { size: 55, type: WidthType.PERCENTAGE },
                              children: [
                                new Paragraph({
                                  children: [
                                    new TextRun({
                                      text: "",
                                      font: "Calibri Light",
                                      size: 18, // 9pt
                                    }),
                                  ],
                                  alignment: AlignmentType.LEFT,
                                }),
                              ],
                              borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                              },
                              verticalAlign: VerticalAlign.TOP,
                            }),
                          ],
                        }),
                      ]
                  ),
                ],
              }),
            ],
          },
          // Página de Encerramento
          {
            properties: {
              page: {
                size: {
                  orientation: "portrait" as const,
                },
                margin: {
                  top: 720,
                  right: 720,
                  bottom: 720,
                  left: 720,
                },
              },
            },
            headers: {
              default: new Header({
                children: [criarHeaderTable(12 + totalCargos + 1, totalPages)],
              }),
            },
            footers: {
              default: new Footer({
                children: criarFooter(),
              }),
            },
            children: [
              new Paragraph({ text: "", spacing: { before: 400, after: 0 } }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: "10. ENCERRAMENTO",
                                font: "Calibri Light",
                                bold: true,
                                size: 24, // 12pt
                                color: "000000", // Preto
                              }),
                            ],
                            alignment: AlignmentType.CENTER,
                          }),
                        ],
                        shading: {
                          fill: "808080", // Cinza
                          type: "clear",
                        },
                        verticalAlign: VerticalAlign.CENTER,
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                          right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
                        },
                      }),
                    ],
                  }),
                ],
              }),
              new Paragraph({ text: "", spacing: { after: 400 } }),
              // Primeiro parágrafo
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Atendendo solicitação da empresa ",
                    font: "Calibri Light",
                    size: 24, // 12pt
                  }),
                  new TextRun({
                    text: empresa?.razaoSocial || emissao.empresaNome || "[NOME DA EMPRESA]",
                    font: "Calibri Light",
                    size: 24, // 12pt
                    bold: true,
                  }),
                  new TextRun({
                    text: ", e baseado em levantamento \"in loco\" realizado na dependência do cliente, foi elaborado o Programa de Prevenção de Riscos Ambientais.",
                    font: "Calibri Light",
                    size: 24, // 12pt
                  }),
                ],
                spacing: { after: 400 },
                alignment: AlignmentType.JUSTIFIED,
                indent: { firstLine: 720 }, // Indentação de primeira linha (1.27cm)
              }),
              // Segundo parágrafo
              new Paragraph({
                children: [
                  new TextRun({
                    text: "O presente documento será submetido a Análise Global e Anual, visando avaliar o seu desenvolvimento, implementar os ajustes necessários e estabelecer novas metas e prioridades.",
                    font: "Calibri Light",
                    size: 24, // 12pt
                  }),
                ],
                spacing: { after: 400 },
                alignment: AlignmentType.JUSTIFIED,
                indent: { firstLine: 720 }, // Indentação de primeira linha (1.27cm)
              }),
              // Terceiro parágrafo
              new Paragraph({
                children: [
                  new TextRun({
                    text: "As medidas propostas devem estar vinculadas ao PCMSO, a fim de identificar o nexo causal de possíveis problemas ocupacionais, devendo as medidas de proteção dos trabalhadores serem imediatamente revistas.",
                    font: "Calibri Light",
                    size: 24, // 12pt
                  }),
                ],
                spacing: { after: 400 },
                alignment: AlignmentType.JUSTIFIED,
                indent: { firstLine: 720 }, // Indentação de primeira linha (1.27cm)
              }),
              // Quarto parágrafo
              new Paragraph({
                children: [
                  new TextRun({
                    text: "O programa contempla planilha de reconhecimento de riscos, sendo anexado complemento ergonômico.",
                    font: "Calibri Light",
                    size: 24, // 12pt
                  }),
                ],
                spacing: { after: 400 },
                alignment: AlignmentType.JUSTIFIED,
                indent: { firstLine: 720 }, // Indentação de primeira linha (1.27cm)
              }),
              // Quinto parágrafo
              new Paragraph({
                children: [
                  new TextRun({
                    text: "O programa é formalizado através de assinatura abaixo e é composto de ",
                    font: "Calibri Light",
                    size: 24, // 12pt
                  }),
                  new TextRun({
                    text: `${totalPages} páginas totais`,
                    font: "Calibri Light",
                    size: 24, // 12pt
                    bold: true,
                  }),
                  new TextRun({
                    text: " (da capa até seus anexos).",
                    font: "Calibri Light",
                    size: 24, // 12pt
                  }),
                ],
                spacing: { after: 400 },
                alignment: AlignmentType.JUSTIFIED,
                indent: { firstLine: 720 }, // Indentação de primeira linha (1.27cm)
              }),
              // Uma linha de espaçamento apenas
              new Paragraph({ text: "", spacing: { after: 400 } }),
              // Cidade, Estado e Data inicial formatada - alinhada à direita
              (() => {
                // Buscar dados da empresa
                const empresaEncontrada = empresas.find((e) => e.id === emissao.empresaId);
                const cidade = empresaEncontrada?.cidadeEndereco || "";
                const estado = empresaEncontrada?.estadoEndereco || "";
                
                // Formatar data para "dia DD de mês de YYYY"
                const formatarDataCompleta = (dataString: string) => {
                  if (!dataString) return "";
                  try {
                    let data: Date;
                    // Se está no formato YYYY-MM-DD
                    if (dataString.match(/^\d{4}-\d{2}-\d{2}/)) {
                      const [ano, mes, dia] = dataString.split('-').map(Number);
                      data = new Date(ano, mes - 1, dia);
                    } else {
                      data = new Date(dataString);
                    }
                    // Formatar: "dia DD de mês de YYYY"
                    return format(data, "'dia' dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                  } catch {
                    return "";
                  }
                };
                
                const dataFormatada = formatarDataCompleta(emissao.vigenciaInicio);
                
                // Montar texto completo: "Cidade - Estado, dia DD de mês de YYYY."
                let textoCompleto = "";
                if (cidade && estado) {
                  textoCompleto = `${cidade} - ${estado}, ${dataFormatada}.`;
                } else if (cidade) {
                  textoCompleto = `${cidade}, ${dataFormatada}.`;
                } else if (estado) {
                  textoCompleto = `${estado}, ${dataFormatada}.`;
                } else {
                  textoCompleto = dataFormatada ? `${dataFormatada}.` : "";
                }
                
                return new Paragraph({
                  children: [
                    new TextRun({
                      text: textoCompleto,
                      font: "Calibri Light",
                      size: 24, // 12pt
                    }),
                  ],
                  spacing: { after: 400 },
                  alignment: AlignmentType.RIGHT,
                });
              })(),
              // Espaçamento antes da assinatura do responsável técnico
              new Paragraph({ text: "", spacing: { after: 300 } }),
              // Linha de assinatura do responsável técnico
              new Paragraph({
                children: [
                  new TextRun({
                    text: "_________________________________",
                    font: "Calibri Light",
                    size: 24, // 12pt
                    bold: true,
                  }),
                ],
                spacing: { after: 0 },
                alignment: AlignmentType.CENTER,
              }),
              // Nome do responsável técnico
              new Paragraph({
                children: [
                  new TextRun({
                    text: emissao.responsavelNome || "[Nome do Responsável]",
                    font: "Calibri Light",
                    size: 24, // 12pt
                    bold: true,
                  }),
                ],
                spacing: { after: 0 },
                alignment: AlignmentType.CENTER,
              }),
              // Função do responsável técnico
              new Paragraph({
                children: [
                  new TextRun({
                    text: emissao.responsavelFuncao || "Técnico de Segurança do Trabalho",
                    font: "Calibri Light",
                    size: 24, // 12pt
                    bold: true,
                  }),
                ],
                spacing: { after: 0 },
                alignment: AlignmentType.CENTER,
              }),
              // Registro MTE do responsável técnico
              new Paragraph({
                children: [
                  new TextRun({
                    text: `MTE: ${emissao.responsavelRegistro || "50002/SP"}`,
                    font: "Calibri Light",
                    size: 24, // 12pt
                    bold: true,
                  }),
                ],
                spacing: { after: 0 },
                alignment: AlignmentType.CENTER,
              }),
              // Texto "Responsável Técnico Pela Elaboração"
              new Paragraph({
                children: [
                  new TextRun({
                    text: "Responsável Técnico Pela Elaboração",
                    font: "Calibri Light",
                    size: 24, // 12pt
                    bold: true,
                  }),
                ],
                spacing: { after: 300 },
                alignment: AlignmentType.CENTER,
              }),
              // Espaçamento antes da assinatura da empresa
              new Paragraph({ text: "", spacing: { after: 300 } }),
              // Linha de assinatura da empresa
              new Paragraph({
                children: [
                  new TextRun({
                    text: "_________________________________",
                    font: "Calibri Light",
                    size: 24, // 12pt
                    bold: true,
                  }),
                ],
                spacing: { after: 0 },
                alignment: AlignmentType.CENTER,
              }),
              // Razão social da empresa
              new Paragraph({
                children: [
                  new TextRun({
                    text: empresa?.razaoSocial || emissao.empresaNome || "[Razão Social da Empresa]",
                    font: "Calibri Light",
                    size: 24, // 12pt
                    bold: true,
                  }),
                ],
                spacing: { after: 0 },
                alignment: AlignmentType.CENTER,
              }),
              // CNPJ da empresa
              new Paragraph({
                children: [
                  new TextRun({
                    text: `CNPJ: ${empresa?.cnpj || "[CNPJ da Empresa]"}`,
                    font: "Calibri Light",
                    size: 24, // 12pt
                    bold: true,
                  }),
                ],
                spacing: { after: 0 },
                alignment: AlignmentType.CENTER,
              }),
            ],
          },
        ],
      });

      // Gerar e baixar o documento
      try {
        const blob = await Packer.toBlob(doc);
        saveAs(blob, `pgro-${emissao.empresaNome.replace(/\s+/g, "-")}-${emissao.id}.docx`);
        toast.success("Documento Word gerado com sucesso!");
      } catch (packError) {
        console.error("Erro ao gerar blob:", packError);
        throw packError;
      }
    } catch (error: any) {
      console.error("Erro ao gerar Word:", error);
      console.error("Stack trace:", error?.stack);
      toast.error(`Erro ao gerar documento Word: ${error?.message || "Erro desconhecido"}`);
    } finally {
      setGerandoWord(false);
    }
  }, [empresas, utils, gerandoWord]);

  const handleEditarEmissao = useCallback(
    (emissao: EmissaoPgro) => {
      setEmissaoEditandoId(emissao.id);
      setSelectedEmpresa({
        id: emissao.empresaId,
        razaoSocial: emissao.empresaNome,
      });
      setVigenciaInicio(emissao.vigenciaInicio.substring(0, 10));
      setVigenciaFim(emissao.vigenciaFim.substring(0, 10));
      setResponsavelSelecionado({
        id: emissao.responsavelId,
        nomeCompleto: emissao.responsavelNome,
        funcao: emissao.responsavelFuncao,
        registroProfissional: emissao.responsavelRegistro,
      });
      setObservacoes(emissao.observacoes);
      setCargosPlano(
        emissao.cargos.map((cargo) => ({
          id: window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10),
          cargoId: cargo.cargoId,
          cargoNome: cargo.cargoNome,
          cargoOpen: false,
          cargoSearch: "",
          setorId: cargo.setorId,
          setorNome: cargo.setorNome,
          setorOpen: false,
          setorSearch: "",
          cbo: cargo.cbo,
        }))
      );
      setCronogramaAcoes(emissao.cronogramaAcoes || []);
      setCidadeEmissao(emissao.cidadeEmissao || "");
      setEstadoEmissao(emissao.estadoEmissao || "");
      setDataEmissao(emissao.dataEmissao || "");
      setDialogOpen(true);
    },
    []
  );

  const handleSalvar = useCallback(async () => {
    if (!formularioValido) {
      toast.error("Preencha todos os campos obrigatórios antes de finalizar.");
      return;
    }

    try {
      setSalvando(true);

      const payload = {
        empresaId: selectedEmpresa?.id,
        responsavelId: responsavelSelecionado?.id,
        vigenciaInicio,
        vigenciaFim,
        observacoes,
        cargos: cargosPlano
          .filter((item) => item.cargoId)
          .map((item) => ({
            cargoId: item.cargoId,
            setorId: item.setorId,
            cbo: item.cbo,
          })),
        cronogramaAcoes: cronogramaAcoes,
      };

      const novaEmissao: EmissaoPgro = {
        id: emissaoEditandoId || (window.crypto?.randomUUID?.() || Math.random().toString(36).slice(2, 10)),
        empresaId: selectedEmpresa?.id ?? "",
        empresaNome: selectedEmpresa?.razaoSocial ?? "",
        responsavelId: responsavelSelecionado?.id ?? "",
        responsavelNome: responsavelSelecionado?.nomeCompleto ?? "",
        responsavelFuncao: responsavelSelecionado?.funcao,
        responsavelRegistro: responsavelSelecionado?.registroProfissional,
        vigenciaInicio,
        vigenciaFim,
        observacoes,
        cargos: cargosPlano
          .filter((item) => item.cargoId)
          .map((item) => ({
            id: item.id,
            cargoId: item.cargoId,
            cargoNome: item.cargoNome,
            setorId: item.setorId,
            setorNome: item.setorNome,
            cbo: item.cbo,
          })),
        cronogramaAcoes: cronogramaAcoes,
        cidadeEmissao: cidadeEmissao?.trim() || "",
        estadoEmissao: estadoEmissao?.trim() || "",
        dataEmissao: dataEmissao?.trim() || "",
        criadoEm: emissaoEditandoId
          ? emissoes.find((emissao) => emissao.id === emissaoEditandoId)?.criadoEm || new Date().toISOString()
          : new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };
      
      // DEBUG - Verificar valores antes de salvar
      console.log("=== SALVANDO EMISSÃO ===");
      console.log("cidadeEmissao STATE:", cidadeEmissao);
      console.log("estadoEmissao STATE:", estadoEmissao);
      console.log("dataEmissao STATE:", dataEmissao);
      console.log("cidadeEmissao SALVO:", novaEmissao.cidadeEmissao);
      console.log("estadoEmissao SALVO:", novaEmissao.estadoEmissao);
      console.log("dataEmissao SALVO:", novaEmissao.dataEmissao);
      console.log("Nova emissão completa:", JSON.stringify(novaEmissao, null, 2));
      console.log("========================");

      const listaAtualizada = emissaoEditandoId
        ? emissoes.map((emissao) => (emissao.id === emissaoEditandoId ? novaEmissao : emissao))
        : [novaEmissao, ...emissoes];

      salvarEmissoesLocal(listaAtualizada);
      setEmissaoEditandoId(null);
      toast.success("PGRO emitido com sucesso (registrado em modo local).");
      handleDialogClose();
    } catch (error: any) {
      console.error("Erro ao salvar PGRO", error);
      toast.error(error?.message || "Erro ao salvar emissão do PGRO.");
    } finally {
      setSalvando(false);
    }
  }, [cargosPlano, vigenciaFim, vigenciaInicio, observacoes, cronogramaAcoes, responsavelSelecionado?.id, selectedEmpresa?.id, formularioValido, handleDialogClose, emissaoEditandoId, emissoes, salvarEmissoesLocal]);

  const handleRemoverCargoPlano = useCallback((itemId: string) => {
    setCargosPlano((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== itemId) : prev));
  }, []);

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)] pr-2">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6">
          <div>
            <CardTitle className="text-2xl font-semibold">PGRO / PPRA</CardTitle>
            <p className="text-muted-foreground mt-2">
              Planeje, execute e acompanhe o Plano de Gerenciamento de Riscos Ocupacionais e o antigo Programa de Prevenção de Riscos Ambientais com fluxos padronizados e registros centralizados.
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={handleDialogToggle}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Emitir PGRO
              </Button>
            </DialogTrigger>
            <DialogContent 
              key={emissaoEditandoId || "new"} 
              className="w-full max-w-[95vw] sm:max-w-[95vw] lg:max-w-[1200px] max-h-[90vh] !flex !flex-col !p-0 gap-0"
            >
              <DialogHeader className="px-6 pt-6 pb-4 flex-shrink-0 border-b">
                <DialogTitle>Emitir PGRO</DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para iniciar um novo PGRO / PPRA. Você poderá complementar informações após o cadastro inicial.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 px-6 py-4 overflow-y-auto flex-1 min-h-0" style={{ maxHeight: 'calc(90vh - 200px)' }}>
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Dados da empresa
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label>Empresa</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          readOnly
                          value={nomeEmpresaSelecionada}
                          placeholder="Selecione a empresa"
                          className="bg-muted/40"
                        />
                        <Popover open={empresaOpen} onOpenChange={setEmpresaOpen}>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="icon" className="shrink-0">
                              <Search className="h-4 w-4" />
                              <span className="sr-only">Pesquisar empresa</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="p-0 w-80" align="start">
                            <Command shouldFilter={false}>
                              <CommandInput
                                placeholder="Pesquisar por razão social, fantasia ou CNPJ"
                                value={empresaSearch}
                                onValueChange={setEmpresaSearch}
                                autoFocus
                              />
                              <CommandList>
                                <CommandEmpty>
                                  {isLoadingEmpresas
                                    ? "Carregando empresas..."
                                    : empresas.length === 0
                                    ? "Nenhuma empresa cadastrada."
                                    : "Nenhuma empresa encontrada."}
                                </CommandEmpty>
                                <CommandGroup>
                                  {empresasFiltradas.length > 0 ? (
                                    empresasFiltradas.map((empresa) => (
                                    <CommandItem
                                      key={empresa.id}
                                        value={`${empresa.razaoSocial} ${empresa.nomeFantasia || ""} ${empresa.cnpj || ""}`}
                                      onSelect={() => handleSelectEmpresa(empresa)}
                                    >
                                      <div className="flex items-start gap-3">
                                        <div className="mt-0.5">
                                          <Building2 className="h-4 w-4 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-medium leading-tight">
                                            {empresa.razaoSocial}
                                          </p>
                                          {empresa.nomeFantasia && (
                                            <p className="text-xs text-muted-foreground">
                                              Fantasia: {empresa.nomeFantasia}
                                            </p>
                                          )}
                                          {empresa.cnpj && (
                                            <p className="text-xs text-muted-foreground">
                                              CNPJ: {empresa.cnpj}
                                            </p>
                                          )}
                                        </div>
                                        <Check
                                          className={cn(
                                            "h-4 w-4 text-primary transition-opacity",
                                            selectedEmpresa?.id === empresa.id
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                      </div>
                                    </CommandItem>
                                  ))
                                  ) : (
                                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                      {isLoadingEmpresas
                                        ? "Carregando..."
                                        : "Digite para buscar empresas"}
                                    </div>
                                  )}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>CNPJ</Label>
                      <Input
                        readOnly
                        value={selectedEmpresa?.cnpj ?? ""}
                        placeholder="Selecionar empresa para preencher"
                        className="bg-muted/40"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Vigência do plano
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data inicial</Label>
                      <Input
                        type="date"
                        value={vigenciaInicio}
                        onChange={(event) => setVigenciaInicio(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data final</Label>
                      <Input
                        type="date"
                        value={vigenciaFim}
                        min={vigenciaInicio || undefined}
                        onChange={(event) => setVigenciaFim(event.target.value)}
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Responsável técnico
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto] gap-6">
                    <div className="space-y-2">
                      <Label>Responsável</Label>
                      <Input
                        readOnly
                        value={responsavelSelecionado?.nomeCompleto ?? ""}
                        placeholder="Selecione o responsável técnico"
                        className="bg-muted/40"
                      />
                    </div>
                    <div className="flex items-end">
                      <Popover open={responsavelOpen} onOpenChange={setResponsavelOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="icon" className="shrink-0">
                            <Search className="h-4 w-4" />
                            <span className="sr-only">Pesquisar responsável</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[24rem]" align="end">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Buscar por nome, função ou registro"
                              value={responsavelSearch}
                              onValueChange={setResponsavelSearch}
                              autoFocus
                            />
                            <CommandList>
                              <CommandEmpty>
                                {isLoadingResponsaveis
                                  ? "Carregando responsáveis..."
                                  : "Nenhum responsável encontrado."}
                              </CommandEmpty>
                              <CommandGroup>
                                {responsaveisFiltrados.map((responsavel) => (
                                  <CommandItem
                                    key={responsavel.id}
                                    value={responsavel.id}
                                    onSelect={() => handleSelectResponsavel(responsavel)}
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="mt-0.5">
                                        <UserCheck className="h-4 w-4 text-primary" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="font-medium leading-tight">
                                          {responsavel.nomeCompleto}
                                        </p>
                                        {responsavel.funcao && (
                                          <p className="text-xs text-muted-foreground">
                                            Função: {responsavel.funcao}
                                          </p>
                                        )}
                                        {responsavel.registroProfissional && (
                                          <p className="text-xs text-muted-foreground">
                                            Registro: {responsavel.registroProfissional}
                                          </p>
                                        )}
                                      </div>
                                      <Check
                                        className={cn(
                                          "h-4 w-4 text-primary transition-opacity",
                                          responsavelSelecionado?.id === responsavel.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <Label>Função</Label>
                      <Input
                        readOnly
                        value={responsavelSelecionado?.funcao ?? ""}
                        placeholder="Função profissional"
                        className="bg-muted/40"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Registro profissional</Label>
                      <Input
                        readOnly
                        value={responsavelSelecionado?.registroProfissional ?? ""}
                        placeholder="CREA, CRM, CAU, etc."
                        className="bg-muted/40"
                      />
                    </div>
                  </div>
                </section>

                <section className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Cargos abrangidos
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Selecione os cargos contemplados no PGRO. O setor é preenchido automaticamente conforme vínculos já cadastrados, e o código CBO é sugerido se estiver disponível.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleAdicionarTodosCargosPlano}
                        disabled={!podeSelecionarCargos}
                      >
                        <CopyPlus className="h-4 w-4" />
                        Adicionar todos
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={handleAdicionarCargoPlano}
                        disabled={!podeSelecionarCargos}
                      >
                        <Plus className="h-4 w-4" />
                        Adicionar cargo
                      </Button>
                    </div>
                  </div>

                  {!queryEnabled ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                      Selecione uma empresa para listar cargos e setores cadastrados.
                    </div>
                  ) : cargosDisponiveis.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                      Nenhum cargo cadastrado para esta empresa. Cadastre cargos e vincule os setores no módulo correspondente antes de emitir o PGRO.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cargosPlano.map((item, index) => {
                        const cargosFiltrados = filtroCargos(item.cargoSearch);
                        const setoresFiltrados = filtroSetores(item.setorSearch);

                        return (
                          <div
                            key={`cargo-${item.id}-${index}`}
                            className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,3fr)_minmax(0,2fr)_auto] gap-4 rounded-lg border bg-muted/20 p-4"
                          >
                            <div className="space-y-2">
                              <Label>Cargo {cargosPlano.length > 1 ? `#${index + 1}` : ""}</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  readOnly
                                  value={item.cargoNome}
                                  placeholder="Selecionar cargo"
                                  className="bg-background"
                                />
                                <Popover
                                  open={item.cargoOpen}
                                  onOpenChange={(open) => atualizarItemCargo(item.id, { cargoOpen: open })}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="shrink-0"
                                      disabled={!podeSelecionarCargos}
                                    >
                                      <Search className="h-4 w-4" />
                                      <span className="sr-only">Buscar cargo</span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="p-0 w-[26rem]" align="start">
                                    <Command shouldFilter={false}>
                                      <CommandInput
                                        placeholder="Buscar cargo ou CBO"
                                        value={item.cargoSearch}
                                        onValueChange={(value) => atualizarItemCargo(item.id, { cargoSearch: value })}
                                        autoFocus
                                      />
                                      <CommandList>
                                        <CommandEmpty>
                                          {isLoadingCargos ? "Carregando cargos..." : "Nenhum cargo encontrado."}
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {cargosFiltrados.map((cargo) => (
                                            <CommandItem
                                              key={cargo.id}
                                              value={cargo.id}
                                              onSelect={() => {
                                                atualizarItemCargo(item.id, { cargoOpen: false });
                                                void handleSelectCargoPlano(item.id, cargo);
                                              }}
                                            >
                                              <div className="flex flex-col">
                                                <span className="font-medium">{cargo.nomeCargo}</span>
                                                {cargo.codigoCbo && (
                                                  <span className="text-xs text-muted-foreground">CBO: {cargo.codigoCbo}</span>
                                                )}
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Setor</Label>
                              <div className="flex items-center gap-2">
                                <Input
                                  readOnly
                                  value={item.setorNome}
                                  placeholder="Selecionado automaticamente"
                                  className="bg-background"
                                />
                                <Popover
                                  open={item.setorOpen}
                                  onOpenChange={(open) => atualizarItemCargo(item.id, { setorOpen: open })}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="shrink-0"
                                      disabled={!queryEnabled}
                                    >
                                      <Search className="h-4 w-4" />
                                      <span className="sr-only">Buscar setor</span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="p-0 w-[24rem]" align="start">
                                    <Command shouldFilter={false}>
                                      <CommandInput
                                        placeholder="Filtrar setores"
                                        value={item.setorSearch}
                                        onValueChange={(value) => atualizarItemCargo(item.id, { setorSearch: value })}
                                        autoFocus
                                      />
                                      <CommandList>
                                        <CommandEmpty>
                                          {isLoadingSetores ? "Carregando setores..." : "Nenhum setor encontrado."}
                                        </CommandEmpty>
                                        <CommandGroup>
                                          {setoresFiltrados.map((setor) => (
                                            <CommandItem
                                              key={setor.id}
                                              value={setor.id}
                                              onSelect={() => {
                                                atualizarItemCargo(item.id, { setorOpen: false });
                                                handleSelectSetorPlano(item.id, setor);
                                              }}
                                            >
                                              <div className="flex flex-col">
                                                <span className="font-medium">{setor.nomeSetor}</span>
                                                {setor.descricao && (
                                                  <span className="text-xs text-muted-foreground">{setor.descricao}</span>
                                                )}
                                              </div>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label>Código CBO</Label>
                              <Input
                                readOnly
                                value={item.cbo}
                                placeholder="Preenchido conforme cargo"
                                className="bg-background"
                              />
                            </div>

                            <div className="flex items-end justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoverCargoPlano(item.id)}
                                disabled={cargosPlano.length === 1}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Remover cargo</span>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Cronograma de Ações
                  </h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const novaAcao: CronogramaAcao = {
                          id: Math.random().toString(36).slice(2, 10),
                          descricao: "",
                          metaDiaria: false,
                          metaMensal: false,
                          metaTrimestral: false,
                          metaAnual: false,
                          estrategiaMetodologia: "",
                        };
                        setCronogramaAcoes([...cronogramaAcoes, novaAcao]);
                      }}
                    >
                      + Adicionar Ação
                    </Button>
                  </div>
                  
                  {cronogramaAcoes.length === 0 ? (
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center text-sm text-muted-foreground">
                      Nenhuma ação adicionada. Clique em "+ Adicionar Ação" para começar.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cronogramaAcoes.map((acao, index) => (
                        <Card key={acao.id}>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold">Ação {index + 1}</Label>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setCronogramaAcoes(cronogramaAcoes.filter((a) => a.id !== acao.id));
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor={`descricao-${acao.id}`}>Descrição da Ação</Label>
                  <Textarea
                                  id={`descricao-${acao.id}`}
                                  placeholder="Descreva a ação a ser realizada..."
                                  value={acao.descricao}
                                  onChange={(e) => {
                                    const novasAcoes = [...cronogramaAcoes];
                                    novasAcoes[index].descricao = e.target.value;
                                    setCronogramaAcoes(novasAcoes);
                                  }}
                                  rows={2}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Meta Pré-estabelecida</Label>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`diaria-${acao.id}`}
                                      checked={acao.metaDiaria}
                                      onChange={(e) => {
                                        const novasAcoes = [...cronogramaAcoes];
                                        novasAcoes[index].metaDiaria = e.target.checked;
                                        setCronogramaAcoes(novasAcoes);
                                      }}
                                      className="h-4 w-4"
                                    />
                                    <Label htmlFor={`diaria-${acao.id}`} className="font-normal cursor-pointer">
                                      Diária
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`mensal-${acao.id}`}
                                      checked={acao.metaMensal}
                                      onChange={(e) => {
                                        const novasAcoes = [...cronogramaAcoes];
                                        novasAcoes[index].metaMensal = e.target.checked;
                                        setCronogramaAcoes(novasAcoes);
                                      }}
                                      className="h-4 w-4"
                                    />
                                    <Label htmlFor={`mensal-${acao.id}`} className="font-normal cursor-pointer">
                                      Mensal
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`trimestral-${acao.id}`}
                                      checked={acao.metaTrimestral}
                                      onChange={(e) => {
                                        const novasAcoes = [...cronogramaAcoes];
                                        novasAcoes[index].metaTrimestral = e.target.checked;
                                        setCronogramaAcoes(novasAcoes);
                                      }}
                                      className="h-4 w-4"
                                    />
                                    <Label htmlFor={`trimestral-${acao.id}`} className="font-normal cursor-pointer">
                                      Trimestral
                                    </Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`anual-${acao.id}`}
                                      checked={acao.metaAnual}
                                      onChange={(e) => {
                                        const novasAcoes = [...cronogramaAcoes];
                                        novasAcoes[index].metaAnual = e.target.checked;
                                        setCronogramaAcoes(novasAcoes);
                                      }}
                                      className="h-4 w-4"
                                    />
                                    <Label htmlFor={`anual-${acao.id}`} className="font-normal cursor-pointer">
                                      Anual
                                    </Label>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`estrategia-${acao.id}`}>Estratégia da Metodologia</Label>
                                <Textarea
                                  id={`estrategia-${acao.id}`}
                                  placeholder="Descreva a estratégia e metodologia a ser utilizada..."
                                  value={acao.estrategiaMetodologia}
                                  onChange={(e) => {
                                    const novasAcoes = [...cronogramaAcoes];
                                    novasAcoes[index].estrategiaMetodologia = e.target.value;
                                    setCronogramaAcoes(novasAcoes);
                                  }}
                                  rows={2}
                                />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>

              </div>

              <DialogFooter className="sm:flex-row sm:justify-between sm:items-center px-6 pb-6 pt-4 flex-shrink-0 border-t bg-background">
                <div className="text-xs text-muted-foreground">
                  Última preparação: {format(new Date(), "dd/MM/yyyy HH:mm")}
                </div>
                <div className="flex gap-2">
                  <DialogClose asChild>
                    <Button variant="outline" onClick={handleDialogClose}>
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button
                    className="gap-2"
                    disabled={!formularioValido || salvando}
                    onClick={handleSalvar}
                  >
                    {salvando ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
                      </>
                    ) : (
                      <>
                        <ChevronsUpDown className="h-4 w-4" />
                        Finalizar emissão
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3 p-4">
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Utilize o botão "Emitir PGRO" para iniciar um novo plano. O fluxo completo de geração, checklist de requisitos e anexos técnicos será liberado nas próximas etapas do desenvolvimento.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Painel de emissões registradas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de emissões</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{totaisPainel.total}</p>
                <p className="text-xs text-muted-foreground">
                  {totaisPainel.totalFiltrado !== totaisPainel.total
                    ? `${totaisPainel.totalFiltrado} exibidos com filtros`
                    : "Todos os registros salvos"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Empresas atendidas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{totaisPainel.empresasUnicas}</p>
                <p className="text-xs text-muted-foreground">Empresas com PGRO emitido</p>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Filtros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="buscar-emissao">Buscar emissão</Label>
                    <Input
                      id="buscar-emissao"
                      value={buscaEmissao}
                      onChange={(event) => setBuscaEmissao(event.target.value)}
                      placeholder="Empresa, responsável, cargo ou CBO"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Empresa</Label>
                    <Select value={empresaFiltroEmissao} onValueChange={setEmpresaFiltroEmissao}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as empresas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">Todas as empresas</SelectItem>
                        {Array.from(new Map(
                          emissoes.map((emissao) => [emissao.empresaId, emissao.empresaNome])
                        ).entries()).map(([id, nome]) => (
                          <SelectItem key={id} value={id}>
                            {nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setBuscaEmissao("");
                      setEmpresaFiltroEmissao("__all__");
                    }}
                    className="gap-1"
                  >
                    <X className="h-4 w-4" /> Limpar filtros
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelecionarTodos}
                    className="gap-1"
                    disabled={emissoesFiltradas.length === 0}
                  >
                    <Filter className="h-4 w-4" />
                    {emissoesSelecionadas.length === emissoesFiltradas.length
                      ? "Desmarcar todos"
                      : "Selecionar todos"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {emissoesFiltradas.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
              Nenhum registro de PGRO encontrado. Emita um novo plano para começar a controlar as revisões.
            </div>
          ) : (
            <div className="space-y-4">
              {emissoesFiltradas.map((emissao) => {
                const selecionado = emissoesSelecionadas.includes(emissao.id);
                const empresaEncontrada = empresas.find((e) => e.id === emissao.empresaId);
                const totalCargosPGRO = emissao.cargos?.length || 0;
                
                return (
                  <Card 
                    key={emissao.id} 
                    className={cn(
                      "transition-all hover:shadow-md",
                      selecionado && "border-primary border-2 shadow-md"
                    )}
                    onClick={() => handleToggleSelecionado(emissao.id)}
                  >
                    <CardContent className="p-6">
                      {/* Cabeçalho com empresa e vigência */}
                      <div className="flex flex-col gap-4 mb-4 pb-4 border-b">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-bold text-gray-900">{emissao.empresaNome}</h3>
                          <Badge 
                            variant={selecionado ? "default" : "secondary"}
                            className="text-xs font-semibold px-3 py-1"
                          >
                              Vigência: {format(new Date(emissao.vigenciaInicio), "dd/MM/yyyy")} – {format(new Date(emissao.vigenciaFim), "dd/MM/yyyy")}
                            </Badge>
                          </div>
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Responsável técnico:</span>{" "}
                          <span className="font-medium text-gray-900">{emissao.responsavelNome}</span>
                          {emissao.responsavelRegistro && (
                            <span className="text-gray-500"> • Registro {emissao.responsavelRegistro}</span>
                          )}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2" 
                            onClick={(event) => { event.stopPropagation(); handleEditarEmissao(emissao); }}
                          >
                            <Edit className="h-4 w-4" /> Editar
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2" 
                                onClick={(e) => e.stopPropagation()}
                              >
                                <FileDown className="h-4 w-4" /> Gerar <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  if (!gerandoWord) {
                                    const emissaoAtualizada = emissoes.find((e) => e.id === emissao.id) || emissao;
                                    gerarWord(emissaoAtualizada).catch((error) => {
                                      console.error("Erro ao gerar Word:", error);
                                    });
                                  }
                                }}
                                disabled={gerandoWord}
                              >
                                <File className="mr-2 h-4 w-4" />
                                {gerandoWord ? "Gerando..." : "Gerar Word"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 text-destructive hover:text-destructive" 
                            onClick={(event) => { event.stopPropagation(); handleExcluirEmissao(emissao.id); }}
                          >
                            <Trash2 className="h-4 w-4" /> Excluir
                          </Button>
                        </div>
                      </div>

                      {/* Accordion abrangendo tudo */}
                      <Accordion type="single" collapsible className="w-full" defaultValue="cargos">
                        <AccordionItem value="cargos" className="border-0">
                          <AccordionTrigger 
                            className="py-2 hover:no-underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-between w-full pr-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-gray-700">
                                  Cargos Abrangidos
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  • Clique para ver detalhes e estatísticas
                                </span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {totalCargosPGRO} {totalCargosPGRO === 1 ? "cargo" : "cargos"}
                              </Badge>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent onClick={(e) => e.stopPropagation()}>
                            {/* Estatísticas de cargos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">
                                  Total de Cargos no PGRO
                                </p>
                                <p className="text-2xl font-bold text-blue-900">{totalCargosPGRO}</p>
                                <p className="text-xs text-blue-600 mt-1">Cargos incluídos neste documento</p>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-1">
                                  Total de Cargos da Empresa
                                </p>
                                <p className="text-2xl font-bold text-green-900">
                                  {empresaEncontrada ? (
                                    <TotalCargosEmpresa empresaId={empresaEncontrada.id} />
                                  ) : (
                                    "—"
                                  )}
                                </p>
                                <p className="text-xs text-green-600 mt-1">Cargos cadastrados na empresa</p>
                              </div>
                            </div>

                            {/* Lista de cargos */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {emissao.cargos.map((cargo) => (
                                <div 
                                  key={cargo.id} 
                                  className="flex items-start gap-2 p-2 bg-gray-50 rounded-md border border-gray-200 hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900 truncate">
                                      {cargo.cargoNome}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {cargo.setorNome && (
                                        <Badge variant="outline" className="text-xs">
                                          {cargo.setorNome}
                                        </Badge>
                                      )}
                                      {cargo.cbo && (
                                        <Badge variant="secondary" className="text-xs">
                                          CBO: {cargo.cbo}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>

                      {/* Rodapé com informações adicionais */}
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>
                              Criado em {format(new Date(emissao.criadoEm), "dd/MM/yyyy HH:mm")}
                            </span>
                            <span>•</span>
                            <span>
                              Atualizado em {format(new Date(emissao.atualizadoEm), "dd/MM/yyyy HH:mm")}
                            </span>
                          </div>
                          {emissao.observacoes && (
                            <p className="text-xs text-gray-600 italic truncate max-w-md">
                              {emissao.observacoes}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
