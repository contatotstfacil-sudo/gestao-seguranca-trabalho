import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Plus, Edit2, Trash2, Filter, X, Check, ChevronsUpDown, Building2, Shield } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const ROLES = [
  { value: "user", label: "Usuário" },
  { value: "admin", label: "Administrador" },
  { value: "gestor", label: "Gestor" },
  { value: "tecnico", label: "Técnico" },
] as const;

export default function UsuariosSistema({ showLayout = true }: { showLayout?: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [permissoesDialogOpen, setPermissoesDialogOpen] = useState(false);
  const [usuarioPermissoes, setUsuarioPermissoes] = useState<number | null>(null);
  const [permissoesSelecionadas, setPermissoesSelecionadas] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    cpf: "",
    cnpj: "",
    password: "",
    role: "user" as "user" | "admin" | "gestor" | "tecnico",
    empresaId: undefined as number | undefined,
  });
  
  // Estados para filtros
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroRole, setFiltroRole] = useState<string>("");
  const [empresaOpen, setEmpresaOpen] = useState(false);
  const [empresaSearch, setEmpresaSearch] = useState("");

  const utils = trpc.useUtils();
  const { data: usuarios = [], isLoading } = trpc.usuarios.list.useQuery({
    searchTerm: filtroNome || undefined,
    role: filtroRole ? (filtroRole as "user" | "admin" | "gestor" | "tecnico") : undefined,
  });

  const { data: empresas = [] } = trpc.empresas.list.useQuery();
  const { data: todasPermissoes = [] } = trpc.permissoes.list.useQuery();
  const { data: permissoesUsuario = [] } = trpc.permissoes.getUserPermissions.useQuery(
    { userId: usuarioPermissoes! },
    { enabled: !!usuarioPermissoes }
  );

  const assignPermissionsMutation = trpc.permissoes.assignPermissions.useMutation({
    onSuccess: () => {
      toast.success("Permissões atualizadas com sucesso!");
      utils.usuarios.list.invalidate();
      setPermissoesDialogOpen(false);
      setUsuarioPermissoes(null);
      setPermissoesSelecionadas([]);
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const empresasFiltradas = useMemo(() => {
    if (!empresaSearch) return empresas;
    return empresas.filter((empresa: { razaoSocial: string }) =>
      empresa.razaoSocial.toLowerCase().includes(empresaSearch.toLowerCase())
    );
  }, [empresas, empresaSearch]);

  const createMutation = trpc.usuarios.create.useMutation({
    onSuccess: () => {
      toast.success("Usuário criado com sucesso!");
      utils.usuarios.list.invalidate();
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const updateMutation = trpc.usuarios.update.useMutation({
    onSuccess: () => {
      toast.success("Usuário atualizado com sucesso!");
      utils.usuarios.list.invalidate();
      resetForm();
      setDialogOpen(false);
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const deleteMutation = trpc.usuarios.delete.useMutation({
    onSuccess: () => {
      toast.success("Usuário deletado com sucesso!");
      utils.usuarios.list.invalidate();
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    },
    onError: (error: { message: string }) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      cpf: "",
      cnpj: "",
      password: "",
      role: "user",
      empresaId: undefined,
    });
    setEditingId(null);
    setEmpresaSearch("");
  };

  const handleOpenDialog = (usuario?: typeof usuarios[0]) => {
    if (usuario) {
      setEditingId(usuario.id);
      setFormData({
        name: usuario.name || "",
        email: usuario.email || "",
        cpf: usuario.cpf || "",
        cnpj: usuario.cnpj || "",
        password: "", // Não preenche senha na edição
        role: usuario.role,
        empresaId: usuario.empresaId || undefined,
      });
      const empresa = empresas.find((e: { id: number }) => e.id === usuario.empresaId);
      setEmpresaSearch(empresa?.razaoSocial || "");
    } else {
      resetForm();
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    if (!formData.email && !formData.cpf && !formData.cnpj) {
      toast.error("É necessário fornecer email, CPF ou CNPJ");
      return;
    }

    if (!editingId && !formData.password) {
      toast.error("Senha é obrigatória para novos usuários");
      return;
    }

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...formData,
        password: formData.password || undefined, // Só envia senha se foi preenchida
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleOpenPermissoesDialog = (usuario: typeof usuarios[0]) => {
    setUsuarioPermissoes(usuario.id);
    setPermissoesDialogOpen(true);
  };

  const handleClosePermissoesDialog = () => {
    setPermissoesDialogOpen(false);
    setUsuarioPermissoes(null);
    setPermissoesSelecionadas([]);
  };

  // Atualiza permissões selecionadas quando as permissões do usuário são carregadas
  useEffect(() => {
    if (permissoesUsuario.length > 0) {
      setPermissoesSelecionadas(permissoesUsuario.map((p: { id: number }) => p.id));
    } else if (usuarioPermissoes) {
      setPermissoesSelecionadas([]);
    }
  }, [permissoesUsuario, usuarioPermissoes]);

  // Agrupa permissões por módulo e ação
  const permissoesAgrupadas = useMemo(() => {
    const grupos: Record<string, Record<string, typeof todasPermissoes[0]>> = {};
    todasPermissoes.forEach((perm: { modulo: string; acao: string }) => {
      if (!grupos[perm.modulo]) {
        grupos[perm.modulo] = {};
      }
      grupos[perm.modulo][perm.acao] = perm;
    });
    return grupos;
  }, [todasPermissoes]);

  // Mapeia ações para nomes em português
  const acoesMap: Record<string, string> = {
    list: "Visualizar",
    read: "Visualizar",
    create: "Incluir",
    update: "Editar",
    edit: "Editar",
    delete: "Excluir",
    download: "Baixar",
    emitir_certificado: "Emitir Certificado",
    emitir_ficha: "Emitir Ficha",
    gerenciar_permissoes: "Gerenciar Permissões",
    view: "Visualizar",
  };

  // Ordem das ações na tabela
  const ordemAcoes = ["list", "read", "view", "create", "update", "edit", "delete", "download", "emitir_certificado", "emitir_ficha", "gerenciar_permissoes"];

  // Nomes dos módulos em português e ordem de exibição
  const modulosMap: Record<string, string> = {
    empresas: "Empresas",
    colaboradores: "Empregados",
    fichas_epi: "Fichas de EPI",
    ordens_servico: "Ordens de Serviço (OS)",
    treinamentos: "Treinamentos",
    modelos_certificados: "Modelos de Certificados",
    relatorios: "Relatórios",
    dashboard: "Dashboard / Painel",
    usuarios: "Usuários / Acessos",
    obras: "Obras",
    cargos: "Cargos",
    setores: "Setores",
    tipos_treinamentos: "Tipos de Treinamentos",
    epis: "EPIs",
    tipos_epis: "Tipos de EPIs",
    modelos_os: "Modelos de OS",
    responsaveis: "Responsáveis",
    riscos_ocupacionais: "Riscos Ocupacionais",
  };

  // Ordem dos módulos conforme a imagem
  const ordemModulos = [
    "empresas",
    "colaboradores",
    "fichas_epi",
    "ordens_servico",
    "treinamentos",
    "modelos_certificados",
    "relatorios",
    "dashboard",
    "usuarios",
  ];

  const handleTogglePermissao = (permissaoId: number) => {
    setPermissoesSelecionadas(prev => {
      if (prev.includes(permissaoId)) {
        return prev.filter(id => id !== permissaoId);
      } else {
        return [...prev, permissaoId];
      }
    });
  };

  const handleSalvarPermissoes = () => {
    if (!usuarioPermissoes) return;
    assignPermissionsMutation.mutate({
      userId: usuarioPermissoes,
      permissaoIds: permissoesSelecionadas,
    });
  };

  const confirmDelete = () => {
    if (userToDelete) {
      deleteMutation.mutate({ id: userToDelete });
    }
  };

  const usuariosFiltrados = useMemo(() => {
    return usuarios;
  }, [usuarios]);

  const content = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários do Sistema</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários e permissões do sistema.
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Editar Usuário" : "Novo Usuário"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Permissão *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="exemplo@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Empresa</Label>
                <Popover open={empresaOpen} onOpenChange={setEmpresaOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !formData.empresaId && "text-muted-foreground"
                      )}
                    >
                      {formData.empresaId
                        ? empresas.find((e: { id: number }) => e.id === formData.empresaId)?.razaoSocial
                        : "Selecione uma empresa"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput
                        placeholder="Buscar empresa..."
                        value={empresaSearch}
                        onValueChange={setEmpresaSearch}
                      />
                      <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="nenhuma-empresa"
                          onSelect={() => {
                            setFormData({ ...formData, empresaId: undefined });
                            setEmpresaSearch("");
                            setEmpresaOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              !formData.empresaId ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Nenhuma empresa
                        </CommandItem>
                        {empresasFiltradas.map((empresa: { id: number; razaoSocial: string }) => (
                          <CommandItem
                            key={empresa.id}
                            value={empresa.razaoSocial}
                            onSelect={() => {
                              setFormData({ ...formData, empresaId: empresa.id });
                              setEmpresaSearch(empresa.razaoSocial);
                              setEmpresaOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.empresaId === empresa.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {empresa.razaoSocial}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Senha {editingId ? "(deixe em branco para manter a atual)" : "*"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingId}
                  minLength={6}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingId ? "Salvar" : "Criar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Lista de Usuários</CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Buscar por nome, email, CPF ou CNPJ..."
                  value={filtroNome}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFiltroNome(e.target.value)}
                  className="w-64"
                />
                <Select value={filtroRole || "all"} onValueChange={(value) => setFiltroRole(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Todas as permissões" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as permissões</SelectItem>
                    {ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(filtroNome || filtroRole) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFiltroNome("");
                      setFiltroRole("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Carregando...</div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosFiltrados.map((usuario: typeof usuarios[0]) => {
                    const roleLabel = ROLES.find(r => r.value === usuario.role)?.label || usuario.role;
                    return (
                      <TableRow key={usuario.id}>
                        <TableCell className="font-medium">{usuario.name || "-"}</TableCell>
                        <TableCell>{usuario.email || "-"}</TableCell>
                        <TableCell>{usuario.cpf || usuario.cnpj || "-"}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2 py-1 rounded text-xs font-medium",
                            usuario.role === "admin" && "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                            usuario.role === "gestor" && "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                            usuario.role === "tecnico" && "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                            usuario.role === "user" && "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                          )}>
                            {roleLabel}
                          </span>
                        </TableCell>
                        <TableCell>{usuario.razaoSocial || "-"}</TableCell>
                        <TableCell>
                          {usuario.lastSignedIn
                            ? new Date(usuario.lastSignedIn).toLocaleDateString("pt-BR")
                            : "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenPermissoesDialog(usuario)}
                              title="Gerenciar Permissões"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDialog(usuario)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(usuario.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={permissoesDialogOpen} onOpenChange={setPermissoesDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <div className="w-5 h-5 rounded bg-orange-500 flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-white" />
              </div>
              Lista de Permissões do Sistema TST Fácil
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[250px] font-semibold text-gray-900">Módulo / Tabela</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900">Visualizar</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900">Incluir</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900">Editar</TableHead>
                    <TableHead className="text-center font-semibold text-gray-900">Excluir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordemModulos
                    .filter(modulo => permissoesAgrupadas[modulo])
                    .map((modulo) => {
                      const perms = permissoesAgrupadas[modulo];
                      const nomeModulo = modulosMap[modulo] || modulo.replace(/_/g, " ");
                      const permList = perms["list"] || perms["read"] || perms["view"];
                      const permCreate = perms["create"];
                      const permUpdate = perms["update"] || perms["edit"];
                      const permDelete = perms["delete"];

                      return (
                        <TableRow key={modulo} className="border-b">
                          <TableCell className="font-medium text-gray-900">{nomeModulo}</TableCell>
                          <TableCell className="text-center">
                            {permList ? (
                              <div className="flex justify-center">
                                <div
                                  className={cn(
                                    "w-10 h-10 rounded border cursor-pointer transition-all flex items-center justify-center shadow-sm",
                                    permissoesSelecionadas.includes(permList.id)
                                      ? "bg-purple-200 border-purple-300 shadow-md"
                                      : "bg-purple-100 border-purple-200 shadow-sm hover:bg-purple-150"
                                  )}
                                  onClick={() => handleTogglePermissao(permList.id)}
                                >
                                  {permissoesSelecionadas.includes(permList.id) && (
                                    <Check className="h-5 w-5 text-purple-800 font-bold stroke-[3]" />
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="w-10 h-10" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {permCreate ? (
                              <div className="flex justify-center">
                                <div
                                  className={cn(
                                    "w-10 h-10 rounded border cursor-pointer transition-all flex items-center justify-center",
                                    permissoesSelecionadas.includes(permCreate.id)
                                      ? "bg-purple-200 border-purple-300 shadow-md"
                                      : "bg-purple-100 border-purple-200 shadow-sm hover:bg-purple-150"
                                  )}
                                  onClick={() => handleTogglePermissao(permCreate.id)}
                                >
                                  {permissoesSelecionadas.includes(permCreate.id) && (
                                    <Check className="h-5 w-5 text-purple-800 font-bold stroke-[3]" />
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="w-10 h-10" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {permUpdate ? (
                              <div className="flex justify-center">
                                <div
                                  className={cn(
                                    "w-10 h-10 rounded border cursor-pointer transition-all flex items-center justify-center",
                                    permissoesSelecionadas.includes(permUpdate.id)
                                      ? "bg-purple-200 border-purple-300 shadow-md"
                                      : "bg-purple-100 border-purple-200 shadow-sm hover:bg-purple-150"
                                  )}
                                  onClick={() => handleTogglePermissao(permUpdate.id)}
                                >
                                  {permissoesSelecionadas.includes(permUpdate.id) && (
                                    <Check className="h-5 w-5 text-purple-800 font-bold stroke-[3]" />
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="w-10 h-10" />
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {permDelete ? (
                              <div className="flex justify-center">
                                <div
                                  className={cn(
                                    "w-10 h-10 rounded border cursor-pointer transition-all flex items-center justify-center",
                                    permissoesSelecionadas.includes(permDelete.id)
                                      ? "bg-purple-200 border-purple-300 shadow-md"
                                      : "bg-purple-100 border-purple-200 shadow-sm hover:bg-purple-150"
                                  )}
                                  onClick={() => handleTogglePermissao(permDelete.id)}
                                >
                                  {permissoesSelecionadas.includes(permDelete.id) && (
                                    <Check className="h-5 w-5 text-purple-800 font-bold stroke-[3]" />
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="w-10 h-10" />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {permissoesSelecionadas.length} permissão(ões) selecionada(s)
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClosePermissoesDialog}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSalvarPermissoes}
                  disabled={assignPermissionsMutation.isPending}
                >
                  {assignPermissionsMutation.isPending ? "Salvando..." : "Salvar Permissões"}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (showLayout) {
    return <DashboardLayout>{content}</DashboardLayout>;
  }

  return content;
}

