import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

const ESTADOS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const TIPOS_LOGRADOURO = [
  "Rua", "Avenida", "Travessa", "Praça", "Alameda", "Estrada",
  "Rodovia", "Largo", "Passagem", "Viela", "Beco", "Caminho"
];

const GRAUS_RISCO = [
  "Grau 1 (Mínimo)",
  "Grau 2 (Baixo)",
  "Grau 3 (Médio)",
  "Grau 4 (Alto)"
];

export default function Empresas() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    razaoSocial: "",
    cnpj: "",
    grauRisco: "",
    cnae: "",
    descricaoAtividade: "",
    responsavelTecnico: "",
    emailContato: "",
    tipoLogradouro: "",
    nomeLogradouro: "",
    numeroEndereco: "",
    complementoEndereco: "",
    bairroEndereco: "",
    cidadeEndereco: "",
    estadoEndereco: "",
    cep: "",
    status: "ativa" as "ativa" | "inativa",
  });

  const [filters, setFilters] = useState({
    searchTerm: "",
    dataInicio: "",
    dataFim: "",
  });

  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const utils = trpc.useUtils();
  const { data: empresas, isLoading } = trpc.empresas.list.useQuery(filters);

  // Limpar seleção quando os filtros mudarem
  useEffect(() => {
    setSelectedIds([]);
  }, [filters.searchTerm, filters.dataInicio, filters.dataFim]);

  // Forçar atualização do Select quando dialog abrir e grauRisco mudar
  const grauRiscoValue = useMemo(() => {
    if (formData.grauRisco && formData.grauRisco.trim() !== "") {
      const trimmed = formData.grauRisco.trim();
      // Verificar se corresponde exatamente
      if (GRAUS_RISCO.includes(trimmed)) {
        return trimmed;
      }
      // Tentar mapear valores antigos (ex: "4" -> "Grau 4 (Alto)")
      const grauNumero = trimmed.match(/\d+/)?.[0];
      if (grauNumero) {
        const grauMapeado = GRAUS_RISCO.find(g => g.includes(`Grau ${grauNumero}`));
        if (grauMapeado) {
          return grauMapeado;
        }
      }
      return trimmed;
    }
    return undefined;
  }, [formData.grauRisco, dialogOpen]);

  // Forçar re-render do Select quando dialog abrir
  useEffect(() => {
    if (dialogOpen && editingId && formData.grauRisco) {
      // Pequeno delay para garantir que o Select seja atualizado
      const timer = setTimeout(() => {
        console.log("🔍 Dialog aberto, grauRisco:", formData.grauRisco);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [dialogOpen, editingId, formData.grauRisco]);
  
  const createMutation = trpc.empresas.create.useMutation({
    onSuccess: () => {
      utils.empresas.list.invalidate();
      toast.success("Empresa cadastrada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      // Extrair mensagem de erro de várias formas possíveis
      let errorMessage = "Erro ao cadastrar empresa";
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      } else if (error.shape?.message) {
        errorMessage = error.shape.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Se a mensagem contém "Você chegou no limite", mostrar apenas essa mensagem
      if (errorMessage.includes("Você chegou no limite")) {
        toast.error("Você chegou no limite.");
      } else {
        toast.error("Erro ao cadastrar empresa: " + errorMessage);
      }
    },
  });

  const updateMutation = trpc.empresas.update.useMutation({
    onSuccess: () => {
      utils.empresas.list.invalidate();
      toast.success("Empresa atualizada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      console.error("❌ Erro ao atualizar:", error);
      toast.error("Erro ao atualizar empresa: " + error.message);
    },
    onMutate: (variables) => {
      console.log("🔄 Mutação iniciada com dados:", variables);
      console.log("🔄 Bairro sendo enviado:", variables.bairroEndereco);
    },
  });

  const deleteMutation = trpc.empresas.delete.useMutation({
    onSuccess: () => {
      utils.empresas.list.invalidate();
      toast.success("Empresa excluída com sucesso!");
      setSelectedIds([]);
    },
    onError: (error) => {
      toast.error("Erro ao excluir empresa: " + error.message);
    },
  });

  const deleteBatchMutation = trpc.empresas.deleteBatch.useMutation({
    onSuccess: (data) => {
      utils.empresas.list.invalidate();
      toast.success(`${data.deletedCount} empresa(s) excluída(s) com sucesso!`);
      setSelectedIds([]);
    },
    onError: (error) => {
      toast.error("Erro ao excluir empresas: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      razaoSocial: "",
      cnpj: "",
      grauRisco: "",
      cnae: "",
      descricaoAtividade: "",
      responsavelTecnico: "",
      emailContato: "",
      tipoLogradouro: "",
      nomeLogradouro: "",
      numeroEndereco: "",
      complementoEndereco: "",
      bairroEndereco: "",
      cidadeEndereco: "",
      estadoEndereco: "",
      cep: "",
      status: "ativa",
    });
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Garantir que todos os campos sejam enviados, incluindo bairroEndereco
    const dadosParaEnviar = {
      ...formData,
      bairroEndereco: formData.bairroEndereco || "", // Sempre incluir, mesmo se vazio
    };
    
    console.log("📤 Enviando dados completos:", dadosParaEnviar);
    console.log("📤 Bairro no formData:", formData.bairroEndereco);
    console.log("📤 Bairro sendo enviado:", dadosParaEnviar.bairroEndereco);
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...dadosParaEnviar });
    } else {
      createMutation.mutate(dadosParaEnviar);
    }
  };

  const handleEdit = (empresa: any) => {
    console.log("🔍 Editando empresa:", empresa);
    console.log("🔍 grauRisco da empresa:", empresa.grauRisco);
    
    setEditingId(empresa.id);
    
    // Garantir que grauRisco seja uma string válida e corresponda a um valor do array
    let grauRisco = "";
    if (empresa.grauRisco && typeof empresa.grauRisco === "string" && empresa.grauRisco.trim() !== "") {
      const grauRiscoTrimmed = empresa.grauRisco.trim();
      // Verificar se o valor corresponde exatamente a um dos valores do array
      if (GRAUS_RISCO.includes(grauRiscoTrimmed)) {
        grauRisco = grauRiscoTrimmed;
      } else {
        // Tentar mapear valores antigos (ex: "4" -> "Grau 4 (Alto)")
        const grauNumero = grauRiscoTrimmed.match(/\d+/)?.[0];
        if (grauNumero) {
          const grauMapeado = GRAUS_RISCO.find(g => g.includes(`Grau ${grauNumero}`));
          if (grauMapeado) {
            grauRisco = grauMapeado;
          } else {
            grauRisco = grauRiscoTrimmed;
          }
        } else {
          grauRisco = grauRiscoTrimmed;
        }
      }
    }
    
    console.log("🔍 grauRisco processado:", grauRisco);
    
    setFormData({
      razaoSocial: empresa.razaoSocial,
      cnpj: empresa.cnpj,
      grauRisco: grauRisco,
      cnae: empresa.cnae || "",
      descricaoAtividade: empresa.descricaoAtividade || "",
      responsavelTecnico: empresa.responsavelTecnico || "",
      emailContato: empresa.emailContato || "",
      tipoLogradouro: empresa.tipoLogradouro || "",
      nomeLogradouro: empresa.nomeLogradouro || "",
      numeroEndereco: empresa.numeroEndereco || "",
      complementoEndereco: empresa.complementoEndereco || "",
      bairroEndereco: empresa.bairroEndereco ?? "",
      cidadeEndereco: empresa.cidadeEndereco || "",
      estadoEndereco: empresa.estadoEndereco || "",
      cep: empresa.cep || "",
      status: empresa.status,
    });
    
    console.log("🔍 formData.grauRisco após setFormData:", grauRisco);
    
    setDialogOpen(true);
  };

  const handleDelete = (id: number): void => {
    if (confirm("Tem certeza que deseja excluir esta empresa?")) {
      deleteMutation.mutate({ id });
    }
  };


  const handleDeleteBatch = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos uma empresa para excluir");
      return;
    }

    const empresasSelecionadas = empresas?.filter((empresa: any) =>
      selectedIds.includes(empresa.id)
    ) || [];

    const nomesEmpresas = empresasSelecionadas
      .map((empresa: any) => empresa.razaoSocial)
      .join(", ");

    if (
      confirm(
        `Tem certeza que deseja excluir ${selectedIds.length} empresa(s)?\n\n${nomesEmpresas}`
      )
    ) {
      deleteBatchMutation.mutate({ ids: selectedIds });
    }
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cadastrar Empresas</h2>
          <p className="text-gray-600 mt-1">Gerencie as empresas cadastradas com informações completas</p>
        </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Empresa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Empresa" : "Nova Empresa"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Seção 1: Informações Básicas */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="razaoSocial">Razão Social *</Label>
                      <Input
                        id="razaoSocial"
                        value={formData.razaoSocial}
                        onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                        placeholder="Ex: 12.345.678/0001-90"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnae">CNAE Principal</Label>
                      <Input
                        id="cnae"
                        value={formData.cnae}
                        onChange={(e) => setFormData({ ...formData, cnae: e.target.value })}
                        placeholder="Ex: 4120400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="descricaoAtividade">Atividades da Empresa</Label>
                      <Textarea
                        id="descricaoAtividade"
                        value={formData.descricaoAtividade}
                        onChange={(e) => setFormData({ ...formData, descricaoAtividade: e.target.value })}
                        placeholder="Descreva as atividades da empresa"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="grauRisco">Grau de Risco</Label>
                      <Select
                        key={`grau-risco-${editingId || 'new'}-${grauRiscoValue || 'empty'}`}
                        value={grauRiscoValue}
                        onValueChange={(value) => {
                          console.log("🔍 Select onChange:", value);
                          setFormData({ ...formData, grauRisco: value });
                        }}
                      >
                        <SelectTrigger className="w-full" id="grauRisco">
                          <SelectValue placeholder="Selecione o grau de risco" />
                        </SelectTrigger>
                        <SelectContent>
                          {GRAUS_RISCO.map((grau) => (
                            <SelectItem key={grau} value={grau}>{grau}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Seção 2: Contatos */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-semibold mb-4">Contatos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="responsavelTecnico">Responsável Técnico</Label>
                      <Input
                        id="responsavelTecnico"
                        value={formData.responsavelTecnico}
                        onChange={(e) => setFormData({ ...formData, responsavelTecnico: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emailContato">Email de Contato</Label>
                      <Input
                        id="emailContato"
                        type="email"
                        value={formData.emailContato}
                        onChange={(e) => setFormData({ ...formData, emailContato: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                {/* Seção 3: Endereço */}
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
                      <Label htmlFor="bairroEndereco">Bairro</Label>
                      <Input
                        id="bairroEndereco"
                        value={formData.bairroEndereco}
                        onChange={(e) => setFormData({ ...formData, bairroEndereco: e.target.value })}
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
                    <div>
                      <Label htmlFor="complementoEndereco">Complemento</Label>
                      <Input
                        id="complementoEndereco"
                        value={formData.complementoEndereco}
                        onChange={(e) => setFormData({ ...formData, complementoEndereco: e.target.value })}
                        placeholder="Sala, bloco, etc"
                      />
                    </div>
                  </div>
                </div>

                {/* Seção 4: Status */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Status</h3>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: "ativa" | "inativa") => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="inativa">Inativa</SelectItem>
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
                <Label htmlFor="search">Buscar por Razão Social</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Digite a razão social..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dataInicio">Data Cadastro - De</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={filters.dataInicio}
                  onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="dataFim">Data Cadastro - Até</Label>
                <Input
                  id="dataFim"
                  type="date"
                  value={filters.dataFim}
                  onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Empresas</CardTitle>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  onClick={handleDeleteBatch}
                  disabled={deleteBatchMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir {selectedIds.length} selecionada(s)
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : empresas && empresas.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            empresas.length > 0 &&
                            selectedIds.length === empresas.length &&
                            empresas.length > 0
                          }
                          onCheckedChange={(checked) => {
                            if (checked && empresas) {
                              setSelectedIds(empresas.map((empresa: any) => empresa.id));
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>Razão Social</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Grau de Risco</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empresas.map((empresa: any) => (
                      <TableRow
                        key={empresa.id}
                        className={selectedIds.includes(empresa.id) ? "bg-muted/50" : ""}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(empresa.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedIds(prev => [...prev, empresa.id]);
                              } else {
                                setSelectedIds(prev => prev.filter(id => id !== empresa.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{empresa.razaoSocial}</TableCell>
                        <TableCell>{empresa.cnpj}</TableCell>
                        <TableCell>{empresa.grauRisco || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              empresa.status === "ativa"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {empresa.status === "ativa" ? "Ativa" : "Inativa"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(empresa)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(empresa.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma empresa cadastrada ainda
              </div>
            )}
          </CardContent>
        </Card>
    </div>
  );
}
