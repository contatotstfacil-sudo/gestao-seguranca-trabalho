import { useState, useEffect, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Edit2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";

const MODULOS = [
  { id: "empresas", nome: "Empresas" },
  { id: "empregados", nome: "Empregados" },
  { id: "fichas", nome: "Fichas de EPI" },
  { id: "os", nome: "Ordens de Serviço" },
  { id: "treinamentos", nome: "Treinamentos" },
  { id: "certificados", nome: "Modelos de Certificados" },
];

const ACOES = [
  { id: "view", nome: "Visualizar" },
  { id: "add", nome: "Incluir" },
  { id: "edit", nome: "Editar" },
  { id: "delete", nome: "Excluir" },
];

export default function PermissoesUsuarios({ showLayout = true }: { showLayout?: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<number | null>(null);
  const [permissoes, setPermissoes] = useState<Record<string, boolean>>({});

  const { data: usuarios = [], isLoading: isLoadingUsuarios } = trpc.usuarios.list.useQuery({});
  const { data: permissoesUsuario, isLoading: isLoadingPermissoes } = trpc.permissoesUsuarios.getByUsuarioId.useQuery(
    { usuarioId: usuarioSelecionado! },
    { enabled: !!usuarioSelecionado }
  );

  const upsertMutation = trpc.permissoesUsuarios.upsert.useMutation({
    onSuccess: () => {
      toast.success("Permissões salvas com sucesso!");
      setDialogOpen(false);
      setUsuarioSelecionado(null);
      setPermissoes({});
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar permissões");
    },
  });

  useEffect(() => {
    if (permissoesUsuario) {
      const perms: Record<string, boolean> = {};
      MODULOS.forEach((modulo) => {
        ACOES.forEach((acao) => {
          // Mapeia os campos: empresas_view -> empresasView, empregados_add -> empregadosAdd, etc.
          const campoMap: Record<string, string> = {
            view: "View",
            add: "Add",
            edit: "Edit",
            delete: "Delete",
          };
          const campo = `${modulo.id}${campoMap[acao.id]}` as keyof typeof permissoesUsuario;
          perms[`${modulo.id}_${acao.id}`] = (permissoesUsuario[campo] as boolean) || false;
        });
      });
      setPermissoes(perms);
    } else {
      // Inicializa todas as permissões como false
      const perms: Record<string, boolean> = {};
      MODULOS.forEach((modulo) => {
        ACOES.forEach((acao) => {
          perms[`${modulo.id}_${acao.id}`] = false;
        });
      });
      setPermissoes(perms);
    }
  }, [permissoesUsuario]);

  const handleOpenDialog = (usuarioId: number) => {
    setUsuarioSelecionado(usuarioId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setUsuarioSelecionado(null);
    setPermissoes({});
  };

  const handleTogglePermissao = (modulo: string, acao: string) => {
    const key = `${modulo}_${acao}`;
    setPermissoes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSalvar = () => {
    if (!usuarioSelecionado) return;

    const permissoesData: Record<string, boolean> = {};
    const campoMap: Record<string, string> = {
      view: "View",
      add: "Add",
      edit: "Edit",
      delete: "Delete",
    };
    
    MODULOS.forEach((modulo) => {
      ACOES.forEach((acao) => {
        const campo = `${modulo.id}${campoMap[acao.id]}`;
        permissoesData[campo] = permissoes[`${modulo.id}_${acao.id}`] || false;
      });
    });

    upsertMutation.mutate({
      usuarioId: usuarioSelecionado,
      ...permissoesData,
    } as any);
  };

  const usuarioAtual = usuarios.find((u) => u.id === usuarioSelecionado);

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Permissões de Usuários</h2>
          <p className="text-muted-foreground mt-1">
            Gerencie as permissões de acesso dos usuários do sistema
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Clique em "Editar Permissões" para gerenciar as permissões de cada usuário
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingUsuarios ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Nenhum usuário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  usuarios.map((usuario) => (
                    <TableRow key={usuario.id}>
                      <TableCell className="font-medium">{usuario.name || "Sem nome"}</TableCell>
                      <TableCell>{usuario.email || "-"}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                          {usuario.role === "admin" && "Administrador"}
                          {usuario.role === "gestor" && "Gestor"}
                          {usuario.role === "tecnico" && "Técnico"}
                          {usuario.role === "user" && "Usuário"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDialog(usuario.id)}
                        >
                          <Edit2 className="mr-2 h-4 w-4" />
                          Editar Permissões
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Editar Permissões - {usuarioAtual?.name || usuarioAtual?.email || "Usuário"}
            </DialogTitle>
            <DialogDescription>
              Marque as permissões que este usuário deve ter acesso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoadingPermissoes ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[200px] font-semibold">Módulo</TableHead>
                      <TableHead className="text-center font-semibold">Visualizar</TableHead>
                      <TableHead className="text-center font-semibold">Incluir</TableHead>
                      <TableHead className="text-center font-semibold">Editar</TableHead>
                      <TableHead className="text-center font-semibold">Excluir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {MODULOS.map((modulo) => (
                      <TableRow key={modulo.id}>
                        <TableCell className="font-medium">{modulo.nome}</TableCell>
                        {ACOES.map((acao) => (
                          <TableCell key={acao.id} className="text-center">
                            <Checkbox
                              checked={permissoes[`${modulo.id}_${acao.id}`] || false}
                              onCheckedChange={() => handleTogglePermissao(modulo.id, acao.id)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={upsertMutation.isPending || isLoadingPermissoes}
            >
              {upsertMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Permissões"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (showLayout) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
}

