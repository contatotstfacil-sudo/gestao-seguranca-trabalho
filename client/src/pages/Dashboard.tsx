import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Building2, Users, HardHat, AlertTriangle, ShieldAlert, Filter, X } from "lucide-react";
import { useState, useMemo, useEffect } from "react";

export default function Dashboard() {
  const [empresaId, setEmpresaId] = useState<number | undefined>(undefined);
  const utils = trpc.useUtils();
  
  // Criar objeto de query estável usando useMemo
  const queryInput = useMemo(() => {
    return empresaId ? { empresaId } : undefined;
  }, [empresaId]);
  
  // O tRPC detecta automaticamente mudanças no input e refaz a query
  const { data: stats, isLoading, refetch } = trpc.dashboard.stats.useQuery(
    queryInput,
    {
      // Garantir que a query seja refeita quando a empresa mudar
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      enabled: true,
    }
  );

  // Forçar atualização quando a empresa mudar
  useEffect(() => {
    // Usar um pequeno delay para evitar múltiplas chamadas
    const timeoutId = setTimeout(async () => {
      // Invalidar cache para forçar atualização
      await utils.dashboard.stats.invalidate(queryInput);
      // Refazer a query imediatamente
      await refetch();
    }, 100);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaId]);
  
  const { data: empresas } = trpc.empresas.list.useQuery();

  const cards = [
    {
      title: "Empresas Ativas",
      value: stats?.empresasAtivas || 0,
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Colaboradores Ativos",
      value: stats?.colaboradoresAtivos || 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Obras em Andamento",
      value: stats?.obrasAtivas || 0,
      icon: HardHat,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
    {
      title: "Treinamentos Vencidos",
      value: stats?.treinamentosVencidos || 0,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-100",
    },
    {
      title: "EPIs Vencidos",
      value: stats?.episVencendo || 0,
      icon: ShieldAlert,
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Visão geral do sistema de gestão de segurança</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-64">
              <Label htmlFor="empresaId">Filtrar por Empresa</Label>
              <Select
                value={empresaId?.toString() || "all"}
                onValueChange={(value) => {
                  setEmpresaId(value === "all" ? undefined : parseInt(value));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {empresas?.map((empresa: any) => (
                    <SelectItem key={empresa.id} value={empresa.id.toString()}>
                      {empresa.razaoSocial}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {empresaId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEmpresaId(undefined)}
                className="mt-6"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      {card.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-gray-900">{card.value}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas Importantes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.treinamentosVencidos ? (
                  <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-900">
                        {stats.treinamentosVencidos} treinamento(s) vencido(s)
                      </p>
                      <p className="text-xs text-red-700">Requer atenção imediata</p>
                    </div>
                  </div>
                ) : null}
                {stats?.episVencendo ? (
                  <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <ShieldAlert className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-900">
                        {stats.episVencendo} EPI(s) vencido(s)
                      </p>
                      <p className="text-xs text-yellow-700">Verificar substituição</p>
                    </div>
                  </div>
                ) : null}
                {!stats?.treinamentosVencidos && !stats?.episVencendo && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum alerta no momento
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resumo Geral</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Total de Empresas</span>
                  <span className="font-semibold">{stats?.empresasAtivas || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Total de Colaboradores</span>
                  <span className="font-semibold">{stats?.colaboradoresAtivos || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-600">Obras Ativas</span>
                  <span className="font-semibold">{stats?.obrasAtivas || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">Status Geral</span>
                  <span className={`font-semibold ${
                    (stats?.treinamentosVencidos || 0) + (stats?.episVencendo || 0) > 0
                      ? "text-yellow-600"
                      : "text-green-600"
                  }`}>
                    {(stats?.treinamentosVencidos || 0) + (stats?.episVencendo || 0) > 0
                      ? "Atenção Necessária"
                      : "Normal"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
