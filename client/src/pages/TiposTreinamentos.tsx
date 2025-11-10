import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit2, Trash2, Search, X } from "lucide-react";
import { toast } from "sonner";

export default function TiposTreinamentos({ showLayout = true }: { showLayout?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    nomeTreinamento: "",
    descricao: "",
    tipoNr: "NR-10" as string | null,
    validadeEmMeses: "",
    status: "ativo" as const,
  });

  const utils = trpc.useUtils();
  const { data: tiposTreinamentos = [], isLoading } = trpc.tiposTreinamentos.list.useQuery({
    searchTerm: searchTerm || undefined,
  });

  const createMutation = trpc.tiposTreinamentos.create.useMutation({
    onSuccess: () => {
      toast.success("Prazo de treinamento criado com sucesso!");
      utils.tiposTreinamentos.list.invalidate();
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateMutation = trpc.tiposTreinamentos.update.useMutation({
    onSuccess: () => {
      toast.success("Prazo de treinamento atualizado com sucesso!");
      utils.tiposTreinamentos.list.invalidate();
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteMutation = trpc.tiposTreinamentos.delete.useMutation({
    onSuccess: () => {
      toast.success("Prazo de treinamento deletado com sucesso!");
      utils.tiposTreinamentos.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteManyMutation = trpc.tiposTreinamentos.deleteMany.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.deleted} tipo(s) de treinamento deletado(s) com sucesso!`);
      setSelectedIds([]);
      utils.tiposTreinamentos.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar tipos de treinamento");
    },
  });

  // Limpar seleção quando o termo de busca mudar
  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm]);

  const resetForm = () => {
    setFormData({
      nomeTreinamento: "",
      descricao: "",
      tipoNr: "NR-10",
      validadeEmMeses: "",
      status: "ativo",
    });
    setEditingId(null);
  };

  const handleEdit = (tipo: any) => {
    setFormData({
      nomeTreinamento: tipo.nomeTreinamento,
      descricao: tipo.descricao || "",
      tipoNr: tipo.tipoNr || "",
      validadeEmMeses: tipo.validadeEmMeses?.toString() || "",
      status: tipo.status,
    });
    setEditingId(tipo.id);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nomeTreinamento.trim()) {
      toast.error("Nome do treinamento é obrigatório");
      return;
    }

    const payload = {
      nomeTreinamento: formData.nomeTreinamento,
      descricao: formData.descricao || undefined,
      tipoNr: formData.tipoNr || undefined,
      validadeEmMeses: formData.validadeEmMeses ? parseInt(formData.validadeEmMeses) : undefined,
      status: formData.status,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este prazo de treinamento?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === tiposTreinamentos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tiposTreinamentos.map((t: any) => t.id));
    }
  };

  const handleDeleteMany = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um prazo de treinamento para excluir");
      return;
    }
    if (
      window.confirm(
        `Tem certeza que deseja excluir ${selectedIds.length} tipo(s) de treinamento?`
      )
    ) {
      deleteManyMutation.mutate({ ids: selectedIds });
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Prazos de Treinamentos</h2>
          <p className="text-muted-foreground">Gerencie os prazos de treinamentos disponíveis</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Prazo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Prazo de Treinamento" : "Novo Prazo de Treinamento"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nome">Nome do Prazo de Treinamento *</Label>
                  <Input
                    id="nome"
                    value={formData.nomeTreinamento}
                    onChange={(e) =>
                      setFormData({ ...formData, nomeTreinamento: e.target.value })
                    }
                    placeholder="Ex: NR-10 Eletricidade"
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do treinamento"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="validade">Validade (em meses)</Label>
                  <Input
                    id="validade"
                    type="number"
                    value={formData.validadeEmMeses}
                    onChange={(e) =>
                      setFormData({ ...formData, validadeEmMeses: e.target.value })
                    }
                    placeholder="Ex: 24"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, status: value })
                    }
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

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
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
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Buscar Prazos de Treinamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por nome do treinamento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
            <CardTitle>Prazos de Treinamentos</CardTitle>
              {selectedIds.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteMany}
                  disabled={deleteManyMutation.isPending}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir {selectedIds.length} selecionado(s)
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : tiposTreinamentos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm
                  ? "Nenhum prazo de treinamento encontrado com o termo de busca."
                  : "Nenhum prazo de treinamento cadastrado. Clique em 'Novo Prazo' para começar."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={
                            tiposTreinamentos.length > 0 &&
                            selectedIds.length === tiposTreinamentos.length
                          }
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Validade (meses)</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tiposTreinamentos.map((tipo: any) => (
                      <TableRow key={tipo.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(tipo.id)}
                            onChange={() => handleToggleSelect(tipo.id)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{tipo.nomeTreinamento}</TableCell>
                        <TableCell>{tipo.validadeEmMeses || "-"}</TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded text-sm ${
                              tipo.status === "ativo"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {tipo.status === "ativo" ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(tipo)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(tipo.id)}
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
