import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const GRAUS_RISCO = ["1", "2", "3", "4"];
const TIPOS_LOGRADOURO = ["Rua", "Avenida", "Travessa", "Alameda", "Estrada", "Rodovia", "Praça", "Largo", "Passagem", "Beco"];
const ESTADOS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

export default function Obras() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nomeObra: "",
    cnpj: "",
    cno: "",
    cnae: "",
    descricaoAtividade: "",
    grauRisco: "",
    quantidadePrevistoColaboradores: "",
    tipoLogradouro: "",
    nomeLogradouro: "",
    numeroEndereco: "",
    complementoEndereco: "",
    bairroEndereco: "",
    cidadeEndereco: "",
    estadoEndereco: "",
    cepEndereco: "",
    empresaId: "",
    dataInicio: "",
    dataFim: "",
    status: "ativa" as "ativa" | "concluida",
  });

  const utils = trpc.useUtils();
  const { data: obras, isLoading } = trpc.obras.list.useQuery();
  const { data: empresas } = trpc.empresas.list.useQuery();
  
  const createMutation = trpc.obras.create.useMutation({
    onSuccess: () => {
      utils.obras.list.invalidate();
      toast.success("Obra cadastrada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar: ${error.message}`);
    },
  });

  const updateMutation = trpc.obras.update.useMutation({
    onSuccess: () => {
      utils.obras.list.invalidate();
      toast.success("Obra atualizada com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar: ${error.message}`);
    },
  });

  const deleteMutation = trpc.obras.delete.useMutation({
    onSuccess: () => {
      utils.obras.list.invalidate();
      toast.success("Obra excluída com sucesso!");
    },
  });

  const resetForm = () => {
    setFormData({
      nomeObra: "",
      cnpj: "",
      cno: "",
      cnae: "",
      descricaoAtividade: "",
      grauRisco: "",
      quantidadePrevistoColaboradores: "",
      tipoLogradouro: "",
      nomeLogradouro: "",
      numeroEndereco: "",
      complementoEndereco: "",
      bairroEndereco: "",
      cidadeEndereco: "",
      estadoEndereco: "",
      cepEndereco: "",
      empresaId: "",
      dataInicio: "",
      dataFim: "",
      status: "ativa",
    });
    setEditingId(null);
    setDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.empresaId) {
      toast.error("Selecione uma empresa!");
      return;
    }
    if (!formData.nomeObra) {
      toast.error("Nome da obra é obrigatório!");
      return;
    }
    const data = {
      ...formData,
      empresaId: parseInt(formData.empresaId),
      quantidadePrevistoColaboradores: formData.quantidadePrevistoColaboradores ? parseInt(formData.quantidadePrevistoColaboradores) : undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (obra: any): void => {
    setEditingId(obra.id);
    setFormData({
      nomeObra: obra.nomeObra,
      cnpj: obra.cnpj || "",
      cno: obra.cno || "",
      cnae: obra.cnae || "",
      descricaoAtividade: obra.descricaoAtividade || "",
      grauRisco: obra.grauRisco || "",
      quantidadePrevistoColaboradores: obra.quantidadePrevistoColaboradores?.toString() || "",
      tipoLogradouro: obra.tipoLogradouro || "",
      nomeLogradouro: obra.nomeLogradouro || "",
      numeroEndereco: obra.numeroEndereco || "",
      complementoEndereco: obra.complementoEndereco || "",
      bairroEndereco: obra.bairroEndereco || "",
      cidadeEndereco: obra.cidadeEndereco || "",
      estadoEndereco: obra.estadoEndereco || "",
      cepEndereco: obra.cepEndereco || "",
      empresaId: obra.empresaId.toString(),
      dataInicio: obra.dataInicio ? new Date(obra.dataInicio).toISOString().split('T')[0] : "",
      dataFim: obra.dataFim ? new Date(obra.dataFim).toISOString().split('T')[0] : "",
      status: obra.status,
    });
    setDialogOpen(true);
  };

  const formatDate = (date: any) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getEmpresaName = (empresaId: number): string => {
    return empresas?.find((e: any) => e.id === empresaId)?.razaoSocial || "-";
  };

  if (isLoading) return <div>Carregando...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Obras</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Obra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Obra" : "Cadastrar Obra"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Seção 1: Informações Básicas */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="nomeObra">Nome da Obra *</Label>
                    <Input
                      id="nomeObra"
                      value={formData.nomeObra}
                      onChange={(e) => setFormData({ ...formData, nomeObra: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="empresaId">Empresa *</Label>
                    <Select
                      value={formData.empresaId}
                      onValueChange={(value) => setFormData({ ...formData, empresaId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma empresa" />
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
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as "ativa" | "concluida" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativa">Ativa</SelectItem>
                        <SelectItem value="concluida">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Seção 2: Identificação da Obra */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Identificação da Obra</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                      placeholder="Ex: 12.345.678/0001-90"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cno">CNO</Label>
                    <Input
                      id="cno"
                      value={formData.cno}
                      onChange={(e) => setFormData({ ...formData, cno: e.target.value })}
                      placeholder="Ex: 123456"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnae">CNAE</Label>
                    <Input
                      id="cnae"
                      value={formData.cnae}
                      onChange={(e) => setFormData({ ...formData, cnae: e.target.value })}
                      placeholder="Ex: 4120-4/00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grauRisco">Grau de Risco</Label>
                    <Select
                      value={formData.grauRisco}
                      onValueChange={(value) => setFormData({ ...formData, grauRisco: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {GRAUS_RISCO.map((grau) => (
                          <SelectItem key={grau} value={grau}>{grau}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Seção 3: Descrição da Atividade */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Descrição da Atividade</h3>
                <div>
                  <Label htmlFor="descricaoAtividade">Descrição da Atividade</Label>
                  <Textarea
                    id="descricaoAtividade"
                    value={formData.descricaoAtividade}
                    onChange={(e) => setFormData({ ...formData, descricaoAtividade: e.target.value })}
                    placeholder="Descreva as atividades que serão realizadas na obra"
                    rows={4}
                  />
                </div>
              </div>

              {/* Seção 4: Informações de Pessoal */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Informações de Pessoal</h3>
                <div>
                  <Label htmlFor="quantidadePrevistoColaboradores">Quantidade Prevista de Colaboradores</Label>
                  <Input
                    id="quantidadePrevistoColaboradores"
                    type="number"
                    value={formData.quantidadePrevistoColaboradores}
                    onChange={(e) => setFormData({ ...formData, quantidadePrevistoColaboradores: e.target.value })}
                    placeholder="Ex: 50"
                  />
                </div>
              </div>

              {/* Seção 5: Localização Detalhada */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Localização</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tipoLogradouro">Tipo de Logradouro</Label>
                    <Select
                      value={formData.tipoLogradouro}
                      onValueChange={(value) => setFormData({ ...formData, tipoLogradouro: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_LOGRADOURO.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="nomeLogradouro">Nome da Rua/Avenida</Label>
                    <Input
                      id="nomeLogradouro"
                      value={formData.nomeLogradouro}
                      onChange={(e) => setFormData({ ...formData, nomeLogradouro: e.target.value })}
                      placeholder="Ex: Rua das Flores"
                    />
                  </div>
                  <div>
                    <Label htmlFor="numeroEndereco">Número</Label>
                    <Input
                      id="numeroEndereco"
                      value={formData.numeroEndereco}
                      onChange={(e) => setFormData({ ...formData, numeroEndereco: e.target.value })}
                      placeholder="Ex: 123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="complementoEndereco">Complemento</Label>
                    <Input
                      id="complementoEndereco"
                      value={formData.complementoEndereco}
                      onChange={(e) => setFormData({ ...formData, complementoEndereco: e.target.value })}
                      placeholder="Ex: Apto 101"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bairroEndereco">Bairro</Label>
                    <Input
                      id="bairroEndereco"
                      value={formData.bairroEndereco}
                      onChange={(e) => setFormData({ ...formData, bairroEndereco: e.target.value })}
                      placeholder="Ex: Centro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cidadeEndereco">Cidade</Label>
                    <Input
                      id="cidadeEndereco"
                      value={formData.cidadeEndereco}
                      onChange={(e) => setFormData({ ...formData, cidadeEndereco: e.target.value })}
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estadoEndereco">Estado</Label>
                    <Select
                      value={formData.estadoEndereco}
                      onValueChange={(value) => setFormData({ ...formData, estadoEndereco: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((estado) => (
                          <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="cepEndereco">CEP</Label>
                    <Input
                      id="cepEndereco"
                      value={formData.cepEndereco}
                      onChange={(e) => setFormData({ ...formData, cepEndereco: e.target.value })}
                      placeholder="Ex: 01310-100"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 6: Datas */}
              <div className="border-b pb-4">
                <h3 className="text-lg font-semibold mb-4">Datas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dataInicio">Data de Início</Label>
                    <Input
                      id="dataInicio"
                      type="date"
                      value={formData.dataInicio}
                      onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dataFim">Data de Término</Label>
                    <Input
                      id="dataFim"
                      type="date"
                      value={formData.dataFim}
                      onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
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

      <Card>
        <CardHeader>
          <CardTitle>Lista de Obras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Obra</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Grau de Risco</TableHead>
                  <TableHead>Colaboradores</TableHead>
                  <TableHead>Data Início</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {obras?.map((obra: any) => (
                  <TableRow key={obra.id}>
                    <TableCell className="font-medium">{obra.nomeObra}</TableCell>
                    <TableCell>{getEmpresaName(obra.empresaId)}</TableCell>
                    <TableCell>{obra.grauRisco || "-"}</TableCell>
                    <TableCell>{obra.quantidadePrevistoColaboradores || "-"}</TableCell>
                    <TableCell>{formatDate(obra.dataInicio)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-sm ${
                        obra.status === "ativa" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {obra.status === "ativa" ? "Ativa" : "Concluída"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(obra)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMutation.mutate({ id: obra.id })}
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
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
}
