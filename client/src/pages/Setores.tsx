import { useEffect, useMemo, useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Search, Filter, X } from "lucide-react";

const normalizarTexto = (valor: string) =>
  valor
    ?.toString()
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .toLowerCase() ?? "";

const removerEspacos = (valor: string) => valor.replace(/\s+/g, "");

const correspondeSubsequencia = (alvo: string, consulta: string) => {
  if (!consulta) return true;
  let indiceConsulta = 0;
  for (let i = 0; i < alvo.length && indiceConsulta < consulta.length; i++) {
    if (alvo[i] === consulta[indiceConsulta]) {
      indiceConsulta++;
    }
  }
  return indiceConsulta === consulta.length;
};

type SetorFormData = {
  nomeSetor: string;
  descricao: string;
  empresaId: string;
};

export default function Setores() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<SetorFormData>({
    nomeSetor: "",
    descricao: "",
    empresaId: "",
  });

  const [empresaPopoverOpen, setEmpresaPopoverOpen] = useState(false);
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [buscaSetor, setBuscaSetor] = useState("");
  const [empresaFiltroId, setEmpresaFiltroId] = useState<string>("__all__");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const { data: empresas = [], isLoading: isLoadingEmpresas } = trpc.empresas.list.useQuery();

  const filtroEmpresaNumber = useMemo(() => {
    if (!empresaFiltroId || empresaFiltroId === "__all__") return undefined;
    const parsed = Number(empresaFiltroId);
    return Number.isNaN(parsed) ? undefined : parsed;
  }, [empresaFiltroId]);

  const setoresQueryInput = useMemo(() => {
    return {
      searchTerm: buscaSetor.trim() ? buscaSetor.trim() : undefined,
      empresaId: filtroEmpresaNumber,
    };
  }, [buscaSetor, filtroEmpresaNumber]);

  const setoresQuery = trpc.setores.list.useQuery(setoresQueryInput, {
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });
  const setores = setoresQuery.data || [];
  const isLoadingSetores = setoresQuery.isLoading;
  const refetch = setoresQuery.refetch;

  const todosSetoresQuery = trpc.setores.list.useQuery(undefined, { keepPreviousData: true });
  const todosSetores = todosSetoresQuery.data || [];

  const empresasMap = useMemo(() => {
    const map = new Map<string, string>();
    empresas.forEach((empresa: any) => {
      const id = empresa.id?.toString?.();
      if (!id) return;
      const nome = empresa.nomeFantasia?.trim() || empresa.razaoSocial?.trim() || `Empresa #${id}`;
      map.set(id, nome);
    });
    return map;
  }, [empresas]);

  const empresasOptions = useMemo(() => {
    return empresas
      .map((empresa: any) => {
        const id = empresa.id?.toString?.();
        if (!id) return null;
        const rawCnpj = empresa.cnpj ?? "";
        const cnpj = typeof rawCnpj === "string" ? rawCnpj : rawCnpj ? String(rawCnpj) : "";
        return {
          id,
          nome: empresa.nomeFantasia?.trim() || empresa.razaoSocial?.trim() || `Empresa #${id}`,
          cnpj,
        };
      })
      .filter(Boolean) as Array<{ id: string; nome: string; cnpj: string }>;
  }, [empresas]);

  const empresasFiltradas = useMemo(() => {
    const termoNormalizado = removerEspacos(normalizarTexto(empresaSearch).trim());
    if (!termoNormalizado) return empresasOptions;

    return empresasOptions.filter((empresa) => {
      const nomeNormalizado = removerEspacos(normalizarTexto(empresa.nome));
      return (
        nomeNormalizado.includes(termoNormalizado) ||
        correspondeSubsequencia(nomeNormalizado, termoNormalizado)
      );
    });
  }, [empresaSearch, empresasOptions]);

  const empresaSelecionadaNome = useMemo(() => {
    if (!formData.empresaId) return "";
    return empresasMap.get(formData.empresaId) ?? "";
  }, [formData.empresaId, empresasMap]);

  useEffect(() => {
    if (selectedIds.length > 0) {
      setSelectedIds([]);
    }
  }, [setoresQueryInput, setores?.length]);

  const totalSetores = todosSetores.length;
  const totalSetoresFiltrados = setores.length;
  const totalEmpresas = useMemo(() => {
    const set = new Set<string>();
    todosSetores.forEach((setor: any) => {
      if (setor.empresaId) set.add(setor.empresaId.toString());
    });
    return set.size;
  }, [todosSetores]);

  const totalSemDescricao = useMemo(() => {
    return setores.filter((setor: any) => !setor.descricao?.trim()).length;
  }, [setores]);

  const createMutation = trpc.setores.create.useMutation({
    onSuccess: () => {
      toast.success("Setor criado com sucesso!");
      resetForm();
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar setor");
    },
  });

  const updateMutation = trpc.setores.update.useMutation({
    onSuccess: () => {
      toast.success("Setor atualizado com sucesso!");
      resetForm();
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.nomeSetor.trim()) {
      toast.error("Nome do setor é obrigatório");
      return;
    }

    const empresaIdNumber = Number(formData.empresaId);
    if (!empresaIdNumber || Number.isNaN(empresaIdNumber)) {
      toast.error("Selecione a empresa à qual o setor pertence");
      return;
    }

    const payload = {
      nomeSetor: formData.nomeSetor.trim(),
      descricao: formData.descricao?.trim() || undefined,
      empresaId: empresaIdNumber,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (setor: any) => {
    setEditingId(setor.id);
    setFormData({
      nomeSetor: setor.nomeSetor || "",
      descricao: setor.descricao || "",
      empresaId: setor.empresaId ? setor.empresaId.toString() : "",
    });
    setEmpresaSearch("");
    setEmpresaPopoverOpen(false);
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este setor?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
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
    setFormData({ nomeSetor: "", descricao: "", empresaId: "" });
    setEditingId(null);
    setEmpresaSearch("");
    setEmpresaPopoverOpen(false);
    setDialogOpen(false);
  };

  if (isLoadingSetores) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <p className="text-sm text-muted-foreground">Carregando setores...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Setores</h1>
            <p className="text-muted-foreground">Organize os setores de cada empresa e mantenha o vínculo atualizado.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="gap-2">
                <Plus className="h-4 w-4" /> Novo setor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar setor" : "Novo setor"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="nomeSetor">Nome do setor *</Label>
                    <Input
                      id="nomeSetor"
                      value={formData.nomeSetor}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, nomeSetor: event.target.value }))
                      }
                      placeholder="Ex: Engenharia, Segurança do Trabalho..."
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Empresa *</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        readOnly
                        value={empresaSelecionadaNome}
                        placeholder={isLoadingEmpresas ? "Carregando empresas..." : "Selecione a empresa"}
                        className="bg-muted/40"
                      />
                      <Popover open={empresaPopoverOpen} onOpenChange={setEmpresaPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="shrink-0"
                            disabled={isLoadingEmpresas || empresasOptions.length === 0}
                          >
                            <Search className="h-4 w-4" />
                            <span className="sr-only">Pesquisar empresa</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[24rem]" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Buscar por nome da empresa"
                              value={empresaSearch}
                              onValueChange={setEmpresaSearch}
                              autoFocus
                            />
                            <CommandList>
                              <CommandEmpty>
                                {isLoadingEmpresas
                                  ? "Carregando empresas..."
                                  : "Nenhuma empresa encontrada."}
                              </CommandEmpty>
                              <CommandGroup>
                                {empresasFiltradas.map((empresa) => (
                                  <CommandItem
                                    key={empresa.id}
                                    value={empresa.nome}
                                    onSelect={() => {
                                      setFormData((prev) => ({ ...prev, empresaId: empresa.id }));
                                      setEmpresaSearch("");
                                      setEmpresaPopoverOpen(false);
                                    }}
                                  >
                                    <div>
                                      <p className="font-medium leading-tight">{empresa.nome}</p>
                                      {empresa.cnpj && (
                                        <p className="text-xs text-muted-foreground">CNPJ: {empresa.cnpj}</p>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, descricao: event.target.value }))
                      }
                      placeholder="Detalhes adicionais do setor, responsabilidades, localização..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter className="sm:justify-between">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit">{editingId ? "Atualizar" : "Criar"}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de setores</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalSetores}</p>
              <p className="text-xs text-muted-foreground">
                {totalSetoresFiltrados !== totalSetores
                  ? `${totalSetoresFiltrados} exibidos com filtros`
                  : "Todos os setores cadastrados"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Empresas atendidas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalEmpresas}</p>
              <p className="text-xs text-muted-foreground">Quantidade de empresas com setores registrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Setores sem descrição</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{totalSemDescricao}</p>
              <p className="text-xs text-muted-foreground">Atualize para melhorar a documentação</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ações rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Utilize os filtros abaixo para refinar a visualização. Selecione setores para ações em lote.</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setBuscaSetor("");
                    setEmpresaFiltroId("__all__");
                  }}
                  className="gap-1"
                >
                  <X className="h-4 w-4" /> Limpar filtros
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  className="gap-1"
                  disabled={setores.length === 0}
                >
                  <Filter className="h-4 w-4" /> {selectedIds.length === setores.length ? "Desmarcar todos" : "Selecionar todos"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtros avançados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label htmlFor="buscar-setor">Buscar setor</Label>
                <Input
                  id="buscar-setor"
                  value={buscaSetor}
                  onChange={(event) => setBuscaSetor(event.target.value)}
                  placeholder="Ex: operação, segurança, documentação..."
                />
              </div>
              <div className="space-y-1">
                <Label>Empresa</Label>
                <Select
                  value={empresaFiltroId}
                  onValueChange={(valor) => setEmpresaFiltroId(valor)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas as empresas</SelectItem>
                    {empresasOptions.map((empresa) => (
                      <SelectItem key={empresa.id} value={empresa.id}>
                        {empresa.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Status dos filtros</Label>
                <div className="rounded-md border p-3 text-sm text-muted-foreground">
                  {empresaFiltroId !== "__all__"
                    ? `Filtrando setores da empresa ${(empresasMap.get(empresaFiltroId) ?? "")}`
                    : "Mostrando setores de todas as empresas"}
                  <br />
                  {buscaSetor ? `Busca ativa: “${buscaSetor}”` : "Sem busca textual"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Lista de setores</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteMany}
                disabled={selectedIds.length === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" /> Excluir selecionados ({selectedIds.length})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {setores.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
                Nenhum setor encontrado com os filtros atuais. Ajuste os filtros ou cadastre um novo setor.
              </div>
            ) : (
              <div className="space-y-3">
                {setores.map((setor: any) => {
                  const empresaNome = setor.empresaId ? empresasMap.get(setor.empresaId.toString()) : undefined;
                  const selecionado = selectedIds.includes(setor.id);

                  return (
                    <div key={setor.id} className="rounded-lg border p-4">
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selecionado}
                                onCheckedChange={() => handleToggleSelect(setor.id)}
                              />
                              <div className="space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3 className="text-lg font-semibold">{setor.nomeSetor}</h3>
                                  {empresaNome && <Badge>{empresaNome}</Badge>}
                                </div>
                                {setor.descricao ? (
                                  <p className="text-sm text-muted-foreground">{setor.descricao}</p>
                                ) : (
                                  <p className="text-sm italic text-muted-foreground">Sem descrição cadastrada.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(setor)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(setor.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {selectedIds.length > 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <span className="text-muted-foreground">
                {selectedIds.length} setor(es) selecionado(s).
              </span>
              <Button variant="destructive" size="sm" onClick={handleDeleteMany} className="gap-2">
                <Trash2 className="h-4 w-4" /> Excluir seleção
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

