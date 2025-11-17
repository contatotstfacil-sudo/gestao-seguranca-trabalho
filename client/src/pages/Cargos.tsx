import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Check, X, Search } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";



type CargoFormData = {
  nomeCargo: string;
  descricao: string;
  codigoCbo: string;
  empresaId: string;
};

export default function Cargos({ showLayout = true }: { showLayout?: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedCargo, setExpandedCargo] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formData, setFormData] = useState<CargoFormData>({ nomeCargo: "", descricao: "", codigoCbo: "", empresaId: "" });
  const [treinamentoForm, setTreinamentoForm] = useState({
    cargoId: 0,
    tipoTreinamentoId: 0,
  });
  const [showTreinamentoDialog, setShowTreinamentoDialog] = useState(false);
  const [setorForm, setSetorForm] = useState({
    cargoId: 0,
    setorId: 0,
  });
  const [showSetorDialog, setShowSetorDialog] = useState(false);
  const [riscoForm, setRiscoForm] = useState({
    cargoId: 0,
    riscoOcupacionalId: 0,
    tipoAgente: "",
    descricaoRiscos: "",
    fonteGeradora: "",
    tipo: "",
    meioPropagacao: "",
    meioContato: "",
    possiveisDanosSaude: "",
    tipoAnalise: "",
    valorAnaliseQuantitativa: "",
    gradacaoEfeitos: "",
    gradacaoExposicao: "",
  });
  const [conclusaoItems, setConclusaoItems] = useState<string[]>([]);
  const [novoItemConclusao, setNovoItemConclusao] = useState("");
  const [riscosTemporarios, setRiscosTemporarios] = useState<Array<{
    riscoOcupacionalId: number;
    tipoAgente: string;
    descricaoRiscos: string;
    fonteGeradora: string;
    tipo: string;
    meioPropagacao: string;
    meioContato: string;
    possiveisDanosSaude: string;
    tipoAnalise: string;
    valorAnaliseQuantitativa: string;
    gradacaoEfeitos: string;
    gradacaoExposicao: string;
    nomeRisco?: string;
    tipoRisco?: string;
  }>>([]);
  const [showRiscoDialog, setShowRiscoDialog] = useState(false);
  const [editingRiscoId, setEditingRiscoId] = useState<number | null>(null);
  const [editRiscoForm, setEditRiscoForm] = useState({
    tipoAgente: "",
    descricaoRiscos: "",
    fonteGeradora: "",
    tipo: "",
    meioPropagacao: "",
    meioContato: "",
    possiveisDanosSaude: "",
    tipoAnalise: "",
    valorAnaliseQuantitativa: "",
    gradacaoEfeitos: "",
    gradacaoExposicao: "",
  });

  const utils = trpc.useUtils();
  const { data: cargos = [], isLoading, refetch } = trpc.cargos.list.useQuery();
  const { data: empresas = [], isLoading: isLoadingEmpresas } = trpc.empresas.list.useQuery();
  const [empresaPopoverOpen, setEmpresaPopoverOpen] = useState(false);
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [buscaCargo, setBuscaCargo] = useState("");
  const [empresaFiltroId, setEmpresaFiltroId] = useState<string>("");
  const { data: treinamentosByCargo = [], refetch: refetchTreinamentos } = trpc.cargoTreinamentos.getByCargo.useQuery(
    { cargoId: expandedCargo || 0 },
    { enabled: expandedCargo !== null }
  );
  const { data: setoresByCargo = [], refetch: refetchSetores } = trpc.cargoSetores.getByCargo.useQuery(
    { cargoId: expandedCargo || 0 },
    { enabled: expandedCargo !== null }
  );
  const { data: riscosByCargo = [], refetch: refetchRiscos } = trpc.cargoRiscos.getByCargo.useQuery(
    { cargoId: expandedCargo || 0 },
    { enabled: expandedCargo !== null }
  );
  
  // Obter cargoId atual para edição
  const currentCargoId = expandedCargo || riscoForm.cargoId || 0;
  
  const { data: setores = [] } = trpc.setores.list.useQuery();
  const { data: riscosOcupacionais = [], refetch: refetchRiscosList } = trpc.riscosOcupacionais.list.useQuery();
  const utilsRiscos = trpc.useUtils();

  const createMutation = trpc.cargos.create.useMutation({
    onSuccess: () => {
      toast.success("Cargo criado com sucesso!");
      setFormData({ nomeCargo: "", descricao: "", codigoCbo: "", empresaId: "" });
      setEmpresaSearch("");
      setEmpresaPopoverOpen(false);
      setDialogOpen(false);
      refetch();
      refetchTreinamentos();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar treinamento");
    },
  });

  const updateMutation = trpc.cargos.update.useMutation({
    onSuccess: () => {
      toast.success("Cargo atualizado com sucesso!");
      setFormData({ nomeCargo: "", descricao: "", codigoCbo: "", empresaId: "" });
      setEmpresaSearch("");
      setEmpresaPopoverOpen(false);
      setEditingId(null);
      setDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar cargo");
    },
  });

  const deleteMutation = trpc.cargos.delete.useMutation({
    onSuccess: () => {
      toast.success("Cargo deletado com sucesso!");
      refetch();
      setSelectedIds([]);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar cargo");
    },
  });

  const deleteBatchMutation = trpc.cargos.deleteBatch.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.deletedCount} cargo(s) excluído(s) com sucesso!`);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error("Erro ao excluir cargos: " + error.message);
    },
  });

  const createTreinamentoMutation = trpc.cargoTreinamentos.create.useMutation({
    onSuccess: (data, variables) => {
      console.log("[Cargos] Treinamento adicionado com sucesso, atualizando lista...", data, "cargoId:", variables.cargoId);
      toast.success("Treinamento adicionado com sucesso!");
      setTreinamentoForm({ cargoId: 0, tipoTreinamentoId: 0 });
      setShowTreinamentoDialog(false);
      // Garantir que expandedCargo está definido
      if (variables.cargoId && expandedCargo !== variables.cargoId) {
        setExpandedCargo(variables.cargoId);
      }
      // Invalidar e refetch a query (sem await para evitar problemas de serialização)
      utils.cargoTreinamentos.getByCargo.invalidate({ cargoId: variables.cargoId }).then(() => {
        refetchTreinamentos();
        console.log("[Cargos] Query de treinamentos atualizada");
      });
    },
    onError: (error: any) => {
      console.error("[Cargos] Erro ao adicionar treinamento:", error);
      toast.error(error.message || "Erro ao adicionar treinamento");
    },
  });

  const deleteTreinamentoMutation = trpc.cargoTreinamentos.delete.useMutation({
    onSuccess: () => {
      toast.success("Treinamento removido com sucesso!");
      refetchTreinamentos();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover treinamento");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomeCargo.trim()) {
      toast.error("Nome do cargo é obrigatório");
      return;
    }

    const descricao = formData.descricao?.trim() ?? "";
    const codigoCbo = formData.codigoCbo.trim();
    const empresaIdNumber = Number(formData.empresaId);

    if (!empresaIdNumber || Number.isNaN(empresaIdNumber)) {
      toast.error("Selecione a empresa vinculada ao cargo");
      return;
    }
 
    const payload = {
      nomeCargo: formData.nomeCargo.trim(),
      descricao: descricao.length ? descricao : undefined,
      codigoCbo: codigoCbo.length ? codigoCbo : undefined,
      empresaId: empresaIdNumber,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (cargo: any) => {
    setEditingId(cargo.id);
    setFormData({
      nomeCargo: cargo.nomeCargo,
      descricao: cargo.descricao || "",
      codigoCbo: cargo.codigoCbo || cargo.cbo || "",
      empresaId: cargo.empresaId ? cargo.empresaId.toString() : "",
    });
    setEmpresaSearch("");
    setEmpresaPopoverOpen(false);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este cargo?")) {
      deleteMutation.mutate({ id });
    }
  };

  const { data: tiposTreinamentos = [] } = trpc.tiposTreinamentos.list.useQuery();

  const handleAddTreinamento = (cargoId: number) => {
    setTreinamentoForm({ cargoId, tipoTreinamentoId: 0 });
    setShowTreinamentoDialog(true);
  };

  const handleSubmitTreinamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treinamentoForm.tipoTreinamentoId || treinamentoForm.tipoTreinamentoId === 0) {
      toast.error("Selecione um tipo de treinamento");
      return;
    }
    if (!treinamentoForm.cargoId || treinamentoForm.cargoId === 0) {
      toast.error("Cargo não identificado");
      return;
    }
    console.log("[Cargos] Adicionando treinamento:", treinamentoForm);
    createTreinamentoMutation.mutate(treinamentoForm);
  };

  const handleDeleteTreinamento = (id: number) => {
    if (confirm("Tem certeza que deseja remover este treinamento?")) {
      deleteTreinamentoMutation.mutate({ id });
    }
  };

  const createSetorMutation = trpc.cargoSetores.create.useMutation({
    onSuccess: (data, variables) => {
      console.log("[Cargos] Setor vinculado com sucesso, atualizando lista...", data, "cargoId:", variables.cargoId);
      toast.success("Setor vinculado com sucesso!");
      setSetorForm({ cargoId: 0, setorId: 0 });
      setShowSetorDialog(false);
      // Garantir que expandedCargo está definido
      if (variables.cargoId && expandedCargo !== variables.cargoId) {
        setExpandedCargo(variables.cargoId);
      }
      // Invalidar e refetch a query (sem await para evitar problemas de serialização)
      utils.cargoSetores.getByCargo.invalidate({ cargoId: variables.cargoId }).then(() => {
        refetchSetores();
        console.log("[Cargos] Query de setores atualizada");
      });
    },
    onError: (error: any) => {
      console.error("[Cargos] Erro ao vincular setor:", error);
      toast.error(error.message || "Erro ao vincular setor");
    },
  });

  const deleteSetorMutation = trpc.cargoSetores.delete.useMutation({
    onSuccess: () => {
      toast.success("Setor removido com sucesso!");
      refetchSetores();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover setor");
    },
  });

  const handleAddSetor = (cargoId: number) => {
    setSetorForm({ cargoId, setorId: 0 });
    setShowSetorDialog(true);
  };

  const handleSubmitSetor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setorForm.setorId || setorForm.setorId === 0) {
      toast.error("Selecione um setor");
      return;
    }
    if (!setorForm.cargoId || setorForm.cargoId === 0) {
      toast.error("Cargo não identificado");
      return;
    }
    console.log("[Cargos] Adicionando setor:", setorForm);
    createSetorMutation.mutate(setorForm);
  };

  const handleDeleteSetor = (id: number) => {
    if (confirm("Tem certeza que deseja remover este setor?")) {
      deleteSetorMutation.mutate({ id });
    }
  };

  const createRiscoMutation = trpc.cargoRiscos.create.useMutation({
    onSuccess: (data, variables) => {
      console.log("[Cargos] Risco salvo:", data);
      // Não fazer nada aqui para evitar problemas de serialização
      // A atualização será feita após salvar todos os riscos
    },
    onError: (error: any) => {
      console.error("[Cargos] Erro:", error);
      // Erro será tratado no handleSalvarTodosRiscos
    },
  });

  const createRiscoOcupacionalMutation = trpc.riscosOcupacionais.create.useMutation({
    onSuccess: (data) => {
      console.log("[createRiscoOcupacionalMutation] Risco criado com sucesso, dados retornados:", JSON.stringify(data, null, 2));
      utilsRiscos.riscosOcupacionais.list.invalidate();
    },
    onError: (error: any) => {
      console.error("[createRiscoOcupacionalMutation] Erro ao criar risco ocupacional:", error);
      console.error("[createRiscoOcupacionalMutation] Detalhes:", {
        message: error?.message,
        data: error?.data,
        shape: error?.shape
      });
    },
  });

  const updateRiscoMutation = trpc.cargoRiscos.update.useMutation({
    onSuccess: () => {
      toast.success("Risco ocupacional atualizado com sucesso!");
      refetchRiscos();
      setEditingRiscoId(null);
      setEditRiscoForm({ 
        tipoAgente: "", 
        descricaoRiscos: "",
        fonteGeradora: "",
        tipo: "",
        meioPropagacao: "",
        meioContato: "",
        possiveisDanosSaude: "",
        tipoAnalise: "",
        valorAnaliseQuantitativa: "",
        gradacaoEfeitos: "",
        gradacaoExposicao: "",
      });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar risco ocupacional");
    },
  });

  const deleteRiscoMutation = trpc.cargoRiscos.delete.useMutation({
    onSuccess: () => {
      toast.success("Risco ocupacional removido com sucesso!");
      refetchRiscos();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover risco ocupacional");
    },
  });

  const handleAddRisco = (cargoId: number) => {
    setRiscoForm({ 
      cargoId, 
      riscoOcupacionalId: 0, 
      tipoAgente: "", 
      descricaoRiscos: "",
      fonteGeradora: "",
      tipo: "",
      meioPropagacao: "",
      meioContato: "",
      possiveisDanosSaude: "",
      tipoAnalise: "",
      valorAnaliseQuantitativa: "",
      gradacaoEfeitos: "",
      gradacaoExposicao: "",
    });
    setRiscosTemporarios([]);
    setConclusaoItems([]);
    setNovoItemConclusao("");
    setShowRiscoDialog(true);
  };

  const handleAddConclusaoItem = () => {
    if (novoItemConclusao.trim()) {
      setConclusaoItems([...conclusaoItems, novoItemConclusao.trim()]);
      setNovoItemConclusao("");
    }
  };

  const handleRemoveConclusaoItem = (index: number) => {
    const novosItems = conclusaoItems.filter((_, i) => i !== index);
    setConclusaoItems(novosItems);
  };

  const handleAdicionarRiscoNaLista = () => {
    if (!riscoForm.tipoAgente) {
      toast.error("Selecione o tipo de agente");
      return;
    }
    
    // Converter array de conclusões para JSON string
    const descricaoRiscosFinal = conclusaoItems.length > 0 
      ? JSON.stringify(conclusaoItems) 
      : riscoForm.descricaoRiscos;
    
    setRiscosTemporarios((prev) => [
      ...prev,
      {
        riscoOcupacionalId: 0,
        tipoAgente: riscoForm.tipoAgente,
        descricaoRiscos: descricaoRiscosFinal,
        fonteGeradora: riscoForm.fonteGeradora,
        tipo: riscoForm.tipo,
        meioPropagacao: riscoForm.meioPropagacao,
        meioContato: riscoForm.meioContato,
        possiveisDanosSaude: riscoForm.possiveisDanosSaude,
        tipoAnalise: riscoForm.tipoAnalise,
        valorAnaliseQuantitativa: riscoForm.valorAnaliseQuantitativa,
        gradacaoEfeitos: riscoForm.gradacaoEfeitos,
        gradacaoExposicao: riscoForm.gradacaoExposicao,
        nomeRisco: riscoForm.tipoAgente,
        tipoRisco: "",
      },
    ]);

    // Limpar campos para próximo risco
    setRiscoForm((prev) => ({
      ...prev,
      tipoAgente: "",
      descricaoRiscos: "",
      fonteGeradora: "",
      tipo: "",
      meioPropagacao: "",
      meioContato: "",
      possiveisDanosSaude: "",
      tipoAnalise: "",
      valorAnaliseQuantitativa: "",
      gradacaoEfeitos: "",
      gradacaoExposicao: "",
    }));
    setConclusaoItems([]);
    setNovoItemConclusao("");
  };

  const handleRemoverRiscoTemporario = (index: number) => {
    setRiscosTemporarios((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSalvarTodosRiscos = async () => {
    console.log("[handleSalvarTodosRiscos] Iniciando salvamento de riscos...");
    console.log("[handleSalvarTodosRiscos] riscoForm:", riscoForm);
    console.log("[handleSalvarTodosRiscos] riscosTemporarios:", riscosTemporarios);
    
    if (riscosTemporarios.length === 0) {
      toast.error("Adicione pelo menos um risco antes de salvar");
      return;
    }

    // Validar cargoId ANTES de começar
    if (!riscoForm.cargoId || riscoForm.cargoId <= 0) {
      console.error("[handleSalvarTodosRiscos] ERRO: cargoId inválido:", riscoForm.cargoId);
      toast.error("Erro: Cargo não identificado. Feche o dialog e tente novamente.");
      return;
    }

    const totalRiscos = riscosTemporarios.length;
    let salvos = 0;
    let erros = 0;

    // Buscar ou criar risco ocupacional genérico baseado no tipo de agente
    const criarOuBuscarRisco = async (tipoAgente: string): Promise<number> => {
      console.log(`[CriarRisco] Buscando ou criando risco: ${tipoAgente}`);
      
      // Buscar risco existente com nome igual ao tipo de agente
      let riscoExistente = riscosOcupacionais.find((r: any) => r.nomeRisco === tipoAgente);
      
      // Se não existir, criar um novo risco ocupacional
      if (!riscoExistente) {
        const tipoRiscoMap: { [key: string]: "fisico" | "quimico" | "biologico" | "ergonomico" | "mecanico" } = {
          "Físico": "fisico",
          "Químico": "quimico",
          "Biológico": "biologico",
          "Ergonômico": "ergonomico",
          "Agentes Mecânicos": "mecanico",
        };
        
        console.log(`[CriarRisco] Criando novo risco ocupacional: ${tipoAgente}`);
        console.log(`[CriarRisco] Tipo mapeado: ${tipoRiscoMap[tipoAgente] || "fisico"}`);
        
        try {
          // Usar mutateAsync diretamente para obter a resposta
          const novoRisco = await createRiscoOcupacionalMutation.mutateAsync({
            nomeRisco: tipoAgente,
            tipoRisco: tipoRiscoMap[tipoAgente] || "fisico",
            status: "ativo" as const,
          });
          
          console.log(`[CriarRisco] Risco criado com sucesso. Resposta completa:`, JSON.stringify(novoRisco, null, 2));
          
          // O novoRisco deve conter o ID diretamente
          let riscoId = novoRisco?.id;
          console.log(`[CriarRisco] ID extraído diretamente: ${riscoId}`);
          
          // Se não tiver ID, tentar buscar na lista atualizada
          if (!riscoId || riscoId <= 0) {
            console.log(`[CriarRisco] ID não encontrado na resposta, buscando na lista atualizada...`);
            
            // Invalidar cache e buscar novamente
            await utilsRiscos.riscosOcupacionais.list.invalidate();
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Buscar novamente após criar
            try {
              const riscosAtualizados = await utilsRiscos.riscosOcupacionais.list.fetch();
              console.log(`[CriarRisco] Lista atualizada obtida, total de riscos: ${riscosAtualizados.length}`);
              const novoRiscoEncontrado = riscosAtualizados.find((r: any) => r.nomeRisco === tipoAgente);
              console.log(`[CriarRisco] Risco encontrado na lista:`, novoRiscoEncontrado);
              riscoId = novoRiscoEncontrado?.id;
            } catch (fetchError) {
              console.error(`[CriarRisco] Erro ao buscar lista atualizada:`, fetchError);
            }
          }
          
          console.log(`[CriarRisco] ID final do risco: ${riscoId}`);
          if (!riscoId || riscoId <= 0) {
            throw new Error(`Não foi possível obter o ID do risco criado para "${tipoAgente}". Resposta recebida: ${JSON.stringify(novoRisco)}`);
          }
          
          console.log(`[CriarRisco] Retornando ID: ${riscoId}`);
          return riscoId;
        } catch (error: any) {
          console.error("[CriarRisco] Erro ao criar risco ocupacional:", error);
          console.error("[CriarRisco] Detalhes do erro:", {
            message: error?.message,
            data: error?.data,
            shape: error?.shape
          });
          throw new Error(error?.message || error?.data?.message || `Erro ao criar risco ocupacional "${tipoAgente}"`);
        }
      }
      
      console.log(`[CriarRisco] Risco existente encontrado: ${riscoExistente.id} para "${tipoAgente}"`);
      return riscoExistente.id;
    };

    // Salvar todos os riscos sequencialmente (um por vez para evitar problemas)
    for (const risco of riscosTemporarios) {
      try {
        // Criar ou buscar risco ocupacional
        const riscoId = await criarOuBuscarRisco(risco.tipoAgente);
        
        if (!riscoId || riscoId <= 0) {
          throw new Error(`Não foi possível obter ID do risco para "${risco.tipoAgente}"`);
        }
        
        // Preparar dados de forma simples e direta
        const dataToSave = {
          cargoId: Number(riscoForm.cargoId),
          riscoOcupacionalId: Number(riscoId),
          tipoAgente: risco.tipoAgente?.trim() || null,
          descricaoRiscos: risco.descricaoRiscos?.trim() || null,
          fonteGeradora: risco.fonteGeradora?.trim() || null,
          tipo: risco.tipo?.trim() || null,
          meioPropagacao: risco.meioPropagacao?.trim() || null,
          meioContato: risco.meioContato?.trim() || null,
          possiveisDanosSaude: risco.possiveisDanosSaude?.trim() || null,
          tipoAnalise: risco.tipoAnalise?.trim() || null,
          valorAnaliseQuantitativa: risco.valorAnaliseQuantitativa?.trim() || null,
          gradacaoEfeitos: risco.gradacaoEfeitos?.trim() || null,
          gradacaoExposicao: risco.gradacaoExposicao?.trim() || null,
        };
        
        // Remover campos null/undefined
        Object.keys(dataToSave).forEach(key => {
          if (dataToSave[key as keyof typeof dataToSave] === null || dataToSave[key as keyof typeof dataToSave] === undefined) {
            delete dataToSave[key as keyof typeof dataToSave];
          }
        });
        
        console.log("[Cargos] Salvando risco:", dataToSave);
        
        // Validar dados obrigatórios
        if (!dataToSave.cargoId || dataToSave.cargoId <= 0) {
          throw new Error(`CargoId inválido: ${dataToSave.cargoId}`);
        }
        if (!dataToSave.riscoOcupacionalId || dataToSave.riscoOcupacionalId <= 0) {
          throw new Error(`RiscoOcupacionalId inválido: ${dataToSave.riscoOcupacionalId}`);
        }
        
        // Salvar usando mutateAsync
        await createRiscoMutation.mutateAsync(dataToSave);
        salvos++;
        console.log(`[Cargos] Risco ${salvos}/${totalRiscos} salvo: ${risco.tipoAgente}`);
      } catch (error: any) {
        console.error(`[Cargos] Erro ao salvar risco "${risco.tipoAgente}":`, error);
        erros++;
        const errorMsg = error?.message || error?.data?.message || String(error);
        toast.error(`Erro ao salvar "${risco.tipoAgente}": ${errorMsg}`);
      }
    }

    // Atualizar lista de riscos após salvar todos
    if (riscoForm.cargoId) {
      // Garantir que expandedCargo está definido
      if (expandedCargo !== riscoForm.cargoId) {
        setExpandedCargo(riscoForm.cargoId);
      }
      // Invalidar e refetch sem await para evitar problemas de serialização
      utils.cargoRiscos.getByCargo.invalidate({ cargoId: riscoForm.cargoId }).then(() => {
        refetchRiscos();
        console.log("[Cargos] Query de riscos atualizada após salvar todos");
      });
    }

    // Verificar se todos foram salvos
    if (erros > 0) {
      toast.warning(`${salvos} risco(s) salvos, ${erros} erro(s) ao salvar`);
    } else {
      toast.success(`${salvos} risco(s) ocupacional(is) adicionado(s) com sucesso`);
    }

    // Limpar formulário e fechar dialog apenas se pelo menos um foi salvo
    if (salvos > 0) {
      setRiscoForm({ 
        cargoId: 0, 
        riscoOcupacionalId: 0, 
        tipoAgente: "", 
        descricaoRiscos: "",
        fonteGeradora: "",
        tipo: "",
        meioPropagacao: "",
        meioContato: "",
        possiveisDanosSaude: "",
        tipoAnalise: "",
        valorAnaliseQuantitativa: "",
        gradacaoEfeitos: "",
        gradacaoExposicao: "",
      });
      setRiscosTemporarios([]);
      setShowRiscoDialog(false);
      refetchRiscos();
    }
  };

  const handleEditRisco = (risco: any) => {
    setEditingRiscoId(risco.id);
    
    // Tentar parsear descricaoRiscos como JSON (array de conclusões)
    let conclusoesArray: string[] = [];
    if (risco.descricaoRiscos) {
      try {
        const parsed = JSON.parse(risco.descricaoRiscos);
        if (Array.isArray(parsed)) {
          conclusoesArray = parsed;
        }
      } catch {
        // Se não for JSON válido, manter como string vazia (formato antigo)
        conclusoesArray = [];
      }
    }
    
    setConclusaoItems(conclusoesArray);
    setEditRiscoForm({
      tipoAgente: risco.tipoAgente || "",
      descricaoRiscos: risco.descricaoRiscos || "",
      fonteGeradora: risco.fonteGeradora || "",
      tipo: risco.tipo || "",
      meioPropagacao: risco.meioPropagacao || "",
      meioContato: risco.meioContato || "",
      possiveisDanosSaude: risco.possiveisDanosSaude || "",
      tipoAnalise: risco.tipoAnalise || "",
      valorAnaliseQuantitativa: risco.valorAnaliseQuantitativa || "",
      gradacaoEfeitos: risco.gradacaoEfeitos || "",
      gradacaoExposicao: risco.gradacaoExposicao || "",
    });
  };

  const handleSaveEditRisco = (cargoId: number) => {
    if (!editingRiscoId) return;
    
    if (!editRiscoForm.tipoAgente.trim()) {
      toast.error("O tipo de agente é obrigatório");
      return;
    }

    // Converter array de conclusões para JSON string
    const descricaoRiscosFinal = conclusaoItems.length > 0 
      ? JSON.stringify(conclusaoItems) 
      : editRiscoForm.descricaoRiscos.trim() || undefined;

    updateRiscoMutation.mutate({
      id: editingRiscoId,
      cargoId,
      tipoAgente: editRiscoForm.tipoAgente.trim(),
      descricaoRiscos: descricaoRiscosFinal,
      fonteGeradora: editRiscoForm.fonteGeradora.trim() || undefined,
      tipo: editRiscoForm.tipo.trim() || undefined,
      meioPropagacao: editRiscoForm.meioPropagacao.trim() || undefined,
      meioContato: editRiscoForm.meioContato.trim() || undefined,
      possiveisDanosSaude: editRiscoForm.possiveisDanosSaude.trim() || undefined,
      tipoAnalise: editRiscoForm.tipoAnalise.trim() || undefined,
      valorAnaliseQuantitativa: editRiscoForm.valorAnaliseQuantitativa.trim() || undefined,
      gradacaoEfeitos: editRiscoForm.gradacaoEfeitos.trim() || undefined,
      gradacaoExposicao: editRiscoForm.gradacaoExposicao.trim() || undefined,
    });
  };

  const handleCancelEditRisco = () => {
    setEditingRiscoId(null);
    setConclusaoItems([]);
    setNovoItemConclusao("");
    setEditRiscoForm({ 
      tipoAgente: "", 
      descricaoRiscos: "",
      fonteGeradora: "",
      tipo: "",
      meioPropagacao: "",
      meioContato: "",
      possiveisDanosSaude: "",
      tipoAnalise: "",
      valorAnaliseQuantitativa: "",
      gradacaoEfeitos: "",
      gradacaoExposicao: "",
    });
  };

  const handleDeleteRisco = (id: number) => {
    if (confirm("Tem certeza que deseja remover este risco ocupacional?")) {
      deleteRiscoMutation.mutate({ id });
    }
  };

  const getTipoRiscoLabel = (tipo: string) => {
    const labels: { [key: string]: string } = {
      fisico: "Físico",
      quimico: "Químico",
      biologico: "Biológico",
      ergonomico: "Ergonômico",
      mecanico: "Mecânico",
    };
    return labels[tipo] || tipo;
  };

  const empresasMap = useMemo(() => {
    const map: Map<string, string> = new Map();
    empresas.forEach((empresa: any) => {
      map.set(empresa.id.toString(), empresa.nomeFantasia || empresa.razaoSocial || `Empresa #${empresa.id}`);
    });
    return map;
  }, [empresas]);

  const firstEmpresaId = useMemo(() => {
    const primeira = empresas[0];
    return primeira?.id ? primeira.id.toString() : "";
  }, [empresas]);

  const empresaSelecionadaNome = useMemo(() => {
    if (!formData.empresaId) return "";
    return empresasMap.get(formData.empresaId) ?? "";
  }, [formData.empresaId, empresasMap]);

  const normalizarTexto = (valor: string) =>
    valor
      ?.toString()
      .normalize("NFD")
      .replace(/[^\w\s-]/g, "")
      .toLowerCase() ?? "";

  const removerEspacos = (valor: string) => valor.replace(/\s+/g, "");

  const correspondeSubsequencia = (alvo: string, consulta: string) => {
    if (!consulta) return true;
    let indiceConsulta = 0;
    for (let i = 0; i < alvo.length && indiceConsulta < consulta.length; i++) {
      if (alvo[i] === consulta[indiceConsulta]) {
        indiceConsulta++;
      }
    }
    return indiceConsulta === consulta.length;
  };

  const empresasOptions = useMemo(() => {
    return empresas.map((empresa: any) => {
      const id = empresa.id?.toString?.();
      if (!id) return null;
      const rawCnpj = empresa.cnpj ?? "";
      const cnpj = typeof rawCnpj === "string" ? rawCnpj : rawCnpj ? String(rawCnpj) : "";
      return {
        id,
        nome:
          empresa.nomeFantasia?.trim() ||
          empresa.razaoSocial?.trim() ||
          `Empresa #${id}`,
        cnpj,
      };
    }).filter(Boolean) as Array<{ id: string; nome: string; cnpj: string }>;
  }, [empresas]);

  const empresasFiltradas = useMemo(() => {
    const termoNormalizado = removerEspacos(normalizarTexto(empresaSearch).trim());
    if (!termoNormalizado) return empresasOptions;

    return empresasOptions.filter((empresa) => {
      const nomeNormalizado = removerEspacos(normalizarTexto(empresa.nome));
      return nomeNormalizado.includes(termoNormalizado) ||
        correspondeSubsequencia(nomeNormalizado, termoNormalizado);
    });
  }, [empresaSearch, empresasOptions]);

  const cargosFiltrados = useMemo(() => {
    const termo = removerEspacos(normalizarTexto(buscaCargo));
    const filtroEmpresaNormalizado = empresaFiltroId && empresaFiltroId !== "__all__" ? empresaFiltroId : "";
    return cargos.filter((cargo: any) => {
      const empresaIdMatch = !filtroEmpresaNormalizado || cargo.empresaId?.toString?.() === filtroEmpresaNormalizado;

      if (!empresaIdMatch) return false;

      if (!termo) return true;

      const nomeCargoNormalizado = removerEspacos(normalizarTexto(cargo.nomeCargo || ""));
      const descricaoNormalizada = removerEspacos(normalizarTexto(cargo.descricao || ""));
      const cbo = (cargo.codigoCbo || cargo.cbo || "").toString().toLowerCase();

      return (
        nomeCargoNormalizado.includes(termo) ||
        descricaoNormalizada.includes(termo) ||
        cbo.includes(termo)
      );
    });
  }, [buscaCargo, cargos, empresaFiltroId]);

  const totalCargosFiltrados = cargosFiltrados.length;
  const totalCargos = cargos.length;
  const totalEmpresas = useMemo(() => {
    const set = new Set<string>();
    cargos.forEach((cargo: any) => {
      if (cargo.empresaId) {
        set.add(cargo.empresaId.toString());
      }
    });
    return set.size;
  }, [cargos]);

  const totalSemSetor = useMemo(() => {
    return cargosFiltrados.filter((cargo: any) => {
      if (Array.isArray(cargo.setores) && cargo.setores.length > 0) return false;
      if (typeof cargo.setoresQuantidade === "number" && cargo.setoresQuantidade > 0) return false;
      return true;
    }).length;
  }, [cargosFiltrados]);

  // Limpar seleção quando os filtros mudarem
  useEffect(() => {
    setSelectedIds([]);
  }, [buscaCargo, empresaFiltroId]);

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((selectedId) => selectedId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.length === cargosFiltrados.length && cargosFiltrados.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(cargosFiltrados.map((cargo: any) => cargo.id));
    }
  };

  const handleDeleteBatch = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um cargo para excluir");
      return;
    }

    const cargosSelecionados = cargosFiltrados.filter((cargo: any) => selectedIds.includes(cargo.id));
    const nomesCargos = cargosSelecionados.map((cargo: any) => cargo.nomeCargo || `Cargo #${cargo.id}`).join(", ");

    if (confirm(`Tem certeza que deseja excluir ${selectedIds.length} cargo(s)?\n\nCargos: ${nomesCargos.substring(0, 200)}${nomesCargos.length > 200 ? "..." : ""}`)) {
      deleteBatchMutation.mutate({ ids: selectedIds });
    }
  };

  useEffect(() => {
    if (!editingId && firstEmpresaId && empresas.length > 0 && empresasMap.size > 0) {
      if (formData.empresaId && !empresasMap.has(formData.empresaId)) {
        setFormData((prev) => ({ ...prev, empresaId: "" }));
      }
    }
  }, [editingId, firstEmpresaId, formData.empresaId, empresas, empresasMap]);

  if (isLoading) return <div>Carregando...</div>;

  const content = (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Cargos</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingId(null);
                  setFormData({ nomeCargo: "", descricao: "", codigoCbo: "", empresaId: "" });
                  setEmpresaSearch("");
                  setEmpresaPopoverOpen(false);
                }}
              >
                <Plus className="mr-2 h-4 w-4" /> Novo Cargo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nomeCargo">Nome do Cargo</Label>
                  <Input
                    id="nomeCargo"
                    value={formData.nomeCargo}
                    onChange={(e) => setFormData({ ...formData, nomeCargo: e.target.value })}
                    placeholder="Ex: Eletricista"
                  />
                </div>
                <div>
                  <Label htmlFor="codigoCbo">Código CBO</Label>
                  <Input
                    id="codigoCbo"
                    value={formData.codigoCbo}
                    onChange={(e) => setFormData({ ...formData, codigoCbo: e.target.value })}
                    placeholder="Ex: 7156-10"
                    maxLength={20}
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do cargo"
                  />
                </div>
                <div>
                  <Label htmlFor="empresaId">Empresa</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="empresaId"
                      readOnly
                      value={empresaSelecionadaNome}
                      placeholder={isLoadingEmpresas ? "Carregando empresas..." : "Selecione a empresa"}
                      className="bg-muted/40"
                    />
                    <Popover open={empresaPopoverOpen} onOpenChange={setEmpresaPopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                          disabled={isLoadingEmpresas || empresasOptions.length === 0}
                        >
                          <Search className="h-4 w-4" />
                          <span className="sr-only">Pesquisar empresa</span>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[24rem]" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Buscar por nome ou CNPJ"
                            value={empresaSearch}
                            onValueChange={setEmpresaSearch}
                            autoFocus
                          />
                          <CommandList>
                            <CommandEmpty>
                              {isLoadingEmpresas
                                ? "Carregando empresas..."
                                : "Nenhuma empresa encontrada."}
                            </CommandEmpty>
                            <CommandGroup>
                              {empresasFiltradas.map((empresa) => (
                                <CommandItem
                                  key={empresa.id}
                                  value={empresa.nome}
                                  onSelect={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      empresaId: empresa.id,
                                    }));
                                    setEmpresaPopoverOpen(false);
                                    setEmpresaSearch("");
                                  }}
                                >
                                  <div>
                                    <p className="font-medium leading-tight">{empresa.nome}</p>
                                    {empresa.cnpj && (
                                      <p className="text-xs text-muted-foreground">CNPJ: {empresa.cnpj}</p>
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
                  {empresasOptions.length === 0 && !isLoadingEmpresas && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Cadastre uma empresa para vincular cargos.
                    </p>
                  )}
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Atualizar" : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de cargos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalCargos}</p>
              <p className="text-xs text-muted-foreground">{totalCargosFiltrados !== totalCargos ? `${totalCargosFiltrados} exibidos com filtros` : "Todos os cargos cadastrados"}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Empresas atendidas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalEmpresas}</p>
              <p className="text-xs text-muted-foreground">Distribuição de cargos por empresa</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Cargos sem setor vinculado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalSemSetor}</p>
              <p className="text-xs text-muted-foreground">Acompanhe para garantir o vínculo correto</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Busca ativa</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">Resultados atualizados conforme filtros abaixo.</p>
              <Button variant="outline" size="sm" className="self-start" onClick={() => {
                setBuscaCargo("");
                setEmpresaFiltroId("");
              }}>Limpar filtros</Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros rápidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="busca-cargo">Buscar cargo ou CBO</Label>
                <Input
                  id="busca-cargo"
                  value={buscaCargo}
                  onChange={(event) => setBuscaCargo(event.target.value)}
                  placeholder="Ex: segurança, 7156, supervisor..."
                />
              </div>
              <div className="space-y-1">
                <Label>Empresa</Label>
                <Select value={empresaFiltroId || "__all__"} onValueChange={(valor) => setEmpresaFiltroId(valor === "__all__" ? "" : valor)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {empresasOptions.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id || "__none__"}>
                        {empresa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status dos filtros</Label>
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  {empresaFiltroId && empresaFiltroId !== "__all__"
                    ? `Filtrando cargos da empresa ${(empresasMap.get(empresaFiltroId) ?? "")}`
                    : "Mostrando cargos de todas as empresas"}
                  <br />
                  {buscaCargo ? `Busca ativa: “${buscaCargo}”` : "Sem busca textual"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
 
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Cargos</CardTitle>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteBatch}
                  disabled={deleteBatchMutation.isPending}
                >
                  {deleteBatchMutation.isPending ? "Excluindo..." : `Excluir ${selectedIds.length} selecionado(s)`}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cargosFiltrados.length > 0 && (
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Checkbox
                    checked={selectedIds.length === cargosFiltrados.length && cargosFiltrados.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm text-muted-foreground">
                    Selecionar todos ({selectedIds.length}/{cargosFiltrados.length})
                  </span>
                </div>
              )}
              {cargosFiltrados.map((cargo: any) => {
                const empresaNome = cargo.empresaId ? empresasMap.get(cargo.empresaId.toString()) : undefined;
                return (
                  <React.Fragment key={cargo.id}>
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3 flex-1">
                          <Checkbox
                            checked={selectedIds.includes(cargo.id)}
                            onCheckedChange={() => handleToggleSelect(cargo.id)}
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="font-semibold text-lg">{cargo.nomeCargo}</h3>
                              {(cargo.codigoCbo || cargo.cbo) && (
                                <Badge variant="secondary">CBO {cargo.codigoCbo || cargo.cbo}</Badge>
                              )}
                              {empresaNome && (
                                <Badge>{empresaNome}</Badge>
                              )}
                            </div>
                            {cargo.descricao && (
                              <p className="text-sm text-muted-foreground mt-2">{cargo.descricao}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setExpandedCargo(expandedCargo === cargo.id ? null : cargo.id)}
                          >
                            {expandedCargo === cargo.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(cargo)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(cargo.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {expandedCargo === cargo.id && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Treinamentos Obrigatórios</h4>
                            <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddTreinamento(cargo.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Adicionar
                            </Button>
                            <Dialog open={showTreinamentoDialog && treinamentoForm.cargoId === cargo.id} onOpenChange={setShowTreinamentoDialog}>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adicionar Treinamento Obrigatório</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleSubmitTreinamento} className="space-y-4">
                                <div>
                                  <Label htmlFor="tipoTreinamento">Tipo de Treinamento</Label>
                                  <select
                                    id="tipoTreinamento"
                                    value={treinamentoForm.tipoTreinamentoId.toString()}
                                    onChange={(e) => setTreinamentoForm({ ...treinamentoForm, tipoTreinamentoId: parseInt(e.target.value) })}
                                    className="w-full border rounded px-3 py-2"
                                  >
                                    <option value="0">Selecione um tipo</option>
                                    {tiposTreinamentos.map((tipo: any) => (
                                      <option key={tipo.id} value={tipo.id.toString()}>
                                        {tipo.nomeTreinamento}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <Button type="submit" className="w-full">
                                  Adicionar
                                </Button>
                              </form>
                            </DialogContent>
                            </Dialog>
                          </>
                        </div>

                        {Array.isArray(treinamentosByCargo) && treinamentosByCargo.length > 0 ? (
                          <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Tipo de Treinamento</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {treinamentosByCargo.map((t: any) => (
                                <TableRow key={t.id}>
                                  <TableCell>{t.tipoNr}</TableCell>
                                  <TableCell>{t.nomeTreinamento}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteTreinamento(t.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-gray-500">Nenhum treinamento obrigatório cadastrado</p>
                        )}
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Setores Vinculados</h4>
                            <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddSetor(cargo.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Adicionar
                            </Button>
                            <Dialog open={showSetorDialog && setorForm.cargoId === cargo.id} onOpenChange={setShowSetorDialog}>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Vincular Setor ao Cargo</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleSubmitSetor} className="space-y-4">
                                <div>
                                  <Label htmlFor="setor">Setor</Label>
                                  <select
                                    id="setor"
                                    value={setorForm.setorId.toString()}
                                    onChange={(e) => setSetorForm({ ...setorForm, setorId: parseInt(e.target.value) })}
                                    className="w-full border rounded px-3 py-2"
                                  >
                                    <option value="0">Selecione um setor</option>
                                    {setores.map((setor: any) => (
                                      <option key={setor.id} value={setor.id.toString()}>
                                        {setor.nomeSetor}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <Button type="submit" className="w-full">
                                  Vincular
                                </Button>
                              </form>
                            </DialogContent>
                            </Dialog>
                          </>
                        </div>

                        {Array.isArray(setoresByCargo) && setoresByCargo.length > 0 ? (
                          <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Nome do Setor</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {setoresByCargo.map((s: any) => (
                                <TableRow key={s.id}>
                                  <TableCell>{s.nomeSetor}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteSetor(s.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-gray-500">Nenhum setor vinculado</p>
                        )}
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-semibold">Riscos Ocupacionais</h4>
                            <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddRisco(cargo.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Adicionar
                            </Button>
                            <Dialog open={showRiscoDialog && riscoForm.cargoId === cargo.id} onOpenChange={setShowRiscoDialog}>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Adicionar Riscos Ocupacionais</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Formulário para adicionar riscos */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Novo Risco</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="tipoAgente">Tipo de Agente *</Label>
                                        <select
                                          id="tipoAgente"
                                          value={riscoForm.tipoAgente}
                                          onChange={(e) => setRiscoForm({ ...riscoForm, tipoAgente: e.target.value })}
                                          className="w-full border rounded-md px-3 py-2 h-10"
                                        >
                                          <option value="">Selecione o tipo de agente</option>
                                          <option value="Físico">Físico</option>
                                          <option value="Químico">Químico</option>
                                          <option value="Biológico">Biológico</option>
                                          <option value="Ergonômico">Ergonômico</option>
                                          <option value="Agentes Mecânicos">Agentes Mecânicos</option>
                                        </select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="tipo">Tipo</Label>
                                        <Input
                                          id="tipo"
                                          value={riscoForm.tipo}
                                          onChange={(e) => setRiscoForm({ ...riscoForm, tipo: e.target.value })}
                                          placeholder="Tipo do risco"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="fonteGeradora">Fonte Geradora</Label>
                                        <Input
                                          id="fonteGeradora"
                                          value={riscoForm.fonteGeradora}
                                          onChange={(e) => setRiscoForm({ ...riscoForm, fonteGeradora: e.target.value })}
                                          placeholder="Ex: Lixadeiras, marteletes, etc."
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="meioPropagacao">Meio de Propagação</Label>
                                        <Input
                                          id="meioPropagacao"
                                          value={riscoForm.meioPropagacao}
                                          onChange={(e) => setRiscoForm({ ...riscoForm, meioPropagacao: e.target.value })}
                                          placeholder="Como o risco se propaga"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="meioContato">Meio de Contato</Label>
                                        <Input
                                          id="meioContato"
                                          value={riscoForm.meioContato}
                                          onChange={(e) => setRiscoForm({ ...riscoForm, meioContato: e.target.value })}
                                          placeholder="Como o trabalhador entra em contato"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="tipoAnalise">Tipo de Análise</Label>
                                        <select
                                          id="tipoAnalise"
                                          value={riscoForm.tipoAnalise}
                                          onChange={(e) => {
                                            setRiscoForm({ 
                                              ...riscoForm, 
                                              tipoAnalise: e.target.value,
                                              // Limpa o valor se mudar para Qualitativa
                                              valorAnaliseQuantitativa: e.target.value === "Quantitativa" ? riscoForm.valorAnaliseQuantitativa : ""
                                            });
                                          }}
                                          className="w-full border rounded-md px-3 py-2 h-10"
                                        >
                                          <option value="">Selecione</option>
                                          <option value="Qualitativa">Qualitativa</option>
                                          <option value="Quantitativa">Quantitativa</option>
                                        </select>
                                      </div>
                                    </div>
                                    {riscoForm.tipoAnalise === "Quantitativa" && (
                                      <div className="space-y-2">
                                        <Label htmlFor="valorAnaliseQuantitativa">Valor da Análise Quantitativa *</Label>
                                        <Input
                                          id="valorAnaliseQuantitativa"
                                          value={riscoForm.valorAnaliseQuantitativa}
                                          onChange={(e) => setRiscoForm({ ...riscoForm, valorAnaliseQuantitativa: e.target.value })}
                                          placeholder="Ex: 88 (dB) Trabalhos esporádicos"
                                          className="w-full"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                          Informe o valor da medição e descrição (ex: "90 (dB) Trabalhos esporádicos")
                                        </p>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="gradacaoEfeitos">Gradação - Efeitos</Label>
                                        <Input
                                          id="gradacaoEfeitos"
                                          value={riscoForm.gradacaoEfeitos}
                                          onChange={(e) => setRiscoForm({ ...riscoForm, gradacaoEfeitos: e.target.value })}
                                          placeholder="Ex: Baixo, Médio, Alto"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="gradacaoExposicao">Gradação - Exposição</Label>
                                        <Input
                                          id="gradacaoExposicao"
                                          value={riscoForm.gradacaoExposicao}
                                          onChange={(e) => setRiscoForm({ ...riscoForm, gradacaoExposicao: e.target.value })}
                                          placeholder="Ex: Baixo, Médio, Alto"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="possiveisDanosSaude">Possíveis Danos à Saúde</Label>
                                      <Textarea
                                        id="possiveisDanosSaude"
                                        value={riscoForm.possiveisDanosSaude}
                                        onChange={(e) => setRiscoForm({ ...riscoForm, possiveisDanosSaude: e.target.value })}
                                        placeholder="Descreva os possíveis danos à saúde..."
                                        rows={3}
                                        className="w-full"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Conclusão</Label>
                                      <div className="border rounded-lg p-4 space-y-3 mt-1.5 bg-gray-50/50">
                                        <div className="flex gap-2">
                                          <Input
                                            value={novoItemConclusao}
                                            onChange={(e) => setNovoItemConclusao(e.target.value)}
                                            placeholder="Digite um item da conclusão"
                                            onKeyPress={(e) => {
                                              if (e.key === "Enter") {
                                                e.preventDefault();
                                                handleAddConclusaoItem();
                                              }
                                            }}
                                            className="flex-1"
                                          />
                                          <Button type="button" onClick={handleAddConclusaoItem} size="sm">
                                            Adicionar
                                          </Button>
                                        </div>
                                        {conclusaoItems.length > 0 && (
                                          <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {conclusaoItems.map((item, index) => (
                                              <div key={index} className="flex items-center justify-between bg-white p-2.5 rounded-md border">
                                                <span className="text-sm">
                                                  <span className="font-medium text-muted-foreground mr-2">
                                                    {String.fromCharCode(97 + index)})
                                                  </span>
                                                  {item}
                                                </span>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleRemoveConclusaoItem(index)}
                                                  className="h-7 w-7 p-0"
                                                >
                                                  <X className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                        {conclusaoItems.length === 0 && (
                                          <p className="text-xs text-muted-foreground text-center py-3">
                                            Nenhum item adicionado. Digite e clique em "Adicionar" para incluir itens.
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex justify-end">
                                      <Button
                                        type="button"
                                        onClick={handleAdicionarRiscoNaLista}
                                        disabled={!riscoForm.tipoAgente}
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar à Lista
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Lista de riscos adicionados */}
                                {riscosTemporarios.length > 0 && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">
                                        Riscos Adicionados ({riscosTemporarios.length})
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {riscosTemporarios.map((risco, index) => (
                                          <div
                                            key={index}
                                            className="p-3 border rounded-lg flex items-start justify-between hover:bg-gray-50 transition-colors"
                                          >
                                            <div className="flex-1 space-y-1">
                                              <div className="font-medium text-sm">
                                                <span className="text-gray-500">Tipo de Agente:</span>{" "}
                                                <span className="text-foreground">{risco.tipoAgente}</span>
                                              </div>
                                              {risco.fonteGeradora && (
                                                <div className="text-xs text-gray-600">
                                                  <span className="text-gray-500">Fonte:</span> {risco.fonteGeradora}
                                                </div>
                                              )}
                                              {risco.possiveisDanosSaude && (
                                                <div className="text-xs text-gray-600">
                                                  <span className="text-gray-500">Danos:</span> {risco.possiveisDanosSaude.substring(0, 100)}{risco.possiveisDanosSaude.length > 100 ? "..." : ""}
                                                </div>
                                              )}
                                              {risco.descricaoRiscos && (() => {
                                                // Tentar parsear como JSON (array de conclusões)
                                                let conclusoesArray: string[] = [];
                                                try {
                                                  const parsed = JSON.parse(risco.descricaoRiscos);
                                                  if (Array.isArray(parsed)) {
                                                    conclusoesArray = parsed;
                                                  }
                                                } catch {
                                                  // Se não for JSON, tratar como string simples (formato antigo)
                                                }
                                                
                                                if (conclusoesArray.length > 0) {
                                                  return (
                                                    <div className="text-xs text-gray-600 space-y-1">
                                                      <span className="text-gray-500 font-medium">Conclusão:</span>
                                                      <ul className="list-disc list-inside ml-2 space-y-0.5">
                                                        {conclusoesArray.slice(0, 3).map((item, idx) => (
                                                          <li key={idx}>{item.length > 80 ? item.substring(0, 80) + "..." : item}</li>
                                                        ))}
                                                        {conclusoesArray.length > 3 && (
                                                          <li className="text-gray-400 italic">... e mais {conclusoesArray.length - 3} item(ns)</li>
                                                        )}
                                                      </ul>
                                                    </div>
                                                  );
                                                } else {
                                                  // Formato antigo (string simples)
                                                  return (
                                                    <div className="text-xs text-gray-600">
                                                      <span className="text-gray-500">Conclusão:</span> {risco.descricaoRiscos.substring(0, 100)}{risco.descricaoRiscos.length > 100 ? "..." : ""}
                                                    </div>
                                                  );
                                                }
                                              })()}
                                            </div>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleRemoverRiscoTemporario(index)}
                                              className="ml-4"
                                            >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Legenda de Gradação */}
                                <Card className="bg-gray-50">
                                  <CardHeader>
                                    <CardTitle className="text-sm font-semibold">Legenda de Gradação</CardTitle>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                      {/* Gradação Efeitos à Saúde */}
                                      <div>
                                        <h5 className="font-semibold mb-2 text-sm">Gradação Efeitos à Saúde</h5>
                                        <div className="space-y-1">
                                          <div><span className="font-medium">00:</span> Efeitos reversíveis e pequenos</div>
                                          <div><span className="font-medium">01:</span> Efeitos reversíveis à saúde, preocupante</div>
                                          <div><span className="font-medium">02:</span> Efeitos severos à saúde, preocupante</div>
                                          <div><span className="font-medium">03:</span> Efeitos irreversíveis à saúde, preocupante</div>
                                          <div><span className="font-medium">04:</span> Ameaça à vida, lesão incapacitante ocupacional</div>
                                        </div>
                                      </div>
                                      {/* Gradação Qualitativa de Exposição */}
                                      <div>
                                        <h5 className="font-semibold mb-2 text-sm">Gradação Qualitativa de Exposição</h5>
                                        <div className="space-y-1">
                                          <div><span className="font-medium">00:</span> Nenhum contato com o agente ou desprezível</div>
                                          <div><span className="font-medium">01:</span> Contatos esporádicos com o agente</div>
                                          <div><span className="font-medium">02:</span> Contato frequente c/ o agente à baixa concentração</div>
                                          <div><span className="font-medium">03:</span> Contato frequente c/ o agente a altas concentrações</div>
                                          <div><span className="font-medium">04:</span> Contato frequente à altíssima concentração</div>
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Botões de ação */}
                                <div className="flex gap-3 justify-end pt-4 border-t">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setShowRiscoDialog(false);
                                      setRiscosTemporarios([]);
                                      setConclusaoItems([]);
                                      setNovoItemConclusao("");
                                      setRiscoForm({ 
                                        cargoId: 0, 
                                        riscoOcupacionalId: 0, 
                                        tipoAgente: "", 
                                        descricaoRiscos: "",
                                        fonteGeradora: "",
                                        tipo: "",
                                        meioPropagacao: "",
                                        meioContato: "",
                                        possiveisDanosSaude: "",
                                        tipoAnalise: "",
                                        valorAnaliseQuantitativa: "",
                                        gradacaoEfeitos: "",
                                        gradacaoExposicao: "",
                                      });
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={handleSalvarTodosRiscos}
                                    disabled={riscosTemporarios.length === 0 || createRiscoMutation.isPending}
                                  >
                                    {createRiscoMutation.isPending ? (
                                      "Salvando..."
                                    ) : (
                                      <>
                                        Salvar {riscosTemporarios.length > 0 && `(${riscosTemporarios.length})`}
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          </>
                        </div>

                        {Array.isArray(riscosByCargo) && riscosByCargo.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="min-w-[120px]">AGENTES</TableHead>
                                  <TableHead className="min-w-[150px]">FONTE GERADORA</TableHead>
                                  <TableHead className="min-w-[100px]">TIPO</TableHead>
                                  <TableHead className="min-w-[150px]">MEIO DE PROPAGAÇÃO</TableHead>
                                  <TableHead className="min-w-[150px]">MEIO DE CONTATO</TableHead>
                                  <TableHead className="min-w-[200px]">POSSÍVEIS DANOS À SAÚDE</TableHead>
                                  <TableHead className="min-w-[120px]">TIPO ANÁLISE</TableHead>
                                  <TableHead className="min-w-[200px]">VALOR ANÁLISE</TableHead>
                                  <TableHead className="min-w-[100px]">EFEITOS</TableHead>
                                  <TableHead className="min-w-[100px]">EXPOSIÇÃO</TableHead>
                                  <TableHead className="min-w-[80px]">Ações</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {riscosByCargo.map((r: any) => (
                                  <TableRow key={r.id}>
                                    {editingRiscoId === r.id ? (
                                      <>
                                        <TableCell>
                                          <select
                                            value={editRiscoForm.tipoAgente}
                                            onChange={(e) => setEditRiscoForm({ ...editRiscoForm, tipoAgente: e.target.value })}
                                            className="w-full border rounded-md px-2 py-1 h-8 text-sm"
                                          >
                                            <option value="">Selecione o tipo de agente</option>
                                            <option value="Físico">Físico</option>
                                            <option value="Químico">Químico</option>
                                            <option value="Biológico">Biológico</option>
                                            <option value="Ergonômico">Ergonômico</option>
                                            <option value="Agentes Mecânicos">Agentes Mecânicos</option>
                                          </select>
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            value={editRiscoForm.fonteGeradora}
                                            onChange={(e) => setEditRiscoForm({ ...editRiscoForm, fonteGeradora: e.target.value })}
                                            placeholder="Fonte geradora"
                                            className="w-full text-sm h-8"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            value={editRiscoForm.tipo}
                                            onChange={(e) => setEditRiscoForm({ ...editRiscoForm, tipo: e.target.value })}
                                            placeholder="Tipo"
                                            className="w-full text-sm h-8"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            value={editRiscoForm.meioPropagacao}
                                            onChange={(e) => setEditRiscoForm({ ...editRiscoForm, meioPropagacao: e.target.value })}
                                            placeholder="Meio de propagação"
                                            className="w-full text-sm h-8"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            value={editRiscoForm.meioContato}
                                            onChange={(e) => setEditRiscoForm({ ...editRiscoForm, meioContato: e.target.value })}
                                            placeholder="Meio de contato"
                                            className="w-full text-sm h-8"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Textarea
                                            value={editRiscoForm.possiveisDanosSaude}
                                            onChange={(e) => setEditRiscoForm({ ...editRiscoForm, possiveisDanosSaude: e.target.value })}
                                            placeholder="Danos à saúde"
                                            rows={2}
                                            className="w-full text-sm"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <select
                                            value={editRiscoForm.tipoAnalise}
                                            onChange={(e) => {
                                              setEditRiscoForm({ 
                                                ...editRiscoForm, 
                                                tipoAnalise: e.target.value,
                                                valorAnaliseQuantitativa: e.target.value === "Quantitativa" ? editRiscoForm.valorAnaliseQuantitativa : ""
                                              });
                                            }}
                                            className="w-full border rounded-md px-2 py-1 h-8 text-sm"
                                          >
                                            <option value="">Selecione</option>
                                            <option value="Qualitativa">Qualitativa</option>
                                            <option value="Quantitativa">Quantitativa</option>
                                          </select>
                                        </TableCell>
                                        <TableCell>
                                          {editRiscoForm.tipoAnalise === "Quantitativa" ? (
                                            <Input
                                              value={editRiscoForm.valorAnaliseQuantitativa}
                                              onChange={(e) => setEditRiscoForm({ ...editRiscoForm, valorAnaliseQuantitativa: e.target.value })}
                                              placeholder="Ex: 88 (dB) Trabalhos esporádicos"
                                              className="w-full text-sm h-8"
                                            />
                                          ) : (
                                            <span className="text-sm text-muted-foreground">-</span>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            value={editRiscoForm.gradacaoEfeitos}
                                            onChange={(e) => setEditRiscoForm({ ...editRiscoForm, gradacaoEfeitos: e.target.value })}
                                            placeholder="Efeitos"
                                            className="w-full text-sm h-8"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <Input
                                            value={editRiscoForm.gradacaoExposicao}
                                            onChange={(e) => setEditRiscoForm({ ...editRiscoForm, gradacaoExposicao: e.target.value })}
                                            placeholder="Exposição"
                                            className="w-full text-sm h-8"
                                          />
                                        </TableCell>
                                        <TableCell>
                                          <div className="flex gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleSaveEditRisco(currentCargoId || r.cargoId)}
                                              disabled={updateRiscoMutation.isPending}
                                            >
                                              <Check className="h-4 w-4 text-green-600" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={handleCancelEditRisco}
                                              disabled={updateRiscoMutation.isPending}
                                            >
                                              <X className="h-4 w-4 text-red-600" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </>
                                    ) : (
                                      <>
                                        <TableCell className="font-medium">{r.tipoAgente || r.nomeRisco || "-"}</TableCell>
                                        <TableCell className="max-w-[150px]">
                                          <div className="truncate" title={r.fonteGeradora}>
                                            {r.fonteGeradora || "-"}
                                          </div>
                                        </TableCell>
                                        <TableCell>{r.tipo || "-"}</TableCell>
                                        <TableCell className="max-w-[150px]">
                                          <div className="truncate" title={r.meioPropagacao}>
                                            {r.meioPropagacao || "-"}
                                          </div>
                                        </TableCell>
                                        <TableCell className="max-w-[150px]">
                                          <div className="truncate" title={r.meioContato}>
                                            {r.meioContato || "-"}
                                          </div>
                                        </TableCell>
                                        <TableCell className="max-w-[200px]">
                                          <div className="truncate" title={r.possiveisDanosSaude}>
                                            {r.possiveisDanosSaude || "-"}
                                          </div>
                                        </TableCell>
                                        <TableCell>{r.tipoAnalise || "-"}</TableCell>
                                        <TableCell className="max-w-[200px]">
                                          <div className="truncate" title={r.valorAnaliseQuantitativa}>
                                            {r.valorAnaliseQuantitativa || "-"}
                                          </div>
                                        </TableCell>
                                        <TableCell>{r.gradacaoEfeitos || "-"}</TableCell>
                                        <TableCell>{r.gradacaoExposicao || "-"}</TableCell>
                                        <TableCell>
                                          <div className="flex gap-2">
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEditRisco(r)}
                                            >
                                              <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleDeleteRisco(r.id)}
                                            >
                                              <Trash2 className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </>
                                    )}
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">Nenhum risco ocupacional cadastrado</p>
                        )}
                        </div>
                      </div>
                    )}
                  </React.Fragment>
              );
            })}
            </div>
          </CardContent>
        </Card>
      </div>
  );

  if (!showLayout) {
    return content;
  }

  return (
    <DashboardLayout>
      {content}
    </DashboardLayout>
  );
}
