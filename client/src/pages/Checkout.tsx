import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, CheckCircle2, CreditCard, Building2, Users, Calendar } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function Checkout() {
  const [location] = useLocation();
  const navigate = useNavigate();
  
  // Pegar parâmetros da URL
  const params = new URLSearchParams(location.split("?")[1] || "");
  const planoIdParam = params.get("plano");
  const periodoParam = params.get("periodo") as "mensal" | "trimestral" | "anual" | null;
  
  const [planoId, setPlanoId] = useState<number | null>(() => {
    if (planoIdParam) {
      const parsed = parseInt(planoIdParam, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  });
  const [periodo, setPeriodo] = useState<"mensal" | "trimestral" | "anual">(periodoParam || "mensal");
  const [isProcessing, setIsProcessing] = useState(false);

  // Debug inicial
  useEffect(() => {
    console.log("Checkout - Location:", location);
    console.log("Checkout - PlanoIdParam:", planoIdParam);
    console.log("Checkout - PlanoId State:", planoId);
    console.log("Checkout - Período:", periodo);
  }, [location, planoIdParam, planoId, periodo]);

  const { data: user } = trpc.auth.me.useQuery();
  const { data: plano, isLoading: isLoadingPlano, error: planoError } = trpc.planos.getById.useQuery(
    { id: planoId! },
    { enabled: !!planoId }
  );

  const createAssinaturaMutation = trpc.assinaturas.create.useMutation({
    onSuccess: () => {
      toast.success("Assinatura criada com sucesso!");
      navigate("/planos");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar assinatura");
      setIsProcessing(false);
    },
  });

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2).replace(".", ",");
  };

  const calcularValor = () => {
    if (!plano) return 0;
    
    if (periodo === "mensal") {
      return plano.precoMensal;
    } else if (periodo === "trimestral") {
      return plano.precoTrimestral || plano.precoMensal * 3;
    } else {
      return plano.precoMensal * 12;
    }
  };

  const calcularValidade = () => {
    const hoje = new Date();
    const dataFim = new Date();
    
    if (periodo === "mensal") {
      dataFim.setMonth(dataFim.getMonth() + 1);
    } else if (periodo === "trimestral") {
      dataFim.setMonth(dataFim.getMonth() + 3);
    } else {
      dataFim.setFullYear(dataFim.getFullYear() + 1);
    }
    
    return dataFim;
  };

  const handleAssinar = async () => {
    if (!planoId) {
      toast.error("Selecione um plano");
      return;
    }

    setIsProcessing(true);

    try {
      // Por enquanto, criar assinatura sem pagamento (será integrado com Mercado Pago depois)
      await createAssinaturaMutation.mutateAsync({
        planoId,
        periodo,
        metodoPagamento: "manual", // Temporário
      });
    } catch (error) {
      // Erro já tratado no onError
    }
  };

  // Admin não precisa de plano, mas pode visualizar
  if (!planoId) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-gray-600 mb-4">
                {user?.role === "admin" 
                  ? "Como administrador, você não precisa de plano. Esta página é para clientes assinarem planos."
                  : "Nenhum plano selecionado. Por favor, escolha um plano primeiro."}
              </p>
              <div className="flex gap-2">
                {user?.role === "admin" && (
                  <Button onClick={() => navigate("/gerenciar-planos")} variant="outline" className="flex-1">
                    Gerenciar Planos
                  </Button>
                )}
                <Button onClick={() => navigate("/planos")} className="flex-1">
                  Ver Planos
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoadingPlano) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando informações do plano...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (planoError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-red-600 mb-4">
                Erro ao carregar plano: {planoError.message}
              </p>
              <Button onClick={() => navigate("/planos")} className="w-full">
                Voltar para Planos
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  if (!plano) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-gray-600 mb-4">
                Plano não encontrado.
              </p>
              <Button onClick={() => navigate("/planos")} className="w-full">
                Ver Planos
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  const valorTotal = calcularValor();
  const dataValidade = calcularValidade();

  // Debug: verificar se plano está carregado
  console.log("Checkout - Plano carregado:", plano);
  console.log("Checkout - PlanoId:", planoId);
  console.log("Checkout - Período:", periodo);
  console.log("Checkout - Valor Total:", valorTotal);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/planos")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Planos
          </Button>
        </div>

        <h1 className="text-4xl font-bold text-gray-900">Finalizar Assinatura</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Resumo do Plano */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações do Plano */}
            <Card>
              <CardHeader>
                <CardTitle>Plano Selecionado</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{plano.nomeExibicao}</h3>
                  <p className="text-gray-600">{plano.descricao}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Empresas</p>
                      <p className="font-semibold">
                        {plano.limiteEmpresas === null ? "Ilimitado" : plano.limiteEmpresas}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-500">Colaboradores</p>
                      <p className="font-semibold">
                        {plano.limiteColaboradoresTotal === null
                          ? "Ilimitado"
                          : `Até ${plano.limiteColaboradoresTotal}`}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Período de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle>Período de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="periodo"
                      value="mensal"
                      checked={periodo === "mensal"}
                      onChange={() => setPeriodo("mensal")}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">Mensal</div>
                      <div className="text-sm text-gray-500">
                        R$ {formatPrice(plano.precoMensal || 0)}/mês
                      </div>
                    </div>
                  </label>

                  {plano.precoTrimestral && (
                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="periodo"
                        value="trimestral"
                        checked={periodo === "trimestral"}
                        onChange={() => setPeriodo("trimestral")}
                        className="h-4 w-4"
                      />
                      <div className="flex-1">
                        <div className="font-semibold flex items-center gap-2">
                          Trimestral
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            ECONOMIZE
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          R$ {formatPrice(plano.precoTrimestral || 0)}/trimestre
                          <span className="ml-2 text-green-600">
                            (Economize R$ {formatPrice(((plano.precoMensal || 0) * 3) - (plano.precoTrimestral || 0))})
                          </span>
                        </div>
                      </div>
                    </label>
                  )}

                  <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="periodo"
                      value="anual"
                      checked={periodo === "anual"}
                      onChange={() => setPeriodo("anual")}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <div className="font-semibold">Anual</div>
                      <div className="text-sm text-gray-500">
                        R$ {formatPrice((plano.precoMensal || 0) * 12)}/ano
                      </div>
                    </div>
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Informações de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Informações de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> A integração com gateway de pagamento (Mercado Pago) será implementada em breve.
                    Por enquanto, a assinatura será criada manualmente para testes.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Plano</span>
                    <span className="font-semibold">{plano.nomeExibicao}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Período</span>
                    <span className="font-semibold">
                      {periodo === "mensal"
                        ? "Mensal"
                        : periodo === "trimestral"
                        ? "Trimestral"
                        : "Anual"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Validade</span>
                    <span className="font-semibold">
                      {dataValidade.toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      R$ {formatPrice(valorTotal)}
                    </span>
                  </div>
                  {periodo === "trimestral" && (
                    <p className="text-xs text-gray-500 mt-1">
                      Equivale a R$ {formatPrice(Math.round(valorTotal / 3))}/mês
                    </p>
                  )}
                </div>

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAssinar}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      Confirmar Assinatura
                      <CheckCircle2 className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-gray-500 text-center">
                  Ao confirmar, você concorda com os termos de serviço e política de privacidade.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

