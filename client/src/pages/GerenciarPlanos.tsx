import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Building2, Users, CreditCard } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function GerenciarPlanos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    nomeExibicao: "",
    descricao: "",
    precoMensal: "",
    precoTrimestral: "",
    limiteEmpresas: "",
    limiteColaboradoresPorEmpresa: "",
    limiteColaboradoresTotal: "",
    recursos: "",
    ativo: true,
    ordem: 0,
  });

  const { data: planos = [], isLoading, error } = trpc.planos.list.useQuery();

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2).replace(".", ",");
  };

  const parsePrice = (price: string) => {
    // Converte "147,00" ou "147" para centavos
    const cleaned = price.replace(/[^\d,]/g, "").replace(",", ".");
    return Math.round(parseFloat(cleaned || "0") * 100);
  };

  const handleOpenDialog = (plano?: any) => {
    if (plano) {
      setEditingId(plano.id);
      setFormData({
        nome: plano.nome || "",
        nomeExibicao: plano.nomeExibicao || "",
        descricao: plano.descricao || "",
        precoMensal: formatPrice(plano.precoMensal || 0),
        precoTrimestral: plano.precoTrimestral ? formatPrice(plano.precoTrimestral) : "",
        limiteEmpresas: plano.limiteEmpresas?.toString() || "",
        limiteColaboradoresPorEmpresa: plano.limiteColaboradoresPorEmpresa?.toString() || "",
        limiteColaboradoresTotal: plano.limiteColaboradoresTotal?.toString() || "",
        recursos: plano.recursos ? JSON.parse(plano.recursos).join("\n") : "",
        ativo: plano.ativo ?? true,
        ordem: plano.ordem || 0,
      });
    } else {
      setEditingId(null);
      setFormData({
        nome: "",
        nomeExibicao: "",
        descricao: "",
        precoMensal: "",
        precoTrimestral: "",
        limiteEmpresas: "",
        limiteColaboradoresPorEmpresa: "",
        limiteColaboradoresTotal: "",
        recursos: "",
        ativo: true,
        ordem: 0,
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      // Por enquanto, apenas mostrar mensagem (criar rotas admin depois)
      toast.info("Funcionalidade de edição será implementada em breve. Use o script 'pnpm seed:planos' para gerenciar planos.");
      setDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar plano");
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando planos...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-red-600 mb-4">
                Erro ao carregar planos: {error.message}
              </p>
              <Button onClick={() => window.location.reload()} className="w-full">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Gerenciar Planos</h1>
            <p className="text-gray-600">
              Cadastre e gerencie os planos disponíveis para seus clientes
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
        </div>

        {/* Lista de Planos */}
        <Card>
          <CardHeader>
            <CardTitle>Planos Cadastrados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Preço Mensal</TableHead>
                  <TableHead>Preço Trimestral</TableHead>
                  <TableHead>Limite Empresas</TableHead>
                  <TableHead>Limite Colaboradores</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      Nenhum plano cadastrado. Clique em "Novo Plano" para criar.
                    </TableCell>
                  </TableRow>
                ) : (
                  planos.map((plano) => (
                    <TableRow key={plano.id}>
                      <TableCell className="font-semibold">{plano.nomeExibicao}</TableCell>
                      <TableCell>R$ {formatPrice(plano.precoMensal || 0)}</TableCell>
                      <TableCell>
                        {plano.precoTrimestral ? `R$ ${formatPrice(plano.precoTrimestral)}` : "-"}
                      </TableCell>
                      <TableCell>
                        {plano.limiteEmpresas === null ? "Ilimitado" : plano.limiteEmpresas}
                      </TableCell>
                      <TableCell>
                        {plano.limiteColaboradoresTotal === null
                          ? "Ilimitado"
                          : `Até ${plano.limiteColaboradoresTotal}`}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            plano.ativo
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {plano.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(plano)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total de Planos</p>
                  <p className="text-2xl font-bold">{planos.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Planos Ativos</p>
                  <p className="text-2xl font-bold">
                    {planos.filter((p) => p.ativo).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Planos Inativos</p>
                  <p className="text-2xl font-bold">
                    {planos.filter((p) => !p.ativo).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dialog de Edição/Criação */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Plano" : "Novo Plano"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome (código)</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="basico, tecnico, profissional"
                  />
                </div>
                <div>
                  <Label htmlFor="nomeExibicao">Nome de Exibição</Label>
                  <Input
                    id="nomeExibicao"
                    value={formData.nomeExibicao}
                    onChange={(e) => setFormData({ ...formData, nomeExibicao: e.target.value })}
                    placeholder="Básico, Técnico/Engenheiro"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descrição do plano"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="precoMensal">Preço Mensal (R$)</Label>
                  <Input
                    id="precoMensal"
                    type="text"
                    value={formData.precoMensal}
                    onChange={(e) => setFormData({ ...formData, precoMensal: e.target.value })}
                    placeholder="147,00"
                  />
                </div>
                <div>
                  <Label htmlFor="precoTrimestral">Preço Trimestral (R$)</Label>
                  <Input
                    id="precoTrimestral"
                    type="text"
                    value={formData.precoTrimestral}
                    onChange={(e) => setFormData({ ...formData, precoTrimestral: e.target.value })}
                    placeholder="397,00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="limiteEmpresas">Limite Empresas</Label>
                  <Input
                    id="limiteEmpresas"
                    type="number"
                    value={formData.limiteEmpresas}
                    onChange={(e) =>
                      setFormData({ ...formData, limiteEmpresas: e.target.value })
                    }
                    placeholder="Deixe vazio para ilimitado"
                  />
                </div>
                <div>
                  <Label htmlFor="limiteColaboradoresPorEmpresa">Colaboradores/Empresa</Label>
                  <Input
                    id="limiteColaboradoresPorEmpresa"
                    type="number"
                    value={formData.limiteColaboradoresPorEmpresa}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limiteColaboradoresPorEmpresa: e.target.value,
                      })
                    }
                    placeholder="Deixe vazio para ilimitado"
                  />
                </div>
                <div>
                  <Label htmlFor="limiteColaboradoresTotal">Total Colaboradores</Label>
                  <Input
                    id="limiteColaboradoresTotal"
                    type="number"
                    value={formData.limiteColaboradoresTotal}
                    onChange={(e) =>
                      setFormData({ ...formData, limiteColaboradoresTotal: e.target.value })
                    }
                    placeholder="Deixe vazio para ilimitado"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="recursos">Recursos (um por linha)</Label>
                <Textarea
                  id="recursos"
                  value={formData.recursos}
                  onChange={(e) => setFormData({ ...formData, recursos: e.target.value })}
                  placeholder="Gestão completa de treinamentos&#10;Controle total de EPIs&#10;Emissão de certificados"
                  rows={5}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="ativo"
                    checked={formData.ativo}
                    onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                  />
                  <Label htmlFor="ativo">Plano Ativo</Label>
                </div>
                <div>
                  <Label htmlFor="ordem">Ordem de Exibição</Label>
                  <Input
                    id="ordem"
                    type="number"
                    value={formData.ordem}
                    onChange={(e) =>
                      setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })
                    }
                    className="w-20"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingId ? "Salvar Alterações" : "Criar Plano"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

