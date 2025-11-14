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

  // Estados para vinculação automática
  const [empresaSelecionada, setEmpresaSelecionada] = useState<number | null>(null);
  const [colaboradorSelecionado, setColaboradorSelecionado] = useState<number | null>(null);
  const [cargoInfo, setCargoInfo] = useState<any>(null);
  const [setorInfo, setSetorInfo] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: riscosOcupacionais = [], isLoading } = trpc.riscosOcupacionais.list.useQuery();
  const { data: empresas = [] } = trpc.empresas.list.useQuery();
  const { data: colaboradores = [] } = trpc.colaboradores.list.useQuery(
    { empresaId: empresaSelecionada || undefined },
    { enabled: !!empresaSelecionada }
  );
  
  // Buscar informações do colaborador quando selecionado
  const { data: colaboradorInfo } = trpc.colaboradores.getComCargoESetor.useQuery(
    { id: colaboradorSelecionado! },
    { enabled: !!colaboradorSelecionado }
  );

  // Buscar riscos do cargo quando cargo for identificado
  const { data: riscosDoCargo = [] } = trpc.cargoRiscos.getByCargo.useQuery(
    { cargoId: cargoInfo?.id || 0 },
    { enabled: !!cargoInfo?.id }
  );

  // Efeito para atualizar cargo e setor quando colaborador for selecionado
  useEffect(() => {
    if (colaboradorInfo) {
      setCargoInfo(colaboradorInfo.cargo);
      setSetorInfo(colaboradorInfo.setor);
    } else {
      setCargoInfo(null);
      setSetorInfo(null);
    }
  }, [colaboradorInfo]);

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

  const empresaSelecionadaObj = empresas.find((e: any) => e.id === empresaSelecionada);
  const colaboradorSelecionadoObj = colaboradores.find((c: any) => c.id === colaboradorSelecionado);

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

      {/* Seção de Vinculação Automática */}
      <Card>
        <CardHeader>
          <CardTitle>Vincular Riscos por Empresa e Colaborador</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="empresa">Empresa *</Label>
              <Select
                value={empresaSelecionada?.toString() || ""}
                onValueChange={(value) => {
                  setEmpresaSelecionada(value ? Number(value) : null);
                  setColaboradorSelecionado(null);
                  setCargoInfo(null);
                  setSetorInfo(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map((empresa: any) => (
                    <SelectItem key={empresa.id} value={empresa.id.toString()}>
                      {empresa.razaoSocial || empresa.nomeFantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={empresaSelecionadaObj?.cnpj || ""}
                readOnly
                className="bg-gray-50"
                placeholder="CNPJ será preenchido automaticamente"
              />
            </div>
          </div>

          {empresaSelecionada && (
            <div>
              <Label htmlFor="colaborador">Colaborador *</Label>
              <Select
                value={colaboradorSelecionado?.toString() || ""}
                onValueChange={(value) => {
                  setColaboradorSelecionado(value ? Number(value) : null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map((colaborador: any) => (
                    <SelectItem key={colaborador.id} value={colaborador.id.toString()}>
                      {colaborador.nomeCompleto}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(cargoInfo || setorInfo) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="text-sm text-gray-600">Cargo</Label>
                <p className="font-medium">{cargoInfo?.nomeCargo || "Não informado"}</p>
                {cargoInfo?.codigoCbo && (
                  <p className="text-sm text-gray-500">CBO: {cargoInfo.codigoCbo}</p>
                )}
              </div>
              <div>
                <Label className="text-sm text-gray-600">Setor</Label>
                <p className="font-medium">{setorInfo?.nomeSetor || "Não vinculado"}</p>
              </div>
            </div>
          )}

          {cargoInfo?.id && riscosDoCargo.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-3">Riscos Ocupacionais do Cargo</h3>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>AGENTES</TableHead>
                      <TableHead>FONTE GERADORA</TableHead>
                      <TableHead>TIPO</TableHead>
                      <TableHead>MEIO DE PROPAGAÇÃO</TableHead>
                      <TableHead>MEIO DE CONTATO</TableHead>
                      <TableHead>POSSÍVEIS DANOS À SAÚDE</TableHead>
                      <TableHead>TIPO ANÁLISE</TableHead>
                      <TableHead>VALOR ANÁLISE</TableHead>
                      <TableHead>EFEITOS</TableHead>
                      <TableHead>EXPOSIÇÃO</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {riscosDoCargo.map((risco: any) => (
                      <TableRow key={risco.id}>
                        <TableCell className="font-medium">{risco.tipoAgente || "-"}</TableCell>
                        <TableCell>{risco.fonteGeradora || "-"}</TableCell>
                        <TableCell>{risco.tipo || "-"}</TableCell>
                        <TableCell>{risco.meioPropagacao || "-"}</TableCell>
                        <TableCell>{risco.meioContato || "-"}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate" title={risco.possiveisDanosSaude}>
                            {risco.possiveisDanosSaude || "-"}
                          </div>
                        </TableCell>
                        <TableCell>{risco.tipoAnalise || "-"}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <div className="truncate" title={risco.valorAnaliseQuantitativa}>
                            {risco.valorAnaliseQuantitativa || "-"}
                          </div>
                        </TableCell>
                        <TableCell>{risco.gradacaoEfeitos || "-"}</TableCell>
                        <TableCell>{risco.gradacaoExposicao || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {cargoInfo?.id && riscosDoCargo.length === 0 && (
            <div className="text-center py-4 text-muted-foreground">
              Nenhum risco ocupacional cadastrado para este cargo.
            </div>
          )}
        </CardContent>
      </Card>

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



