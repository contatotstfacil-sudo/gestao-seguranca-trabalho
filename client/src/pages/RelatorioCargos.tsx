import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Building2, FolderTree, BarChart3, Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function RelatorioCargos() {
  const [empresaFiltro, setEmpresaFiltro] = useState<number | undefined>(undefined);
  
  const { data: empresas = [] } = trpc.empresas.list.useQuery();
  const { data: relatorioPorEmpresa = [], isLoading: loadingEmpresa } = trpc.cargos.relatorioPorEmpresa.useQuery(
    { empresaId: empresaFiltro },
    { enabled: true }
  );
  const { data: relatorioPorSetor = [], isLoading: loadingSetor } = trpc.cargos.relatorioPorSetor.useQuery(
    { empresaId: empresaFiltro },
    { enabled: true }
  );
  const { data: relatorioPorEmpresaESetor = [], isLoading: loadingCombinado } = trpc.cargos.relatorioPorEmpresaESetor.useQuery(
    { empresaId: empresaFiltro },
    { enabled: true }
  );

  const handleExportCSV = () => {
    // Exportar relatório combinado para CSV
    const headers = ["Empresa", "Setor", "Quantidade de Cargos"];
    const rows = relatorioPorEmpresaESetor.map((item: any) => [
      item.razaoSocial || item.nomeFantasia || "Sem empresa",
      item.nomeSetor || "Sem setor",
      item.quantidade || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_cargos_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalCargos = relatorioPorEmpresa.reduce((sum: number, item: any) => sum + (Number(item.quantidade) || 0), 0);
  const totalSetores = relatorioPorSetor.length;

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatório de Cargos</h1>
            <p className="text-gray-600 mt-1">Quantidade de cargos por empresas e setores</p>
          </div>
          <Button onClick={handleExportCSV} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filtrar por Empresa
                </label>
                <select
                  value={empresaFiltro || ""}
                  onChange={(e) => setEmpresaFiltro(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full border rounded-md px-3 py-2"
                >
                  <option value="">Todas as empresas</option>
                  {empresas.map((empresa: any) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.razaoSocial || empresa.nomeFantasia}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total de Cargos
              </CardTitle>
              <Building2 className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalCargos}</div>
              <p className="text-xs text-gray-500 mt-1">Em todas as empresas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Setores com Cargos
              </CardTitle>
              <FolderTree className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{totalSetores}</div>
              <p className="text-xs text-gray-500 mt-1">Setores vinculados</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Relatórios Disponíveis
              </CardTitle>
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">3</div>
              <p className="text-xs text-gray-500 mt-1">Tipos de análise</p>
            </CardContent>
          </Card>
        </div>

        {/* Relatório por Empresa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Cargos por Empresa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingEmpresa ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : relatorioPorEmpresa.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum dado disponível</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-right">Quantidade de Cargos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorioPorEmpresa.map((item: any) => (
                      <TableRow key={item.empresaId || "sem-empresa"}>
                        <TableCell className="font-medium">
                          {item.razaoSocial || item.nomeFantasia || "Sem empresa"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {item.quantidade || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Relatório por Setor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              Cargos por Setor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingSetor ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : relatorioPorSetor.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum dado disponível</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Setor</TableHead>
                      <TableHead className="text-right">Quantidade de Cargos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorioPorSetor
                      .sort((a: any, b: any) => (b.quantidade || 0) - (a.quantidade || 0))
                      .map((item: any) => (
                        <TableRow key={item.setorId || "sem-setor"}>
                          <TableCell className="font-medium">
                            {item.nomeSetor || "Sem setor"}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.quantidade || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Relatório Combinado: Empresa x Setor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Cargos por Empresa e Setor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCombinado ? (
              <div className="text-center py-8 text-gray-500">Carregando...</div>
            ) : relatorioPorEmpresaESetor.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Nenhum dado disponível</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead className="text-right">Quantidade de Cargos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {relatorioPorEmpresaESetor
                      .sort((a: any, b: any) => {
                        // Ordenar por empresa, depois por quantidade
                        const empresaA = (a.razaoSocial || a.nomeFantasia || "").toLowerCase();
                        const empresaB = (b.razaoSocial || b.nomeFantasia || "").toLowerCase();
                        if (empresaA !== empresaB) {
                          return empresaA.localeCompare(empresaB);
                        }
                        return (b.quantidade || 0) - (a.quantidade || 0);
                      })
                      .map((item: any, index: number) => (
                        <TableRow key={`${item.empresaId}-${item.setorId}-${index}`}>
                          <TableCell className="font-medium">
                            {item.razaoSocial || item.nomeFantasia || "Sem empresa"}
                          </TableCell>
                          <TableCell>{item.nomeSetor || "Sem setor"}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {item.quantidade || 0}
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
    </DashboardLayout>
  );
}

