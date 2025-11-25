import { Card, CardContent } from "@/components/ui/card";

export default function LaudoLtcat() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Laudo Técnico das Condições Ambientais do Trabalho (LTCAT)</h2>
          <p className="text-muted-foreground mt-2">
            Área reservada para gerenciar medições ambientais, anexos fotográficos, conclusões periciais e responsabilidades técnicas relacionadas ao LTCAT.
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          Em breve você poderá armazenar laudos, controlar revisões e gerar relatórios consolidados do LTCAT diretamente pelo sistema.
        </div>
      </CardContent>
    </Card>
  );
}









