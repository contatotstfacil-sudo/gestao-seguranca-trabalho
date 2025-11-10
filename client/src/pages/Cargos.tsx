import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";



export default function Cargos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedCargo, setExpandedCargo] = useState<number | null>(null);
  const [formData, setFormData] = useState({ nomeCargo: "", descricao: "" });
  const [treinamentoForm, setTreinamentoForm] = useState({
    cargoId: 0,
    tipoTreinamentoId: 0,
  });
  const [showTreinamentoDialog, setShowTreinamentoDialog] = useState(false);
  const [setorForm, setSetorForm] = useState({
    cargoId: 0,
    setorId: 0,
  });
  const [showSetorDialog, setShowSetorDialog] = useState(false);
  const [riscoForm, setRiscoForm] = useState({
    cargoId: 0,
    riscoOcupacionalId: 0,
    tipoAgente: "",
    descricaoRiscos: "",
  });
  const [riscosTemporarios, setRiscosTemporarios] = useState<Array<{
    riscoOcupacionalId: number;
    tipoAgente: string;
    descricaoRiscos: string;
    nomeRisco?: string;
    tipoRisco?: string;
  }>>([]);
  const [showRiscoDialog, setShowRiscoDialog] = useState(false);
  const [editingRiscoId, setEditingRiscoId] = useState<number | null>(null);
  const [editRiscoForm, setEditRiscoForm] = useState({
    tipoAgente: "",
    descricaoRiscos: "",
  });

  const { data: cargos = [], isLoading, refetch } = trpc.cargos.list.useQuery();
  const { data: treinamentosByCargo = [], refetch: refetchTreinamentos } = trpc.cargoTreinamentos.getByCargo.useQuery(
    { cargoId: expandedCargo || 0 },
    { enabled: expandedCargo !== null }
  );
  const { data: setoresByCargo = [], refetch: refetchSetores } = trpc.cargoSetores.getByCargo.useQuery(
    { cargoId: expandedCargo || 0 },
    { enabled: expandedCargo !== null }
  );
  const { data: riscosByCargo = [], refetch: refetchRiscos } = trpc.cargoRiscos.getByCargo.useQuery(
    { cargoId: expandedCargo || 0 },
    { enabled: expandedCargo !== null }
  );
  
  // Obter cargoId atual para edição
  const currentCargoId = expandedCargo || riscoForm.cargoId || 0;
  
  const { data: setores = [] } = trpc.setores.list.useQuery();
  const { data: riscosOcupacionais = [], refetch: refetchRiscosList } = trpc.riscosOcupacionais.list.useQuery();
  const utilsRiscos = trpc.useUtils();

  const createMutation = trpc.cargos.create.useMutation({
    onSuccess: () => {
      toast.success("Cargo criado com sucesso!");
      setFormData({ nomeCargo: "", descricao: "" });
      setDialogOpen(false);
      refetch();
      refetchTreinamentos();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar treinamento");
    },
  });

  const updateMutation = trpc.cargos.update.useMutation({
    onSuccess: () => {
      toast.success("Cargo atualizado com sucesso!");
      setFormData({ nomeCargo: "", descricao: "" });
      setEditingId(null);
      setDialogOpen(false);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar cargo");
    },
  });

  const deleteMutation = trpc.cargos.delete.useMutation({
    onSuccess: () => {
      toast.success("Cargo deletado com sucesso!");
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao deletar cargo");
    },
  });

  const createTreinamentoMutation = trpc.cargoTreinamentos.create.useMutation({
    onSuccess: () => {
      toast.success("Treinamento adicionado com sucesso!");
      setTreinamentoForm({ cargoId: 0, tipoTreinamentoId: 0 });
      setShowTreinamentoDialog(false);
      refetchTreinamentos();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar treinamento");
    },
  });

  const deleteTreinamentoMutation = trpc.cargoTreinamentos.delete.useMutation({
    onSuccess: () => {
      toast.success("Treinamento removido com sucesso!");
      refetchTreinamentos();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover treinamento");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomeCargo.trim()) {
      toast.error("Nome do cargo é obrigatório");
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (cargo: any) => {
    setEditingId(cargo.id);
    setFormData({ nomeCargo: cargo.nomeCargo, descricao: cargo.descricao || "" });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja deletar este cargo?")) {
      deleteMutation.mutate({ id });
    }
  };

  const { data: tiposTreinamentos = [] } = trpc.tiposTreinamentos.list.useQuery();

  const handleAddTreinamento = (cargoId: number) => {
    setTreinamentoForm({ cargoId, tipoTreinamentoId: 0 });
    setShowTreinamentoDialog(true);
  };

  const handleSubmitTreinamento = (e: React.FormEvent) => {
    e.preventDefault();
    if (!treinamentoForm.tipoTreinamentoId || treinamentoForm.tipoTreinamentoId === 0) {
      toast.error("Selecione um tipo de treinamento");
      return;
    }
    createTreinamentoMutation.mutate(treinamentoForm, {
      onSuccess: () => {
        setTreinamentoForm({ cargoId: 0, tipoTreinamentoId: 0 });
        setShowTreinamentoDialog(false);
        toast.success("Treinamento adicionado com sucesso");
      },
    });
  };

  const handleDeleteTreinamento = (id: number) => {
    if (confirm("Tem certeza que deseja remover este treinamento?")) {
      deleteTreinamentoMutation.mutate({ id });
    }
  };

  const createSetorMutation = trpc.cargoSetores.create.useMutation({
    onSuccess: () => {
      toast.success("Setor vinculado com sucesso!");
      setSetorForm({ cargoId: 0, setorId: 0 });
      setShowSetorDialog(false);
      refetchSetores();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao vincular setor");
    },
  });

  const deleteSetorMutation = trpc.cargoSetores.delete.useMutation({
    onSuccess: () => {
      toast.success("Setor removido com sucesso!");
      refetchSetores();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover setor");
    },
  });

  const handleAddSetor = (cargoId: number) => {
    setSetorForm({ cargoId, setorId: 0 });
    setShowSetorDialog(true);
  };

  const handleSubmitSetor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setorForm.setorId || setorForm.setorId === 0) {
      toast.error("Selecione um setor");
      return;
    }
    createSetorMutation.mutate(setorForm, {
      onSuccess: () => {
        setSetorForm({ cargoId: 0, setorId: 0 });
        setShowSetorDialog(false);
        toast.success("Setor vinculado com sucesso");
      },
    });
  };

  const handleDeleteSetor = (id: number) => {
    if (confirm("Tem certeza que deseja remover este setor?")) {
      deleteSetorMutation.mutate({ id });
    }
  };

  const createRiscoMutation = trpc.cargoRiscos.create.useMutation({
    onSuccess: () => {
      toast.success("Risco ocupacional adicionado com sucesso!");
      setRiscoForm({ cargoId: 0, riscoOcupacionalId: 0, tipoAgente: "", descricaoRiscos: "" });
      setShowRiscoDialog(false);
      refetchRiscos();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao adicionar risco ocupacional");
    },
  });

  const createRiscoOcupacionalMutation = trpc.riscosOcupacionais.create.useMutation({
    onSuccess: () => {
      utilsRiscos.riscosOcupacionais.list.invalidate();
    },
    onError: (error: any) => {
      console.error("Erro ao criar risco ocupacional:", error);
    },
  });

  const updateRiscoMutation = trpc.cargoRiscos.update.useMutation({
    onSuccess: () => {
      toast.success("Risco ocupacional atualizado com sucesso!");
      refetchRiscos();
      setEditingRiscoId(null);
      setEditRiscoForm({ tipoAgente: "", descricaoRiscos: "" });
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar risco ocupacional");
    },
  });

  const deleteRiscoMutation = trpc.cargoRiscos.delete.useMutation({
    onSuccess: () => {
      toast.success("Risco ocupacional removido com sucesso!");
      refetchRiscos();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao remover risco ocupacional");
    },
  });

  const handleAddRisco = (cargoId: number) => {
    setRiscoForm({ cargoId, riscoOcupacionalId: 0, tipoAgente: "", descricaoRiscos: "" });
    setRiscosTemporarios([]);
    setShowRiscoDialog(true);
  };

  const handleAdicionarRiscoNaLista = () => {
    if (!riscoForm.tipoAgente) {
      toast.error("Selecione o tipo de agente");
      return;
    }
    
    setRiscosTemporarios((prev) => [
      ...prev,
      {
        riscoOcupacionalId: 0,
        tipoAgente: riscoForm.tipoAgente,
        descricaoRiscos: riscoForm.descricaoRiscos,
        nomeRisco: riscoForm.tipoAgente,
        tipoRisco: "",
      },
    ]);

    // Limpar campos para próximo risco
    setRiscoForm((prev) => ({
      ...prev,
      tipoAgente: "",
      descricaoRiscos: "",
    }));
  };

  const handleRemoverRiscoTemporario = (index: number) => {
    setRiscosTemporarios((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSalvarTodosRiscos = async () => {
    if (riscosTemporarios.length === 0) {
      toast.error("Adicione pelo menos um risco antes de salvar");
      return;
    }

    const totalRiscos = riscosTemporarios.length;
    let salvos = 0;

    // Buscar ou criar risco ocupacional genérico baseado no tipo de agente
    const criarOuBuscarRisco = async (tipoAgente: string): Promise<number> => {
      // Buscar risco existente com nome igual ao tipo de agente
      let riscoExistente = riscosOcupacionais.find((r: any) => r.nomeRisco === tipoAgente);
      
      // Se não existir, criar um novo risco ocupacional
      if (!riscoExistente) {
        const tipoRiscoMap: { [key: string]: "fisico" | "quimico" | "biologico" | "ergonomico" | "mecanico" } = {
          "Físico": "fisico",
          "Químico": "quimico",
          "Biológico": "biologico",
          "Ergonômico": "ergonomico",
          "Agentes Mecânicos": "mecanico",
        };
        
        return new Promise((resolve, reject) => {
          createRiscoOcupacionalMutation.mutate(
            {
              nomeRisco: tipoAgente,
              tipoRisco: tipoRiscoMap[tipoAgente] || "fisico",
              status: "ativo" as const,
            },
            {
              onSuccess: async (novoRisco: any) => {
                // Aguardar atualização da lista antes de continuar
                await refetchRiscosList();
                resolve(novoRisco.id);
              },
              onError: (error: any) => {
                reject(error);
              },
            }
          );
        });
      }
      
      return riscoExistente.id;
    };

    // Salvar todos os riscos sequencialmente (um por vez para evitar problemas)
    for (const risco of riscosTemporarios) {
      try {
        // Criar ou buscar risco ocupacional
        const riscoId = await criarOuBuscarRisco(risco.tipoAgente);
        
        // Salvar vínculo cargo-risco
        await new Promise<void>((resolve, reject) => {
          const dataToSave: any = {
            cargoId: riscoForm.cargoId,
            riscoOcupacionalId: riscoId,
          };
          
          if (risco.tipoAgente && risco.tipoAgente.trim()) {
            dataToSave.tipoAgente = risco.tipoAgente.trim();
          }
          if (risco.descricaoRiscos && risco.descricaoRiscos.trim()) {
            dataToSave.descricaoRiscos = risco.descricaoRiscos.trim();
          }
          
          createRiscoMutation.mutate(
            dataToSave,
            {
              onSuccess: () => {
                salvos++;
                resolve();
              },
              onError: (error: any) => {
                reject(new Error(error.message || `Erro ao salvar risco "${risco.tipoAgente}"`));
              },
            }
          );
        });
      } catch (error: any) {
        toast.error(`Erro ao salvar risco "${risco.tipoAgente}": ${error.message || error}`);
        return;
      }
    }

    // Todos salvos com sucesso
    setRiscoForm({ cargoId: 0, riscoOcupacionalId: 0, tipoAgente: "", descricaoRiscos: "" });
    setRiscosTemporarios([]);
    setShowRiscoDialog(false);
    toast.success(`${totalRiscos} risco(s) ocupacional(is) adicionado(s) com sucesso`);
    refetchRiscos();
  };

  const handleEditRisco = (risco: any) => {
    setEditingRiscoId(risco.id);
    setEditRiscoForm({
      tipoAgente: risco.tipoAgente || "",
      descricaoRiscos: risco.descricaoRiscos || "",
    });
  };

  const handleSaveEditRisco = (cargoId: number) => {
    if (!editingRiscoId) return;
    
    if (!editRiscoForm.tipoAgente.trim()) {
      toast.error("O tipo de agente é obrigatório");
      return;
    }

    updateRiscoMutation.mutate({
      id: editingRiscoId,
      cargoId,
      tipoAgente: editRiscoForm.tipoAgente.trim(),
      descricaoRiscos: editRiscoForm.descricaoRiscos.trim() || undefined,
    });
  };

  const handleCancelEditRisco = () => {
    setEditingRiscoId(null);
    setEditRiscoForm({ tipoAgente: "", descricaoRiscos: "" });
  };

  const handleDeleteRisco = (id: number) => {
    if (confirm("Tem certeza que deseja remover este risco ocupacional?")) {
      deleteRiscoMutation.mutate({ id });
    }
  };

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

  if (isLoading) return <div>Carregando...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Cargos</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingId(null); setFormData({ nomeCargo: "", descricao: "" }); }}>
                <Plus className="mr-2 h-4 w-4" /> Novo Cargo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="nomeCargo">Nome do Cargo</Label>
                  <Input
                    id="nomeCargo"
                    value={formData.nomeCargo}
                    onChange={(e) => setFormData({ ...formData, nomeCargo: e.target.value })}
                    placeholder="Ex: Eletricista"
                  />
                </div>
                <div>
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Descrição do cargo"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingId ? "Atualizar" : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Cargos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cargos.map((cargo: any) => (
                <div key={cargo.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-semibold">{cargo.nomeCargo}</h3>
                      {cargo.descricao && <p className="text-sm text-gray-600">{cargo.descricao}</p>}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpandedCargo(expandedCargo === cargo.id ? null : cargo.id)}
                      >
                        {expandedCargo === cargo.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(cargo)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(cargo.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {expandedCargo === cargo.id && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">Treinamentos Obrigatórios</h4>
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddTreinamento(cargo.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Adicionar
                            </Button>
                            <Dialog open={showTreinamentoDialog && treinamentoForm.cargoId === cargo.id} onOpenChange={setShowTreinamentoDialog}>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adicionar Treinamento Obrigatório</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleSubmitTreinamento} className="space-y-4">
                                <div>
                                  <Label htmlFor="tipoTreinamento">Tipo de Treinamento</Label>
                                  <select
                                    id="tipoTreinamento"
                                    value={treinamentoForm.tipoTreinamentoId.toString()}
                                    onChange={(e) => setTreinamentoForm({ ...treinamentoForm, tipoTreinamentoId: parseInt(e.target.value) })}
                                    className="w-full border rounded px-3 py-2"
                                  >
                                    <option value="0">Selecione um tipo</option>
                                    {tiposTreinamentos.map((tipo: any) => (
                                      <option key={tipo.id} value={tipo.id.toString()}>
                                        {tipo.nomeTreinamento}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <Button type="submit" className="w-full">
                                  Adicionar
                                </Button>
                              </form>
                            </DialogContent>
                            </Dialog>
                          </>
                        </div>

                        {Array.isArray(treinamentosByCargo) && treinamentosByCargo.length > 0 ? (
                          <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Tipo de Treinamento</TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {treinamentosByCargo.map((t: any) => (
                                <TableRow key={t.id}>
                                  <TableCell>{t.tipoNr}</TableCell>
                                  <TableCell>{t.nomeTreinamento}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteTreinamento(t.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-gray-500">Nenhum treinamento obrigatório cadastrado</p>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">Setores Vinculados</h4>
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddSetor(cargo.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Adicionar
                            </Button>
                            <Dialog open={showSetorDialog && setorForm.cargoId === cargo.id} onOpenChange={setShowSetorDialog}>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Vincular Setor ao Cargo</DialogTitle>
                              </DialogHeader>
                              <form onSubmit={handleSubmitSetor} className="space-y-4">
                                <div>
                                  <Label htmlFor="setor">Setor</Label>
                                  <select
                                    id="setor"
                                    value={setorForm.setorId.toString()}
                                    onChange={(e) => setSetorForm({ ...setorForm, setorId: parseInt(e.target.value) })}
                                    className="w-full border rounded px-3 py-2"
                                  >
                                    <option value="0">Selecione um setor</option>
                                    {setores.map((setor: any) => (
                                      <option key={setor.id} value={setor.id.toString()}>
                                        {setor.nomeSetor}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <Button type="submit" className="w-full">
                                  Vincular
                                </Button>
                              </form>
                            </DialogContent>
                            </Dialog>
                          </>
                        </div>

                        {Array.isArray(setoresByCargo) && setoresByCargo.length > 0 ? (
                          <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Nome do Setor</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {setoresByCargo.map((s: any) => (
                                <TableRow key={s.id}>
                                  <TableCell>{s.nomeSetor}</TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteSetor(s.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-gray-500">Nenhum setor vinculado</p>
                        )}
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">Riscos Ocupacionais</h4>
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAddRisco(cargo.id)}
                            >
                              <Plus className="mr-2 h-4 w-4" /> Adicionar
                            </Button>
                            <Dialog open={showRiscoDialog && riscoForm.cargoId === cargo.id} onOpenChange={setShowRiscoDialog}>
                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Adicionar Riscos Ocupacionais</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                {/* Formulário para adicionar riscos */}
                                <Card>
                                  <CardHeader>
                                    <CardTitle className="text-lg">Novo Risco</CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="tipoAgente">Tipo de Agente *</Label>
                                        <select
                                          id="tipoAgente"
                                          value={riscoForm.tipoAgente}
                                          onChange={(e) => setRiscoForm({ ...riscoForm, tipoAgente: e.target.value })}
                                          className="w-full border rounded-md px-3 py-2 h-10"
                                        >
                                          <option value="">Selecione o tipo de agente</option>
                                          <option value="Físico">Físico</option>
                                          <option value="Químico">Químico</option>
                                          <option value="Biológico">Biológico</option>
                                          <option value="Ergonômico">Ergonômico</option>
                                          <option value="Agentes Mecânicos">Agentes Mecânicos</option>
                                        </select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor="descricaoRiscos">Descrição dos Riscos</Label>
                                        <Textarea
                                          id="descricaoRiscos"
                                          value={riscoForm.descricaoRiscos}
                                          onChange={(e) => setRiscoForm({ ...riscoForm, descricaoRiscos: e.target.value })}
                                          placeholder="Descreva os riscos específicos deste cargo..."
                                          rows={3}
                                          className="w-full"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-end">
                                      <Button
                                        type="button"
                                        onClick={handleAdicionarRiscoNaLista}
                                        disabled={!riscoForm.tipoAgente}
                                      >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Adicionar à Lista
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Lista de riscos adicionados */}
                                {riscosTemporarios.length > 0 && (
                                  <Card>
                                    <CardHeader>
                                      <CardTitle className="text-lg">
                                        Riscos Adicionados ({riscosTemporarios.length})
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {riscosTemporarios.map((risco, index) => (
                                          <div
                                            key={index}
                                            className="p-3 border rounded-lg flex items-start justify-between hover:bg-gray-50 transition-colors"
                                          >
                                            <div className="flex-1 space-y-1">
                                              <div className="font-medium text-sm">
                                                <span className="text-gray-500">Tipo de Agente:</span>{" "}
                                                <span className="text-foreground">{risco.tipoAgente}</span>
                                              </div>
                                              {risco.descricaoRiscos && (
                                                <div className="text-sm text-gray-600">
                                                  <span className="text-gray-500">Descrição:</span>{" "}
                                                  {risco.descricaoRiscos}
                                                </div>
                                              )}
                                            </div>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleRemoverRiscoTemporario(index)}
                                              className="ml-4"
                                            >
                                              <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </CardContent>
                                  </Card>
                                )}

                                {/* Botões de ação */}
                                <div className="flex gap-3 justify-end pt-4 border-t">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                      setShowRiscoDialog(false);
                                      setRiscosTemporarios([]);
                                      setRiscoForm({ cargoId: 0, riscoOcupacionalId: 0, tipoAgente: "", descricaoRiscos: "" });
                                    }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    type="button"
                                    onClick={handleSalvarTodosRiscos}
                                    disabled={riscosTemporarios.length === 0 || createRiscoMutation.isPending}
                                  >
                                    {createRiscoMutation.isPending ? (
                                      "Salvando..."
                                    ) : (
                                      <>
                                        Salvar {riscosTemporarios.length > 0 && `(${riscosTemporarios.length})`}
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                            </Dialog>
                          </>
                        </div>

                        {Array.isArray(riscosByCargo) && riscosByCargo.length > 0 ? (
                          <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Nome do Risco</TableHead>
                                    <TableHead>Tipo de Agente</TableHead>
                                    <TableHead>Descrição dos Riscos</TableHead>
                                <TableHead>Ações</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {riscosByCargo.map((r: any) => (
                                <TableRow key={r.id}>
                                  {editingRiscoId === r.id ? (
                                    <>
                                      <TableCell className="font-medium">{r.nomeRisco}</TableCell>
                                      <TableCell>
                                        <select
                                          value={editRiscoForm.tipoAgente}
                                          onChange={(e) => setEditRiscoForm({ ...editRiscoForm, tipoAgente: e.target.value })}
                                          className="w-full border rounded-md px-2 py-1 h-8 text-sm"
                                        >
                                          <option value="">Selecione o tipo de agente</option>
                                          <option value="Físico">Físico</option>
                                          <option value="Químico">Químico</option>
                                          <option value="Biológico">Biológico</option>
                                          <option value="Ergonômico">Ergonômico</option>
                                          <option value="Agentes Mecânicos">Agentes Mecânicos</option>
                                        </select>
                                      </TableCell>
                                      <TableCell>
                                        <Textarea
                                          value={editRiscoForm.descricaoRiscos}
                                          onChange={(e) => setEditRiscoForm({ ...editRiscoForm, descricaoRiscos: e.target.value })}
                                          placeholder="Descreva os riscos específicos..."
                                          rows={2}
                                          className="w-full text-sm"
                                        />
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleSaveEditRisco(currentCargoId || r.cargoId)}
                                            disabled={updateRiscoMutation.isPending}
                                          >
                                            <Check className="h-4 w-4 text-green-600" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCancelEditRisco}
                                            disabled={updateRiscoMutation.isPending}
                                          >
                                            <X className="h-4 w-4 text-red-600" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </>
                                  ) : (
                                    <>
                                      <TableCell className="font-medium">{r.nomeRisco}</TableCell>
                                      <TableCell>{r.tipoAgente || "-"}</TableCell>
                                      <TableCell className="max-w-[300px]">
                                        <div className="truncate" title={r.descricaoRiscos}>
                                          {r.descricaoRiscos || "-"}
                                        </div>
                                      </TableCell>
                                      <TableCell>
                                        <div className="flex gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditRisco(r)}
                                          >
                                            <Pencil className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteRisco(r.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </>
                                  )}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-gray-500">Nenhum risco ocupacional cadastrado</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
