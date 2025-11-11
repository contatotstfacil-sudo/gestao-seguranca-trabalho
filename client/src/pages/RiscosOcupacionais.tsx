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
import { Checkbox } from "@/components/ui/checkbox";

export default function RiscosOcupacionais({ showLayout = true }: { showLayout?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    nomeRisco: "",
    descricao: "",
    tipoRisco: "fisico" as "fisico" | "quimico" | "biologico" | "ergonomico" | "mecanico",
    codigo: "",
    status: "ativo" as "ativo" | "inativo",
  });

  const utils = trpc.useUtils();
  const { data: riscosOcupacionais = [], isLoading } = trpc.riscosOcupacionais.list.useQuery();

  const createMutation = trpc.riscosOcupacionais.create.useMutation({
    onSuccess: () => {
      toast.success("Risco ocupacional criado com sucesso!");
      utils.riscosOcupacionais.list.invalidate();
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateMutation = trpc.riscosOcupacionais.update.useMutation({
    onSuccess: () => {
      toast.success("Risco ocupacional atualizado com sucesso!");
      utils.riscosOcupacionais.list.invalidate();
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteMutation = trpc.riscosOcupacionais.delete.useMutation({
    onSuccess: () => {
      toast.success("Risco ocupacional deletado com sucesso!");
      utils.riscosOcupacionais.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  // Limpar seleção quando o termo de busca mudar
  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm]);

  const resetForm = () => {
    setFormData({
      nomeRisco: "",
      descricao: "",
      tipoRisco: "fisico",
      codigo: "",
      status: "ativo",
    });
    setEditingId(null);
  };

  const handleEdit = (risco: any) => {
    setEditingId(risco.id);
    setFormData({
      nomeRisco: risco.nomeRisco || "",
      descricao: risco.descricao || "",
      tipoRisco: risco.tipoRisco || "fisico",
      codigo: risco.codigo || "",
      status: risco.status || "ativo",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este risco ocupacional?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomeRisco.trim()) {
      toast.error("Nome do risco é obrigatório");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === riscosOcupacionais.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(riscosOcupacionais.map((r: any) => r.id));
    }
  };

  const handleDeleteMany = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um risco ocupacional para deletar");
      return;
    }
    if (confirm(`Tem certeza que deseja deletar ${selectedIds.length} risco(s) ocupacional(is)?`)) {
      selectedIds.forEach((id) => {
        deleteMutation.mutate({ id });
      });
      setSelectedIds([]);
    }
  };

  const riscosFiltrados = riscosOcupacionais.filter((risco: any) => {
    if (!searchTerm.trim()) return true;
    const termo = searchTerm.toLowerCase();
    return (
      risco.nomeRisco?.toLowerCase().includes(termo) ||
      risco.descricao?.toLowerCase().includes(termo) ||
      risco.codigo?.toLowerCase().includes(termo) ||
      risco.tipoRisco?.toLowerCase().includes(termo)
    );
  });

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

  const content = (
    <div className="space-y-6">
      {showLayout && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Riscos Ocupacionais</h1>
            <p className="text-muted-foreground">Gerencie os riscos ocupacionais disponíveis</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Risco
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Risco Ocupacional" : "Novo Risco Ocupacional"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nomeRisco">Nome do Risco *</Label>
                  <Input
                    id="nomeRisco"
                    value={formData.nomeRisco}
                    onChange={(e) => setFormData({ ...formData, nomeRisco: e.target.value })}
                    placeholder="Ex: Ruído, Poeira, Vibração..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="tipoRisco">Tipo de Risco *</Label>
                  <Select
                    value={formData.tipoRisco}
                    onValueChange={(value: any) =>
                      setFormData({ ...formData, tipoRisco: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fisico">Físico</SelectItem>
                      <SelectItem value="quimico">Químico</SelectItem>
                      <SelectItem value="biologico">Biológico</SelectItem>
                      <SelectItem value="ergonomico">Ergonômico</SelectItem>
                      <SelectItem value="mecanico">Mecânico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="codigo">Código</Label>
                  <Input
                    id="codigo"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    placeholder="Ex: R01, R02..."
                  />
                </div>

                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descreva o risco ocupacional..."
                    rows={3}
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
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {editingId ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Riscos Ocupacionais</CardTitle>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMany}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Selecionados ({selectedIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, descrição, código ou tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1.5 h-7 w-7 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : riscosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? "Nenhum risco ocupacional encontrado com os filtros aplicados."
                : "Nenhum risco ocupacional cadastrado. Clique em 'Novo Risco' para adicionar."}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          riscosFiltrados.length > 0 &&
                          riscosFiltrados.every((r: any) => selectedIds.includes(r.id))
                        }
                        onCheckedChange={handleSelectAll}
                        aria-label="Selecionar todos"
                      />
                    </TableHead>
                    <TableHead>Nome do Risco</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {riscosFiltrados.map((risco: any) => (
                    <TableRow key={risco.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(risco.id)}
                          onCheckedChange={() => handleToggleSelect(risco.id)}
                          aria-label={`Selecionar risco ${risco.nomeRisco}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{risco.nomeRisco}</TableCell>
                      <TableCell>{getTipoRiscoLabel(risco.tipoRisco)}</TableCell>
                      <TableCell>{risco.codigo || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            risco.status === "ativo"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {risco.status === "ativo" ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(risco)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(risco.id)}
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
    </div>
  );

  if (showLayout) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
}



