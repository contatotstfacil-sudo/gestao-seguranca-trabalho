import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Plus, Pencil, Trash2, FileText, X, ChevronsUpDown, Check, ShieldCheck, Eye, Users, Building2, Calendar } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface EpiFormItem {
  tipoEpiId: string;
  nomeEquipamento: string;
  dataEntrega: string;
  quantidade: string;
}

export default function ListaEpis({ showLayout = true }: { showLayout?: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<{ colaboradorId: number; empresaId: number; dataEntrega: string } | null>(null);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [empresaId, setEmpresaId] = useState<string>("");
  const [colaboradorId, setColaboradorId] = useState<string>("");
  const [episList, setEpisList] = useState<EpiFormItem[]>([
    {
      tipoEpiId: "",
      nomeEquipamento: "",
      dataEntrega: "",
      quantidade: "01",
    },
  ]);
  
  const [tipoEpiOpen, setTipoEpiOpen] = useState<{ [key: number]: boolean }>({});
  const [tipoEpiSearch, setTipoEpiSearch] = useState<{ [key: number]: string }>({});

  const utils = trpc.useUtils();
  const { data: epis, isLoading } = trpc.epis.list.useQuery();
  const { data: colaboradores } = trpc.colaboradores.list.useQuery();
  const { data: empresas } = trpc.empresas.list.useQuery();
  const { data: tiposEpis = [] } = trpc.tiposEpis.list.useQuery();
  
  const createMutation = trpc.epis.create.useMutation({
    onSuccess: () => {
      utils.epis.list.invalidate();
    },
  });

  const createMultipleMutation = trpc.epis.createMultiple.useMutation({
    onSuccess: (count) => {
      utils.epis.list.invalidate();
      toast.success(`${count} EPI(s) cadastrado(s) com sucesso!`);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar EPIs: ${error.message}`);
    },
  });

  const updateMutation = trpc.epis.update.useMutation({
    onSuccess: () => {
      utils.epis.list.invalidate();
      toast.success("EPI atualizado com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar EPI: ${error.message}`);
    },
  });

  const deleteMutation = trpc.epis.delete.useMutation({
    onSuccess: () => {
      utils.epis.list.invalidate();
      toast.success("EPI excluído com sucesso!");
    },
  });

  const resetForm = () => {
    setEmpresaId("");
    setColaboradorId("");
    setEpisList([
      {
        tipoEpiId: "",
        nomeEquipamento: "",
        dataEntrega: "",
        quantidade: "01",
      },
    ]);
    setEditingId(null);
    setTipoEpiOpen([]);
    setTipoEpiSearch({});
    setDialogOpen(false);
  };

  const addEpi = () => {
    setEpisList((prev) => [
      ...prev,
      {
        tipoEpiId: "",
        nomeEquipamento: "",
        dataEntrega: "",
        quantidade: "01",
      },
    ]);
  };

  const removeEpi = (index: number) => {
    setEpisList((prev) => {
      if (prev.length > 1) {
        return prev.filter((_, i) => i !== index);
      }
      return prev;
    });
  };

  const updateEpi = (index: number, field: keyof EpiFormItem, value: any) => {
    setEpisList((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (editingId) {
      // Edição de um único EPI
      const epi = episList[0];
      updateMutation.mutate({
        id: editingId,
        empresaId: parseInt(empresaId),
        colaboradorId: parseInt(colaboradorId),
        nomeEquipamento: epi.nomeEquipamento,
        dataEntrega: epi.dataEntrega || undefined,
        quantidade: parseInt(epi.quantidade) || 1,
        tipoEpiId: epi.tipoEpiId ? parseInt(epi.tipoEpiId) : undefined,
        caNumero: tiposEpis.find((t: any) => t.id.toString() === epi.tipoEpiId)?.caNumero || undefined,
      });
    } else {
      // Criação de múltiplos EPIs
      const episToCreate = episList
        .filter((epi) => epi.nomeEquipamento && epi.dataEntrega)
        .map((epi) => ({
          empresaId: parseInt(empresaId),
          colaboradorId: parseInt(colaboradorId),
          nomeEquipamento: epi.nomeEquipamento,
          dataEntrega: epi.dataEntrega,
          quantidade: parseInt(epi.quantidade) || 1,
          tipoEpiId: epi.tipoEpiId ? parseInt(epi.tipoEpiId) : undefined,
          caNumero: tiposEpis.find((t: any) => t.id.toString() === epi.tipoEpiId)?.caNumero || undefined,
        }));

      if (episToCreate.length === 0) {
        toast.error("Preencha pelo menos um EPI com nome e data de entrega");
        return;
      }

      createMultipleMutation.mutate({ epis: episToCreate });
    }
  };

  const handleEdit = (epi: any) => {
    setEditingId(epi.id);
    setEmpresaId(epi.empresaId.toString());
    setColaboradorId(epi.colaboradorId.toString());
    setEpisList([
      {
        tipoEpiId: epi.tipoEpiId?.toString() || "",
        nomeEquipamento: epi.nomeEquipamento || "",
        dataEntrega: epi.dataEntrega || "",
        quantidade: (epi.quantidade || 1).toString().padStart(2, "0"),
      },
    ]);
    setDialogOpen(true);
  };

  const formatDate = (date: string | null) => {
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

  // Agrupar EPIs por colaborador, empresa e data de lançamento
  const episAgrupados = useMemo(() => {
    if (!epis || !colaboradores || !empresas) return [];

    const grupos: { [key: string]: any[] } = {};

    epis.forEach((epi: any) => {
      const dataEntrega = epi.dataEntrega ? formatDate(epi.dataEntrega) : "Sem data";
      const key = `${epi.colaboradorId}-${epi.empresaId}-${dataEntrega}`;
      
      if (!grupos[key]) {
        grupos[key] = [];
      }
      grupos[key].push(epi);
    });

    return Object.entries(grupos).map(([key, episGrupo]) => {
      const [colaboradorId, empresaId, dataEntrega] = key.split("-");
      const colaborador = colaboradores.find((c: any) => c.id.toString() === colaboradorId);
      const empresa = empresas.find((e: any) => e.id.toString() === empresaId);
      
      return {
        colaboradorId: parseInt(colaboradorId),
        empresaId: parseInt(empresaId),
        dataEntrega,
        colaboradorNome: colaborador?.nomeCompleto || "-",
        empresaNome: empresa?.razaoSocial || "-",
        epis: episGrupo,
        quantidade: episGrupo.length,
      };
    }).sort((a, b) => {
      // Ordenar por data (mais recente primeiro), depois por colaborador
      if (a.dataEntrega !== b.dataEntrega) {
        return b.dataEntrega.localeCompare(a.dataEntrega);
      }
      return a.colaboradorNome.localeCompare(b.colaboradorNome);
    });
  }, [epis, colaboradores, empresas]);

  const episDoGrupoSelecionado = useMemo(() => {
    if (!selectedGroup || !epis) return [];
    return epis.filter((epi: any) => 
      epi.colaboradorId === selectedGroup.colaboradorId &&
      epi.empresaId === selectedGroup.empresaId &&
      formatDate(epi.dataEntrega) === selectedGroup.dataEntrega
    );
  }, [selectedGroup, epis]);

  const handleViewGroup = (grupo: any) => {
    setSelectedGroup({
      colaboradorId: grupo.colaboradorId,
      empresaId: grupo.empresaId,
      dataEntrega: grupo.dataEntrega,
    });
    setViewDialogOpen(true);
  };

  const content = (
    <div className="space-y-6">
      {/* Header melhorado */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lista de EPIs</h1>
              <p className="text-gray-600 mt-1">Gerencie os equipamentos de proteção individual</p>
            </div>
          </div>
        </div>
        
          {/* Grupo de ações organizadas */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Ação principal - Registrar EPI */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="shadow-sm">
                <Plus className="h-4 w-4 mr-2" />
                Registrar EPI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Lançar EPI" : "Registrar EPI"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                <div className="space-y-4 overflow-y-auto flex-1 pr-2">
                <div>
                  <Label htmlFor="empresaId">Empresa *</Label>
                  <Select
                    value={empresaId}
                    onValueChange={(value) => {
                      setEmpresaId(value);
                      setColaboradorId("");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a empresa" />
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
                    value={colaboradorId}
                    onValueChange={setColaboradorId}
                    disabled={!empresaId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o colaborador" />
                    </SelectTrigger>
                    <SelectContent>
                      {colaboradores
                        ?.filter((c: any) => c.empresaId.toString() === empresaId)
                        .map((colaborador: any) => (
                          <SelectItem key={colaborador.id} value={colaborador.id.toString()}>
                            {colaborador.nomeCompleto}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {episList.map((epi, index) => {
                  const tipoSelecionado = tiposEpis.find((t: any) => t.id.toString() === epi.tipoEpiId);
                  
                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm">EPI {index + 1}</h3>
                        {!editingId && episList.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeEpi(index);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-[1fr_120px] gap-3">
                        <div className="space-y-2">
                          <Label>Tipo de EPI</Label>
                          <Popover
                            open={tipoEpiOpen[index] || false}
                            onOpenChange={(open) => {
                              setTipoEpiOpen((prev) => ({
                                ...prev,
                                [index]: open,
                              }));
                            }}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={tipoEpiOpen[index] || false}
                                className="w-full justify-between"
                              >
                                {tipoSelecionado
                                  ? tipoSelecionado.tipoEpi
                                  : "Selecione o tipo de EPI"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                              <Command>
                                <CommandInput
                                  placeholder="Buscar tipo de EPI..."
                                  value={tipoEpiSearch[index] || ""}
                                  onValueChange={(value) => {
                                    setTipoEpiSearch((prev) => ({
                                      ...prev,
                                      [index]: value,
                                    }));
                                  }}
                                />
                                <CommandList>
                                  <CommandEmpty>Nenhum tipo encontrado.</CommandEmpty>
                                  <CommandGroup>
                                    {tiposEpis
                                      .filter((tipo: any) => {
                                        const search = tipoEpiSearch[index]?.toLowerCase() || "";
                                        return !search || 
                                          tipo.tipoEpi?.toLowerCase().includes(search) ||
                                          tipo.caNumero?.toLowerCase().includes(search) ||
                                          tipo.fabricante?.toLowerCase().includes(search);
                                      })
                                      .map((tipo: any) => (
                                        <CommandItem
                                          key={tipo.id}
                                          value={`${tipo.id}-${tipo.tipoEpi}`}
                                          onSelect={() => {
                                            updateEpi(index, "tipoEpiId", tipo.id.toString());
                                            updateEpi(index, "nomeEquipamento", tipo.tipoEpi);
                                            setTipoEpiOpen((prev) => ({
                                              ...prev,
                                              [index]: false,
                                            }));
                                            setTipoEpiSearch((prev) => ({
                                              ...prev,
                                              [index]: "",
                                            }));
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4",
                                              epi.tipoEpiId === tipo.id.toString() ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                          {tipo.tipoEpi}
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <Label>CA</Label>
                          <Input
                            value={tipoSelecionado?.caNumero || ""}
                            readOnly
                            className="bg-gray-50"
                            placeholder="CA"
                          />
                        </div>
                      </div>

                      {tipoSelecionado?.fabricante && (
                        <div className="text-sm text-gray-600">
                          <strong>Fabricante:</strong> {tipoSelecionado.fabricante}
                        </div>
                      )}

                      <div>
                        <Label htmlFor={`nomeEquipamento-${index}`}>Nome do Equipamento *</Label>
                        <Input
                          id={`nomeEquipamento-${index}`}
                          value={epi.nomeEquipamento}
                          onChange={(e) => updateEpi(index, "nomeEquipamento", e.target.value)}
                          placeholder="Nome do equipamento"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`dataEntrega-${index}`}>Data de Entrega *</Label>
                          <Input
                            id={`dataEntrega-${index}`}
                            type="date"
                            value={epi.dataEntrega}
                            onChange={(e) => updateEpi(index, "dataEntrega", e.target.value)}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`quantidade-${index}`}>Quantidade *</Label>
                          <Input
                            id={`quantidade-${index}`}
                            type="number"
                            min="1"
                            value={epi.quantidade}
                            onChange={(e) => updateEpi(index, "quantidade", e.target.value.padStart(2, "0"))}
                            required
                          />
                        </div>
                      </div>

                      {!editingId && index === episList.length - 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addEpi();
                          }}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Lance outro EPI
                        </Button>
                      )}
                    </div>
                  );
                })}
                </div>
                <div className="flex gap-3 pt-4 border-t mt-4">
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
      </div>

      {/* Dialog para visualizar lançamentos de um grupo */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Lançamentos de EPI
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {selectedGroup && (
              <div className="space-y-4 mb-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Colaborador</p>
                      <p className="font-semibold">{getColaboradorName(selectedGroup.colaboradorId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Empresa</p>
                      <p className="font-semibold">{getEmpresaName(selectedGroup.empresaId)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-600" />
                    <div>
                      <p className="text-xs text-gray-500">Data de Lançamento</p>
                      <p className="font-semibold">{selectedGroup.dataEntrega}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead className="font-semibold">Equipamento</TableHead>
                        <TableHead className="font-semibold">Quantidade</TableHead>
                        <TableHead className="font-semibold">CA</TableHead>
                        <TableHead className="text-right font-semibold">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {episDoGrupoSelecionado.map((epi: any) => (
                        <TableRow key={epi.id} className="hover:bg-gray-50/50 transition-colors">
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4 text-blue-600" />
                              {epi.nomeEquipamento}
                            </div>
                          </TableCell>
                          <TableCell>{epi.quantidade || 1}</TableCell>
                          <TableCell>{epi.caNumero || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  handleEdit(epi);
                                  setViewDialogOpen(false);
                                }}
                                className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  deleteMutation.mutate({ id: epi.id });
                                }}
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
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm">
        <CardHeader className="border-b bg-gray-50/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Lançamentos de EPI
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-500">Carregando EPIs...</p>
            </div>
          ) : episAgrupados && episAgrupados.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {episAgrupados.map((grupo, index) => (
                <Card key={index} className="border hover:border-primary transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Colaborador</p>
                            <p className="font-semibold text-sm">{grupo.colaboradorNome}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg">
                            <Building2 className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Empresa</p>
                            <p className="font-semibold text-sm">{grupo.empresaNome}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <Calendar className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Data de Lançamento</p>
                            <p className="font-semibold text-sm">{grupo.dataEntrega}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <Badge variant="secondary" className="text-sm">
                          {grupo.quantidade} {grupo.quantidade === 1 ? "EPI" : "EPIs"}
                        </Badge>
                        <Button
                          variant="outline"
                          onClick={() => handleViewGroup(grupo)}
                          className="shadow-sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Visualizar Lançamentos
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <ShieldCheck className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum EPI cadastrado
              </h3>
              <p className="text-gray-500 mb-4">
                Comece registrando seu primeiro EPI
              </p>
              <Button onClick={() => setDialogOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Registrar Primeiro EPI
              </Button>
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

