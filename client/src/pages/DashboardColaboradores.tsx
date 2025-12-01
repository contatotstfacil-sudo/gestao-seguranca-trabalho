import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Users, TrendingUp, User } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useState, useMemo, useEffect, useCallback, memo } from "react";

const COLORS = {
  masculino: "#3b82f6",
  feminino: "#ec4899",
  outro: "#8b5cf6",
};

export default function DashboardColaboradores() {
  const [empresaId, setEmpresaId] = useState<number | undefined>(undefined);
  const { data: empresas } = trpc.empresas.list.useQuery();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  // Buscar dados quando empresaId mudar
  useEffect(() => {
    let cancelled = false;
    
    setIsLoading(true);
    setError(null);
    
    const url = `/api/dashboard/colaboradores/stats`;
    const bodyData: { empresaId: number | null } = { 
      empresaId: empresaId !== undefined && empresaId !== null ? empresaId : null 
    };
    
    fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyData),
    })
    .then(async (response) => {
      if (cancelled) return;
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text}`);
      }
      const data = await response.json();
      const { _debug, ...statsData } = data;
      if (!cancelled) {
        setStats(statsData);
        setIsLoading(false);
      }
    })
    .catch((err) => {
      if (!cancelled) {
        setError(err);
        setIsLoading(false);
      }
    });
    
    return () => {
      cancelled = true;
    };
  }, [empresaId]);

  // Handler para mudança de empresa (memoizado)
  const handleEmpresaChange = useCallback((value: string) => {
    const newEmpresaId = value === "all" ? undefined : parseInt(value);
    setEmpresaId(newEmpresaId);
  }, []);

  // Memoizar valores calculados
  const statsValues = useMemo(() => ({
    total: stats?.total ?? 0,
    ativos: stats?.ativos ?? 0,
    inativos: stats?.inativos ?? 0,
    totalHomens: stats?.totalHomens ?? 0,
    totalMulheres: stats?.totalMulheres ?? 0,
    percentualHomens: stats?.percentualHomens ?? 0,
    percentualMulheres: stats?.percentualMulheres ?? 0,
    topFuncoes: stats?.funcoes?.slice(0, 10) ?? [],
    topSetores: stats?.setor?.slice(0, 10) ?? [],
    maisAntigos: stats?.maisAntigos ?? [],
    maisNovos: stats?.maisNovos ?? [],
  }), [stats]);

  const dadosSexo = useMemo(() => {
    if (!statsValues.totalHomens && !statsValues.totalMulheres) return [];
    return [
      { nome: "Masculino", quantidade: statsValues.totalHomens, cor: COLORS.masculino },
      { nome: "Feminino", quantidade: statsValues.totalMulheres, cor: COLORS.feminino },
    ].filter(item => item.quantidade > 0);
  }, [statsValues.totalHomens, statsValues.totalMulheres]);

  // Memoizar função de cálculo de tempo
  const calcularTempo = useCallback((dataAdmissao: string) => {
    const data = new Date(dataAdmissao);
    const hoje = new Date();
    let anos = hoje.getFullYear() - data.getFullYear();
    let meses = hoje.getMonth() - data.getMonth();
    if (meses < 0) { anos--; meses += 12; }
    if (hoje.getDate() < data.getDate()) {
      meses--;
      if (meses < 0) { anos--; meses += 12; }
    }
    if (anos > 0) {
      return `${anos} ano${anos > 1 ? "s" : ""}${meses > 0 ? ` e ${meses} mês${meses > 1 ? "es" : ""}` : ""}`;
    }
    return `${meses} mês${meses > 1 ? "es" : ""}`;
  }, []);

  // Memoizar nome da empresa
  const empresaNome = useMemo(() => {
    if (!empresaId || !empresas) return null;
    return empresas.find((e: any) => e.id === empresaId)?.razaoSocial;
  }, [empresaId, empresas]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard de Colaboradores</h1>
            <p className="text-gray-600 mt-1">
              {empresaNome ? `Visão geral - ${empresaNome}` : "Visão geral de todas as empresas"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Filtrar por Empresa:</Label>
            <Select
              value={empresaId?.toString() || "all"}
              onValueChange={handleEmpresaChange}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {empresas?.map((empresa: any) => (
                  <SelectItem key={empresa.id} value={empresa.id.toString()}>
                    {empresa.razaoSocial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Dashboard de Colaboradores</h1>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Filtrar por Empresa:</Label>
            <Select
              value={empresaId?.toString() || "all"}
              onValueChange={handleEmpresaChange}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {empresas?.map((empresa: any) => (
                  <SelectItem key={empresa.id} value={empresa.id.toString()}>
                    {empresa.razaoSocial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-center py-12 text-red-600">
          <p>Erro ao carregar dados: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
      <div>
            <h1 className="text-2xl font-bold">Dashboard de Colaboradores</h1>
            <p className="text-gray-600 mt-1">
              {empresaNome ? `Visão geral - ${empresaNome}` : "Visão geral de todas as empresas"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Filtrar por Empresa:</Label>
            <Select
              value={empresaId?.toString() || "all"}
              onValueChange={handleEmpresaChange}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Todas as empresas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {empresas?.map((empresa: any) => (
                  <SelectItem key={empresa.id} value={empresa.id.toString()}>
                    {empresa.razaoSocial}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
      </div>

        <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Colaboradores
                </CardTitle>
                <Users className="h-5 w-5 text-blue-500" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold">{statsValues.total}</div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Homens
                </CardTitle>
                <User className="h-5 w-5 text-blue-500" />
              </div>
          </CardHeader>
          <CardContent>
              <div className="text-3xl font-bold text-blue-600">{statsValues.totalHomens}</div>
          </CardContent>
        </Card>

        <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total de Mulheres
                </CardTitle>
                <User className="h-5 w-5 text-pink-500" />
      </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-pink-600">{statsValues.totalMulheres}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Taxa de Atividade
                </CardTitle>
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats?.taxa ?? 0}%</div>
            </CardContent>
          </Card>
      </div>

        {/* Cards de Porcentagem */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
              <CardTitle className="text-lg">Porcentagem de Homens</CardTitle>
              </CardHeader>
              <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Masculino</span>
                  <span className="text-gray-600">{statsValues.percentualHomens}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-500 h-4 rounded-full"
                    style={{ width: `${statsValues.percentualHomens}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Porcentagem de Mulheres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Feminino</span>
                  <span className="text-gray-600">{statsValues.percentualMulheres}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-pink-500 h-4 rounded-full"
                    style={{ width: `${statsValues.percentualMulheres}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
      </div>

        {/* Gráfico de Distribuição por Sexo */}
        {dadosSexo.length > 0 && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Distribuição por Sexo</CardTitle></CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dadosSexo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nome" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantidade" radius={[8, 8, 0, 0]}>
                      {dadosSexo.map((entry, index) => (
                        <Cell key={index} fill={entry.cor} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
              <CardHeader><CardTitle>Proporção por Sexo</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dadosSexo}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="quantidade"
                      label={({ nome, quantidade, percent }) =>
                        `${nome}: ${quantidade} (${(percent * 100).toFixed(1)}%)`
                      }
                    >
                      {dadosSexo.map((entry, index) => (
                        <Cell key={index} fill={entry.cor} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          )}

        {/* Top 10 Funções */}
        {statsValues.topFuncoes.length > 0 && (
        <Card>
          <CardHeader>
              <CardTitle>Top 10 Funções com Mais Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={statsValues.topFuncoes} layout="vertical" margin={{ top: 20, right: 30, left: 200, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="funcao" type="category" width={180} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

        {/* Top 10 Setores */}
        {statsValues.topSetores.length > 0 && (
        <Card>
          <CardHeader>
              <CardTitle>Top 10 Setores com Mais Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={statsValues.topSetores} layout="vertical" margin={{ top: 20, right: 30, left: 200, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="setor" type="category" width={180} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top 5 Mais Antigos e Mais Novos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {statsValues.maisAntigos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Funcionários Mais Antigos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statsValues.maisAntigos.map((colab: any, index: number) => (
                    <div key={colab.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{colab.nome}</p>
                          <p className="text-sm text-gray-500">{colab.funcao}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{calcularTempo(colab.dataAdmissao)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(colab.dataAdmissao).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
          </CardContent>
        </Card>
      )}

          {statsValues.maisNovos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Funcionários Mais Novos</CardTitle>
        </CardHeader>
        <CardContent>
                <div className="space-y-3">
                  {statsValues.maisNovos.map((colab: any, index: number) => (
                    <div key={colab.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold flex items-center justify-center">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{colab.nome}</p>
                          <p className="text-sm text-gray-500">{colab.funcao}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{calcularTempo(colab.dataAdmissao)}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(colab.dataAdmissao).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
        </CardContent>
      </Card>
          )}
        </div>
      </div>
    </div>
  );
}
