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
import { Plus, Pencil, Trash2, Search, X, ShieldCheck, FileCheck, Building2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";

export default function TiposEpis({ showLayout = true }: { showLayout?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    tipoEpi: "",
    caNumero: "",
    fabricante: "",
  });

  const utils = trpc.useUtils();
  const { data: tiposEpis = [], isLoading } = trpc.tiposEpis.list.useQuery({
    searchTerm: searchTerm || undefined,
  });

  const createMutation = trpc.tiposEpis.create.useMutation({
    onSuccess: () => {
      toast.success("Tipo de EPI criado com sucesso!");
      utils.tiposEpis.list.invalidate();
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateMutation = trpc.tiposEpis.update.useMutation({
    onSuccess: () => {
      toast.success("Tipo de EPI atualizado com sucesso!");
      utils.tiposEpis.list.invalidate();
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteMutation = trpc.tiposEpis.delete.useMutation({
    onSuccess: () => {
      toast.success("Tipo de EPI deletado com sucesso!");
      utils.tiposEpis.list.invalidate();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteManyMutation = trpc.tiposEpis.deleteMany.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.deleted} tipo(s) de EPI deletado(s) com sucesso!`);
      setSelectedIds([]);
      utils.tiposEpis.list.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar tipos de EPI");
    },
  });

  // Limpar seleção quando o termo de busca mudar
  useEffect(() => {
    setSelectedIds([]);
  }, [searchTerm]);

  const resetForm = () => {
    setFormData({
      tipoEpi: "",
      caNumero: "",
      fabricante: "",
    });
    setEditingId(null);
  };

  const handleEdit = (tipoEpi: any) => {
    setEditingId(tipoEpi.id);
    setFormData({
      tipoEpi: tipoEpi.tipoEpi || "",
      caNumero: tipoEpi.caNumero || "",
      fabricante: tipoEpi.fabricante || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.tipoEpi.trim()) {
      toast.error("Tipo de EPI é obrigatório");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este tipo de EPI?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDeleteMany = () => {
    if (selectedIds.length === 0) {
      toast.error("Selecione pelo menos um tipo de EPI para deletar");
      return;
    }
    if (confirm(`Tem certeza que deseja deletar ${selectedIds.length} tipo(s) de EPI?`)) {
      deleteManyMutation.mutate({ ids: selectedIds });
    }
  };

  const tiposEpisFiltrados = tiposEpis.filter((tipo: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      tipo.tipoEpi?.toLowerCase().includes(term) ||
      tipo.caNumero?.toLowerCase().includes(term) ||
      tipo.fabricante?.toLowerCase().includes(term)
    );
  });

  const content = (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tipos de EPIs</h1>
              <p className="text-gray-600 mt-1">Gerencie os tipos de equipamentos de proteção individual</p>
            </div>
          </div>
          {tiposEpis.length > 0 && (
            <div className="flex items-center gap-4 mt-3">
              <Badge variant="secondary" className="text-sm">
                <FileCheck className="h-3 w-3 mr-1" />
                {tiposEpis.length} {tiposEpis.length === 1 ? "tipo cadastrado" : "tipos cadastrados"}
              </Badge>
              {tiposEpis.filter((t: any) => t.caNumero).length > 0 && (
                <Badge variant="outline" className="text-sm">
                  {tiposEpis.filter((t: any) => t.caNumero).length} com CA
                </Badge>
              )}
            </div>
          )}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Tipo de EPI
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                {editingId ? "Editar Tipo de EPI" : "Novo Tipo de EPI"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="tipoEpi" className="text-sm font-medium">
                  Tipo de EPI <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tipoEpi"
                  value={formData.tipoEpi}
                  onChange={(e) => setFormData({ ...formData, tipoEpi: e.target.value })}
                  placeholder="Ex: Capacete, Luvas, Óculos de Proteção..."
                  required
                  className="h-10"
                />
                <p className="text-xs text-gray-500">Nome do equipamento de proteção individual</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="caNumero" className="text-sm font-medium">
                  CA (Certificado de Aprovação)
                </Label>
                <Input
                  id="caNumero"
                  value={formData.caNumero}
                  onChange={(e) => setFormData({ ...formData, caNumero: e.target.value })}
                  placeholder="Ex: 12345"
                  className="h-10"
                />
                <p className="text-xs text-gray-500">Número do certificado de aprovação do EPI</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fabricante" className="text-sm font-medium">
                  Fabricante
                </Label>
                <Input
                  id="fabricante"
                  value={formData.fabricante}
                  onChange={(e) => setFormData({ ...formData, fabricante: e.target.value })}
                  placeholder="Ex: 3M, MSA, etc."
                  className="h-10"
                />
                <p className="text-xs text-gray-500">Nome do fabricante do equipamento</p>
              </div>
              <div className="flex gap-3 pt-4 border-t">
                <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {editingId ? "Atualizando..." : "Criando..."}
                    </>
                  ) : (
                    <>
                      {editingId ? "Atualizar" : "Criar"}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    resetForm();
                    setIsDialogOpen(false);
                  }}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-gray-600" />
              Lista de Tipos de EPIs
            </CardTitle>
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteMany}
                className="shadow-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar Selecionados ({selectedIds.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por tipo, CA ou fabricante..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10 h-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-gray-100"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {searchTerm && tiposEpisFiltrados.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                {tiposEpisFiltrados.length} {tiposEpisFiltrados.length === 1 ? "resultado encontrado" : "resultados encontrados"}
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-500">Carregando tipos de EPIs...</p>
            </div>
          ) : tiposEpisFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <AlertCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {searchTerm ? "Nenhum resultado encontrado" : "Nenhum tipo de EPI cadastrado"}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm 
                  ? "Tente ajustar os termos de busca" 
                  : "Comece cadastrando seu primeiro tipo de EPI"}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsDialogOpen(true)} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeiro Tipo
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === tiposEpisFiltrados.length && tiposEpisFiltrados.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds(tiposEpisFiltrados.map((t: any) => t.id));
                          } else {
                            setSelectedIds([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="font-semibold">Tipo de EPI</TableHead>
                    <TableHead className="font-semibold">CA</TableHead>
                    <TableHead className="font-semibold">Fabricante</TableHead>
                    <TableHead className="text-right font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tiposEpisFiltrados.map((tipo: any, idx: number) => (
                    <TableRow 
                      key={tipo.id} 
                      className="hover:bg-gray-50/50 transition-colors"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(tipo.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedIds((prev) => [...prev, tipo.id]);
                            } else {
                              setSelectedIds((prev) => prev.filter((id) => id !== tipo.id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-blue-600" />
                          {tipo.tipoEpi}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tipo.caNumero ? (
                          <Badge variant="outline" className="font-mono">
                            {tipo.caNumero}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {tipo.fabricante ? (
                          <span className="text-gray-700">{tipo.fabricante}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(tipo)}
                            className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(tipo.id)}
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600"
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

