import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Trash2, Edit2, X, Printer, Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ListaOrdensServico({ showLayout = true }: { showLayout?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroDataEmissao, setFiltroDataEmissao] = useState<string>("");
  const [filtroDataAdmissao, setFiltroDataAdmissao] = useState<string>("");
  
  // Função centralizada para extrair data no formato YYYY-MM-DD (sem timezone)
  const extrairDataYYYYMMDD = (data: any): string => {
    if (!data) return "";
    
    try {
      // Se já está no formato YYYY-MM-DD, usar diretamente
      if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
        return data;
      }
      
      // Se tem timestamp, extrair apenas a parte da data
      if (typeof data === 'string' && data.includes('T')) {
        const dataPart = data.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataPart)) {
          return dataPart;
        }
      }
      
      // Se for Date, converter usando métodos locais (evitar UTC)
      if (data instanceof Date) {
        const year = data.getFullYear();
        const month = String(data.getMonth() + 1).padStart(2, '0');
        const day = String(data.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Tentar converter de string
      const date = new Date(data);
      if (!isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      
      // Se falhar, tentar extrair de ISO string
      if (typeof data === 'string') {
        const dataPart = data.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataPart)) {
          return dataPart;
        }
      }
      
      return "";
    } catch (error) {
      console.error("[extrairDataYYYYMMDD] Erro ao extrair data:", error, data);
      return "";
    }
  };
  
  // Função centralizada para formatar data para exibição (DD/MM/YYYY)
  const formatarDataParaExibicao = (data: any): string => {
    const dataYYYYMMDD = extrairDataYYYYMMDD(data);
    if (!dataYYYYMMDD) return "-";
    
    const [year, month, day] = dataYYYYMMDD.split('-');
    return `${day}/${month}/${year}`;
  };
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ordemToDelete, setOrdemToDelete] = useState<number | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [ordemEditando, setOrdemEditando] = useState<any>(null);

  // Estados para o formulário de edição
  const [editEmpresaId, setEditEmpresaId] = useState<string>("");
  const [editCnpjEmpresa, setEditCnpjEmpresa] = useState<string>("");
  const [editColaboradorId, setEditColaboradorId] = useState<string>("");
  const [editFuncaoColaborador, setEditFuncaoColaborador] = useState<string>("");
  const [editDataEmissao, setEditDataEmissao] = useState("");
  const [editCidade, setEditCidade] = useState("");
  const [editUf, setEditUf] = useState("");
  const [editModeloId, setEditModeloId] = useState<string>("");
  const [editResponsavelId, setEditResponsavelId] = useState<string>("");
  const [editEmpresaOpen, setEditEmpresaOpen] = useState(false);
  const [editEmpresaSearch, setEditEmpresaSearch] = useState("");
  const [editColaboradorOpen, setEditColaboradorOpen] = useState(false);
  const [editColaboradorSearch, setEditColaboradorSearch] = useState("");
  const [editModeloOpen, setEditModeloOpen] = useState(false);
  const [editModeloSearch, setEditModeloSearch] = useState("");
  const [editResponsavelOpen, setEditResponsavelOpen] = useState(false);
  const [editResponsavelSearch, setEditResponsavelSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: ordens = [], isLoading, refetch } = trpc.ordensServico.list.useQuery({
    searchTerm: searchTerm || undefined,
  });
  
  // Debug: verificar dados recebidos
  useEffect(() => {
    if (ordens.length > 0) {
      console.log("[ListaOrdensServico] Ordens recebidas:", ordens.map((o: any) => ({
        id: o.id,
        numeroOrdem: o.numeroOrdem,
        dataEmissao: o.dataEmissao,
        tipo: typeof o.dataEmissao
      })));
    }
  }, [ordens]);

  const { data: colaboradores = [] } = trpc.colaboradores.list.useQuery();
  const { data: empresas = [] } = trpc.empresas.list.useQuery();
  const { data: modelos = [] } = trpc.modelosOrdemServico.list.useQuery();
  const { data: responsaveis = [] } = trpc.responsaveis.list.useQuery();

  // Filtrar ordens por data de emissão e data de admissão do colaborador
  const ordensFiltradas = useMemo(() => {
    let filtradas = ordens;

    // Filtrar por data de emissão
    if (filtroDataEmissao) {
      filtradas = filtradas.filter((ordem: any) => {
        if (!ordem.dataEmissao) return false;
        // Se já vier como string YYYY-MM-DD, usar diretamente
        if (typeof ordem.dataEmissao === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ordem.dataEmissao)) {
          return ordem.dataEmissao === filtroDataEmissao;
        }
        // Caso contrário, tentar converter
        try {
          const date = new Date(ordem.dataEmissao);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dataEmissao = `${year}-${month}-${day}`;
            return dataEmissao === filtroDataEmissao;
          }
        } catch {
          // Ignorar erros de conversão
        }
        return false;
      });
    }

    // Filtrar por data de admissão do colaborador
    if (filtroDataAdmissao && filtradas.length > 0) {
      // Buscar colaboradores com a data de admissão especificada
      const colaboradoresIds = colaboradores
        .filter((c: any) => {
          if (!c.dataAdmissao) return false;
          const dataAdmissao = new Date(c.dataAdmissao).toISOString().split('T')[0];
          return dataAdmissao === filtroDataAdmissao;
        })
        .map((c: any) => c.id.toString());
      
      filtradas = filtradas.filter((ordem: any) => 
        ordem.colaboradorId && colaboradoresIds.includes(ordem.colaboradorId.toString())
      );
    }

    return filtradas;
  }, [ordens, filtroDataEmissao, filtroDataAdmissao, colaboradores]);

  const deleteMutation = trpc.ordensServico.delete.useMutation({
    onSuccess: () => {
      utils.ordensServico.list.invalidate();
      toast.success("Ordem de serviço excluída com sucesso!");
      setDeleteDialogOpen(false);
      setOrdemToDelete(null);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir ordem: ${error.message}`);
    },
  });

  const deleteManyMutation = trpc.ordensServico.deleteMany.useMutation({
    onSuccess: () => {
      utils.ordensServico.list.invalidate();
      toast.success(`${selectedIds.length} ordem(ns) excluída(s) com sucesso!`);
      setSelectedIds([]);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir ordens: ${error.message}`);
    },
  });

  const updateMutation = trpc.ordensServico.update.useMutation({
    onSuccess: async () => {
      // Invalidar e refetch a lista para garantir que os dados sejam atualizados
      await utils.ordensServico.list.invalidate();
      await refetch();
      toast.success("Ordem de serviço atualizada com sucesso!");
      setEditDialogOpen(false);
      setOrdemEditando(null);
      // Limpar campos do formulário
      setEditEmpresaId("");
      setEditCnpjEmpresa("");
      setEditColaboradorId("");
      setEditFuncaoColaborador("");
      setEditDataEmissao("");
      setEditCidade("");
      setEditUf("");
      setEditModeloId("");
      setEditResponsavelId("");
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar ordem: ${error.message}`);
      console.error("Erro ao atualizar ordem:", error);
    },
  });

  const handleDelete = (id: number) => {
    setOrdemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (ordemToDelete) {
      deleteMutation.mutate({ id: ordemToDelete });
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === ordensFiltradas.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(ordensFiltradas.map((o: any) => o.id));
    }
  };

  const handleDeleteMany = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos uma ordem para excluir");
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir ${selectedIds.length} ordem(ns)?`)) {
      deleteManyMutation.mutate({ ids: selectedIds });
    }
  };

  const handleDownloadMany = async () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos uma ordem para baixar");
      return;
    }

    try {
      // Buscar todas as ordens selecionadas
      const ordensParaBaixar = ordensFiltradas.filter((ordem: any) => 
        selectedIds.includes(ordem.id)
      );

      // Baixar cada ordem individualmente em uma nova aba
      for (const ordem of ordensParaBaixar) {
        await handleImprimirOrdemServico(ordem);
        // Pequeno delay para evitar abrir muitas abas de uma vez
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      toast.success(`${selectedIds.length} ordem(ns) sendo baixada(s)...`);
    } catch (error) {
      console.error("Erro ao baixar ordens em massa:", error);
      toast.error("Erro ao baixar ordens em massa");
    }
  };

  const handleEdit = (ordem: any) => {
    if (!ordem || !ordem.id) {
      toast.error("Ordem de serviço inválida");
      return;
    }
    
    // Definir ordem sendo editada primeiro
    setOrdemEditando(ordem);
    
    // Preencher todos os campos do formulário
    setEditEmpresaId(ordem.empresaId ? String(ordem.empresaId) : "");
    setEditCnpjEmpresa(ordem.empresaCnpj || "");
    setEditColaboradorId(ordem.colaboradorId ? String(ordem.colaboradorId) : "");
    setEditFuncaoColaborador(ordem.colaboradorFuncao || "");
    
    // Formatar data de emissão usando função centralizada
    const dataFormatada = extrairDataYYYYMMDD(ordem.dataEmissao);
    console.log("[handleEdit] Data extraída para edição:", dataFormatada, "de:", ordem.dataEmissao);
    setEditDataEmissao(dataFormatada);
    
    setEditCidade(ordem.cidade || "");
    setEditUf(ordem.uf || "");
    setEditModeloId(ordem.modeloId ? String(ordem.modeloId) : "");
    setEditResponsavelId(ordem.responsavelId ? String(ordem.responsavelId) : "");
    
    // Limpar buscas
    setEditEmpresaSearch("");
    setEditColaboradorSearch("");
    setEditModeloSearch("");
    setEditResponsavelSearch("");
    
    // Abrir dialog
    setEditDialogOpen(true);
  };

  const estadosBrasil = [
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

  // Filtrar empresas para edição
  const empresasFiltradasEdit = useMemo(() => {
    if (!editEmpresaSearch.trim()) return empresas;
    const termo = editEmpresaSearch.toLowerCase();
    return empresas.filter((empresa: any) =>
      empresa.razaoSocial?.toLowerCase().includes(termo) ||
      empresa.cnpj?.toLowerCase().includes(termo)
    );
  }, [empresas, editEmpresaSearch]);

  // Filtrar colaboradores para edição
  const colaboradoresFiltradosEdit = useMemo(() => {
    let filtrados = colaboradores;
    
    if (editEmpresaId) {
      filtrados = filtrados.filter((c: any) => c.empresaId?.toString() === editEmpresaId);
    }
    
    if (editColaboradorSearch.trim()) {
      const termo = editColaboradorSearch.toLowerCase();
      filtrados = filtrados.filter((c: any) =>
        c.nomeCompleto?.toLowerCase().includes(termo)
      );
    }
    
    return filtrados;
  }, [colaboradores, editEmpresaId, editColaboradorSearch]);

  // Filtrar modelos para edição
  const modelosFiltradosEdit = useMemo(() => {
    if (!editModeloSearch.trim()) return modelos;
    const termo = editModeloSearch.toLowerCase();
    return modelos.filter((modelo: any) =>
      modelo.nome?.toLowerCase().includes(termo)
    );
  }, [modelos, editModeloSearch]);

  // Filtrar responsáveis para edição
  const responsaveisFiltradosEdit = useMemo(() => {
    if (!editResponsavelSearch.trim()) return responsaveis;
    const termo = editResponsavelSearch.toLowerCase();
    return responsaveis.filter((responsavel: any) =>
      responsavel.nomeCompleto?.toLowerCase().includes(termo) ||
      responsavel.funcao?.toLowerCase().includes(termo)
    );
  }, [responsaveis, editResponsavelSearch]);

  const handleSubmitEdit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!ordemEditando) {
      toast.error("Ordem de serviço não encontrada");
      return;
    }

    if (!editEmpresaId) {
      toast.error("Selecione uma empresa");
      return;
    }

    // Garantir que editDataEmissao está no formato correto (YYYY-MM-DD)
    const dataEmissaoFormatada = editDataEmissao.trim();
    
    if (!dataEmissaoFormatada) {
      toast.error("Selecione a data de emissão");
      return;
    }
    
    // Validar formato da data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dataEmissaoFormatada)) {
      toast.error("Formato de data inválido. Use o formato YYYY-MM-DD");
      return;
    }
    
    updateMutation.mutate({
      id: ordemEditando.id,
      empresaId: parseInt(editEmpresaId),
      colaboradorId: editColaboradorId ? parseInt(editColaboradorId) : undefined,
      dataEmissao: dataEmissaoFormatada,
      modeloId: editModeloId ? parseInt(editModeloId) : undefined,
      cidade: editCidade ? editCidade.trim() : undefined,
      uf: editUf ? editUf.trim() : undefined,
      responsavelId: editResponsavelId ? parseInt(editResponsavelId) : undefined,
    });
  };

  const gerarTemplateOrdemServico = (ordem: any, riscos: any[] = [], epis: any[] = [], modelo: any = null, responsavelTecnico: any = null) => {
    // Formatar data no formato DD/MM/YYYY
    const formatarData = (data: string | Date | null | undefined) => {
      if (!data) return "";
      try {
        let dia: number, mes: number, ano: number;
        
        if (data instanceof Date) {
          dia = data.getDate();
          mes = data.getMonth();
          ano = data.getFullYear();
        } else if (typeof data === 'string') {
          // Se já vier como string YYYY-MM-DD, parsear diretamente sem usar Date
          if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
            const [year, month, day] = data.split('-').map(Number);
            dia = day;
            mes = month - 1; // Mês é 0-indexed
            ano = year;
          } else {
            // Caso contrário, usar Date mas com métodos locais
            const date = new Date(data);
            if (isNaN(date.getTime())) {
              return String(data);
            }
            dia = date.getDate();
            mes = date.getMonth();
            ano = date.getFullYear();
          }
        } else {
          const date = new Date(String(data));
          if (isNaN(date.getTime())) {
            return String(data);
          }
          dia = date.getDate();
          mes = date.getMonth();
          ano = date.getFullYear();
        }
        
        return `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${ano}`;
      } catch {
        return String(data || "");
      }
    };

    // Formatar data por extenso com cidade e UF
    // IMPORTANTE: Sempre usar a data exata, sem conversões de timezone
    const formatarDataComCidade = (data: string, cidade: string | null | undefined, uf: string | null | undefined) => {
      if (!data) return "";
      try {
        let dia: number, mes: number, ano: number;
        
        // Se já vier como string YYYY-MM-DD, parsear diretamente sem usar Date (evita timezone)
        if (typeof data === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(data)) {
          const [year, month, day] = data.split('-').map(Number);
          dia = day;
          mes = month - 1; // Mês é 0-indexed
          ano = year;
          console.log("[formatarDataComCidade] Data parseada diretamente:", { dia, mes: mes + 1, ano });
        } else if (typeof data === 'string' && data.includes('T')) {
          // Se tem timestamp, extrair apenas a parte da data
          const dataPart = data.split('T')[0];
          if (/^\d{4}-\d{2}-\d{2}$/.test(dataPart)) {
            const [year, month, day] = dataPart.split('-').map(Number);
            dia = day;
            mes = month - 1;
            ano = year;
            console.log("[formatarDataComCidade] Data extraída de timestamp:", { dia, mes: mes + 1, ano });
          } else {
            console.warn("[formatarDataComCidade] Formato de data inválido:", data);
            return data;
          }
        } else {
          // Caso contrário, tentar usar Date mas com cuidado
          const date = new Date(data);
          if (isNaN(date.getTime())) {
            console.warn("[formatarDataComCidade] Data inválida:", data);
            return data;
          }
          // Usar métodos locais para evitar problemas de timezone
          dia = date.getDate();
          mes = date.getMonth();
          ano = date.getFullYear();
          console.log("[formatarDataComCidade] Data convertida de Date:", { dia, mes: mes + 1, ano });
        }
        
        const meses = [
          "janeiro", "fevereiro", "março", "abril", "maio", "junho",
          "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
        ];
        
        // Sempre formatar a data por extenso
        const dataExtenso = `${dia} ${meses[mes]} de ${ano}.`;
        
        // Adicionar cidade e UF antes da data se disponíveis
        // Garantir que cidade e uf sejam strings válidas (não null, undefined ou vazias)
        const cidadeStr = cidade ? String(cidade).trim() : "";
        const ufStr = uf ? String(uf).trim() : "";
        const cidadeValida = cidadeStr !== "";
        const ufValida = ufStr !== "";
        
        if (cidadeValida && ufValida) {
          return `${cidadeStr} - ${ufStr}, ${dataExtenso}`;
        } else if (cidadeValida) {
          return `${cidadeStr}, ${dataExtenso}`;
        } else if (ufValida) {
          return `${ufStr}, ${dataExtenso}`;
        }
        
        // Se não tiver cidade nem UF, retornar apenas a data por extenso
        return dataExtenso;
      } catch (error) {
        console.error("Erro ao formatar data:", error);
        return data;
      }
    };

    // Sempre usar formatarDataComCidade, mesmo que cidade/UF sejam vazios
    // Garantir que cidade e uf sejam strings não-nulas
    const cidade = ordem.cidade ? String(ordem.cidade).trim() : "";
    const uf = ordem.uf ? String(ordem.uf).trim() : "";
    
    // Debug: verificar valores recebidos
    console.log("=== DEBUG IMPRESSÃO ORDEM ===");
    console.log("Ordem ID:", ordem.id);
    console.log("Cidade recebida:", ordem.cidade, "-> Processada:", cidade);
    console.log("UF recebida:", ordem.uf, "-> Processada:", uf);
    console.log("Data recebida:", ordem.dataEmissao, "Tipo:", typeof ordem.dataEmissao);
    
    // Converter dataEmissao para formato adequado (pode vir como Date do banco)
    let dataEmissaoParaFormatar: string | Date | null = null;
    if (ordem.dataEmissao) {
      if (typeof ordem.dataEmissao === 'string') {
        dataEmissaoParaFormatar = ordem.dataEmissao;
      } else if (ordem.dataEmissao instanceof Date) {
        dataEmissaoParaFormatar = ordem.dataEmissao;
      } else {
        dataEmissaoParaFormatar = String(ordem.dataEmissao);
      }
    }
    
    const dataFormatada = formatarData(dataEmissaoParaFormatar);
    
    // Converter para string para formatarDataComCidade usando função centralizada
    // IMPORTANTE: Sempre usar a data exata que foi salva, sem conversões de timezone
    const dataEmissaoStr = extrairDataYYYYMMDD(ordem.dataEmissao);
    console.log("[gerarTemplateOrdemServico] Data extraída para documento:", dataEmissaoStr, "de:", ordem.dataEmissao);
    
    // Formatar data de admissão no formato DD/MM/YYYY
    // Usar a data de admissão do colaborador em vez da data de emissão da ordem
    const formatarDataAdmissao = (data: string) => {
      if (!data) return "";
      try {
        // Se já está no formato YYYY-MM-DD, converter para DD/MM/YYYY
        if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
          const [year, month, day] = data.split('-');
          return `${day}/${month}/${year}`;
        }
        // Se já está no formato DD/MM/YYYY, retornar como está
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) {
          return data;
        }
        // Tentar converter de outros formatos
        const date = new Date(data);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }
        return data;
      } catch (error) {
        return data;
      }
    };
    
    // Usar colaboradorDataAdmissao se disponível, senão usar data de emissão como fallback
    const dataAdmissaoColaborador = ordem.colaboradorDataAdmissao || "";
    const dataAdmissaoFormatada = formatarDataAdmissao(dataAdmissaoColaborador);
    
    console.log("Data convertida para formatarDataComCidade:", dataEmissaoStr);
    console.log("Cidade:", cidade, "UF:", uf);
    
    const dataComCidade = formatarDataComCidade(
      dataEmissaoStr, 
      cidade, 
      uf
    );
    
    console.log("Resultado formatarDataComCidade:", dataComCidade);
    console.log("=== FIM DEBUG ===");

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ordem de Serviço - SST</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: Arial, sans-serif;
      padding: 0;
      margin: 0;
      background: white;
    }
    .container {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: white;
      padding: 15mm;
      box-shadow: none;
    }
    .secao {
      margin-top: 15px;
      margin-bottom: 12px;
    }
    .secao-titulo {
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 8px;
      border-bottom: 1px solid #000;
      padding-bottom: 4px;
    }
    .lista-itens {
      margin-left: 20px;
      margin-top: 8px;
    }
    .lista-itens li {
      margin-bottom: 4px;
    }
    .termo-responsabilidade {
      margin-top: 20px;
      padding: 12px;
      border: 1px solid #000;
      text-align: justify;
    }
    @media print {
      body {
        background: white;
        padding: 0;
        margin: 0;
      }
      .container {
        width: 210mm;
        min-height: 297mm;
        padding: 15mm;
        margin: 0;
        box-shadow: none;
      }
      @page {
        size: A4 portrait;
        margin: 0;
      }
      table {
        page-break-inside: avoid;
      }
      .secao {
        page-break-inside: avoid;
      }
    }
    @media screen {
      .container {
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        margin: 20px auto;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; margin: 0;">
      <tr>
        <td style="text-align: center; padding: 12px; border: 1px solid #000;">
          <div style="font-size: 16px; font-weight: bold; margin: 0;">ORDEM DE SERVIÇO</div>
          <div style="font-size: 14px; font-weight: bold; margin: 4px 0 0 0;">SEGURANÇA E SAÚDE DO TRABALHO</div>
        </td>
      </tr>
      <tr>
        <td style="padding: 8px; border: 1px solid #000; font-size: 12px;">
          <strong>Empresa:</strong> ${ordem.empresaNome || "-"}<br/>
          <strong>CNPJ:</strong> ${ordem.empresaCnpj || "-"}<br/><br/>
          <strong>Colaborador:</strong> ${ordem.colaboradorNome || "-"}<br/>
          <strong>Cargo:</strong> ${ordem.colaboradorFuncao || "-"}<br/>
          <strong>Data de Admissão:</strong> ${dataAdmissaoFormatada || ""}
        </td>
      </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; margin-top: 12px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #000;">
          <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 8px;">OBJETIVO</div>
          <div style="text-align: justify; line-height: 1.4; font-size: 11px;">
            Pela presente Ordem de serviço, objetivamos informar os trabalhadores que executam suas atividades laborais nesse setor, conforme estabelece a NR-1, item 1.7, sobre as condições de segurança e saúde às quais estão expostos, como medida preventiva e, tendo como parâmetro os agentes físicos, químicos, e biológicos citados na NR-9 - Programa de Prevenção de Riscos Ambientais (Lei nº 6514 de 22/12/1977, Portaria nº 3214 de 08/06/1978), bem como os procedimentos de aplicação da NR-6 - Equipamento de Proteção Individual - EPI, NR-17 - Ergonomia, de forma a padronizar comportamentos para prevenir acidentes e/ou doenças ocupacionais.
          </div>
        </td>
      </tr>
    </table>

    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; margin-top: 12px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #000;">
          <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 8px;">Descrição de Cargos</div>
          <div style="text-align: justify; line-height: 1.4; font-size: 11px;">
            ${ordem.colaboradorDescricaoCargo || "Descrição do cargo não disponível."}
          </div>
        </td>
      </tr>
    </table>

    ${riscos.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; margin-top: 12px;">
      <tr>
        <td style="text-align: center; padding: 8px; border: 1px solid #000; background-color: #f3f4f6;">
          <div style="font-weight: bold; font-size: 14px;">Riscos Ocupacionais do Cargo</div>
        </td>
      </tr>
      <tr>
        <td style="padding: 0; border: 1px solid #000;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f9fafb;">
              <th style="padding: 6px; border: 1px solid #000; text-align: left; font-weight: bold; font-size: 11px; width: 30%;">Tipo de Agente</th>
              <th style="padding: 6px; border: 1px solid #000; text-align: left; font-weight: bold; font-size: 11px;">Conclusão</th>
            </tr>
            ${riscos.map((risco) => `
            <tr>
              <td style="padding: 6px; border: 1px solid #000; vertical-align: top; font-size: 11px;">
                ${risco.tipoAgente || "-"}
              </td>
              <td style="padding: 6px; border: 1px solid #000; text-align: justify; font-size: 11px;">
                ${risco.descricaoRiscos || "-"}
              </td>
            </tr>
            `).join('')}
          </table>
        </td>
      </tr>
    </table>
    ` : ''}

    ${epis.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; margin-top: 12px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #000;">
          <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 8px;">Equipamentos de Proteção Individual - (EPI) Necessários e/ou Utilizado</div>
          <div style="text-align: justify; line-height: 1.4; font-size: 11px;">
            ${epis.map((epi, index) => {
              const formatarData = (data: string | Date | null) => {
                if (!data) return "";
                try {
                  let dia: number, mes: number, ano: number;
                  
                  if (data instanceof Date) {
                    dia = data.getDate();
                    mes = data.getMonth();
                    ano = data.getFullYear();
                  } else if (typeof data === 'string') {
                    // Se já vier como string YYYY-MM-DD, parsear diretamente sem usar Date
                    if (/^\d{4}-\d{2}-\d{2}$/.test(data)) {
                      const [year, month, day] = data.split('-').map(Number);
                      dia = day;
                      mes = month - 1; // Mês é 0-indexed
                      ano = year;
                    } else {
                      // Caso contrário, usar Date mas com métodos locais
                      const date = new Date(data);
                      if (isNaN(date.getTime())) {
                        return "";
                      }
                      dia = date.getDate();
                      mes = date.getMonth();
                      ano = date.getFullYear();
                    }
                  } else {
                    return "";
                  }
                  
                  return `${String(dia).padStart(2, '0')}/${String(mes + 1).padStart(2, '0')}/${ano}`;
                } catch {
                  return "";
                }
              };
              const dataValidade = formatarData(epi.dataValidade);
              const caNumero = epi.caNumero ? ` - CA: ${epi.caNumero}` : "";
              const validade = dataValidade ? ` - Válido até: ${dataValidade}` : "";
              return `<strong>${epi.nomeEquipamento || "-"}</strong>${caNumero}${validade}${index < epis.length - 1 ? '<br/><br/>' : ''}`;
            }).join('')}
          </div>
        </td>
      </tr>
    </table>
    ` : ''}

    ${modelo?.medidasPreventivasEPC ? (() => {
      try {
        const medidas = JSON.parse(modelo.medidasPreventivasEPC);
        if (Array.isArray(medidas) && medidas.length > 0) {
          return `
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; margin-top: 12px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #000;">
          <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 8px;">Medidas Preventivas para os Riscos de Ambientais - EPC</div>
          <div style="text-align: justify; line-height: 1.4; font-size: 11px;">
            ${medidas.map((medida: string, index: number) => {
              const letra = String.fromCharCode(97 + index); // a, b, c, etc.
              return `${letra}) ${medida}${index < medidas.length - 1 ? '<br/><br/>' : ''}`;
            }).join('')}
          </div>
        </td>
      </tr>
    </table>
          `;
        }
      } catch (e) {
        console.error("Erro ao processar medidas preventivas:", e);
      }
      return '';
    })() : ''}

    ${modelo?.orientacoesSeguranca ? (() => {
      try {
        const orientacoes = JSON.parse(modelo.orientacoesSeguranca);
        if (Array.isArray(orientacoes) && orientacoes.length > 0) {
          return `
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; margin-top: 12px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #000;">
          <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 8px;">Orientações de Segurança do Trabalho</div>
          <div style="text-align: justify; line-height: 1.4; font-size: 11px;">
            ${orientacoes.map((orientacao: string, index: number) => {
              const letra = String.fromCharCode(97 + index); // a, b, c, etc.
              return `${letra}) ${orientacao}${index < orientacoes.length - 1 ? '<br/><br/>' : ''}`;
            }).join('')}
          </div>
        </td>
      </tr>
    </table>
          `;
        }
      } catch (e) {
        console.error("Erro ao processar orientações de segurança:", e);
      }
      return '';
    })() : ''}

    ${modelo?.termoResponsabilidade ? (() => {
      // Usar a mesma função formatarDataComCidade que já está definida acima
      // para garantir que cidade e UF apareçam também no Termo de Responsabilidade
      const dataEmissaoExtenso = dataComCidade || formatarDataComCidade(
        dataEmissaoStr || ordem.dataEmissao || "",
        cidade,
        uf
      );
      
      // Informações do colaborador
      const colaboradorNome = ordem.colaboradorNome || "-";
      const colaboradorFuncao = ordem.colaboradorFuncao || "-";
      
      // Informações do responsável técnico
      const responsavelNome = responsavelTecnico?.nome || "-";
      const responsavelFuncao = responsavelTecnico?.funcao || "Responsável Técnico";
      
      return `
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000; margin-top: 12px;">
      <tr>
        <td style="padding: 8px; border: 1px solid #000;">
          <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 8px;">Termo de Responsabilidade</div>
          <div style="text-align: justify; line-height: 1.4; font-size: 11px;">
            ${modelo.termoResponsabilidade}
            ${dataEmissaoExtenso ? `<br/><br/><div style="text-align: right; font-size: 11px;">${dataEmissaoExtenso}</div>` : ''}
            <br/><br/><br/><br/>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; padding: 8px; text-align: center; vertical-align: bottom;">
                  <div style="border-top: 1px solid #000; padding-top: 1px; min-height: 50px; display: flex; flex-direction: column; justify-content: flex-start; font-size: 11px; line-height: 1.1; gap: 0;">
                    <strong style="margin: 0; padding: 0; line-height: 1.1;">${colaboradorNome}</strong>
                    <span style="margin: 0; padding: 0; display: block; line-height: 1.1;">${colaboradorFuncao}</span>
                  </div>
                </td>
                <td style="width: 50%; padding: 8px; text-align: center; vertical-align: bottom;">
                  <div style="border-top: 1px solid #000; padding-top: 1px; min-height: 50px; display: flex; flex-direction: column; justify-content: flex-start; font-size: 11px; line-height: 1.1; gap: 0;">
                    <strong style="margin: 0; padding: 0; line-height: 1.1;">${responsavelNome}</strong>
                    <span style="margin: 0; padding: 0; display: block; line-height: 1.1;">${responsavelFuncao}</span>
                    <span style="margin: 0; padding: 0; display: block; line-height: 1.1;">Responsável Técnico</span>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </td>
      </tr>
    </table>
      `;
    })() : ''}
  </div>
</body>
</html>
    `;

    return html;
  };

  const handleImprimirOrdemServico = async (ordem: any) => {
    let riscos: any[] = [];
    let epis: any[] = [];
    
    // Buscar dados atualizados da ordem para garantir que cidade e uf estejam presentes
    let ordemCompleta = ordem;
    try {
      const ordemAtualizada = await utils.ordensServico.getById.fetch({ id: ordem.id });
      if (ordemAtualizada) {
        ordemCompleta = ordemAtualizada;
      }
    } catch (error) {
      console.error("Erro ao buscar ordem atualizada:", error);
    }
    
    // Buscar riscos ocupacionais do cargo do colaborador
    if (ordemCompleta.colaboradorCargoId) {
      try {
        const riscosData = await utils.cargoRiscos.getByCargo.fetch({ cargoId: ordemCompleta.colaboradorCargoId });
        riscos = riscosData || [];
      } catch (error) {
        console.error("Erro ao buscar riscos ocupacionais:", error);
      }
    }
    
    // Buscar EPIs do colaborador
    if (ordemCompleta.colaboradorId) {
      try {
        const episData = await utils.epis.list.fetch();
        epis = (episData || []).filter((epi: any) => 
          epi.colaboradorId?.toString() === ordemCompleta.colaboradorId?.toString() && 
          epi.status === "em_uso"
        );
      } catch (error) {
        console.error("Erro ao buscar EPIs:", error);
      }
    }
    
    // Buscar modelo de ordem de serviço (do modeloId da ordem ou padrão)
    let modelo: any = null;
    try {
      const modelosData = await utils.modelosOrdemServico.list.fetch();
      if (ordemCompleta.modeloId) {
        modelo = modelosData?.find((m: any) => m.id === ordemCompleta.modeloId) || null;
      }
      if (!modelo) {
        modelo = modelosData?.find((m: any) => m.padrao) || modelosData?.[0] || null;
      }
    } catch (error) {
      console.error("Erro ao buscar modelo de ordem de serviço:", error);
    }
    
    // Buscar responsável técnico - usar APENAS o responsável selecionado na ordem
    // Não usar fallback da empresa, pois o responsável deve ser selecionado na emissão
    let responsavelTecnico: any = null;
    if (ordemCompleta.responsavelId && ordemCompleta.responsavelNome) {
      // Usar responsável selecionado na ordem
      let nomeCompleto = ordemCompleta.responsavelNome;
      
      // Se tiver registro profissional, adicionar ao nome
      if (ordemCompleta.responsavelRegistroProfissional) {
        nomeCompleto = `${nomeCompleto} - ${ordemCompleta.responsavelRegistroProfissional}`;
      }
      
      responsavelTecnico = {
        nome: nomeCompleto,
        funcao: ordemCompleta.responsavelFuncao || "Responsável Técnico"
      };
    }
    
    const html = gerarTemplateOrdemServico(ordemCompleta, riscos, epis, modelo, responsavelTecnico);
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };


  const content = (
    <div className="space-y-6">
      {showLayout && (
        <div>
          <h2 className="text-2xl font-bold">Lista de Ordens de Serviço</h2>
          <p className="text-muted-foreground">Visualize e gerencie todas as ordens de serviço emitidas</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Pesquisar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por número, descrição ou empresa..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setSelectedIds([]);
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="dataEmissao">Data de Emissão</Label>
              <Input
                id="dataEmissao"
                type="date"
                value={filtroDataEmissao}
                onChange={(e) => setFiltroDataEmissao(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="dataAdmissao">Data de Admissão</Label>
              <Input
                id="dataAdmissao"
                type="date"
                value={filtroDataAdmissao}
                onChange={(e) => setFiltroDataAdmissao(e.target.value)}
                className="mt-1.5"
              />
            </div>
          </div>

          {(searchTerm || filtroDataEmissao || filtroDataAdmissao) && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("");
                  setFiltroDataEmissao("");
                  setFiltroDataAdmissao("");
                  setSelectedIds([]);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Ordens de Serviço</CardTitle>
            {selectedIds.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadMany}
                  disabled={selectedIds.length === 0}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Baixar em Massa ({selectedIds.length})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteMany}
                  disabled={selectedIds.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir em Massa ({selectedIds.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando ordens de serviço...
            </div>
          ) : ordensFiltradas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma ordem de serviço encontrada.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === ordensFiltradas.length && ordensFiltradas.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Data Emissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordensFiltradas.map((ordem: any) => (
                    <TableRow key={ordem.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(ordem.id)}
                          onCheckedChange={() => handleToggleSelect(ordem.id)}
                        />
                      </TableCell>
                      <TableCell>{ordem.empresaNome || "-"}</TableCell>
                      <TableCell>{ordem.colaboradorNome || "-"}</TableCell>
                      <TableCell>{ordem.colaboradorFuncao || "-"}</TableCell>
                      <TableCell>
                        {formatarDataParaExibicao(ordem.dataEmissao)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleEdit(ordem);
                            }}
                            title="Editar"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleImprimirOrdemServico(ordem)}
                            title="Imprimir"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(ordem.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setOrdemEditando(null);
          // Limpar campos ao fechar
          setEditResponsavelId("");
          setEditResponsavelSearch("");
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Ordem de Serviço</DialogTitle>
          </DialogHeader>
          {ordemEditando ? (
            <form onSubmit={handleSubmitEdit} className="space-y-4">
              {/* Primeira linha: Empresa e CNPJ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-empresa">Empresa *</Label>
                  <Popover open={editEmpresaOpen} onOpenChange={setEditEmpresaOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={editEmpresaOpen}
                        className="w-full justify-between mt-1.5 h-10"
                      >
                        {editEmpresaId
                          ? empresas.find((e: any) => e.id.toString() === editEmpresaId)?.razaoSocial || "Selecione uma empresa"
                          : "Selecione uma empresa"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Buscar empresa..."
                          value={editEmpresaSearch}
                          onValueChange={setEditEmpresaSearch}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                          <CommandGroup>
                            {empresasFiltradasEdit.map((empresa: any) => (
                              <CommandItem
                                key={empresa.id}
                                value={empresa.razaoSocial}
                                onSelect={() => {
                                  const newEmpresaId = empresa.id.toString();
                                  setEditEmpresaId(newEmpresaId);
                                  setEditCnpjEmpresa(empresa.cnpj || "");
                                  setEditEmpresaOpen(false);
                                  setEditEmpresaSearch("");
                                  setEditColaboradorId("");
                                  setEditFuncaoColaborador("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editEmpresaId === empresa.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {empresa.razaoSocial}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="edit-cnpj">CNPJ</Label>
                  <Input
                    id="edit-cnpj"
                    value={editCnpjEmpresa}
                    disabled
                    className="mt-1.5 bg-muted"
                    placeholder="CNPJ será preenchido automaticamente"
                  />
                </div>
              </div>

              {/* Segunda linha: Colaborador e Função */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-colaborador">Colaborador</Label>
                  <Popover open={editColaboradorOpen} onOpenChange={setEditColaboradorOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={editColaboradorOpen}
                        className="w-full justify-between mt-1.5 h-10"
                        disabled={!editEmpresaId}
                      >
                        {editColaboradorId
                          ? colaboradores.find((c: any) => c.id.toString() === editColaboradorId)?.nomeCompleto || "Selecione um colaborador"
                          : "Selecione um colaborador"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Buscar colaborador..."
                          value={editColaboradorSearch}
                          onValueChange={setEditColaboradorSearch}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
                          <CommandGroup>
                            {colaboradoresFiltradosEdit.map((colaborador: any) => (
                              <CommandItem
                                key={colaborador.id}
                                value={colaborador.nomeCompleto}
                                onSelect={() => {
                                  const newColaboradorId = colaborador.id.toString();
                                  setEditColaboradorId(newColaboradorId === editColaboradorId ? "" : newColaboradorId);
                                  if (newColaboradorId !== editColaboradorId) {
                                    setEditFuncaoColaborador(colaborador.funcao || "");
                                  } else {
                                    setEditFuncaoColaborador("");
                                  }
                                  setEditColaboradorOpen(false);
                                  setEditColaboradorSearch("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editColaboradorId === colaborador.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {colaborador.nomeCompleto}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label htmlFor="edit-funcao">Função</Label>
                  <Input
                    id="edit-funcao"
                    value={editFuncaoColaborador}
                    disabled
                    className="mt-1.5 bg-muted"
                    placeholder="Função será preenchida automaticamente"
                  />
                </div>
              </div>

              {/* Terceira linha: Data de Emissão e Modelo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-dataEmissao">Data de Emissão *</Label>
                  <Input
                    id="edit-dataEmissao"
                    type="date"
                    value={editDataEmissao}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setEditDataEmissao(newValue);
                    }}
                    onBlur={(e) => {
                      // Garantir que o valor está atualizado ao perder o foco
                      const value = e.target.value;
                      if (value !== editDataEmissao) {
                        setEditDataEmissao(value);
                      }
                    }}
                    className="mt-1.5"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="edit-modelo">Modelo</Label>
                  <Popover open={editModeloOpen} onOpenChange={setEditModeloOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={editModeloOpen}
                        className="w-full justify-between mt-1.5 h-10"
                      >
                        {editModeloId
                          ? modelos.find((m: any) => m.id.toString() === editModeloId)?.nome || "Selecione um modelo"
                          : "Selecione um modelo"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Buscar modelo..."
                          value={editModeloSearch}
                          onValueChange={setEditModeloSearch}
                        />
                        <CommandList>
                          <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
                          <CommandGroup>
                            {modelosFiltradosEdit.map((modelo: any) => (
                              <CommandItem
                                key={modelo.id}
                                value={modelo.nome}
                                onSelect={() => {
                                  const newModeloId = modelo.id.toString();
                                  setEditModeloId(newModeloId === editModeloId ? "" : newModeloId);
                                  setEditModeloOpen(false);
                                  setEditModeloSearch("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    editModeloId === modelo.id.toString() ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {modelo.nome}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Quarta linha: Cidade e UF */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-cidade">Cidade</Label>
                  <Input
                    id="edit-cidade"
                    value={editCidade}
                    onChange={(e) => setEditCidade(e.target.value)}
                    placeholder="Digite a cidade"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="edit-uf">UF</Label>
                  <Select value={editUf} onValueChange={setEditUf}>
                    <SelectTrigger className="mt-1.5">
                      <SelectValue placeholder="Selecione a UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {estadosBrasil.map((estado) => (
                        <SelectItem key={estado.sigla} value={estado.sigla}>
                          {estado.sigla} - {estado.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Responsável Técnico */}
              <div>
                <Label htmlFor="edit-responsavel">Responsável Técnico</Label>
                <Popover open={editResponsavelOpen} onOpenChange={setEditResponsavelOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={editResponsavelOpen}
                      className="w-full justify-between mt-1.5 h-10"
                    >
                      {editResponsavelId
                        ? responsaveis.find((r: any) => r.id.toString() === editResponsavelId)?.nomeCompleto || "Selecione um responsável"
                        : "Selecione um responsável (opcional)"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar responsável..."
                        value={editResponsavelSearch}
                        onValueChange={setEditResponsavelSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum responsável encontrado.</CommandEmpty>
                        <CommandGroup>
                          {responsaveisFiltradosEdit.map((responsavel: any) => (
                            <CommandItem
                              key={responsavel.id}
                              value={`${responsavel.nomeCompleto} ${responsavel.funcao || ""}`}
                              onSelect={() => {
                                const newResponsavelId = responsavel.id.toString();
                                setEditResponsavelId(newResponsavelId === editResponsavelId ? "" : newResponsavelId);
                                setEditResponsavelOpen(false);
                                setEditResponsavelSearch("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  editResponsavelId === responsavel.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {responsavel.nomeCompleto} {responsavel.funcao ? `- ${responsavel.funcao}` : ""}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setOrdemEditando(null);
                  }}
                  disabled={updateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "Salvando..." : "Salvar Alterações"}
                </Button>
              </div>
            </form>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Carregando dados da ordem...</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta ordem de serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOrdemToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  if (showLayout) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
}

