import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, FileText, Users } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ListaPresencaEmitida({ showLayout = true }: { showLayout?: boolean }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("");
  const [filtroMes, setFiltroMes] = useState<string>("");
  const [filtroAno, setFiltroAno] = useState<string>("");
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: empresas } = trpc.empresas.list.useQuery();
  const { data: certificadosEmitidos = [], isLoading } = trpc.certificadosEmitidos.list.useQuery({
    searchTerm: searchTerm || undefined,
    empresaId: filtroEmpresa ? parseInt(filtroEmpresa) : undefined,
    mes: filtroMes || undefined,
    ano: filtroAno || undefined,
  });

  const { data: modelosCertificados = [] } = trpc.modelosCertificados.list.useQuery();
  const { data: colaboradores = [] } = trpc.colaboradores.list.useQuery({});

  // Agrupar certificados por empresa e modelo de certificado
  const gruposCertificados = useMemo(() => {
    const grupos: { [key: string]: any[] } = {};

    certificadosEmitidos.forEach((certificado: any) => {
      const chave = `${certificado.empresaId || 'sem-empresa'}-${certificado.modeloCertificadoId}`;
      if (!grupos[chave]) {
        grupos[chave] = [];
      }
      grupos[chave].push(certificado);
    });

    return Object.entries(grupos).map(([chave, certificados]) => {
      const primeiroCertificado = certificados[0];
      const modelo = modelosCertificados.find((m: any) => m.id === primeiroCertificado.modeloCertificadoId);
      const empresa = empresas?.find((e: any) => e.id === primeiroCertificado.empresaId);

      return {
        chave,
        certificados,
        empresaNome: empresa?.razaoSocial || primeiroCertificado.nomeEmpresa || "Sem empresa",
        empresaCnpj: empresa?.cnpj || primeiroCertificado.cnpjEmpresa || "",
        modeloNome: modelo?.nome || "Modelo não encontrado",
        quantidade: certificados.length,
      };
    });
  }, [certificadosEmitidos, modelosCertificados, empresas, colaboradores]);

  // Função para formatar data
  const formatarData = (dataString: string): string => {
    if (!dataString) return "";
    try {
      // Se já está no formato YYYY-MM-DD, converter
      if (/^\d{4}-\d{2}-\d{2}$/.test(dataString)) {
        const [year, month, day] = dataString.split('-');
        return `${day}/${month}/${year}`;
      }
      // Se tem timestamp, extrair apenas a parte da data
      if (dataString.includes('T')) {
        const dataPart = dataString.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(dataPart)) {
          const [year, month, day] = dataPart.split('-');
          return `${day}/${month}/${year}`;
        }
      }
      // Tentar converter de Date
      const date = new Date(dataString);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      return dataString;
    } catch (error) {
      return dataString;
    }
  };

  // Gerar HTML da lista de presença
  const gerarListaPresenca = (grupo: any): string => {
    const certificados = grupo.certificados;
    const primeiroCertificado = certificados[0];
    const modelo = modelosCertificados.find((m: any) => m.id === primeiroCertificado.modeloCertificadoId);
    
    // Buscar informações do modelo
    const cargaHoraria = modelo?.cargaHoraria || "08h";
    const tipoNr = modelo?.tipoNr || "";
    const descricaoCertificado = modelo?.descricaoCertificado || modelo?.descricao || "";
    const nomeTreinamento = modelo?.nome || grupo.modeloNome;
    
    // Buscar conteúdo programático
    let conteudoProgramatico: string[] = [];
    if (modelo?.conteudoProgramatico) {
      try {
        const parsed = JSON.parse(modelo.conteudoProgramatico);
        if (Array.isArray(parsed)) {
          conteudoProgramatico = parsed;
        }
      } catch (e) {
        console.error("Erro ao parsear conteúdo programático:", e);
      }
    }
    
    // Coletar todas as datas únicas de todos os certificados
    const todasDatas: string[] = [];
    certificados.forEach((cert: any) => {
      if (cert.datasRealizacao) {
        try {
          const datas = JSON.parse(cert.datasRealizacao);
          if (Array.isArray(datas)) {
            datas.forEach((data: string) => {
              if (data && data.trim() !== "" && !todasDatas.includes(data)) {
                todasDatas.push(data);
              }
            });
          }
        } catch (e) {
          console.error("Erro ao parsear datas:", e);
        }
      }
    });
    
    // Ordenar datas
    todasDatas.sort((a, b) => {
      const dateA = new Date(a + 'T00:00:00');
      const dateB = new Date(b + 'T00:00:00');
      return dateA.getTime() - dateB.getTime();
    });
    
    // Se não tem datas, usar uma data padrão
    const datasParaUsar = todasDatas.length > 0 ? todasDatas : [new Date().toISOString().split('T')[0]];
    
    // Gerar conteúdo programático em duas colunas
    let conteudoProgramaticoHtml = "";
    if (conteudoProgramatico.length > 0) {
      const meio = Math.ceil(conteudoProgramatico.length / 2);
      const colunaEsquerda = conteudoProgramatico.slice(0, meio);
      const colunaDireita = conteudoProgramatico.slice(meio);
      
      conteudoProgramaticoHtml = `
        <div style="margin-top: 15px; margin-bottom: 15px;">
          <div style="font-weight: bold; margin-bottom: 8px; font-size: 11px;">Conteúdo Programático</div>
          <div style="display: flex; gap: 20px;">
            <div style="flex: 1; font-size: 10px;">
              ${colunaEsquerda.map(item => `<div style="margin-bottom: 4px;">${item}</div>`).join('')}
            </div>
            <div style="flex: 1; font-size: 10px;">
              ${colunaDireita.map(item => `<div style="margin-bottom: 4px;">${item}</div>`).join('')}
            </div>
          </div>
        </div>
      `;
    }
    
    const assuntoTreinamento = tipoNr ? `Treinamento Norma Regulamentadora NR - ${tipoNr}${descricaoCertificado ? ` / ${descricaoCertificado}` : ''}` : nomeTreinamento;
    
    // Gerar HTML para cada data (cada data será uma página)
    let htmlCompleto = "";
    
    datasParaUsar.forEach((data, indexData) => {
      const dataFormatada = formatarData(data);
      let linhasTabela = "";
      let numeroLinha = 1;
      
      certificados.forEach((cert: any) => {
        const nome = cert.nomeColaborador || "Nome não informado";
        linhasTabela += `
          <tr>
            <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 50px;">${String(numeroLinha).padStart(2, '0')}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: left;">${nome.toUpperCase()}</td>
            <td style="border: 1px solid #000; padding: 6px; text-align: center; width: 120px;"></td>
          </tr>
        `;
        numeroLinha++;
      });
      
      const listaPresencaHtml = `
        <div style="margin-top: 15px; page-break-inside: avoid;">
          <div style="background-color: #B3D9FF; padding: 8px; border: 1px solid #000; border-bottom: none;">
            <div style="font-weight: bold; text-align: center; font-size: 12px; margin-bottom: 6px;">LISTA DE PRESENÇA</div>
            <div style="display: flex; justify-content: space-between; font-size: 10px;">
              <span>Horário Início: 08:00</span>
              <span>Horário Término: 17:00</span>
              <span>Data: ${dataFormatada}</span>
              <span>Carga Horária: ${cargaHoraria}</span>
            </div>
          </div>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000;">
            <thead>
              <tr style="background-color: #E0E0E0;">
                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 50px; font-size: 10px;">Nº</th>
                <th style="border: 1px solid #000; padding: 6px; text-align: left; font-size: 10px;">PARTICIPANTES</th>
                <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 120px; font-size: 10px;">VISTO</th>
              </tr>
            </thead>
            <tbody>
              ${linhasTabela}
            </tbody>
          </table>
        </div>
      `;
      
      const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Registro de Treinamento</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    @page {
      size: A4 portrait;
      margin: 15mm;
    }
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      padding: 0;
      color: #000;
      width: 210mm;
      margin: 0 auto;
    }
    .container {
      width: 100%;
      max-width: 210mm;
      margin: 0 auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 15px;
    }
    th, td {
      border: 1px solid #000;
      padding: 6px;
    }
    .titulo-tabela {
      text-align: center;
      font-size: 16px;
      font-weight: bold;
      background-color: #f0f0f0;
    }
    .info-cabecalho {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
    }
    .info-esquerda {
      flex: 1;
    }
    .info-direita {
      text-align: right;
    }
    .conteudo-programatico {
      margin-bottom: 15px;
    }
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <table style="width: 100%; border-collapse: collapse; border: 2px solid #000;">
      <tr>
        <td class="titulo-tabela" style="border: 2px solid #000; padding: 12px; text-align: center; font-size: 16px; font-weight: bold;">
          REGISTRO DE TREINAMENTO
        </td>
      </tr>
      <tr>
        <td style="border: 2px solid #000; padding: 10px;">
          <div class="info-cabecalho">
            <div class="info-esquerda">
              <div><strong>Assunto:</strong> ${assuntoTreinamento}</div>
            </div>
            <div class="info-direita">
              <div><strong>Carga Horária Total</strong></div>
              <div>${cargaHoraria}</div>
              <div style="margin-top: 8px;"><strong>Folha:</strong></div>
              <div>Página ${indexData + 1} de ${datasParaUsar.length}</div>
            </div>
          </div>
          
          ${conteudoProgramaticoHtml}
          
          ${listaPresencaHtml}
        </td>
      </tr>
    </table>
  </div>
</body>
</html>`;
      
      htmlCompleto += html;
      if (indexData < datasParaUsar.length - 1) {
        htmlCompleto += '<div style="page-break-after: always;"></div>';
      }
    });
    
    return htmlCompleto;
  };

  const handleGerarListaPresenca = (grupo: any) => {
    const html = gerarListaPresenca(grupo);
    
    // Criar uma nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    } else {
      toast.error("Erro ao abrir janela de impressão. Verifique se o pop-up está bloqueado.");
    }
  };

  const gruposFiltrados = gruposCertificados.filter((grupo) => {
    const matchSearch = grupo.empresaNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       grupo.modeloNome.toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  const content = (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lista de Presença Emitida</h1>
        <p className="text-muted-foreground mt-1">
          Gere listas de presença automaticamente a partir dos certificados emitidos.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por empresa ou treinamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="empresa">Empresa</Label>
              <Select value={filtroEmpresa || undefined} onValueChange={(value) => setFiltroEmpresa(value || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as empresas" />
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
            <div className="space-y-2">
              <Label htmlFor="mes">Mês</Label>
              <Select value={filtroMes || undefined} onValueChange={(value) => setFiltroMes(value || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os meses" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const mes = String(i + 1).padStart(2, '0');
                    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
                    return (
                      <SelectItem key={mes} value={mes}>
                        {meses[i]}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ano">Ano</Label>
              <Select value={filtroAno || undefined} onValueChange={(value) => setFiltroAno(value || "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const ano = new Date().getFullYear() - i;
                    return (
                      <SelectItem key={ano} value={ano.toString()}>
                        {ano}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Grupos de Certificados</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando certificados...
            </div>
          ) : gruposFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum certificado encontrado. Emita certificados primeiro para gerar listas de presença.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Treinamento</TableHead>
                  <TableHead className="text-center">Participantes</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gruposFiltrados.map((grupo) => (
                  <TableRow key={grupo.chave}>
                    <TableCell className="font-medium">{grupo.empresaNome}</TableCell>
                    <TableCell>{grupo.modeloNome}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users className="h-4 w-4" />
                        {grupo.quantidade}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleGerarListaPresenca(grupo)}
                        variant="outline"
                        size="sm"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Lista de Presença
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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

