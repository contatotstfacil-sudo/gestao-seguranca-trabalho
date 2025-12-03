import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function EmitirOrdemServico({ showLayout = true }: { showLayout?: boolean }) {
  const [empresaId, setEmpresaId] = useState<string>("");
  const [cnpjEmpresa, setCnpjEmpresa] = useState<string>("");
  const [colaboradorId, setColaboradorId] = useState<string>("");
  const [funcaoColaborador, setFuncaoColaborador] = useState<string>("");
  const [dataEmissao, setDataEmissao] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");
  
  const [empresaOpen, setEmpresaOpen] = useState(false);
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [colaboradorOpen, setColaboradorOpen] = useState(false);
  const [colaboradorSearch, setColaboradorSearch] = useState("");
  const [modeloId, setModeloId] = useState<string>("");
  const [modeloOpen, setModeloOpen] = useState(false);
  const [modeloSearch, setModeloSearch] = useState("");
  const [responsavelId, setResponsavelId] = useState<string>("");
  const [responsavelOpen, setResponsavelOpen] = useState(false);
  const [responsavelSearch, setResponsavelSearch] = useState("");

  const estadosBrasil = [
    { sigla: "AC", nome: "Acre" },
    { sigla: "AL", nome: "Alagoas" },
    { sigla: "AP", nome: "Amapá" },
    { sigla: "AM", nome: "Amazonas" },
    { sigla: "BA", nome: "Bahia" },
    { sigla: "CE", nome: "Ceará" },
    { sigla: "DF", nome: "Distrito Federal" },
    { sigla: "ES", nome: "Espírito Santo" },
    { sigla: "GO", nome: "Goiás" },
    { sigla: "MA", nome: "Maranhão" },
    { sigla: "MT", nome: "Mato Grosso" },
    { sigla: "MS", nome: "Mato Grosso do Sul" },
    { sigla: "MG", nome: "Minas Gerais" },
    { sigla: "PA", nome: "Pará" },
    { sigla: "PB", nome: "Paraíba" },
    { sigla: "PR", nome: "Paraná" },
    { sigla: "PE", nome: "Pernambuco" },
    { sigla: "PI", nome: "Piauí" },
    { sigla: "RJ", nome: "Rio de Janeiro" },
    { sigla: "RN", nome: "Rio Grande do Norte" },
    { sigla: "RS", nome: "Rio Grande do Sul" },
    { sigla: "RO", nome: "Rondônia" },
    { sigla: "RR", nome: "Roraima" },
    { sigla: "SC", nome: "Santa Catarina" },
    { sigla: "SP", nome: "São Paulo" },
    { sigla: "SE", nome: "Sergipe" },
    { sigla: "TO", nome: "Tocantins" },
  ];

  const utils = trpc.useUtils();
  const { data: empresas = [] } = trpc.empresas.list.useQuery();
  const { data: colaboradores = [] } = trpc.colaboradores.list.useQuery();
  const { data: modelos = [] } = trpc.modelosOrdemServico.list.useQuery();
  const { data: responsaveis = [] } = trpc.responsaveis.list.useQuery();
  const { data: nextNumero } = trpc.ordensServico.getNextNumero.useQuery();

  const createMutation = trpc.ordensServico.create.useMutation({
    onSuccess: () => {
      utils.ordensServico.list.invalidate();
      toast.success("Ordem de serviço emitida com sucesso!");
      resetForm();
    },
    onError: (error) => {
      toast.error(`Erro ao emitir ordem de serviço: ${error.message}`);
    },
  });

  // Filtrar empresas
  const empresasFiltradas = useMemo(() => {
    if (!empresaSearch.trim()) return empresas;
    const termo = empresaSearch.toLowerCase();
    return empresas.filter((empresa: any) =>
      empresa.razaoSocial?.toLowerCase().includes(termo) ||
      empresa.cnpj?.toLowerCase().includes(termo)
    );
  }, [empresas, empresaSearch]);

  // Filtrar colaboradores baseado na empresa selecionada
  const colaboradoresFiltrados = useMemo(() => {
    let filtrados = colaboradores;
    
    if (empresaId) {
      filtrados = filtrados.filter((c: any) => c.empresaId?.toString() === empresaId);
    }
    
    if (colaboradorSearch.trim()) {
      const termo = colaboradorSearch.toLowerCase();
      filtrados = filtrados.filter((c: any) =>
        c.nomeCompleto?.toLowerCase().includes(termo)
      );
    }
    
    // Debug: verificar se os colaboradores têm nomeCargo
    if (filtrados.length > 0) {
      console.log("[EmitirOrdemServico] Colaboradores filtrados:", filtrados.map((c: any) => ({
        id: c.id,
        nome: c.nomeCompleto,
        nomeCargo: c.nomeCargo,
        cargoId: c.cargoId
      })));
    }
    
    return filtrados;
  }, [colaboradores, empresaId, colaboradorSearch]);
  
  // Debug: verificar empresas
  useEffect(() => {
    if (empresas.length > 0) {
      console.log("[EmitirOrdemServico] Empresas disponíveis:", empresas.map((e: any) => ({
        id: e.id,
        razaoSocial: e.razaoSocial,
        cnpj: e.cnpj
      })));
    }
  }, [empresas]);

  // Filtrar modelos
  const modelosFiltrados = useMemo(() => {
    if (!modeloSearch.trim()) return modelos;
    const termo = modeloSearch.toLowerCase();
    return modelos.filter((modelo: any) =>
      modelo.nome?.toLowerCase().includes(termo)
    );
  }, [modelos, modeloSearch]);

  // Filtrar responsáveis
  const responsaveisFiltrados = useMemo(() => {
    if (!responsavelSearch.trim()) return responsaveis;
    const termo = responsavelSearch.toLowerCase();
    return responsaveis.filter((responsavel: any) =>
      responsavel.nomeCompleto?.toLowerCase().includes(termo) ||
      responsavel.funcao?.toLowerCase().includes(termo)
    );
  }, [responsaveis, responsavelSearch]);

  const resetForm = () => {
    setEmpresaId("");
    setCnpjEmpresa("");
    setColaboradorId("");
    setFuncaoColaborador("");
    setDataEmissao("");
    setCidade("");
    setUf("");
    setModeloId("");
    setResponsavelId("");
    setEmpresaSearch("");
    setColaboradorSearch("");
    setModeloSearch("");
    setResponsavelSearch("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!empresaId) {
      toast.error("Selecione uma empresa");
      return;
    }

    if (!dataEmissao) {
      toast.error("Selecione a data de emissão");
      return;
    }

    // Garantir que dataEmissao está no formato correto (YYYY-MM-DD)
    const dataEmissaoFormatada = dataEmissao.trim();
    
    console.log("=== DEBUG FRONTEND ===");
    console.log("Estado dataEmissao:", dataEmissao);
    console.log("Data formatada:", dataEmissaoFormatada);
    
    if (!dataEmissaoFormatada) {
      toast.error("Selecione a data de emissão");
      return;
    }
    
    // Validar formato da data (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dataEmissaoFormatada)) {
      toast.error("Formato de data inválido. Use o formato YYYY-MM-DD");
      return;
    }
    
    // Validar que a data é válida
    const [year, month, day] = dataEmissaoFormatada.split('-').map(Number);
    const testDate = new Date(year, month - 1, day);
    if (testDate.getFullYear() !== year || testDate.getMonth() !== month - 1 || testDate.getDate() !== day) {
      toast.error("Data inválida. Verifique o dia, mês e ano.");
      return;
    }
    
    console.log("Enviando para backend:", dataEmissaoFormatada);
    console.log("=== FIM DEBUG FRONTEND ===");
    
    createMutation.mutate({
      numeroOrdem: nextNumero || "OS-0001",
      empresaId: parseInt(empresaId),
      colaboradorId: colaboradorId ? parseInt(colaboradorId) : undefined,
      descricaoServico: "", // Campo obrigatório no backend, mas não será usado
      status: "aberta",
      dataEmissao: dataEmissaoFormatada, // Enviar como string YYYY-MM-DD
      modeloId: modeloId ? parseInt(modeloId) : undefined,
      cidade: cidade || undefined,
      uf: uf || undefined,
      responsavelId: responsavelId ? parseInt(responsavelId) : undefined,
    });
  };

  const content = (
    <div className="space-y-6">
      {showLayout && (
        <div>
          <h2 className="text-2xl font-bold">Emitir Ordem de Serviço - SST</h2>
          <p className="text-muted-foreground">Preencha os dados para emitir uma nova ordem de serviço de Segurança do Trabalho</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dados da Ordem de Serviço - Segurança do Trabalho</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Primeira linha: Empresa e CNPJ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="empresa">Empresa *</Label>
              <Popover open={empresaOpen} onOpenChange={setEmpresaOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={empresaOpen}
                    className="w-full justify-between mt-1.5 h-10"
                  >
                    {empresaId
                      ? empresas.find((e: any) => e.id.toString() === empresaId)?.razaoSocial || "Selecione uma empresa"
                      : "Selecione uma empresa"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Buscar empresa..."
                      value={empresaSearch}
                      onValueChange={setEmpresaSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                      <CommandGroup>
                        {empresasFiltradas.map((empresa: any) => (
                          <CommandItem
                            key={empresa.id}
                            value={empresa.razaoSocial}
                            onSelect={() => {
                              const newEmpresaId = empresa.id.toString();
                              console.log("[EmitirOrdemServico] Empresa selecionada:", empresa);
                              setEmpresaId(newEmpresaId);
                              // Preencher CNPJ automaticamente
                              const cnpj = empresa.cnpj || "";
                              console.log("[EmitirOrdemServico] Preenchendo CNPJ:", cnpj);
                              setCnpjEmpresa(cnpj);
                              setEmpresaOpen(false);
                              setEmpresaSearch("");
                              // Limpar colaborador quando trocar empresa
                              setColaboradorId("");
                              setFuncaoColaborador("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                empresaId === empresa.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {empresa.razaoSocial}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              </div>

              <div>
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={cnpjEmpresa}
                  disabled
                  className="mt-1.5 bg-muted"
                  placeholder="CNPJ será preenchido automaticamente"
                />
              </div>
            </div>

            {/* Segunda linha: Colaborador e Função */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="colaborador">Colaborador</Label>
                <Popover open={colaboradorOpen} onOpenChange={setColaboradorOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={colaboradorOpen}
                      className="w-full justify-between mt-1.5 h-10"
                      disabled={!empresaId}
                    >
                      {colaboradorId
                        ? colaboradores.find((c: any) => c.id.toString() === colaboradorId)?.nomeCompleto || "Selecione um colaborador"
                        : "Selecione um colaborador"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar colaborador..."
                        value={colaboradorSearch}
                        onValueChange={setColaboradorSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum colaborador encontrado.</CommandEmpty>
                        <CommandGroup>
                          {colaboradoresFiltrados.map((colaborador: any) => (
                            <CommandItem
                              key={colaborador.id}
                              value={colaborador.nomeCompleto}
                              onSelect={() => {
                                const newColaboradorId = colaborador.id.toString();
                                console.log("[EmitirOrdemServico] Colaborador selecionado:", colaborador);
                                console.log("[EmitirOrdemServico] Colaborador.nomeCargo:", colaborador.nomeCargo);
                                setColaboradorId(newColaboradorId === colaboradorId ? "" : newColaboradorId);
                                // Preencher função automaticamente (nomeCargo vem do JOIN na query)
                                if (newColaboradorId !== colaboradorId) {
                                  const funcao = colaborador.nomeCargo || "";
                                  console.log("[EmitirOrdemServico] Preenchendo função:", funcao);
                                  setFuncaoColaborador(funcao);
                                } else {
                                  setFuncaoColaborador("");
                                }
                                setColaboradorOpen(false);
                                setColaboradorSearch("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  colaboradorId === colaborador.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {colaborador.nomeCompleto}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label htmlFor="funcao">Cargo</Label>
                <Input
                  id="funcao"
                  value={funcaoColaborador}
                  disabled
                  className="mt-1.5 bg-muted"
                  placeholder="Cargo será preenchido automaticamente"
                />
              </div>
            </div>

            {/* Terceira linha: Data de Emissão e Modelo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataEmissao">Data de Emissão *</Label>
                <Input
                  id="dataEmissao"
                  type="date"
                  value={dataEmissao}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log("Data alterada no input:", newValue);
                    setDataEmissao(newValue);
                  }}
                  onBlur={(e) => {
                    // Garantir que o valor está atualizado ao perder o foco
                    const value = e.target.value;
                    console.log("Data no blur:", value, "Estado atual:", dataEmissao);
                    if (value !== dataEmissao) {
                      setDataEmissao(value);
                    }
                  }}
                  className="mt-1.5"
                  required
                />
              </div>

              <div>
                <Label htmlFor="modelo">Modelo</Label>
                <Popover open={modeloOpen} onOpenChange={setModeloOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={modeloOpen}
                      className="w-full justify-between mt-1.5 h-10"
                    >
                      {modeloId
                        ? modelos.find((m: any) => m.id.toString() === modeloId)?.nome || "Selecione um modelo"
                        : "Selecione um modelo"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Buscar modelo..."
                        value={modeloSearch}
                        onValueChange={setModeloSearch}
                      />
                      <CommandList>
                        <CommandEmpty>Nenhum modelo encontrado.</CommandEmpty>
                        <CommandGroup>
                          {modelosFiltrados.map((modelo: any) => (
                            <CommandItem
                              key={modelo.id}
                              value={modelo.nome}
                              onSelect={() => {
                                const newModeloId = modelo.id.toString();
                                setModeloId(newModeloId === modeloId ? "" : newModeloId);
                                setModeloOpen(false);
                                setModeloSearch("");
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  modeloId === modelo.id.toString() ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {modelo.nome}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Quarta linha: Cidade e UF */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  placeholder="Digite a cidade"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="uf">UF</Label>
                <Select value={uf} onValueChange={setUf}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Selecione a UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosBrasil.map((estado) => (
                      <SelectItem key={estado.sigla} value={estado.sigla}>
                        {estado.sigla} - {estado.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quinta linha: Responsável Técnico */}
            <div>
              <Label htmlFor="responsavel">Responsável Técnico</Label>
              <Popover open={responsavelOpen} onOpenChange={setResponsavelOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={responsavelOpen}
                    className="w-full justify-between mt-1.5 h-10"
                  >
                    {responsavelId
                      ? responsaveis.find((r: any) => r.id.toString() === responsavelId)?.nomeCompleto || "Selecione um responsável"
                      : "Selecione um responsável (opcional)"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Buscar responsável..."
                      value={responsavelSearch}
                      onValueChange={setResponsavelSearch}
                    />
                    <CommandList>
                      <CommandEmpty>Nenhum responsável encontrado.</CommandEmpty>
                      <CommandGroup>
                        {responsaveisFiltrados.map((responsavel: any) => (
                          <CommandItem
                            key={responsavel.id}
                            value={`${responsavel.nomeCompleto} ${responsavel.funcao || ""}`}
                            onSelect={() => {
                              const newResponsavelId = responsavel.id.toString();
                              setResponsavelId(newResponsavelId === responsavelId ? "" : newResponsavelId);
                              setResponsavelOpen(false);
                              setResponsavelSearch("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                responsavelId === responsavel.id.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {responsavel.nomeCompleto} {responsavel.funcao ? `- ${responsavel.funcao}` : ""}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
                disabled={createMutation.isPending}
              >
                Limpar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Emitir Ordem de Serviço"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );

  if (showLayout) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
}

