import { Card, CardContent } from "@/components/ui/card";

export default function LaudoInsalubridade() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Laudo de Insalubridade</h2>
          <p className="text-muted-foreground mt-2">
            Registre avaliações de agentes insalubres, anexos técnicos e controle de adicionais de insalubridade correspondentes.
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          Funcionalidades disponíveis em breve: checklist de medições, anexos de pareceres, histórico de revisões e integrações com folha de pagamento.
        </div>
      </CardContent>
    </Card>
  );
}














