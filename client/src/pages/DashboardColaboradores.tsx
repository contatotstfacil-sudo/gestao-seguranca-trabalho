import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, LabelList } from "recharts";
import { Users, TrendingUp, Calendar, AlertCircle } from "lucide-react";

// Paletas de cores específicas para cada tipo de gráfico
const STATUS_COLORS = {
  "Ativo": "#10b981", // Verde
  "Inativo": "#ef4444", // Vermelho
};

const SEXO_COLORS = {
  "Masculino": "#3b82f6", // Azul
  "Feminino": "#ec4899", // Rosa
  "Outro": "#8b5cf6", // Roxo
};

const COLORS_PALETTE = [
  "#3b82f6", // Azul
  "#10b981", // Verde
  "#f59e0b", // Laranja
  "#ef4444", // Vermelho
  "#8b5cf6", // Roxo
  "#ec4899", // Rosa
  "#06b6d4", // Ciano
  "#84cc16", // Lima
  "#f97316", // Laranja escuro
  "#14b8a6", // Turquesa
  "#a855f7", // Roxo claro
  "#eab308", // Amarelo
];

// Função para abreviar nomes de cargos/funções
const abbreviateName = (name: string): string => {
  if (!name) return "";
  const smallWords = ['de', 'do', 'da', 'e', 'ou', 'a', 'o'];
  const words = name.toLowerCase().split(' ');
  const abbreviated = words
    .filter(word => !smallWords.includes(word) && word.length > 0)
    .slice(0, 3)
    .map(word => word.substring(0, 3).toUpperCase())
    .join(' ');
  return abbreviated || name.substring(0, 3).toUpperCase();
};

// Componente de Tooltip customizado
const CustomFuncaoTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-2 border border-gray-300 rounded shadow">
        <p className="text-sm font-semibold">{data.fullName}</p>
        <p className="text-sm text-gray-600">Quantidade: {payload[0].value}</p>
      </div>
    );
  }
  return null;
};

export default function DashboardColaboradores() {
  const { data: stats, isLoading } = trpc.colaboradores.stats.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-8">Carregando estatísticas...</div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="p-8">Nenhum dado disponível</div>
      </DashboardLayout>
    );
  }

  // Formatar dados de sexo
  const sexoData = stats.sexo
    ?.map((s: any) => ({
      name: s.sexo === 'masculino' ? 'Masculino' : s.sexo === 'feminino' ? 'Feminino' : 'Outro',
      value: Number(s.count),
    }))
    .filter((s: any) => s.value > 0) || [];

  // Formatar dados de setor e criar top 5
  const TOP_SETORES = 5;
  const todosSetores = stats.setor
    ?.map((s: any) => ({
      name: s.setor || "Sem setor",
      value: Number(s.count),
    }))
    .filter((s: any) => s.value > 0)
    .sort((a: any, b: any) => b.value - a.value) || [];

  // Mostrar apenas os top 5 setores
  const setorData = todosSetores.slice(0, TOP_SETORES);

  // Dados de idade (não implementado no backend por enquanto)
  const idadeData: any[] = [];

  // Formatar dados de função e criar top N (top 5)
  const TOP_FUNCOES = 5;
  const todasFuncoes = stats.funcoes
    ?.map((f: any) => ({
      name: abbreviateName(f.funcao || "Sem função"),
      fullName: f.funcao || "Sem função",
      value: Number(f.count),
    }))
    .filter((f: any) => f.value > 0)
    .sort((a: any, b: any) => b.value - a.value) || [];

  // Mostrar apenas as top 5 funções, sem categoria "Outros"
  const funcaoData = todasFuncoes.slice(0, TOP_FUNCOES);

  // Formatar dados de status
  const statusData = stats.status
    ?.map((s: any) => ({
      name: s.status === 'ativo' ? 'Ativo' : 'Inativo',
      value: Number(s.count),
    }))
    .filter((s: any) => s.value > 0) || [];

  return (
    <DashboardLayout>
      <div className="space-y-8 p-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Colaboradores</h1>
          <p className="text-gray-600 mt-2">Visualize estatísticas e métricas de seus colaboradores</p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-gray-500">Colaboradores cadastrados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Colaboradores Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.ativos}</div>
              <p className="text-xs text-gray-500">Status ativo no sistema</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Atividade</CardTitle>
              <Calendar className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total > 0 ? Math.round((stats.ativos / stats.total) * 100) : 0}%
              </div>
              <p className="text-xs text-gray-500">Colaboradores ativos</p>
            </CardContent>
          </Card>
        </div>

        {/* Status dos Colaboradores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {statusData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Status dos Colaboradores</CardTitle>
                <CardDescription>Distribuição por status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart 
                    data={statusData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#374151" 
                      fontSize={13}
                      fontWeight={500}
                      tick={{ fill: '#374151' }}
                    />
                    <YAxis hide={true} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        padding: '12px',
                      }}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[8, 8, 0, 0]}
                      barSize={80}
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || "#3b82f6"} />
                      ))}
                      <LabelList 
                        dataKey="value" 
                        position="top" 
                        fill="#374151" 
                        fontSize={14} 
                        fontWeight={600}
                        offset={8}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {statusData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Proporção de Status</CardTitle>
                <CardDescription>Percentual de colaboradores por status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {statusData.map((entry: any, index: number) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STATUS_COLORS[entry.name as keyof typeof STATUS_COLORS] || "#3b82f6"} 
                          stroke="#fff" 
                          strokeWidth={3} 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => (
                        <span style={{ color: '#374151', fontSize: '13px', fontWeight: 500 }}>
                          {value}: {entry.payload.value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Distribuição por Função */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {funcaoData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Função</CardTitle>
                <CardDescription>
                  Top {TOP_FUNCOES} funções com mais colaboradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={funcaoData}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" hide={true} />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      width={140} 
                      stroke="#374151" 
                      fontSize={13}
                      fontWeight={500}
                      tick={{ fill: '#374151' }}
                    />
                    <Tooltip 
                      content={<CustomFuncaoTooltip />}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      radius={[0, 8, 8, 0]}
                      barSize={50}
                    >
                      {funcaoData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} />
                      ))}
                      <LabelList 
                        dataKey="value" 
                        position="right" 
                        fill="#374151" 
                        fontSize={13} 
                        fontWeight={600}
                        offset={8}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {funcaoData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Proporção de Funções</CardTitle>
                <CardDescription>
                  Top {TOP_FUNCOES} funções com mais colaboradores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={funcaoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {funcaoData.map((_entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={<CustomFuncaoTooltip />}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        padding: '12px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value, entry: any) => (
                        <span style={{ color: '#374151', fontSize: '12px', fontWeight: 500 }}>
                          {entry.payload.fullName || value}: {entry.payload.value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Distribuição por Sexo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sexoData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Sexo</CardTitle>
                <CardDescription>Colaboradores por sexo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sexoData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis hide={true} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#fff', 
                        border: '1px solid #e5e7eb', 
                        borderRadius: '8px' 
                      }} 
                    />
                    <Bar dataKey="value">
                      {sexoData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={SEXO_COLORS[entry.name as keyof typeof SEXO_COLORS] || "#3b82f6"} />
                      ))}
                      <LabelList dataKey="value" position="top" fill="#374151" fontSize={12} fontWeight={500} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {sexoData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Proporção de Sexo</CardTitle>
                <CardDescription>Percentual de colaboradores por sexo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={sexoData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {sexoData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={SEXO_COLORS[entry.name as keyof typeof SEXO_COLORS] || "#3b82f6"} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>



        {/* Distribuição por Setor */}
        {setorData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Setor</CardTitle>
              <CardDescription>Top {TOP_SETORES} setores com mais colaboradores</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={setorData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 180, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis type="number" hide={true} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={180} 
                    stroke="#374151" 
                    fontSize={13}
                    fontWeight={500}
                    tick={{ fill: '#374151' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      padding: '12px',
                    }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[0, 8, 8, 0]}
                    barSize={50}
                  >
                    {setorData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} />
                    ))}
                    <LabelList 
                      dataKey="value" 
                      position="right" 
                      fill="#374151" 
                      fontSize={13} 
                      fontWeight={600}
                      offset={8}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Colaboradores com Mais Tempo */}
        {stats.maisAntigos && stats.maisAntigos.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Colaboradores com Mais Tempo de Empresa</CardTitle>
              <CardDescription>Top 5 colaboradores mais antigos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.maisAntigos.map((colab: any, index: number) => {
                  const dataAdmissao = new Date(colab.dataAdmissao);
                  const hoje = new Date();
                  
                  let anos = hoje.getFullYear() - dataAdmissao.getFullYear();
                  let meses = hoje.getMonth() - dataAdmissao.getMonth();
                  
                  if (meses < 0) {
                    anos--;
                    meses += 12;
                  }
                  
                  if (hoje.getDate() < dataAdmissao.getDate()) {
                    meses--;
                    if (meses < 0) {
                      anos--;
                      meses += 12;
                    }
                  }
                  
                  let tempoEmpresa = "";
                  if (anos > 0) {
                    tempoEmpresa += anos + " ano" + (anos > 1 ? "s" : "");
                  }
                  if (meses > 0) {
                    if (tempoEmpresa) tempoEmpresa += " e ";
                    tempoEmpresa += meses + " m\u00eas" + (meses > 1 ? "es" : "");
                  }
                  if (!tempoEmpresa) {
                    tempoEmpresa = "Menos de 1 m\u00eas";
                  }
                  
                  return (
                    <div key={colab.id} className="flex items-center justify-between pb-4 border-b last:border-b-0">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{colab.nome}</p>
                          <p className="text-sm text-gray-500">{colab.funcao || "Sem função"}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{tempoEmpresa}</p>
                        <p className="text-sm text-gray-500">
                          {dataAdmissao.toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alertas Importantes */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Importantes</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Nenhum alerta no momento</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
