import { Card, CardContent } from "@/components/ui/card";

export default function LaudoPgr() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">PGR / PCMAT</h2>
          <p className="text-muted-foreground mt-2">
            Acompanhe aqui o Programa de Gerenciamento de Riscos e o Programa de Condições e Meio Ambiente de Trabalho na Indústria da Construção. Centralize inventário de riscos, plano de ação, medições de campo e evidências fotográficas das obras.
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          Em breve este módulo permitirá registrar etapas, anexar documentos e gerar relatórios consolidados do PGR / PCMAT. Compartilhe suas necessidades para guiarmos o desenvolvimento.
        </div>
      </CardContent>
    </Card>
  );
}
