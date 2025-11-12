import { useState } from "react";
import { useNavigate } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowRight, Clock, Building2, Users, Zap, CreditCard } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

export default function Planos() {
  const navigate = useNavigate();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "quarterly">("monthly");
  
  const { data: planos = [], isLoading, error: planosError } = trpc.planos.list.useQuery();
  const { data: user } = trpc.auth.me.useQuery();
  
  // Buscar assinatura apenas se não for admin
  const { data: assinaturaAtiva } = trpc.assinaturas.getMinha.useQuery(undefined, {
    retry: false,
    enabled: user ? user.role !== "admin" : false,
  });

  const handleAssinar = (planoId: number) => {
    navigate(`/checkout?plano=${planoId}&periodo=${billingPeriod}`);
  };

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2).replace(".", ",");
  };

  const getPlanoIcon = (nome: string) => {
    switch (nome) {
      case "basico":
        return <Building2 className="h-8 w-8" />;
      case "tecnico":
        return <Users className="h-8 w-8" />;
      case "profissional":
        return <Zap className="h-8 w-8" />;
      default:
        return <Building2 className="h-8 w-8" />;
    }
  };

  const getPlanoColor = (nome: string) => {
    switch (nome) {
      case "basico":
        return {
          gradient: "from-blue-500 to-blue-600",
          bgColor: "bg-blue-50",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          borderColor: "border-blue-200",
        };
      case "tecnico":
        return {
          gradient: "from-orange-500 to-yellow-500",
          bgColor: "bg-orange-50",
          iconBg: "bg-orange-100",
          iconColor: "text-orange-600",
          borderColor: "border-orange-200",
        };
      case "profissional":
        return {
          gradient: "from-purple-500 to-purple-600",
          bgColor: "bg-purple-50",
          iconBg: "bg-purple-100",
          iconColor: "text-purple-600",
          borderColor: "border-purple-200",
        };
      default:
        return {
          gradient: "from-gray-500 to-gray-600",
          bgColor: "bg-gray-50",
          iconBg: "bg-gray-100",
          iconColor: "text-gray-600",
          borderColor: "border-gray-200",
        };
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

  if (planosError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="max-w-md">
            <CardContent className="pt-6">
              <p className="text-center text-red-600 mb-4">
                Erro ao carregar planos: {planosError.message}
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
      <div className="space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Planos e Assinaturas</h1>
              <p className="text-gray-600">
                Escolha o plano ideal para sua necessidade. Todos os planos incluem suporte e atualizações.
              </p>
            </div>
            {user?.role === "admin" && (
              <Button onClick={() => navigate("/gerenciar-planos")} variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Gerenciar Planos
              </Button>
            )}
          </div>
        </div>

        {/* Plano Atual - Só mostra se não for admin */}
        {assinaturaAtiva && user?.role !== "admin" && (
          <Card className="border-2 border-green-500 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Plano Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{assinaturaAtiva.plano.nomeExibicao}</h3>
                  <p className="text-gray-600">
                    Válido até {new Date(assinaturaAtiva.dataFim).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Período: {assinaturaAtiva.periodo === "mensal" ? "Mensal" : assinaturaAtiva.periodo === "trimestral" ? "Trimestral" : "Anual"}
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  {assinaturaAtiva.status === "ativa" ? "Ativa" : assinaturaAtiva.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Toggle Mensal/Trimestral */}
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-gray-900" : "text-gray-500"}`}>
            Mensal
          </span>
          <button
            onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "quarterly" : "monthly")}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              billingPeriod === "quarterly" ? "bg-green-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                billingPeriod === "quarterly" ? "translate-x-7" : "translate-x-1"
              }`}
            />
          </button>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-medium ${billingPeriod === "quarterly" ? "text-gray-900" : "text-gray-500"}`}>
              Trimestral
            </span>
            <Badge className="bg-green-100 text-green-800">ECONOMIZE</Badge>
          </div>
        </div>

        {/* Lista de Planos */}
        {!planos || planos.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Nenhum plano cadastrado.</p>
                {user?.role === "admin" && (
                  <Button onClick={() => navigate("/gerenciar-planos")}>
                    Cadastrar Planos
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {planos.map((plano) => {
              const colors = getPlanoColor(plano.nome);
              const isEnterprise = plano.nome === "enterprise";
              const currentPrice = billingPeriod === "monthly" ? plano.precoMensal : (plano.precoTrimestral || plano.precoMensal * 3);
              const quarterlySavings = plano.precoMensal ? (plano.precoMensal * 3) - (plano.precoTrimestral || plano.precoMensal * 3) : 0;
              const isPlanoAtual = assinaturaAtiva?.plano.id === plano.id;
              const recursos = plano.recursos ? JSON.parse(plano.recursos) : [];

              return (
                <Card
                  key={plano.id}
                  className={`relative border-2 ${
                    isPlanoAtual
                      ? `${colors.borderColor} shadow-xl scale-105`
                      : "border-gray-200 shadow-lg hover:shadow-xl transition-shadow"
                  } ${colors.bgColor}`}
                >
                  {isPlanoAtual && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-green-600 text-white px-4 py-1">
                        Seu Plano Atual
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className={`${colors.iconBg} ${colors.iconColor} w-16 h-16 rounded-lg flex items-center justify-center mb-4`}>
                      {getPlanoIcon(plano.nome)}
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-900">{plano.nomeExibicao}</CardTitle>
                    <p className="text-gray-600 text-sm mt-2">{plano.descricao}</p>
                  </CardHeader>

                  <CardContent>
                    {/* Preço */}
                    <div className="mb-6">
                      {isEnterprise ? (
                        <div className="text-3xl font-bold text-gray-900">Sob consulta</div>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold text-gray-900">R$ {formatPrice(currentPrice)}</span>
                            <span className="text-gray-600">
                              {billingPeriod === "monthly" ? "/mês" : "/trimestre"}
                            </span>
                          </div>
                          {billingPeriod === "quarterly" && quarterlySavings > 0 && (
                            <div className="text-sm text-green-600 font-semibold mt-2 flex items-center gap-1">
                              <CheckCircle2 className="h-4 w-4" />
                              Economize R$ {formatPrice(quarterlySavings)} pagando trimestral
                            </div>
                          )}
                          {billingPeriod === "quarterly" && plano.precoTrimestral && (
                            <div className="text-xs text-gray-500 mt-1">
                              Equivale a R$ {formatPrice(Math.round(plano.precoTrimestral / 3))}/mês
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Limites */}
                    <div className="mb-6 space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          Empresas: {plano.limiteEmpresas === null ? "Ilimitado" : plano.limiteEmpresas}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">
                          Colaboradores:{" "}
                          {plano.limiteColaboradoresTotal === null
                            ? "Ilimitado"
                            : `Até ${plano.limiteColaboradoresTotal}`}
                        </span>
                      </div>
                      {plano.limiteColaboradoresPorEmpresa && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-gray-700">
                            Por empresa: {plano.limiteColaboradoresPorEmpresa}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Recursos */}
                    <ul className="space-y-2 mb-6">
                      {recursos.slice(0, 5).map((recurso: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className={`h-5 w-5 ${colors.iconColor} flex-shrink-0 mt-0.5`} />
                          <span className="text-gray-700 text-sm">{recurso}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Botão */}
                    <Button
                      className={`w-full ${
                        isPlanoAtual
                          ? "bg-gray-400 cursor-not-allowed"
                          : `bg-gradient-to-r ${colors.gradient} hover:opacity-90 text-white`
                      }`}
                      disabled={isPlanoAtual || user?.role === "admin"}
                      onClick={() => !isPlanoAtual && user?.role !== "admin" && handleAssinar(plano.id)}
                    >
                      {isPlanoAtual ? (
                        "Plano Atual"
                      ) : user?.role === "admin" ? (
                        "Admin - Sem Assinatura"
                      ) : isEnterprise ? (
                        "Falar com Vendas"
                      ) : (
                        <>
                          Assinar Agora
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
