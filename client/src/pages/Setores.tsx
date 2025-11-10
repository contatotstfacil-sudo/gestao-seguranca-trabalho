import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Pencil, Trash2, Search, X } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Setores() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nomeSetor: "", descricao: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: setores = [], isLoading, refetch } = trpc.setores.list.useQuery(
    { searchTerm: searchTerm || undefined },
    { enabled: true }
  );

  // Limpar seleção quando a busca mudar
  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm]);

  const createMutation = trpc.setores.create.useMutation({
    onSuccess: () => {
      toast.success("Setor criado com sucesso!");
      setFormData({ nomeSetor: "", descricao: "" });
      setDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar setor");
    },
  });

  const updateMutation = trpc.setores.update.useMutation({
    onSuccess: () => {
      toast.success("Setor atualizado com sucesso!");
      setFormData({ nomeSetor: "", descricao: "" });
      setEditingId(null);
      setDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar setor");
    },
  });

  const deleteMutation = trpc.setores.delete.useMutation({
    onSuccess: () => {
      toast.success("Setor deletado com sucesso!");
      setSelectedIds([]);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar setor");
    },
  });

  const deleteManyMutation = trpc.setores.deleteMany.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.deleted} setor(es) deletado(s) com sucesso!`);
      setSelectedIds([]);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar setores");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomeSetor.trim()) {
      toast.error("Nome do setor é obrigatório");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (setor: any) => {
    setEditingId(setor.id);
    setFormData({
      nomeSetor: setor.nomeSetor || "",
      descricao: setor.descricao || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este setor?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === setores.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(setores.map((s: any) => s.id));
    }
  };

  const handleDeleteMany = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um setor para excluir");
      return;
    }
    if (
      window.confirm(
        `Tem certeza que deseja excluir ${selectedIds.length} setor(es)?`
      )
    ) {
      deleteManyMutation.mutate({ ids: selectedIds });
    }
  };

  const resetForm = () => {
    setFormData({ nomeSetor: "", descricao: "" });
    setEditingId(null);
    setDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Setores</h1>
            <p className="text-muted-foreground">
              Gerencie os setores da empresa
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Setor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Setor" : "Novo Setor"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nomeSetor">Nome do Setor *</Label>
                  <Input
                    id="nomeSetor"
                    value={formData.nomeSetor}
                    onChange={(e) =>
                      setFormData({ ...formData, nomeSetor: e.target.value })
                    }
                    placeholder="Ex: Administrativo, Produção, Qualidade"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                    placeholder="Descrição do setor"
                    rows={4}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingId ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Lista de Setores</CardTitle>
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
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por nome do setor..."
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
            </div>

            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : setores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm
                  ? "Nenhum setor encontrado com o termo de busca."
                  : "Nenhum setor cadastrado. Clique em 'Novo Setor' para começar."}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          setores.length > 0 &&
                          selectedIds.length === setores.length
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                    <TableHead>Nome do Setor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {setores.map((setor: any) => (
                    <TableRow key={setor.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(setor.id)}
                          onChange={() => handleToggleSelect(setor.id)}
                          className="rounded border-gray-300"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {setor.nomeSetor}
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {setor.descricao || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(setor)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(setor.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

