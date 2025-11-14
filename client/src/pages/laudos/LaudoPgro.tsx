import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type EmpresaResumo = {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string | null;
  cnpj?: string | null;
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
  const [emissaoEditandoId, setEmissaoEditandoId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [emissoesSelecionadas, setEmissoesSelecionadas] = useState<string[]>([]);
  const [emissoes, setEmissoes] = useState<EmissaoPgro[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem("pgro-emissoes");
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (error) {
      console.error("Erro ao carregar emissões do localStorage", error);
      return [];
    }
  });

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
      onSuccess: (data) => {
        console.log(`[PGRO] ✅ Empresas carregadas: ${data.length}`);
      },
      onError: (error) => {
        console.error("[PGRO] ❌ Erro ao carregar empresas:", error);
      },
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
      return mapped.filter((cargo) => cargo.empresaId === null || cargo.empresaId === empresaIdStr);
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
      return mapped.filter((setor) => setor.empresaId === null || setor.empresaId === empresaIdStr);
    },
    [setoresData, empresaIdNumber, queryEnabled]
  );

  const podeSelecionarCargos = queryEnabled && cargosDisponiveis.length > 0;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("pgro-emissoes", JSON.stringify(emissoes));
    } catch (error) {
      console.error("Erro ao salvar emissões do PGRO", error);
    }
  }, [emissoes]);

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
    setCargosPlano([createEmptyCargoItem()]);
  }, [createEmptyCargoItem]);

  const handleDialogToggle = useCallback(
    (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        resetDialogState();
      }
    },
    [resetDialogState]
  );

  const handleDialogClose = useCallback(() => {
    resetDialogState();
    setDialogOpen(false);
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

  const salvarEmissoesLocal = useCallback(
    (lista: EmissaoPgro[]) => {
      setEmissoes(lista);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("pgro-emissoes", JSON.stringify(lista));
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

  const handleBaixarEmissao = useCallback((emissao: EmissaoPgro) => {
    const texto = `Relatório PGRO / PPRA\n\nEmpresa: ${emissao.empresaNome}\nResponsável: ${emissao.responsavelNome}\nVigência: ${format(new Date(emissao.vigenciaInicio), "dd/MM/yyyy")} - ${format(new Date(emissao.vigenciaFim), "dd/MM/yyyy")}\n\nCargos contemplados:\n${emissao.cargos
      .map((item) => `- ${item.cargoNome} (Setor: ${item.setorNome} | CBO: ${item.cbo || "-"})`)
      .join("\n")}\n\nObservações:\n${emissao.observacoes || "Nenhuma"}`;

    const blob = new Blob([texto], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-pgro-${emissao.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório básico gerado em TXT.");
  }, []);

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
      };
      console.log("Dados para salvar PGRO", payload);

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
        criadoEm: emissaoEditandoId
          ? emissoes.find((emissao) => emissao.id === emissaoEditandoId)?.criadoEm || new Date().toISOString()
          : new Date().toISOString(),
        atualizadoEm: new Date().toISOString(),
      };

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
  }, [cargosPlano, vigenciaFim, vigenciaInicio, observacoes, responsavelSelecionado?.id, selectedEmpresa?.id, formularioValido, handleDialogClose, emissaoEditandoId, emissoes, salvarEmissoesLocal]);

  const handleRemoverCargoPlano = useCallback((itemId: string) => {
    setCargosPlano((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== itemId) : prev));
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            <DialogContent className="w-full max-w-[95vw] sm:max-w-[95vw] lg:max-w-[1200px]">
              <DialogHeader>
                <DialogTitle>Emitir PGRO</DialogTitle>
                <DialogDescription>
                  Preencha os dados abaixo para iniciar um novo PGRO / PPRA. Você poderá complementar informações após o cadastro inicial.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
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
                          <Command>
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
                            key={item.id}
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
                                    <Command>
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
                                    <Command>
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
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Observações iniciais
                  </h3>
                  <Textarea
                    placeholder="Resumo do escopo, particularidades do ambiente, próximos passos..."
                    value={observacoes}
                    onChange={(event) => setObservacoes(event.target.value)}
                    rows={4}
                  />
                </section>
              </div>

              <DialogFooter className="sm:flex-row sm:justify-between sm:items-center">
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
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-dashed p-6 text-muted-foreground">
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
            <div className="space-y-3">
              {emissoesFiltradas.map((emissao) => {
                const selecionado = emissoesSelecionadas.includes(emissao.id);
                return (
                  <Card key={emissao.id} className={cn(selecionado && "border-primary")}
                    onClick={() => handleToggleSelecionado(emissao.id)}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold">{emissao.empresaNome}</h3>
                            <Badge variant={selecionado ? "default" : "secondary"}>
                              Vigência: {format(new Date(emissao.vigenciaInicio), "dd/MM/yyyy")} – {format(new Date(emissao.vigenciaFim), "dd/MM/yyyy")}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Responsável técnico: <span className="font-medium">{emissao.responsavelNome}</span>
                            {emissao.responsavelRegistro && ` • Registro ${emissao.responsavelRegistro}`}
                          </p>
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wide">Cargos abrangidos</p>
                            <ul className="space-y-1 text-sm">
                              {emissao.cargos.map((cargo) => (
                                <li key={cargo.id} className="flex flex-wrap gap-2">
                                  <span className="font-medium">{cargo.cargoNome}</span>
                                  <Badge variant="outline">Setor {cargo.setorNome || "-"}</Badge>
                                  {cargo.cbo && <Badge variant="secondary">CBO {cargo.cbo}</Badge>}
                                </li>
                              ))}
                            </ul>
                          </div>
                          {emissao.observacoes && (
                            <p className="text-sm text-muted-foreground">
                              {emissao.observacoes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            Criado em {format(new Date(emissao.criadoEm), "dd/MM/yyyy HH:mm")} • Atualizado em {format(new Date(emissao.atualizadoEm), "dd/MM/yyyy HH:mm")}
                          </p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="sm" className="gap-2" onClick={(event) => { event.stopPropagation(); handleEditarEmissao(emissao); }}>
                            <Edit className="h-4 w-4" /> Editar
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2" onClick={(event) => { event.stopPropagation(); handleBaixarEmissao(emissao); }}>
                            <FileDown className="h-4 w-4" /> Baixar TXT
                          </Button>
                          <Button variant="outline" size="sm" className="gap-2 text-destructive" onClick={(event) => { event.stopPropagation(); handleExcluirEmissao(emissao.id); }}>
                            <Trash2 className="h-4 w-4" /> Excluir
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {emissoesSelecionadas.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <span>{emissoesSelecionadas.length} emissão(ões) selecionada(s).</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setEmissoesSelecionadas([])}>
                  Limpar seleção
                </Button>
                <Button variant="destructive" size="sm" className="gap-2" onClick={handleExcluirSelecionados}>
                  <Trash2 className="h-4 w-4" /> Excluir selecionadas
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
