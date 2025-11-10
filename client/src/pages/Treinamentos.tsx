import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Treinamentos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nomeTreinamento: "",
    tipoNr: "",
    colaboradorId: "",
    empresaId: "",
    dataRealizacao: "",
    dataValidade: "",
    status: "valido" as "valido" | "vencido" | "a_vencer",
  });

  const [filters, setFilters] = useState({
    searchTerm: "",
    colaboradorNome: "",
    funcao: "",
    empresaId: "",
    tipoNr: "",
  });

  const utils = trpc.useUtils();
  const { data: treinamentos, isLoading } = trpc.treinamentos.list.useQuery();
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();
  const { data: empresas } = trpc.empresas.list.useQuery();
  
  const createMutation = trpc.treinamentos.create.useMutation({
    onSuccess: () => {
      utils.treinamentos.list.invalidate();
      toast.success("Treinamento cadastrado com sucesso!");
      resetForm();
    },
  });

  const updateMutation = trpc.treinamentos.update.useMutation({
    onSuccess: () => {
      utils.treinamentos.list.invalidate();
      toast.success("Treinamento atualizado com sucesso!");
      resetForm();
    },
  });

  const deleteMutation = trpc.treinamentos.delete.useMutation({
    onSuccess: () => {
      utils.treinamentos.list.invalidate();
      toast.success("Treinamento excluído com sucesso!");
    },
  });

  const resetForm = () => {
    setFormData({
      nomeTreinamento: "",
      tipoNr: "",
      colaboradorId: "",
      empresaId: "",
      dataRealizacao: "",
      dataValidade: "",
      status: "valido",
    });
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = {
      ...formData,
      colaboradorId: parseInt(formData.colaboradorId),
      empresaId: parseInt(formData.empresaId),
      dataRealizacao: formData.dataRealizacao || undefined,
      dataValidade: formData.dataValidade || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (treinamento: any) => {
    setEditingId(treinamento.id);
    setFormData({
      nomeTreinamento: treinamento.nomeTreinamento,
      tipoNr: treinamento.tipoNr || "",
      colaboradorId: treinamento.colaboradorId.toString(),
      empresaId: treinamento.empresaId.toString(),
      dataRealizacao: treinamento.dataRealizacao ? new Date(treinamento.dataRealizacao).toISOString().split('T')[0] : "",
      dataValidade: treinamento.dataValidade ? new Date(treinamento.dataValidade).toISOString().split('T')[0] : "",
      status: treinamento.status,
    });
    setDialogOpen(true);
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getColaboradorName = (colaboradorId: number) => {
    const colaborador = colaboradores?.find((c: any) => c.id === colaboradorId);
    return colaborador?.nomeCompleto || "-";
  };

  const getEmpresaName = (empresaId: number) => {
    const empresa = empresas?.find((e: any) => e.id === empresaId);
    return empresa?.razaoSocial || "-";
  };

  const filteredTreinamentos = treinamentos?.filter((t: any) => {
    const colaborador = colaboradores?.find((c: any) => c.id === t.colaboradorId);
    
    // Filtro por nome do treinamento
    if (filters.searchTerm && !t.nomeTreinamento.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtro por nome do colaborador
    if (filters.colaboradorNome && !colaborador?.nomeCompleto.toLowerCase().includes(filters.colaboradorNome.toLowerCase())) {
      return false;
    }
    
    // Filtro por função/cargo
    if (filters.funcao && !colaborador?.funcao?.toLowerCase().includes(filters.funcao.toLowerCase())) {
      return false;
    }
    
    // Filtro por empresa
    if (filters.empresaId && t.empresaId.toString() !== filters.empresaId) {
      return false;
    }
    
    // Filtro por tipo de treinamento
    if (filters.tipoNr && t.tipoNr !== filters.tipoNr) {
      return false;
    }
    
    return true;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Treinamentos</h1>
            <p className="text-gray-600 mt-1">Gerencie os treinamentos obrigatórios</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Treinamento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Treinamento" : "Novo Treinamento"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nomeTreinamento">Nome do Treinamento *</Label>
                  <Input
                    id="nomeTreinamento"
                    value={formData.nomeTreinamento}
                    onChange={(e) => setFormData({ ...formData, nomeTreinamento: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="tipoNr">Tipo NR</Label>
                  <Select
                    value={formData.tipoNr}
                    onValueChange={(value) => setFormData({ ...formData, tipoNr: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NR-10">NR-10</SelectItem>
                      <SelectItem value="NR-33">NR-33</SelectItem>
                      <SelectItem value="NR-35">NR-35</SelectItem>
                      <SelectItem value="NR-06">NR-06</SelectItem>
                      <SelectItem value="NR-12">NR-12</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="empresaId">Empresa *</Label>
                  <Select
                    value={formData.empresaId}
                    onValueChange={(value) => setFormData({ ...formData, empresaId: value })}
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
                <div>
                  <Label htmlFor="colaboradorId">Colaborador *</Label>
                  <Select
                    value={formData.colaboradorId}
                    onValueChange={(value) => setFormData({ ...formData, colaboradorId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores?.filter((c: any) => !formData.empresaId || c.empresaId.toString() === formData.empresaId).map((colaborador: any) => (
                        <SelectItem key={colaborador.id} value={colaborador.id.toString()}>
                          {colaborador.nomeCompleto}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dataRealizacao">Data de Realização</Label>
                  <Input
                    id="dataRealizacao"
                    type="date"
                    value={formData.dataRealizacao}
                    onChange={(e) => setFormData({ ...formData, dataRealizacao: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="dataValidade">Data de Validade</Label>
                  <Input
                    id="dataValidade"
                    type="date"
                    value={formData.dataValidade}
                    onChange={(e) => setFormData({ ...formData, dataValidade: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "valido" | "vencido" | "a_vencer") => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="valido">Válido</SelectItem>
                      <SelectItem value="a_vencer">A Vencer</SelectItem>
                      <SelectItem value="vencido">Vencido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-4">
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
            <div className="flex justify-between items-center">
              <CardTitle>Filtros de Pesquisa</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ searchTerm: "", colaboradorNome: "", funcao: "", empresaId: "", tipoNr: "" })}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="search">Nome do Treinamento</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Buscar..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="colaborador">Nome do Colaborador</Label>
                <Input
                  id="colaborador"
                  placeholder="Buscar..."
                  value={filters.colaboradorNome}
                  onChange={(e) => setFilters({ ...filters, colaboradorNome: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="funcao">Funcao/Cargo</Label>
                <Input
                  id="funcao"
                  placeholder="Buscar..."
                  value={filters.funcao}
                  onChange={(e) => setFilters({ ...filters, funcao: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="empresa-filter">Empresa</Label>
                <Select
                  value={filters.empresaId}
                  onValueChange={(value) => setFilters({ ...filters, empresaId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as Empresas" />
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
              <div>
                <Label htmlFor="tipo-filter">Tipo de Treinamento</Label>
                <Select
                  value={filters.tipoNr}
                  onValueChange={(value) => setFilters({ ...filters, tipoNr: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos os Tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NR-10">NR-10</SelectItem>
                    <SelectItem value="NR-33">NR-33</SelectItem>
                    <SelectItem value="NR-35">NR-35</SelectItem>
                    <SelectItem value="NR-06">NR-06</SelectItem>
                    <SelectItem value="NR-12">NR-12</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Treinamentos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : filteredTreinamentos && filteredTreinamentos.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Treinamento</TableHead>
                    <TableHead>Tipo NR</TableHead>
                    <TableHead>Colaborador</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Realização</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTreinamentos.map((treinamento: any) => (
                    <TableRow key={treinamento.id}>
                      <TableCell className="font-medium">{treinamento.nomeTreinamento}</TableCell>
                      <TableCell>{treinamento.tipoNr || "-"}</TableCell>
                      <TableCell>{getColaboradorName(treinamento.colaboradorId)}</TableCell>
                      <TableCell>{getEmpresaName(treinamento.empresaId)}</TableCell>
                      <TableCell>{formatDate(treinamento.dataRealizacao)}</TableCell>
                      <TableCell>{formatDate(treinamento.dataValidade)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            treinamento.status === "valido"
                              ? "bg-green-100 text-green-800"
                              : treinamento.status === "a_vencer"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {treinamento.status === "valido" ? "Válido" : treinamento.status === "a_vencer" ? "A Vencer" : "Vencido"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(treinamento)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate({ id: treinamento.id })}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum treinamento cadastrado ainda
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
