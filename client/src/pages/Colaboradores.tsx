import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, Search, Download } from "lucide-react";
import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { memo } from "react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const TIPOS_LOGRADOURO = [
  "Rua", "Avenida", "Travessa", "Praça", "Alameda", "Estrada",
  "Rodovia", "Largo", "Passagem", "Viela", "Beco", "Caminho"
];

// Componente memoizado para linha da tabela - evita re-renderizações desnecessárias
const ColaboradorRow = memo(({ 
  colaborador, 
  isSelected, 
  empresaNome, 
  dataFormatada, 
  onToggleSelection, 
  onEdit, 
  onDelete 
}: {
  colaborador: any;
  isSelected: boolean;
  empresaNome: string;
  dataFormatada: string;
  onToggleSelection: (id: number) => void;
  onEdit: (colaborador: any) => void;
  onDelete: (id: number) => void;
}) => {
  const isAtivo = colaborador.status === "ativo";
  
  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(colaborador.id)}
        />
      </TableCell>
      <TableCell className="font-medium">{colaborador.nomeCompleto}</TableCell>
      <TableCell>{colaborador.nomeCargo || "-"}</TableCell>
      <TableCell>{colaborador.nomeSetor || "-"}</TableCell>
      <TableCell>{empresaNome}</TableCell>
      <TableCell>{dataFormatada}</TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isAtivo
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {isAtivo ? "Ativo" : "Inativo"}
        </span>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(colaborador)}
            title="Editar colaborador"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(colaborador.id)}
            title="Excluir colaborador"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});

ColaboradorRow.displayName = "ColaboradorRow";

export default function Colaboradores() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    cargoId: "",
    setorId: "",
    empresaId: "",
    dataAdmissao: "",
    dataPrimeiroAso: "",
    validadeAso: "",
    dataNascimento: "",
    cidadeNascimento: "",
    estadoNascimento: "",
    rg: "",
    cpf: "",
    pis: "",
    tipoLogradouro: "",
    nomeLogradouro: "",
    numeroEndereco: "",
    complementoEndereco: "",
    cidadeEndereco: "",
    estadoEndereco: "",
    cep: "",
    fotoUrl: "",
    telefonePrincipal: "",
    telefoneRecado: "",
    nomePessoaRecado: "",
    grauParentesco: "",
    observacoes: "",
    status: "ativo" as "ativo" | "inativo",
  });
  const [selectedTrainings, setSelectedTrainings] = useState<Set<number>>(new Set());

  const [filters, setFilters] = useState({
    searchTerm: "",
    dataAdmissaoInicio: "",
    dataAdmissaoFim: "",
    empresaId: "",
  });

  // Debounce para searchTerm - evita requisições a cada tecla
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(filters.searchTerm);
  const [isDebouncing, setIsDebouncing] = useState(false);
  
  useEffect(() => {
    if (filters.searchTerm !== debouncedSearchTerm) {
      setIsDebouncing(true);
    }
    
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(filters.searchTerm);
      setIsDebouncing(false);
    }, 300); // 300ms de delay
    
    return () => clearTimeout(timer);
  }, [filters.searchTerm, debouncedSearchTerm]);

  const utils = trpc.useUtils();
  
  // Otimizar query com cache e staleTime
  const { data: colaboradores, isLoading } = trpc.colaboradores.list.useQuery({
    searchTerm: debouncedSearchTerm || undefined,
    dataAdmissaoInicio: filters.dataAdmissaoInicio || undefined,
    dataAdmissaoFim: filters.dataAdmissaoFim || undefined,
    empresaId: filters.empresaId ? parseInt(filters.empresaId) : undefined,
  }, {
    staleTime: 30000, // 30 segundos - dados considerados frescos
    gcTime: 5 * 60 * 1000, // 5 minutos de cache
    refetchOnWindowFocus: false, // Não refazer query ao focar na janela
  });
  // Otimizar queries com cache
  const { data: empresas } = trpc.empresas.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });
  const { data: todosCargos } = trpc.cargos.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const { data: todosSetores } = trpc.setores.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  
  // Filtrar cargos e setores pela empresa selecionada
  const cargos = useMemo(() => {
    if (!todosCargos) return [];
    if (!formData.empresaId) return todosCargos;
    // Mostrar apenas cargos vinculados à empresa selecionada
    return todosCargos.filter((cargo: any) => 
      cargo.empresaId && cargo.empresaId.toString() === formData.empresaId
    );
  }, [todosCargos, formData.empresaId]);
  
  const setores = useMemo(() => {
    if (!todosSetores) return [];
    if (!formData.empresaId) return todosSetores;
    // Mostrar apenas setores vinculados à empresa selecionada
    return todosSetores.filter((setor: any) => 
      setor.empresaId && setor.empresaId.toString() === formData.empresaId
    );
  }, [todosSetores, formData.empresaId]);
  const { data: treinamentosCargo } = trpc.cargoTreinamentos.getByCargo.useQuery(
    { cargoId: formData.cargoId ? parseInt(formData.cargoId) : 0 },
    { enabled: !!formData.cargoId }
  );
  
  const createMutation = trpc.colaboradores.create.useMutation({
    onSuccess: () => {
      utils.colaboradores.list.invalidate();
      toast.success("Colaborador cadastrado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao cadastrar colaborador: " + error.message);
    },
  });

  const updateMutation = trpc.colaboradores.update.useMutation({
    onSuccess: () => {
      utils.colaboradores.list.invalidate();
      toast.success("Colaborador atualizado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar colaborador: " + error.message);
    },
  });

  const deleteMutation = trpc.colaboradores.delete.useMutation({
    onSuccess: () => {
      utils.colaboradores.list.invalidate();
      toast.success("Colaborador excluído com sucesso!");
      setSelectedIds(new Set());
    },
    onError: (error) => {
      toast.error("Erro ao excluir colaborador: " + error.message);
    },
  });

  const deleteManyMutation = trpc.colaboradores.deleteMany.useMutation({
    onSuccess: (data) => {
      utils.colaboradores.list.invalidate();
      toast.success(`${data.deleted} colaborador(es) excluído(s) com sucesso!`);
      setSelectedIds(new Set());
    },
    onError: (error) => {
      toast.error("Erro ao excluir colaboradores: " + error.message);
    },
  });

  const resetForm = () => {
    setEditingId(null);
    setFotoPreview(null);
    setSelectedTrainings(new Set());
    setFormData({
      nomeCompleto: "",
      cargoId: "",
      setorId: "",
      empresaId: "",
      dataAdmissao: "",
      dataPrimeiroAso: "",
      validadeAso: "",
      dataNascimento: "",
      cidadeNascimento: "",
      estadoNascimento: "",
      rg: "",
      cpf: "",
      pis: "",
      tipoLogradouro: "",
      nomeLogradouro: "",
      numeroEndereco: "",
      complementoEndereco: "",
      cidadeEndereco: "",
      estadoEndereco: "",
      cep: "",
      fotoUrl: "",
      telefonePrincipal: "",
      telefoneRecado: "",
      nomePessoaRecado: "",
      grauParentesco: "",
      observacoes: "",
      status: "ativo",
    });
    setDialogOpen(false);
  };

  const formatPhoneNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 3) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
    if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3)}`;
    if (cleaned.length <= 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  };

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxWidth = 400;
        const maxHeight = 600;
        
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const compressed = await compressImage(base64);
        setFotoPreview(compressed);
        setFormData({ ...formData, fotoUrl: compressed });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.empresaId) {
      toast.error("Selecione uma empresa!");
      return;
    }
    const data = {
      ...formData,
      empresaId: parseInt(formData.empresaId),
      cargoId: formData.cargoId ? parseInt(formData.cargoId) : undefined,
      setorId: formData.setorId ? parseInt(formData.setorId) : undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Memoizar funções de manipulação
  const handleEdit = useCallback((colaborador: any) => {
    setEditingId(colaborador.id);
    setFotoPreview(colaborador.fotoUrl || null);
    setFormData({
      nomeCompleto: colaborador.nomeCompleto,
      cargoId: colaborador.cargoId ? colaborador.cargoId.toString() : "",
      setorId: colaborador.setorId ? colaborador.setorId.toString() : "",
      empresaId: colaborador.empresaId.toString(),
      dataAdmissao: colaborador.dataAdmissao ? new Date(colaborador.dataAdmissao).toISOString().split('T')[0] : "",
      dataPrimeiroAso: colaborador.dataPrimeiroAso ? new Date(colaborador.dataPrimeiroAso).toISOString().split('T')[0] : "",
      validadeAso: colaborador.validadeAso ? new Date(colaborador.validadeAso).toISOString().split('T')[0] : "",
      dataNascimento: colaborador.dataNascimento ? new Date(colaborador.dataNascimento).toISOString().split('T')[0] : "",
      cidadeNascimento: colaborador.cidadeNascimento || "",
      estadoNascimento: colaborador.estadoNascimento || "",
      rg: colaborador.rg || "",
      cpf: colaborador.cpf || "",
      pis: colaborador.pis || "",
      tipoLogradouro: colaborador.tipoLogradouro || "",
      nomeLogradouro: colaborador.nomeLogradouro || "",
      numeroEndereco: colaborador.numeroEndereco || "",
      complementoEndereco: colaborador.complementoEndereco || "",
      cidadeEndereco: colaborador.cidadeEndereco || "",
      estadoEndereco: colaborador.estadoEndereco || "",
      cep: colaborador.cep || "",
      fotoUrl: colaborador.fotoUrl || "",
      telefonePrincipal: colaborador.telefonePrincipal || "",
      telefoneRecado: colaborador.telefoneRecado || "",
      nomePessoaRecado: colaborador.nomePessoaRecado || "",
      grauParentesco: colaborador.grauParentesco || "",
      observacoes: colaborador.observacoes || "",
      status: colaborador.status || "ativo",
    });
    setSelectedTrainings(new Set(colaborador.treinamentos?.map((t: any) => t.id) || []));
    setDialogOpen(true);
  }, []);

  const handleDelete = useCallback((id: number): void => {
    if (confirm("Tem certeza que deseja excluir este colaborador?")) {
      deleteMutation.mutate({ id });
    }
  }, [deleteMutation]);

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (!colaboradores) return;
    if (selectedIds.size === colaboradores.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(colaboradores.map((c: any) => c.id)));
    }
  }, [colaboradores, selectedIds.size]);

  const handleDeleteMany = () => {
    if (selectedIds.size === 0) {
      toast.error("Selecione pelo menos um colaborador para excluir");
      return;
    }
    if (window.confirm(`Tem certeza que deseja excluir ${selectedIds.size} colaborador(es)?`)) {
      deleteManyMutation.mutate({ ids: Array.from(selectedIds) });
    }
  };

  const exportarColaboradores = (exportarTodos: boolean) => {
    if (!colaboradores || colaboradores.length === 0) {
      toast.error("Nenhum colaborador para exportar");
      return;
    }

    const idsParaExportar = exportarTodos 
      ? colaboradores.map((c: any) => c.id)
      : Array.from(selectedIds);

    if (idsParaExportar.length === 0) {
      toast.error("Selecione pelo menos um colaborador para exportar");
      return;
    }

    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const colaboradoresParaExportar = colaboradores.filter((c: any) => idsParaExportar.includes(c.id));
      let primeiraFicha = true;

      for (const colaborador of colaboradoresParaExportar) {
        if (!primeiraFicha) pdf.addPage();
        primeiraFicha = false;

        pdf.setFontSize(16);
        pdf.text("FICHA DE CADASTRO DO COLABORADOR", 105, 15, { align: "center" });

        const lineHeight = 7;
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 10;
        const maxWidth = 190;
        let yPos = 25;
        
        if (colaborador.foto) {
          try {
            const fotoWidth = 30;
            const fotoHeight = 40;
            (pdf as any).addImage(colaborador.foto, "JPEG", margin, yPos, fotoWidth, fotoHeight);
            yPos += fotoHeight + 5;
          } catch (error) {
            console.error("Erro ao adicionar foto:", error);
          }
        }

        const addField = (label: string, value: string | undefined) => {
          if (yPos > pageHeight - 20) { pdf.addPage(); yPos = 15; }
          pdf.setFontSize(9);
          (pdf as any).setFont(undefined, "bold");
          (pdf as any).text(`${label}:`, margin, yPos);
          (pdf as any).setFont(undefined, "normal");
          (pdf as any).text(value || "-", margin + 50, yPos);
          yPos += lineHeight;
        };

        const addSection = (title: string) => {
          if (yPos > pageHeight - 25) { pdf.addPage(); yPos = 15; }
          pdf.setFontSize(11);
          (pdf as any).setFont(undefined, "bold");
          (pdf as any).text(title, margin, yPos);
          (pdf as any).setDrawColor(0);
          (pdf as any).line(margin, yPos + 1, margin + maxWidth, yPos + 1);
          yPos += lineHeight + 2;
        };

        addSection("INFORMACOES PESSOAIS");
        addField("Nome Completo", colaborador.nomeCompleto);
        addField("Data de Nascimento", formatDate(colaborador.dataNascimento));
        addField("Cidade de Nascimento", colaborador.cidadeNascimento);
        addField("Estado de Nascimento", colaborador.estadoNascimento);
        addField("RG", colaborador.rg);
        addField("CPF", colaborador.cpf);
        addField("PIS", colaborador.pis);

        addSection("INFORMACOES PROFISSIONAIS");
        addField("Empresa", getEmpresaName(colaborador.empresaId));
        addField("Cargo", colaborador.nomeCargo || "-");
        addField("Setor", colaborador.nomeSetor || "-");
        addField("Data de Admissao", formatDate(colaborador.dataAdmissao));
        addField("Data Primeiro ASO", formatDate(colaborador.dataPrimeiroAso));
        addField("Validade do ASO", formatDate(colaborador.validadeAso));

        addSection("ENDERECO");
        addField("Tipo de Logradouro", colaborador.tipoLogradouro);
        addField("Rua/Avenida", colaborador.nomeLogradouro);
        addField("Numero", colaborador.numeroEndereco);
        addField("Complemento", colaborador.complementoEndereco);
        addField("Cidade", colaborador.cidadeEndereco);
        addField("Estado", colaborador.estadoEndereco);
        addField("CEP", colaborador.cep);

        addSection("CONTATOS");
        addField("Telefone Principal", colaborador.telefonePrincipal);
        addField("Telefone para Recado", colaborador.telefoneRecado);

        addSection("CONTATO DE EMERGENCIA");
        addField("Nome da Pessoa de Recado", colaborador.nomePessoaRecado);
        addField("Grau de Parentesco", colaborador.grauParentesco);

        if (colaborador.observacoes) {
          addSection("OBSERVACOES");
          const linhas = pdf.splitTextToSize(colaborador.observacoes, maxWidth - 20);
          pdf.setFontSize(9);
          (pdf as any).setFont(undefined, "normal");
          linhas.forEach((linha: string | undefined) => {
            if (yPos > pageHeight - 20) { pdf.addPage(); yPos = 15; }
            (pdf as any).text(linha || "", margin + 5, yPos);
            yPos += lineHeight;
          });
        }

        pdf.setFontSize(8);
        (pdf as any).setFont(undefined, "italic");
        const dataHora = `Gerado em: ${new Date().toLocaleDateString("pt-BR")} as ${new Date().toLocaleTimeString("pt-BR")}`;
        (pdf as any).text(dataHora, 105, pageHeight - 5, { align: "center" });
      }

      pdf.save(`colaboradores_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success(`${idsParaExportar.length} colaborador(es) exportado(s) com sucesso!`);
      setSelectedIds(new Set());
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF");
    }
  };

  // Memoizar função de formatação de data
  const formatDate = useCallback((date: any) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  }, []);

  // Memoizar mapa de empresas para busca O(1) em vez de O(n)
  const empresasMap = useMemo(() => {
    if (!empresas) return new Map();
    const map = new Map();
    empresas.forEach((empresa: any) => {
      map.set(empresa.id, empresa.razaoSocial);
    });
    return map;
  }, [empresas]);

  // Função otimizada para buscar nome da empresa
  const getEmpresaName = useCallback((empresaId: number) => {
    return empresasMap.get(empresaId) || "-";
  }, [empresasMap]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cadastrar Colaboradores</h2>
          <p className="text-gray-600 mt-1">Gerencie os colaboradores com ficha completa</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Colaborador" : "Novo Colaborador"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seção 1: Foto */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Foto</h3>
                <div className="flex items-center gap-4">
                    {fotoPreview && (
                      <img src={fotoPreview} alt="Preview" className="w-24 h-24 rounded-lg object-cover" />
                    )}
                    <div>
                      <Label htmlFor="foto">Selecionar Foto</Label>
                      <Input
                        id="foto"
                        type="file"
                        accept="image/*"
                        onChange={handleFotoChange}
                        className="mt-2"
                      />
                      <p className="text-sm text-gray-500 mt-1">Máximo 5MB. Formatos: JPG, PNG</p>
                    </div>
                </div>
              </div>

              {/* Seção 2: Informações Pessoais */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Informações Pessoais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                      <Input
                        id="nomeCompleto"
                        value={formData.nomeCompleto}
                        onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                      <Input
                        id="dataNascimento"
                        type="date"
                        value={formData.dataNascimento}
                        onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cidadeNascimento">Cidade de Nascimento</Label>
                      <Input
                        id="cidadeNascimento"
                        value={formData.cidadeNascimento}
                        onChange={(e) => setFormData({ ...formData, cidadeNascimento: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="estadoNascimento">Estado de Nascimento</Label>
                      <Select
                        value={formData.estadoNascimento}
                        onValueChange={(value) => setFormData({ ...formData, estadoNascimento: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS.map((estado) => (
                            <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rg">RG</Label>
                      <Input
                        id="rg"
                        value={formData.rg}
                        onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                        placeholder="Ex: 12.345.678-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                        placeholder="Ex: 123.456.789-10"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pis">PIS</Label>
                      <Input
                        id="pis"
                        value={formData.pis}
                        onChange={(e) => setFormData({ ...formData, pis: e.target.value })}
                        placeholder="Ex: 123.45678.90-1"
                      />
                    </div>
                </div>
              </div>

              {/* Seção 3: Informações Profissionais */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Informações Profissionais</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="empresaId">Empresa *</Label>
                      <Select
                        value={formData.empresaId}
                        onValueChange={(value) => {
                          setFormData({ ...formData, empresaId: value, cargoId: "", setorId: "" });
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma empresa" />
                        </SelectTrigger>
                        <SelectContent>
                          {empresas?.map((empresa: any) => (
                            <SelectItem key={empresa.id} value={empresa.id.toString()}>
                              {empresa.razaoSocial}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <Label htmlFor="cargoId">Cargo</Label>
                      <Select
                        value={formData.cargoId}
                        onValueChange={(value) => {
                          setFormData({ ...formData, cargoId: value });
                          // Limpar seleção de treinamentos quando cargo muda
                          setSelectedTrainings(new Set());
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um cargo" />
                        </SelectTrigger>
                        <SelectContent>
                          {cargos?.map((cargo: any) => (
                            <SelectItem key={cargo.id} value={cargo.id.toString()}>
                              {cargo.nomeCargo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="setorId">Setor</Label>
                      <Select
                        value={formData.setorId}
                        onValueChange={(value) => setFormData({ ...formData, setorId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um setor" />
                        </SelectTrigger>
                        <SelectContent>
                          {setores?.map((setor: any) => (
                            <SelectItem key={setor.id} value={setor.id.toString()}>
                              {setor.nomeSetor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dataAdmissao">Data de Admissão</Label>
                      <Input
                        id="dataAdmissao"
                        type="date"
                        value={formData.dataAdmissao}
                        onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataPrimeiroAso">Data Primeiro ASO</Label>
                      <Input
                        id="dataPrimeiroAso"
                        type="date"
                        value={formData.dataPrimeiroAso}
                        onChange={(e) => setFormData({ ...formData, dataPrimeiroAso: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="validadeAso">Validade do ASO</Label>
                      <Input
                        id="validadeAso"
                        type="date"
                        value={formData.validadeAso}
                        onChange={(e) => setFormData({ ...formData, validadeAso: e.target.value })}
                      />
                    </div>
                </div>
              </div>

              {/* Seção 4: Endereço */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tipoLogradouro">Tipo de Logradouro</Label>
                      <Select
                        value={formData.tipoLogradouro}
                        onValueChange={(value) => setFormData({ ...formData, tipoLogradouro: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_LOGRADOURO.map((tipo) => (
                            <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="nomeLogradouro">Nome da Rua/Avenida</Label>
                      <Input
                        id="nomeLogradouro"
                        value={formData.nomeLogradouro}
                        onChange={(e) => setFormData({ ...formData, nomeLogradouro: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="numeroEndereco">Número</Label>
                      <Input
                        id="numeroEndereco"
                        value={formData.numeroEndereco}
                        onChange={(e) => setFormData({ ...formData, numeroEndereco: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="complementoEndereco">Complemento</Label>
                      <Input
                        id="complementoEndereco"
                        value={formData.complementoEndereco}
                        onChange={(e) => setFormData({ ...formData, complementoEndereco: e.target.value })}
                        placeholder="Apto, sala, etc"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cidadeEndereco">Cidade</Label>
                      <Input
                        id="cidadeEndereco"
                        value={formData.cidadeEndereco}
                        onChange={(e) => setFormData({ ...formData, cidadeEndereco: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="estadoEndereco">Estado</Label>
                      <Select
                        value={formData.estadoEndereco}
                        onValueChange={(value) => setFormData({ ...formData, estadoEndereco: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS.map((estado) => (
                            <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                        placeholder="Ex: 12345-678"
                      />
                    </div>
                </div>
              </div>

              {/* Seção 5: Contatos */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Contatos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="telefonePrincipal">Telefone Principal</Label>
                      <Input
                        id="telefonePrincipal"
                        value={formData.telefonePrincipal}
                        onChange={(e) => setFormData({ ...formData, telefonePrincipal: formatPhoneNumber(e.target.value) })}
                        placeholder="(xxxx) x xxxx-xxxx"
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefoneRecado">Telefone para Recado</Label>
                      <Input
                        id="telefoneRecado"
                        value={formData.telefoneRecado}
                        onChange={(e) => setFormData({ ...formData, telefoneRecado: formatPhoneNumber(e.target.value) })}
                        placeholder="(xxxx) x xxxx-xxxx"
                      />
                    </div>
                </div>
              </div>

              {/* Seção 6: Contato de Emergência */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Contato de Emergência</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nomePessoaRecado">Nome da Pessoa de Recado</Label>
                      <Input
                        id="nomePessoaRecado"
                        value={formData.nomePessoaRecado}
                        onChange={(e) => setFormData({ ...formData, nomePessoaRecado: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="grauParentesco">Grau de Parentesco</Label>
                      <Select
                        value={formData.grauParentesco}
                        onValueChange={(value) => setFormData({ ...formData, grauParentesco: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pai">Pai</SelectItem>
                          <SelectItem value="Mãe">Mãe</SelectItem>
                          <SelectItem value="Cônjuge">Cônjuge</SelectItem>
                          <SelectItem value="Filho(a)">Filho(a)</SelectItem>
                          <SelectItem value="Irmão(ã)">Irmão(ã)</SelectItem>
                          <SelectItem value="Avô(ó)">Avô(ó)</SelectItem>
                          <SelectItem value="Tio(a)">Tio(a)</SelectItem>
                          <SelectItem value="Primo(a)">Primo(a)</SelectItem>
                          <SelectItem value="Amigo(a)">Amigo(a)</SelectItem>
                          <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                </div>
              </div>

              {/* Seção 7: Treinamentos Obrigatórios */}
              {treinamentosCargo && treinamentosCargo.length > 0 && (
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-4">Treinamentos Obrigatórios</h3>
                  <p className="text-sm text-gray-600 mb-4">Selecione os treinamentos que este colaborador já realizou:</p>
                  <div className="space-y-3">
                      {treinamentosCargo.map((treinamento: any) => (
                        <div key={treinamento.id} className="flex items-center space-x-3">
                          <Checkbox
                            id={`treinamento-${treinamento.id}`}
                            checked={selectedTrainings.has(treinamento.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedTrainings);
                              if (checked) {
                                newSelected.add(treinamento.id);
                              } else {
                                newSelected.delete(treinamento.id);
                              }
                              setSelectedTrainings(newSelected);
                            }}
                          />
                          <Label
                            htmlFor={`treinamento-${treinamento.id}`}
                            className="cursor-pointer font-medium"
                          >
                            {treinamento.nomeTreinamento}
                          </Label>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Seção 8: Observações */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Observações</h3>
                <div>
                    <Label htmlFor="observacoes">Observações Adicionais</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                      placeholder="Adicione qualquer observação relevante"
                      rows={3}
                    />
                </div>
              </div>

              {/* Seção 9: Status */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Status</h3>
                <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "ativo" | "inativo") => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" className="flex-1">
                  {editingId ? "Atualizar" : "Cadastrar"}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
            </DialogContent>
          </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros de Pesquisa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Buscar por Nome</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Digite o nome..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="pl-10"
                />
                {isDebouncing && (
                  <div className="absolute right-3 top-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                  </div>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="dataAdmissaoInicio">Data Admissão - De</Label>
              <Input
                id="dataAdmissaoInicio"
                type="date"
                value={filters.dataAdmissaoInicio}
                onChange={(e) => setFilters({ ...filters, dataAdmissaoInicio: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dataAdmissaoFim">Data Admissão - Até</Label>
              <Input
                id="dataAdmissaoFim"
                type="date"
                value={filters.dataAdmissaoFim}
                onChange={(e) => setFilters({ ...filters, dataAdmissaoFim: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="empresaId">Empresa</Label>
              <Select
                value={filters.empresaId || "all"}
                onValueChange={(value) => setFilters({ ...filters, empresaId: value === "all" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {empresas?.map((empresa: any) => (
                    <SelectItem key={empresa.id} value={empresa.id.toString()}>
                      {empresa.razaoSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Lista de Colaboradores</CardTitle>
            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteMany}
                    disabled={deleteManyMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir {selectedIds.size} selecionado(s)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => exportarColaboradores(false)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar Selecionados ({selectedIds.size})
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportarColaboradores(true)}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar Todos
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando...</div>
          ) : colaboradores && colaboradores.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.size === colaboradores.length && colaboradores.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Admissão</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {colaboradores.map((colaborador: any) => (
                      <ColaboradorRow
                        key={colaborador.id}
                        colaborador={colaborador}
                        isSelected={selectedIds.has(colaborador.id)}
                        empresaNome={getEmpresaName(colaborador.empresaId)}
                        dataFormatada={formatDate(colaborador.dataAdmissao)}
                        onToggleSelection={toggleSelection}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Nenhum colaborador cadastrado ainda
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
