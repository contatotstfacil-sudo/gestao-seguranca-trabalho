import { useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, Plus, Search, X } from "lucide-react";
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

export default function ModelosOrdemServico({ showLayout = true }: { showLayout?: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [modeloToDelete, setModeloToDelete] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [medidasPreventivasItems, setMedidasPreventivasItems] = useState<string[]>([]);
  const [novaMedidaPreventiva, setNovaMedidaPreventiva] = useState("");
  const [orientacoesSegurancaItems, setOrientacoesSegurancaItems] = useState<string[]>([]);
  const [novaOrientacaoSeguranca, setNovaOrientacaoSeguranca] = useState("");
  
  const [formData, setFormData] = useState({
    nome: "",
    medidasPreventivasEPC: "",
    orientacoesSeguranca: "",
    termoResponsabilidade: "",
  });

  const { data: modelos = [], isLoading, refetch } = trpc.modelosOrdemServico.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.modelosOrdemServico.create.useMutation({
    onSuccess: () => {
      utils.modelosOrdemServico.list.invalidate();
      toast.success("Modelo de ordem de serviço criado com sucesso!");
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao criar modelo: ${error.message}`);
    },
  });

  const updateMutation = trpc.modelosOrdemServico.update.useMutation({
    onSuccess: () => {
      utils.modelosOrdemServico.list.invalidate();
      toast.success("Modelo de ordem de serviço atualizado com sucesso!");
      resetForm();
      setDialogOpen(false);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar modelo: ${error.message}`);
    },
  });

  const deleteMutation = trpc.modelosOrdemServico.delete.useMutation({
    onSuccess: () => {
      utils.modelosOrdemServico.list.invalidate();
      toast.success("Modelo de ordem de serviço excluído com sucesso!");
      setDeleteDialogOpen(false);
      setModeloToDelete(null);
    },
    onError: (error) => {
      toast.error(`Erro ao excluir modelo: ${error.message}`);
    },
  });

  const filteredModelos = modelos.filter((modelo: any) =>
    modelo.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const resetForm = () => {
    setFormData({
      nome: "",
      medidasPreventivasEPC: "",
      orientacoesSeguranca: "",
      termoResponsabilidade: "",
    });
    setMedidasPreventivasItems([]);
    setNovaMedidaPreventiva("");
    setOrientacoesSegurancaItems([]);
    setNovaOrientacaoSeguranca("");
    setEditingId(null);
  };

  const handleAdicionarMedidaPreventiva = () => {
    if (novaMedidaPreventiva.trim()) {
      setMedidasPreventivasItems([...medidasPreventivasItems, novaMedidaPreventiva.trim()]);
      setNovaMedidaPreventiva("");
    }
  };

  const handleRemoverMedidaPreventiva = (index: number) => {
    const novosItems = medidasPreventivasItems.filter((_, i) => i !== index);
    setMedidasPreventivasItems(novosItems);
  };

  const handleAdicionarOrientacaoSeguranca = () => {
    if (novaOrientacaoSeguranca.trim()) {
      setOrientacoesSegurancaItems([...orientacoesSegurancaItems, novaOrientacaoSeguranca.trim()]);
      setNovaOrientacaoSeguranca("");
    }
  };

  const handleRemoverOrientacaoSeguranca = (index: number) => {
    const novosItems = orientacoesSegurancaItems.filter((_, i) => i !== index);
    setOrientacoesSegurancaItems(novosItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error("Nome do modelo é obrigatório");
      return;
    }

    const dadosParaEnviar = {
      ...formData,
      medidasPreventivasEPC: JSON.stringify(medidasPreventivasItems),
      orientacoesSeguranca: JSON.stringify(orientacoesSegurancaItems),
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...dadosParaEnviar });
    } else {
      createMutation.mutate(dadosParaEnviar);
    }
  };

  const handleEdit = (modelo: any) => {
    setEditingId(modelo.id);
    
    // Converter medidasPreventivasEPC de JSON string para array
    let medidasArray: string[] = [];
    if (modelo.medidasPreventivasEPC) {
      try {
        medidasArray = JSON.parse(modelo.medidasPreventivasEPC);
        if (!Array.isArray(medidasArray)) {
          medidasArray = [];
        }
      } catch (e) {
        // Se não for JSON válido, tratar como string vazia
        medidasArray = [];
      }
    }
    
    // Converter orientacoesSeguranca de JSON string para array
    let orientacoesArray: string[] = [];
    if (modelo.orientacoesSeguranca) {
      try {
        orientacoesArray = JSON.parse(modelo.orientacoesSeguranca);
        if (!Array.isArray(orientacoesArray)) {
          orientacoesArray = [];
        }
      } catch (e) {
        // Se não for JSON válido, tratar como string vazia
        orientacoesArray = [];
      }
    }
    
    setMedidasPreventivasItems(medidasArray);
    setOrientacoesSegurancaItems(orientacoesArray);
    setFormData({
      nome: modelo.nome || "",
      medidasPreventivasEPC: modelo.medidasPreventivasEPC || "",
      orientacoesSeguranca: modelo.orientacoesSeguranca || "",
      termoResponsabilidade: modelo.termoResponsabilidade || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    setModeloToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (modeloToDelete) {
      deleteMutation.mutate({ id: modeloToDelete });
    }
  };

  const content = (
    <div className="space-y-6">
      {showLayout && (
        <div>
          <h2 className="text-2xl font-bold">Cadastrar Modelos de Ordem de Serviço</h2>
          <p className="text-muted-foreground">Gerencie os modelos de ordem de serviço disponíveis</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Modelos de Ordem de Serviço</CardTitle>
            <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Modelo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar modelos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : filteredModelos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Nenhum modelo encontrado" : "Nenhum modelo cadastrado"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredModelos.map((modelo: any) => (
                    <TableRow key={modelo.id}>
                      <TableCell className="font-medium">{modelo.nome}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(modelo)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(modelo.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Modelo" : "Novo Modelo de Ordem de Serviço"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="nome">Nome do Modelo *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Modelo Padrão SST"
                className="mt-1.5"
                required
              />
            </div>

            <div>
              <Label>Medidas Preventivas para os Riscos de Ambientais - EPC</Label>
              <div className="border rounded-lg p-4 space-y-3 mt-1.5 bg-gray-50/50">
                <div className="flex gap-2">
                  <Input
                    value={novaMedidaPreventiva}
                    onChange={(e) => setNovaMedidaPreventiva(e.target.value)}
                    placeholder="Digite uma medida preventiva ou EPC"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAdicionarMedidaPreventiva();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAdicionarMedidaPreventiva} size="sm">
                    Adicionar
                  </Button>
                </div>
                {medidasPreventivasItems.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {medidasPreventivasItems.map((item, index) => (
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
                          onClick={() => handleRemoverMedidaPreventiva(index)}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {medidasPreventivasItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Nenhuma medida adicionada. Digite e clique em "Adicionar" para incluir medidas.
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label>Orientações de Segurança do Trabalho</Label>
              <div className="border rounded-lg p-4 space-y-3 mt-1.5 bg-gray-50/50">
                <div className="flex gap-2">
                  <Input
                    value={novaOrientacaoSeguranca}
                    onChange={(e) => setNovaOrientacaoSeguranca(e.target.value)}
                    placeholder="Digite uma orientação de segurança"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAdicionarOrientacaoSeguranca();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAdicionarOrientacaoSeguranca} size="sm">
                    Adicionar
                  </Button>
                </div>
                {orientacoesSegurancaItems.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {orientacoesSegurancaItems.map((item, index) => (
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
                          onClick={() => handleRemoverOrientacaoSeguranca(index)}
                          className="h-7 w-7 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {orientacoesSegurancaItems.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    Nenhuma orientação adicionada. Digite e clique em "Adicionar" para incluir orientações.
                  </p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="termoResponsabilidade">Termo de Responsabilidade</Label>
              <Textarea
                id="termoResponsabilidade"
                value={formData.termoResponsabilidade}
                onChange={(e) => setFormData({ ...formData, termoResponsabilidade: e.target.value })}
                placeholder="Descreva o termo de responsabilidade..."
                rows={5}
                className="mt-1.5"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setDialogOpen(false); resetForm(); }}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : editingId
                  ? "Atualizar"
                  : "Criar Modelo"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este modelo de ordem de serviço? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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

