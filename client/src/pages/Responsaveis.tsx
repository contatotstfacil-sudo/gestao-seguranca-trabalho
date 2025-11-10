import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, Filter, X } from "lucide-react";
import { toast } from "sonner";

export default function Responsaveis({ showLayout = true }: { showLayout?: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nomeCompleto: "",
    funcao: "",
    registroProfissional: "",
    status: "ativo" as "ativo" | "inativo",
  });
  
  // Estados para filtros e seleção
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroFuncao, setFiltroFuncao] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const utils = trpc.useUtils();
  const { data: responsaveis = [], isLoading } = trpc.responsaveis.list.useQuery();

  const createMutation = trpc.responsaveis.create.useMutation({
    onSuccess: () => {
      toast.success("Responsável criado com sucesso!");
      utils.responsaveis.list.invalidate();
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateMutation = trpc.responsaveis.update.useMutation({
    onSuccess: () => {
      toast.success("Responsável atualizado com sucesso!");
      utils.responsaveis.list.invalidate();
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteMutation = trpc.responsaveis.delete.useMutation({
    onSuccess: () => {
      toast.success("Responsável deletado com sucesso!");
      utils.responsaveis.list.invalidate();
      setSelectedIds([]);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteManyMutation = trpc.responsaveis.deleteMany.useMutation({
    onSuccess: () => {
      toast.success(`${selectedIds.length} responsável(is) deletado(s) com sucesso!`);
      utils.responsaveis.list.invalidate();
      setSelectedIds([]);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      nomeCompleto: "",
      funcao: "",
      registroProfissional: "",
      status: "ativo",
    });
    setEditingId(null);
  };

  const handleEdit = (responsavel: any) => {
    setEditingId(responsavel.id);
    setFormData({
      nomeCompleto: responsavel.nomeCompleto || "",
      funcao: responsavel.funcao || "",
      registroProfissional: responsavel.registroProfissional || "",
      status: responsavel.status || "ativo",
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nomeCompleto.trim()) {
      toast.error("Nome completo é obrigatório");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este responsável?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDeleteMany = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um responsável para deletar");
      return;
    }
    if (confirm(`Tem certeza que deseja deletar ${selectedIds.length} responsável(is)?`)) {
      deleteManyMutation.mutate({ ids: selectedIds });
    }
  };

  // Obter lista única de funções para o filtro
  const funcoesUnicas = useMemo(() => {
    const funcoes = responsaveis
      .map((r: any) => r.funcao)
      .filter((f: string | null | undefined) => f && f.trim() !== "");
    return Array.from(new Set(funcoes)).sort();
  }, [responsaveis]);

  // Filtrar responsáveis
  const responsaveisFiltrados = useMemo(() => {
    return responsaveis.filter((r: any) => {
      const nomeMatch = !filtroNome || 
        r.nomeCompleto?.toLowerCase().includes(filtroNome.toLowerCase());
      const funcaoMatch = !filtroFuncao || 
        r.funcao?.toLowerCase().includes(filtroFuncao.toLowerCase());
      return nomeMatch && funcaoMatch;
    });
  }, [responsaveis, filtroNome, filtroFuncao]);

  // Seleção
  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(responsaveisFiltrados.map((r: any) => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected = responsaveisFiltrados.length > 0 && 
    responsaveisFiltrados.every((r: any) => selectedIds.includes(r.id));
  const isSomeSelected = responsaveisFiltrados.some((r: any) => selectedIds.includes(r.id));

  const limparFiltros = () => {
    setFiltroNome("");
    setFiltroFuncao("");
  };

  const content = (
    <div className="space-y-6">
      {showLayout && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Responsáveis</h1>
            <p className="text-muted-foreground">
              Cadastre responsáveis por assinar documentos e treinamentos
            </p>
          </div>
        </div>
      )}
      {!showLayout && (
        <div className="mb-4">
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Responsável
          </Button>
        </div>
      )}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {showLayout && (
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Responsável
            </Button>
          </DialogTrigger>
        )}
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Responsável" : "Novo Responsável"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                  <Input
                    id="nomeCompleto"
                    value={formData.nomeCompleto}
                    onChange={(e) =>
                      setFormData({ ...formData, nomeCompleto: e.target.value })
                    }
                    placeholder="Ex: João Silva"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="funcao">Função</Label>
                  <Input
                    id="funcao"
                    value={formData.funcao}
                    onChange={(e) =>
                      setFormData({ ...formData, funcao: e.target.value })
                    }
                    placeholder="Ex: Engenheiro de Segurança do Trabalho"
                  />
                </div>

                <div>
                  <Label htmlFor="registroProfissional">Registro Profissional</Label>
                  <Input
                    id="registroProfissional"
                    value={formData.registroProfissional}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        registroProfissional: e.target.value,
                      })
                    }
                    placeholder="Ex: CREA 123456"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: "ativo" | "inativo") =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Responsáveis</CardTitle>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteMany}
                  disabled={deleteManyMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Selecionados ({selectedIds.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Filtros */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Filtros</span>
                {(filtroNome || filtroFuncao) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={limparFiltros}
                    className="h-6 px-2 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="filtroNome" className="text-sm">Filtrar por Nome</Label>
                  <Input
                    id="filtroNome"
                    value={filtroNome}
                    onChange={(e) => setFiltroNome(e.target.value)}
                    placeholder="Digite o nome..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="filtroFuncao" className="text-sm">Filtrar por Função</Label>
                  <Input
                    id="filtroFuncao"
                    value={filtroFuncao}
                    onChange={(e) => setFiltroFuncao(e.target.value)}
                    placeholder="Digite a função..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : responsaveis.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum responsável cadastrado. Clique em "Novo Responsável" para começar.
              </div>
            ) : responsaveisFiltrados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum responsável encontrado com os filtros aplicados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={isAllSelected}
                          onCheckedChange={handleSelectAll}
                          aria-label="Selecionar todos"
                        />
                      </TableHead>
                      <TableHead>Nome Completo</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Registro Profissional</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responsaveisFiltrados.map((responsavel: any) => (
                      <TableRow key={responsavel.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(responsavel.id)}
                            onCheckedChange={() => handleToggleSelect(responsavel.id)}
                            aria-label={`Selecionar ${responsavel.nomeCompleto}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {responsavel.nomeCompleto}
                        </TableCell>
                        <TableCell>{responsavel.funcao || "-"}</TableCell>
                        <TableCell>{responsavel.registroProfissional || "-"}</TableCell>
                        <TableCell>
                          {responsavel.status === "ativo" ? (
                            <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                              Ativo
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">
                              Inativo
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(responsavel)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(responsavel.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {responsaveisFiltrados.length !== responsaveis.length && (
                  <div className="mt-4 text-sm text-muted-foreground text-center">
                    Mostrando {responsaveisFiltrados.length} de {responsaveis.length} responsável(is)
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );

  if (showLayout) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
}

