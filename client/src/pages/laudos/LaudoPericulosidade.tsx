import { Card, CardContent } from "@/components/ui/card";

export default function LaudoPericulosidade() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div>
          <h2 className="text-2xl font-semibold">Laudo de Periculosidade</h2>
          <p className="text-muted-foreground mt-2">
            Utilize este espaço para documentar análises de atividades perigosas, justificativas técnicas e evidências fotográficas.
          </p>
        </div>
        <div className="rounded-lg border border-dashed p-6 text-center text-muted-foreground">
          Em breve será possível administrar laudos, anexar documentos e controlar vigência dos adicionais de periculosidade.
        </div>
      </CardContent>
    </Card>
  );
}











