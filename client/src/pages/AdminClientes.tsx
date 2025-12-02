import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Edit2, Save, Building2, Users, UserCheck, Calendar, DollarSign, 
  Mail, Phone, FileText, TrendingUp, AlertTriangle, CheckCircle, 
  XCircle, Filter, Search, Download, RefreshCw, Plus
} from "lucide-react";
import { toast } from "sonner";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/_core/hooks/useAuth";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";

const PLANOS = [
  { value: "bronze", label: "🥉 Bronze", valor: "67,90", color: "bg-amber-100 text-amber-800" },
  { value: "prata", label: "🥈 Prata", valor: "97,90", color: "bg-gray-100 text-gray-800" },
  { value: "ouro", label: "🥇 Ouro", valor: "137,90", color: "bg-yellow-100 text-yellow-800" },
  { value: "diamante", label: "💎 Diamante", valor: "199,90", color: "bg-purple-100 text-purple-800" },
] as const;

const STATUS = [
  { value: "ativo", label: "Ativo", color: "bg-green-100 text-green-800" },
  { value: "suspenso", label: "Suspenso", color: "bg-yellow-100 text-yellow-800" },
  { value: "cancelado", label: "Cancelado", color: "bg-red-100 text-red-800" },
] as const;

const STATUS_PAGAMENTO = [
  { value: "pago", label: "Pago", color: "bg-green-100 text-green-800" },
  { value: "pendente", label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
  { value: "atrasado", label: "Atrasado", color: "bg-red-100 text-red-800" },
  { value: "cancelado", label: "Cancelado", color: "bg-gray-100 text-gray-800" },
] as const;

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdminClientes() {
  const { user } = useAuth();
  const [editingTenant, setEditingTenant] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogCreateOpen, setDialogCreateOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("all");
  const [filtroPlano, setFiltroPlano] = useState<string>("all");
  const [filtroPagamento, setFiltroPagamento] = useState<string>("all");
  const [busca, setBusca] = useState("");
  
  const [createForm, setCreateForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    cnpj: "",
    senha: "",
    plano: "bronze" as const,
    valorPlano: "",
    modoDemonstracao: false,
    diasAcesso: 7,
    observacoes: "",
  });
  
  const [editForm, setEditForm] = useState<{
    nome: string;
    email: string;
    telefone: string;
    cpf: string;
    cnpj: string;
    plano: string;
    valorPlano: string;
    status: string;
    statusPagamento: string;
    periodicidade: string;
    dataInicio: string;
    dataFim: string;
    dataUltimoPagamento: string;
    dataProximoPagamento: string;
    observacoes: string;
  } | null>(null);

  const { data: tenants, isLoading, refetch } = trpc.admin.listTenants.useQuery();

  // Verificar se o usuário tem permissão
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'tenant_admin';

  // Filtrar clientes
  const clientesFiltrados = useMemo(() => {
    if (!tenants) return [];
    
    return tenants.filter((tenant: any) => {
      if (filtroStatus !== "all" && tenant.status !== filtroStatus) return false;
      if (filtroPlano !== "all" && tenant.plano !== filtroPlano) return false;
      if (filtroPagamento !== "all" && (tenant.statusPagamento || "pendente") !== filtroPagamento) return false;
      
      if (busca) {
        const buscaLower = busca.toLowerCase();
        const nome = (tenant.nome || "").toLowerCase();
        const email = (tenant.email || "").toLowerCase();
        const cpf = (tenant.cpf || "").toLowerCase();
        const cnpj = (tenant.cnpj || "").toLowerCase();
        
        if (!nome.includes(buscaLower) && !email.includes(buscaLower) && 
            !cpf.includes(buscaLower) && !cnpj.includes(buscaLower)) {
          return false;
        }
      }
      
      return true;
    });
  }, [tenants, filtroStatus, filtroPlano, filtroPagamento, busca]);

  // Calcular estatísticas
  const estatisticas = useMemo(() => {
    if (!tenants) return null;

    const total = tenants.length;
    const ativos = tenants.filter((t: any) => t.status === "ativo").length;
    const suspensos = tenants.filter((t: any) => t.status === "suspenso").length;
    const cancelados = tenants.filter((t: any) => t.status === "cancelado").length;
    
    const pagos = tenants.filter((t: any) => (t.statusPagamento || "pendente") === "pago").length;
    const pendentes = tenants.filter((t: any) => (t.statusPagamento || "pendente") === "pendente").length;
    const atrasados = tenants.filter((t: any) => (t.statusPagamento || "pendente") === "atrasado").length;

    // Calcular receita mensal
    const receitaMensal = tenants
      .filter((t: any) => t.status === "ativo")
      .reduce((acc: number, t: any) => {
        const valor = parseFloat((t.valorPlano || PLANOS.find(p => p.value === t.plano)?.valor || "0").replace(",", "."));
        return acc + valor;
      }, 0);

    // Pagamentos a vencer (próximos 7 dias)
    const hoje = new Date();
    const proximos7Dias = addDays(hoje, 7);
    const aVencer = tenants.filter((t: any) => {
      if (!t.dataProximoPagamento || t.status !== "ativo") return false;
      const dataProx = new Date(t.dataProximoPagamento);
      return isAfter(dataProx, hoje) && isBefore(dataProx, proximos7Dias);
    }).length;

    // Pagamentos vencidos
    const vencidos = tenants.filter((t: any) => {
      if (!t.dataProximoPagamento || t.status !== "ativo") return false;
      return isBefore(new Date(t.dataProximoPagamento), hoje);
    }).length;

    return {
      total,
      ativos,
      suspensos,
      cancelados,
      pagos,
      pendentes,
      atrasados,
      receitaMensal,
      aVencer,
      vencidos,
    };
  }, [tenants]);

  // Dados para gráficos
  const dadosPorPlano = useMemo(() => {
    if (!tenants) return [];
    
    const porPlano: Record<string, number> = {};
    tenants.forEach((t: any) => {
      porPlano[t.plano] = (porPlano[t.plano] || 0) + 1;
    });
    
    return Object.entries(porPlano).map(([plano, count]) => ({
      name: PLANOS.find(p => p.value === plano)?.label || plano,
      value: count,
    }));
  }, [tenants]);

  const dadosPorStatus = useMemo(() => {
    if (!tenants) return [];
    
    return [
      { name: "Ativos", value: estatisticas?.ativos || 0 },
      { name: "Suspensos", value: estatisticas?.suspensos || 0 },
      { name: "Cancelados", value: estatisticas?.cancelados || 0 },
    ];
  }, [estatisticas]);

  const dadosReceitaPorPlano = useMemo(() => {
    if (!tenants) return [];
    
    const receitaPorPlano: Record<string, number> = {};
    tenants
      .filter((t: any) => t.status === "ativo")
      .forEach((t: any) => {
        const valor = parseFloat((t.valorPlano || PLANOS.find(p => p.value === t.plano)?.valor || "0").replace(",", "."));
        receitaPorPlano[t.plano] = (receitaPorPlano[t.plano] || 0) + valor;
      });
    
    return Object.entries(receitaPorPlano).map(([plano, receita]) => ({
      name: PLANOS.find(p => p.value === plano)?.label || plano,
      receita: receita.toFixed(2),
    }));
  }, [tenants]);

  const updatePlanoMutation = trpc.admin.updateTenantPlano.useMutation({
    onSuccess: () => {
      toast.success("Plano atualizado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar plano: ${error.message}`);
    },
  });

  const updateStatusMutation = trpc.admin.updateTenantStatus.useMutation({
    onSuccess: () => {
      toast.success("Status atualizado com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar status: ${error.message}`);
    },
  });

  const updateDatesMutation = trpc.admin.updateTenantDates.useMutation({
    onSuccess: () => {
      toast.success("Datas atualizadas com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar datas: ${error.message}`);
    },
  });

  const updatePagamentoMutation = trpc.admin.updateTenantPagamento.useMutation({
    onSuccess: () => {
      toast.success("Informações de pagamento atualizadas!");
      refetch();
      setDialogOpen(false);
      setEditingTenant(null);
      setEditForm(null);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar pagamento: ${error.message}`);
    },
  });

  const updateContatoMutation = trpc.admin.updateTenantContato.useMutation({
    onSuccess: () => {
      toast.success("Informações de contato atualizadas!");
      refetch();
      setDialogOpen(false);
      setEditingTenant(null);
      setEditForm(null);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar contato: ${error.message}`);
    },
  });

  const createTenantMutation = trpc.admin.createTenant.useMutation({
    onSuccess: () => {
      toast.success("Cliente cadastrado com sucesso!");
      refetch();
      setDialogCreateOpen(false);
      setCreateForm({
        nome: "",
        email: "",
        telefone: "",
        cpf: "",
        cnpj: "",
        senha: "",
        plano: "bronze",
        valorPlano: "",
        modoDemonstracao: false,
        diasAcesso: 7,
        observacoes: "",
      });
    },
    onError: (error) => {
      toast.error(`Erro ao cadastrar cliente: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!createForm.nome.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    
    if (!createForm.senha.trim() || createForm.senha.length < 6) {
      toast.error("Senha é obrigatória e deve ter no mínimo 6 caracteres");
      return;
    }
    
    if (createForm.modoDemonstracao && (!createForm.diasAcesso || createForm.diasAcesso < 1)) {
      toast.error("Informe a quantidade de dias de acesso para modo demonstração");
      return;
    }

    createTenantMutation.mutate({
      nome: createForm.nome,
      email: createForm.email || undefined,
      telefone: createForm.telefone || undefined,
      cpf: createForm.cpf || undefined,
      cnpj: createForm.cnpj || undefined,
      senha: createForm.senha,
      plano: createForm.plano,
      valorPlano: createForm.valorPlano || undefined,
      modoDemonstracao: createForm.modoDemonstracao,
      diasAcesso: createForm.modoDemonstracao ? createForm.diasAcesso : undefined,
      observacoes: createForm.observacoes || undefined,
    });
  };

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso Negado</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Você precisa ter permissão de administrador para acessar esta página.
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Seu role atual:</strong> {user?.role || 'Não identificado'}
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const handleEdit = (tenant: any) => {
    setEditingTenant(tenant.id);
    setEditForm({
      nome: tenant.nome || "",
      email: tenant.email || "",
      telefone: tenant.telefone || "",
      cpf: tenant.cpf || "",
      cnpj: tenant.cnpj || "",
      plano: tenant.plano || "",
      valorPlano: tenant.valorPlano || PLANOS.find(p => p.value === tenant.plano)?.valor || "",
      status: tenant.status || "ativo",
      statusPagamento: tenant.statusPagamento || "pendente",
      periodicidade: tenant.periodicidade || "mensal",
      dataInicio: tenant.dataInicio ? format(new Date(tenant.dataInicio), "yyyy-MM-dd") : "",
      dataFim: tenant.dataFim ? format(new Date(tenant.dataFim), "yyyy-MM-dd") : "",
      dataUltimoPagamento: tenant.dataUltimoPagamento ? format(new Date(tenant.dataUltimoPagamento), "yyyy-MM-dd") : "",
      dataProximoPagamento: tenant.dataProximoPagamento ? format(new Date(tenant.dataProximoPagamento), "yyyy-MM-dd") : "",
      observacoes: tenant.observacoes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!editingTenant || !editForm) return;

    updateContatoMutation.mutate({
      tenantId: editingTenant,
      nome: editForm.nome,
      email: editForm.email,
      telefone: editForm.telefone,
      cpf: editForm.cpf,
      cnpj: editForm.cnpj,
      observacoes: editForm.observacoes,
    });

    if (editForm.plano !== tenants?.find((t: any) => t.id === editingTenant)?.plano) {
      updatePlanoMutation.mutate({
        tenantId: editingTenant,
        plano: editForm.plano as any,
        valorPlano: editForm.valorPlano,
      });
    }

    if (editForm.status !== tenants?.find((t: any) => t.id === editingTenant)?.status) {
      updateStatusMutation.mutate({
        tenantId: editingTenant,
        status: editForm.status as any,
      });
    }

    const currentTenant = tenants?.find((t: any) => t.id === editingTenant);
    if (
      editForm.dataInicio !== (currentTenant?.dataInicio ? format(new Date(currentTenant.dataInicio), "yyyy-MM-dd") : "") ||
      editForm.dataFim !== (currentTenant?.dataFim ? format(new Date(currentTenant.dataFim), "yyyy-MM-dd") : "")
    ) {
      updateDatesMutation.mutate({
        tenantId: editingTenant,
        dataInicio: editForm.dataInicio,
        dataFim: editForm.dataFim || undefined,
      });
    }

    updatePagamentoMutation.mutate({
      tenantId: editingTenant,
      dataUltimoPagamento: editForm.dataUltimoPagamento || undefined,
      dataProximoPagamento: editForm.dataProximoPagamento || undefined,
      statusPagamento: editForm.statusPagamento as any,
      valorPlano: editForm.valorPlano,
    });
  };

  const getPlanoLabel = (plano: string) => {
    return PLANOS.find((p) => p.value === plano)?.label || plano;
  };

  const getPlanoColor = (plano: string) => {
    return PLANOS.find((p) => p.value === plano)?.color || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status: string) => {
    return STATUS.find((s) => s.value === status)?.label || status;
  };

  const getStatusColor = (status: string) => {
    return STATUS.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-800";
  };

  const getStatusPagamentoLabel = (status: string) => {
    return STATUS_PAGAMENTO.find((s) => s.value === status)?.label || status;
  };

  const getStatusPagamentoColor = (status: string) => {
    return STATUS_PAGAMENTO.find((s) => s.value === status)?.color || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando clientes...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Administração de Clientes</h1>
            <p className="text-muted-foreground mt-1">
              Gestão completa de clientes, planos e pagamentos
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.total}</div>
                <p className="text-xs text-muted-foreground">
                  {estatisticas.ativos} ativos, {estatisticas.suspensos} suspensos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {estatisticas.receitaMensal.toFixed(2).replace(".", ",")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {estatisticas.pagos} pagos, {estatisticas.atrasados} atrasados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagamentos a Vencer</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{estatisticas.aVencer}</div>
                <p className="text-xs text-muted-foreground">
                  Próximos 7 dias
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagamentos Vencidos</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{estatisticas.vencidos}</div>
                <p className="text-xs text-muted-foreground">
                  Requer atenção
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Alertas */}
        {estatisticas && (estatisticas.aVencer > 0 || estatisticas.vencidos > 0) && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div className="flex-1">
                  <p className="font-semibold text-yellow-900">Atenção: Pagamentos Requerem Ação</p>
                  <p className="text-sm text-yellow-700">
                    {estatisticas.vencidos > 0 && `${estatisticas.vencidos} pagamento(s) vencido(s). `}
                    {estatisticas.aVencer > 0 && `${estatisticas.aVencer} pagamento(s) a vencer nos próximos 7 dias.`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={dadosPorPlano}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosPorPlano.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status dos Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosPorStatus}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Receita por Plano</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dadosReceitaPorPlano}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `R$ ${value}`} />
                  <Bar dataKey="receita" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pagos</span>
                  <Badge className="bg-green-100 text-green-800">
                    {estatisticas?.pagos || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Pendentes</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    {estatisticas?.pendentes || 0}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Atrasados</span>
                  <Badge className="bg-red-100 text-red-800">
                    {estatisticas?.atrasados || 0}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros e Busca */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Clientes ({clientesFiltrados.length})</CardTitle>
              <Button onClick={() => setDialogCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4 mb-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email, CPF ou CNPJ..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  {STATUS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroPlano} onValueChange={setFiltroPlano}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Planos</SelectItem>
                  {PLANOS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filtroPagamento} onValueChange={setFiltroPagamento}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Pagamentos</SelectItem>
                  {STATUS_PAGAMENTO.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {!clientesFiltrados || clientesFiltrados.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum cliente encontrado com os filtros aplicados.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Plano</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Último Pagamento</TableHead>
                      <TableHead>Próximo Pagamento</TableHead>
                      <TableHead>Estatísticas</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientesFiltrados.map((tenant: any) => {
                      const dataProx = tenant.dataProximoPagamento ? new Date(tenant.dataProximoPagamento) : null;
                      const hoje = new Date();
                      const vencendo = dataProx && isAfter(dataProx, hoje) && isBefore(dataProx, addDays(hoje, 7));
                      const vencido = dataProx && isBefore(dataProx, hoje);
                      
                      return (
                        <TableRow 
                          key={tenant.id}
                          className={vencido ? "bg-red-50" : vencendo ? "bg-yellow-50" : ""}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium">{tenant.nome || `Cliente #${tenant.id}`}</div>
                              {tenant.cpf && (
                                <div className="text-xs text-muted-foreground">CPF: {tenant.cpf}</div>
                              )}
                              {tenant.cnpj && (
                                <div className="text-xs text-muted-foreground">CNPJ: {tenant.cnpj}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {tenant.email && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3" />
                                  {tenant.email}
                                </div>
                              )}
                              {tenant.telefone && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Phone className="h-3 w-3" />
                                  {tenant.telefone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getPlanoColor(tenant.plano)}>
                              {getPlanoLabel(tenant.plano)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              <span className="font-medium">
                                R$ {tenant.valorPlano || PLANOS.find(p => p.value === tenant.plano)?.valor || "0,00"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(tenant.status)}>
                              {getStatusLabel(tenant.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusPagamentoColor(tenant.statusPagamento || "pendente")}>
                              {getStatusPagamentoLabel(tenant.statusPagamento || "pendente")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {tenant.dataUltimoPagamento
                              ? format(new Date(tenant.dataUltimoPagamento), "dd/MM/yyyy", { locale: ptBR })
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {tenant.dataProximoPagamento ? (
                              <div className={vencido ? "text-red-600 font-semibold" : vencendo ? "text-yellow-600 font-semibold" : ""}>
                                {format(new Date(tenant.dataProximoPagamento), "dd/MM/yyyy", { locale: ptBR })}
                                {vencido && " ⚠️"}
                                {vencendo && " ⏰"}
                              </div>
                            ) : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2 text-sm">
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {tenant.stats?.usuarios || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {tenant.stats?.empresas || 0}
                              </span>
                              <span className="flex items-center gap-1">
                                <UserCheck className="h-3 w-3" />
                                {tenant.stats?.colaboradores || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(tenant)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog de Edição */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Cliente</DialogTitle>
            </DialogHeader>
            {editForm && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Informações de Contato</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="nome">Nome *</Label>
                      <Input
                        id="nome"
                        value={editForm.nome}
                        onChange={(e) => setEditForm({ ...editForm, nome: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        value={editForm.telefone}
                        onChange={(e) => setEditForm({ ...editForm, telefone: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        value={editForm.cpf}
                        onChange={(e) => setEditForm({ ...editForm, cpf: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cnpj">CNPJ</Label>
                      <Input
                        id="cnpj"
                        value={editForm.cnpj}
                        onChange={(e) => setEditForm({ ...editForm, cnpj: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Plano e Status</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="plano">Plano *</Label>
                      <Select
                        value={editForm.plano}
                        onValueChange={(value) => {
                          const plano = PLANOS.find(p => p.value === value);
                          setEditForm({
                            ...editForm,
                            plano: value,
                            valorPlano: plano?.valor || editForm.valorPlano
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PLANOS.map((plano) => (
                            <SelectItem key={plano.value} value={plano.value}>
                              {plano.label} - R$ {plano.valor}/mês
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="valorPlano">Valor do Plano (R$)</Label>
                      <Input
                        id="valorPlano"
                        value={editForm.valorPlano}
                        onChange={(e) => setEditForm({ ...editForm, valorPlano: e.target.value })}
                        placeholder="67,90"
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status *</Label>
                      <Select
                        value={editForm.status}
                        onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="statusPagamento">Status Pagamento</Label>
                      <Select
                        value={editForm.statusPagamento}
                        onValueChange={(value) => setEditForm({ ...editForm, statusPagamento: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_PAGAMENTO.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Datas</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="dataInicio">Data Início *</Label>
                      <Input
                        id="dataInicio"
                        type="date"
                        value={editForm.dataInicio}
                        onChange={(e) => setEditForm({ ...editForm, dataInicio: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataFim">Data Fim</Label>
                      <Input
                        id="dataFim"
                        type="date"
                        value={editForm.dataFim}
                        onChange={(e) => setEditForm({ ...editForm, dataFim: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataUltimoPagamento">Último Pagamento</Label>
                      <Input
                        id="dataUltimoPagamento"
                        type="date"
                        value={editForm.dataUltimoPagamento}
                        onChange={(e) => setEditForm({ ...editForm, dataUltimoPagamento: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="dataProximoPagamento">Próximo Pagamento</Label>
                      <Input
                        id="dataProximoPagamento"
                        type="date"
                        value={editForm.dataProximoPagamento}
                        onChange={(e) => setEditForm({ ...editForm, dataProximoPagamento: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações</Label>
                  <Textarea
                    id="observacoes"
                    value={editForm.observacoes}
                    onChange={(e) => setEditForm({ ...editForm, observacoes: e.target.value })}
                    rows={4}
                    placeholder="Anotações sobre o cliente..."
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      setEditingTenant(null);
                      setEditForm(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={
                      updatePlanoMutation.isPending ||
                      updateStatusMutation.isPending ||
                      updateDatesMutation.isPending ||
                      updatePagamentoMutation.isPending ||
                      updateContatoMutation.isPending
                    }
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Dialog de Cadastro */}
        <Dialog open={dialogCreateOpen} onOpenChange={setDialogCreateOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="create-nome">Nome *</Label>
                    <Input
                      id="create-nome"
                      value={createForm.nome}
                      onChange={(e) => setCreateForm({ ...createForm, nome: e.target.value })}
                      placeholder="Nome completo ou razão social"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-email">Email</Label>
                    <Input
                      id="create-email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-telefone">Telefone</Label>
                    <Input
                      id="create-telefone"
                      value={createForm.telefone}
                      onChange={(e) => setCreateForm({ ...createForm, telefone: e.target.value })}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-cpf">CPF</Label>
                    <Input
                      id="create-cpf"
                      value={createForm.cpf}
                      onChange={(e) => setCreateForm({ ...createForm, cpf: e.target.value })}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-cnpj">CNPJ</Label>
                    <Input
                      id="create-cnpj"
                      value={createForm.cnpj}
                      onChange={(e) => setCreateForm({ ...createForm, cnpj: e.target.value })}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-senha">Senha *</Label>
                    <Input
                      id="create-senha"
                      type="password"
                      value={createForm.senha}
                      onChange={(e) => setCreateForm({ ...createForm, senha: e.target.value })}
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Senha para acesso ao sistema (mínimo 6 caracteres)
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Plano e Acesso</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-plano">Plano *</Label>
                    <Select
                      value={createForm.plano}
                      onValueChange={(value: any) => {
                        const planoSelecionado = PLANOS.find(p => p.value === value);
                        setCreateForm({ 
                          ...createForm, 
                          plano: value,
                          valorPlano: planoSelecionado?.valor || ""
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANOS.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label} - R$ {p.valor}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="create-valor">Valor do Plano</Label>
                    <Input
                      id="create-valor"
                      value={createForm.valorPlano}
                      onChange={(e) => setCreateForm({ ...createForm, valorPlano: e.target.value })}
                      placeholder="67,90"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Modo Demonstração</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="create-demo"
                      checked={createForm.modoDemonstracao}
                      onCheckedChange={(checked) => 
                        setCreateForm({ ...createForm, modoDemonstracao: checked === true })
                      }
                    />
                    <Label htmlFor="create-demo" className="font-normal cursor-pointer">
                      Liberar acesso em modo demonstração
                    </Label>
                  </div>
                  
                  {createForm.modoDemonstracao && (
                    <div>
                      <Label htmlFor="create-dias">Quantidade de Dias de Acesso *</Label>
                      <Input
                        id="create-dias"
                        type="number"
                        min="1"
                        value={createForm.diasAcesso}
                        onChange={(e) => setCreateForm({ 
                          ...createForm, 
                          diasAcesso: parseInt(e.target.value) || 7 
                        })}
                        placeholder="7"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        O acesso será liberado por {createForm.diasAcesso} dia(s) a partir de hoje.
                        {createForm.diasAcesso > 0 && (
                          <span className="block mt-1">
                            Data de expiração: {format(addDays(new Date(), createForm.diasAcesso), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="create-observacoes">Observações</Label>
                <Textarea
                  id="create-observacoes"
                  value={createForm.observacoes}
                  onChange={(e) => setCreateForm({ ...createForm, observacoes: e.target.value })}
                  placeholder="Observações adicionais sobre o cliente..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogCreateOpen(false);
                    setCreateForm({
                      nome: "",
                      email: "",
                      telefone: "",
                      cpf: "",
                      cnpj: "",
                      senha: "",
                      plano: "bronze",
                      valorPlano: "",
                      modoDemonstracao: false,
                      diasAcesso: 7,
                      observacoes: "",
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={createTenantMutation.isPending}
                >
                  {createTenantMutation.isPending ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Cliente
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
