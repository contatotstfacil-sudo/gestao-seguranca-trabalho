import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Building2, Users, TrendingUp, MapPin, Search, Filter, Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function DashboardEmpresas() {
  const [filters, setFilters] = useState({
    searchTerm: "",
    status: "all" as "all" | "ativa" | "inativa",
    estado: "all",
    empresaSelecionada: null as number | null,
  });
  const [empresaOpen, setEmpresaOpen] = useState(false);
  const [empresaSearch, setEmpresaSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: empresas, isLoading } = trpc.empresas.list.useQuery({
    searchTerm: filters.searchTerm || undefined,
  });

  // Criar objeto de query estável usando useMemo
  const colaboradoresQueryInput = useMemo(() => {
    return filters.empresaSelecionada 
      ? { empresaId: filters.empresaSelecionada }
      : undefined;
  }, [filters.empresaSelecionada]);

  // Buscar colaboradores para calcular totais (filtrar por empresa se selecionada)
  // O tRPC detecta automaticamente mudanças no input e refaz a query
  const { data: colaboradores, refetch: refetchColaboradores } = trpc.colaboradores.list.useQuery(
    colaboradoresQueryInput,
    {
      // Garantir que a query seja refeita quando o filtro mudar
      refetchOnMount: "always",
      refetchOnWindowFocus: false,
      enabled: true,
    }
  );

  // Forçar atualização quando a empresa selecionada mudar
  useEffect(() => {
    // Usar um pequeno delay para evitar múltiplas chamadas
    const timeoutId = setTimeout(async () => {
      // Invalidar cache para forçar atualização
      await utils.colaboradores.list.invalidate(colaboradoresQueryInput);
      // Refazer a query imediatamente
      await refetchColaboradores();
    }, 100);
    
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.empresaSelecionada]);

  // Calcular métricas
  const metrics = useMemo(() => {
    if (!empresas || !colaboradores) {
      return {
        total: 0,
        ativas: 0,
        inativas: 0,
        totalColaboradores: 0,
      };
    }

    const ativas = empresas.filter((e: any) => e.status === "ativa").length;
    const inativas = empresas.filter((e: any) => e.status === "inativa").length;
    const totalColaboradores = colaboradores.filter((c: any) => c.status === "ativo").length;

    return {
      total: empresas.length,
      ativas,
      inativas,
      totalColaboradores,
    };
  }, [empresas, colaboradores]);

  // Filtrar empresas
  const empresasFiltradas = useMemo(() => {
    if (!empresas) return [];

    return empresas.filter((empresa: any) => {
      // Filtro por empresa selecionada
      if (filters.empresaSelecionada && empresa.id !== filters.empresaSelecionada) {
        return false;
      }

      // Filtro de busca (só aplica se não houver empresa selecionada)
      if (!filters.empresaSelecionada && filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesSearch =
          empresa.razaoSocial?.toLowerCase().includes(searchLower) ||
          empresa.cnpj?.includes(searchLower) ||
          empresa.cidadeEndereco?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtro de status
      if (filters.status !== "all" && empresa.status !== filters.status) {
        return false;
      }

      // Filtro de estado
      if (filters.estado !== "all" && empresa.estadoEndereco !== filters.estado) {
        return false;
      }

      return true;
    });
  }, [empresas, filters]);

  // Empresa selecionada para exibição
  const empresaSelecionada = useMemo(() => {
    if (!filters.empresaSelecionada || !empresas) return null;
    return empresas.find((e: any) => e.id === filters.empresaSelecionada);
  }, [filters.empresaSelecionada, empresas]);

  // Calcular colaboradores por empresa
  const empresasComColaboradores = useMemo(() => {
    if (!empresasFiltradas || !colaboradores) return [];

    return empresasFiltradas.map((empresa: any) => {
      const colaboradoresEmpresa = colaboradores.filter(
        (c: any) => c.empresaId === empresa.id && c.status === "ativo"
      );
      return {
        ...empresa,
        totalColaboradores: colaboradoresEmpresa.length,
      };
    });
  }, [empresasFiltradas, colaboradores]);

  // Top 10 empresas por colaboradores
  const topEmpresas = useMemo(() => {
    return [...empresasComColaboradores]
      .sort((a, b) => b.totalColaboradores - a.totalColaboradores)
      .slice(0, 10);
  }, [empresasComColaboradores]);

  // Distribuição por estado
  const distribuicaoPorEstado = useMemo(() => {
    const estados: { [key: string]: number } = {};
    empresasFiltradas.forEach((empresa: any) => {
      const estado = empresa.estadoEndereco || "Não informado";
      estados[estado] = (estados[estado] || 0) + 1;
    });
    return Object.entries(estados)
      .map(([estado, count]) => ({ estado, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [empresasFiltradas]);

  // Empresas cadastradas este mês
  const empresasEsteMes = useMemo(() => {
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return empresasFiltradas.filter((empresa: any) => {
      if (!empresa.createdAt) return false;
      const dataCriacao = new Date(empresa.createdAt);
      return dataCriacao >= inicioMes;
    }).length;
  }, [empresasFiltradas]);

  // Obter lista de estados únicos
  const estadosUnicos = useMemo(() => {
    if (!empresas) return [];
    const estados = new Set(
      empresas
        .map((e: any) => e.estadoEndereco)
        .filter((e: string) => e && e !== "")
    );
    return Array.from(estados).sort();
  }, [empresas]);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard de Empresas</h2>
          <p className="text-gray-600 mt-1">Visão geral e estatísticas das empresas cadastradas</p>
        </div>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Empresas</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total}</div>
            <p className="text-xs text-muted-foreground">Empresas cadastradas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.ativas}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total > 0
                ? `${Math.round((metrics.ativas / metrics.total) * 100)}% do total`
                : "0% do total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Empresas Inativas</CardTitle>
            <Building2 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{metrics.inativas}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.total > 0
                ? `${Math.round((metrics.inativas / metrics.total) * 100)}% do total`
                : "0% do total"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.totalColaboradores}</div>
            <p className="text-xs text-muted-foreground">Colaboradores ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas Adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Cadastros Este Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{empresasEsteMes}</div>
            <p className="text-xs text-muted-foreground">
              Empresas cadastradas em {format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Média de Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {empresasComColaboradores.length > 0
                ? Math.round(
                    empresasComColaboradores.reduce(
                      (acc, e) => acc + e.totalColaboradores,
                      0
                    ) / empresasComColaboradores.length
                  )
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">Por empresa</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Estados Representados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{distribuicaoPorEstado.length}</div>
            <p className="text-xs text-muted-foreground">Estados diferentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Selecionar Empresa</label>
                <Popover open={empresaOpen} onOpenChange={setEmpresaOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={empresaOpen}
                      className="w-full justify-between"
                    >
                      {empresaSelecionada
                        ? empresaSelecionada.razaoSocial
                        : "Selecione uma empresa..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Pesquisar empresa..."
                        value={empresaSearch}
                        onValueChange={setEmpresaSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setFilters((prev) => ({ ...prev, empresaSelecionada: null, searchTerm: "" }));
                              setEmpresaOpen(false);
                              setEmpresaSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !filters.empresaSelecionada ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Todas as empresas
                          </CommandItem>
                          {empresas
                            ?.filter((empresa: any) => {
                              if (!empresaSearch) return true;
                              const searchLower = empresaSearch.toLowerCase();
                              return (
                                empresa.razaoSocial?.toLowerCase().includes(searchLower) ||
                                empresa.cnpj?.includes(searchLower) ||
                                empresa.cidadeEndereco?.toLowerCase().includes(searchLower)
                              );
                            })
                            .map((empresa: any) => (
                              <CommandItem
                                key={empresa.id}
                                value={empresa.id.toString()}
                                onSelect={() => {
                                  setFilters((prev) => ({
                                    ...prev,
                                    empresaSelecionada: empresa.id,
                                    searchTerm: "",
                                  }));
                                  setEmpresaOpen(false);
                                  setEmpresaSearch("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    filters.empresaSelecionada === empresa.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{empresa.razaoSocial}</span>
                                  {empresa.cnpj && (
                                    <span className="text-xs text-muted-foreground">
                                      CNPJ: {empresa.cnpj}
                                    </span>
                                  )}
                                  {empresa.cidadeEndereco && (
                                    <span className="text-xs text-muted-foreground">
                                      {empresa.cidadeEndereco}
                                      {empresa.estadoEndereco && ` - ${empresa.estadoEndereco}`}
                                    </span>
                                  )}
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {empresaSelecionada && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, empresaSelecionada: null }));
                    }}
                  >
                    Limpar seleção
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Nome, CNPJ ou cidade..."
                    value={filters.searchTerm}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, searchTerm: e.target.value, empresaSelecionada: null }))
                    }
                    className="pl-8"
                    disabled={!!filters.empresaSelecionada}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select
                  value={filters.status}
                  onValueChange={(value: "all" | "ativa" | "inativa") =>
                    setFilters((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="ativa">Ativas</SelectItem>
                    <SelectItem value="inativa">Inativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Estado</label>
                <Select
                  value={filters.estado}
                  onValueChange={(value) =>
                    setFilters((prev) => ({ ...prev, estado: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    {estadosUnicos.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
        </CardContent>
      </Card>

      {/* Gráficos e Estatísticas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 10 Empresas por Colaboradores */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Top 10 Empresas por Colaboradores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topEmpresas.length > 0 ? (
                topEmpresas.map((empresa: any, index: number) => (
                  <div key={empresa.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{empresa.razaoSocial}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {empresa.cidadeEndereco}
                          {empresa.estadoEndereco && ` - ${empresa.estadoEndereco}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {empresa.totalColaboradores} {empresa.totalColaboradores === 1 ? "colaborador" : "colaboradores"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma empresa encontrada
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Distribuição por Estado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distribuicaoPorEstado.length > 0 ? (
                distribuicaoPorEstado.map((item) => (
                  <div key={item.estado} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.estado}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{
                          width: `${(item.count / empresasFiltradas.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum dado disponível
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Empresas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Lista de Empresas ({empresasFiltradas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : empresasFiltradas.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Razão Social</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Cidade/Estado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Colaboradores</TableHead>
                      <TableHead>Grau de Risco</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {empresasComColaboradores.map((empresa: any) => (
                      <TableRow key={empresa.id}>
                        <TableCell className="font-medium">{empresa.razaoSocial}</TableCell>
                        <TableCell>{empresa.cnpj || "-"}</TableCell>
                        <TableCell>
                          {empresa.cidadeEndereco || "-"}
                          {empresa.estadoEndereco && ` / ${empresa.estadoEndereco}`}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={empresa.status === "ativa" ? "default" : "secondary"}
                            className={
                              empresa.status === "ativa"
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }
                          >
                            {empresa.status === "ativa" ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{empresa.totalColaboradores}</Badge>
                        </TableCell>
                        <TableCell>{empresa.grauRisco || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhuma empresa encontrada com os filtros aplicados
              </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

