import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, PanelLeft, Users, Building2, HardHat, Briefcase, GraduationCap, ShieldCheck, FolderTree, FileText, FileCheck, Settings, ClipboardList, Stethoscope, Home as HomeIcon, BarChart3, ChevronRight } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState, memo, useMemo, useCallback, startTransition } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";

type MenuItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  subItems?: { label: string; path: string; icon: React.ComponentType<{ className?: string }> }[];
};

const menuItems: MenuItem[] = [
  { icon: HomeIcon, label: "Home", path: "/" },
  { icon: Building2, label: "Cadastrar Empresas", path: "/empresas" },
  { icon: Briefcase, label: "Cargos e Setores", path: "/cargos-e-funcoes" },
  { icon: Users, label: "Cadastrar Colaboradores", path: "/colaboradores" },
  { icon: ClipboardList, label: "Ordem de Serviço - SST", path: "/ordem-servico" },
  { icon: ShieldCheck, label: "EPIs", path: "/epis" },
  { icon: GraduationCap, label: "Treinamentos", path: "/treinamentos" },
  { icon: Stethoscope, label: "Gestão de ASOs", path: "/gestao-asos" },
  { icon: FileText, label: "Laudos Ocupacionais", path: "/laudos-ocupacionais" },
  { icon: Settings, label: "Configurações", path: "/configuracoes" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 220;
const MIN_WIDTH = 160;
const MAX_WIDTH = 380;

// Componente memoizado para item do menu com submenu - versão otimizada
const MenuItemWithSubmenu = memo(({ 
  item, 
  location, 
  isExpanded, 
  onToggle,
  onSubItemClick
}: {
  item: MenuItem;
  location: string;
  isExpanded: boolean;
  onToggle: () => void;
  onSubItemClick: (path: string) => void;
}) => {
  // Calcular isActive de forma simples
  const isActive = location === item.path || 
    (item.subItems?.some(sub => location === sub.path || location.startsWith(sub.path + "/")) ?? false);
  
  // Memoizar subitems para evitar recriação
  const subItems = useMemo(() => item.subItems || [], [item.subItems]);
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={onToggle}
        tooltip={item.label}
        className="h-8 font-normal text-sm"
      >
        <item.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`} />
        <span className="text-xs">{item.label}</span>
        <ChevronRight 
          className="h-3.5 w-3.5 ml-auto" 
          style={{ 
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.1s ease'
          }} 
        />
      </SidebarMenuButton>
            <SidebarMenuSub
        style={{ 
          display: isExpanded ? 'block' : 'none',
          contain: 'layout style paint',
          willChange: 'contents'
        }}
      >
        {subItems.map(subItem => {
          const isSubActive = location === subItem.path || location.startsWith(subItem.path + "/");
          return (
            <SidebarMenuSubItem key={subItem.path}>
              <SidebarMenuSubButton
                isActive={isSubActive}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  // Navegação ultra-rápida - sem qualquer delay ou processamento
                  onSubItemClick(subItem.path);
                }}
                style={{ 
                  cursor: 'pointer',
                  userSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                  touchAction: 'manipulation',
                  pointerEvents: 'auto'
                }}
              >
                <subItem.icon className="h-3.5 w-3.5" />
                <span className="text-xs">{subItem.label}</span>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          );
        })}
      </SidebarMenuSub>
    </SidebarMenuItem>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada mais rigorosa
  if (prevProps.item.path !== nextProps.item.path) return false;
  if (prevProps.location !== nextProps.location) return false;
  if (prevProps.isExpanded !== nextProps.isExpanded) return false;
  return true;
});

MenuItemWithSubmenu.displayName = "MenuItemWithSubmenu";

// Componente memoizado para item do menu simples - otimizado
const MenuItemSimple = memo(({ 
  item, 
  location, 
  onClick
}: {
  item: MenuItem;
  location: string;
  onClick: () => void;
}) => {
  const isActive = location === item.path || location.startsWith(item.path + "/");
  
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        isActive={isActive}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick();
        }}
        tooltip={item.label}
        className="h-8 font-normal text-sm"
        style={{ 
          transition: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        <item.icon className={`h-3.5 w-3.5 ${isActive ? "text-primary" : ""}`} />
        <span className="text-xs">{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}, (prevProps, nextProps) => {
  // Comparação customizada
  return (
    prevProps.location === nextProps.location &&
    prevProps.item.path === nextProps.item.path
  );
});

MenuItemSimple.displayName = "MenuItemSimple";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Usar objeto em vez de Set para melhor performance
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-8 p-8 max-w-md w-full">
          <div className="flex flex-col items-center gap-6">
            <div className="relative group">
              <div className="relative">
                <img
                  src={APP_LOGO}
                  alt={APP_TITLE}
                  className="h-20 w-20 rounded-xl object-cover shadow"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h1 className="text-2xl font-bold tracking-tight">{APP_TITLE}</h1>
              <p className="text-sm text-muted-foreground">
                Please sign in to continue
              </p>
            </div>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full shadow-lg hover:shadow-xl transition-all"
          >
            Sign in
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent 
        setSidebarWidth={setSidebarWidth}
        expandedMenus={expandedMenus}
        setExpandedMenus={setExpandedMenus}
      >
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
  expandedMenus,
  setExpandedMenus,
}: DashboardLayoutContentProps & {
  expandedMenus: Record<string, boolean>;
  setExpandedMenus: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  
  // Calcular qual menu deve estar expandido baseado na rota atual (simplificado)
  const shouldBeExpanded = useMemo(() => {
    const result: Record<string, boolean> = {};
    for (const item of menuItems) {
      if (item.subItems) {
        for (const sub of item.subItems) {
          if (location === sub.path || location.startsWith(sub.path + "/")) {
            result[item.path] = true;
            break;
          }
        }
      }
    }
    return result;
  }, [location]);
  
  // Auto-expandir menu quando estiver em uma rota de submenu (usando startTransition)
  useEffect(() => {
    startTransition(() => {
      setExpandedMenus(prev => {
        let needsUpdate = false;
        const updates: Record<string, boolean> = {};
        
        for (const path in shouldBeExpanded) {
          if (shouldBeExpanded[path] && !prev[path]) {
            updates[path] = true;
            needsUpdate = true;
          }
        }
        
        return needsUpdate ? { ...prev, ...updates } : prev;
      });
    });
  }, [location]); // Apenas quando location mudar
  
  // Callback ultra-otimizado para navegação instantânea
  const handleSubItemClick = useCallback((path: string) => {
    // Usar window.history diretamente para máxima velocidade (bypass React state)
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', path);
      // Disparar evento customizado para atualizar o router
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
    // Fallback para setLocation caso necessário
    setLocation(path);
  }, [setLocation]);
  
  // Memoizar todos os handlers de toggle em um objeto - usando startTransition para não bloquear
  const toggleHandlers = useMemo(() => {
    const handlers: Record<string, () => void> = {};
    menuItems.forEach(item => {
      if (item.subItems) {
        handlers[item.path] = () => {
          startTransition(() => {
            setExpandedMenus(prev => {
              const currentlyExpanded = prev[item.path];
              if (currentlyExpanded) {
                const newState = { ...prev };
                delete newState[item.path];
                return newState;
              } else {
                const newState = { ...prev, [item.path]: true };
                if (item.subItems?.[0] && !shouldBeExpanded[item.path]) {
                  setLocation(item.subItems[0].path);
                }
                return newState;
              }
            });
          });
        };
      }
    });
    return handlers;
  }, [setExpandedMenus, setLocation, shouldBeExpanded]);
  
  // Memoizar todos os handlers de click para itens simples
  const simpleClickHandlers = useMemo(() => {
    const handlers: Record<string, () => void> = {};
    menuItems.forEach(item => {
      if (!item.subItems) {
        handlers[item.path] = () => setLocation(item.path);
      }
    });
    return handlers;
  }, [setLocation]);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem =
    menuItems.find(item => item.path === location) ??
    menuItems.find(item => location.startsWith(`${item.path}/`));
  const isMobile = useIsMobile();
  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-12 justify-center">
            <div className="flex items-center gap-2 pl-1.5 group-data-[collapsible=icon]:px-0 transition-all w-full">
              {isCollapsed ? (
                <div className="relative h-6 w-6 shrink-0 group">
                  <img
                    src={APP_LOGO}
                    className="h-6 w-6 rounded-md object-cover ring-1 ring-border"
                    alt="Logo"
                  />
                  <button
                    onClick={toggleSidebar}
                    className="absolute inset-0 flex items-center justify-center bg-accent rounded-md ring-1 ring-border opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <PanelLeft className="h-3 w-3 text-foreground" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={APP_LOGO}
                      className="h-6 w-6 rounded-md object-cover ring-1 ring-border shrink-0"
                      alt="Logo"
                    />
                    <span className="text-sm font-semibold tracking-tight truncate">
                      {APP_TITLE}
                    </span>
                  </div>
                  <button
                    onClick={toggleSidebar}
                    className="ml-auto h-6 w-6 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                  >
                    <PanelLeft className="h-3 w-3 text-muted-foreground" />
                  </button>
                </>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-1.5 py-0.5">
              {menuItems.map(item => {
                const hasSubItems = Boolean(item.subItems?.length);
                
                if (hasSubItems) {
                  // isExpanded: se está explicitamente expandido OU se deve estar expandido pela rota
                  const isExpanded = Boolean(expandedMenus[item.path] || shouldBeExpanded[item.path]);
                  
                  return (
                    <MenuItemWithSubmenu
                      key={item.path}
                      item={item}
                      location={location}
                      isExpanded={isExpanded}
                      onToggle={toggleHandlers[item.path]}
                      onSubItemClick={handleSubItemClick}
                    />
                  );
                }
                
                return (
                  <MenuItemSimple
                    key={item.path}
                    item={item}
                    location={location}
                    onClick={() => {
                      // Pré-carregar dados se for Colaboradores
                      if (item.path === "/colaboradores") {
                        // Usar startTransition para não bloquear
                        startTransition(() => {
                          setLocation(item.path);
                        });
                      } else {
                        setLocation(item.path);
                      }
                    }}
                  />
                );
              })}
            </SidebarMenu>
          </SidebarContent>
          
          {/* Separador e Botão de Sair - Fora do SidebarContent para ficar fixo no final */}
          <div className="border-t px-1.5 py-0.5">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={async () => {
                    if (window.confirm("Tem certeza que deseja sair do sistema?")) {
                      try {
                        await logout();
                        // Limpar localStorage
                        localStorage.removeItem("manus-runtime-user-info");
                        // Aguardar um pouco para garantir que o logout foi processado
                        await new Promise(resolve => setTimeout(resolve, 200));
                        // Redirecionar para login usando replace para forçar o redirecionamento
                        const loginUrl = getLoginUrl();
                        if (loginUrl.startsWith("/")) {
                          // URL relativa - usar replace
                          window.location.replace(loginUrl);
                        } else {
                          // URL absoluta (OAuth) - usar href
                          window.location.href = loginUrl;
                        }
                      } catch (error) {
                        console.error("Erro ao fazer logout:", error);
                        // Mesmo com erro, tentar redirecionar
                        const loginUrl = getLoginUrl();
                        if (loginUrl.startsWith("/")) {
                          window.location.replace(loginUrl);
                        } else {
                          window.location.href = loginUrl;
                        }
                      }
                    }
                  }}
                  tooltip="Sair do Sistema"
                  className="h-8 transition-all font-normal text-sm text-destructive hover:text-destructive hover:bg-destructive/10 group-data-[collapsible=icon]:text-destructive"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="text-xs">Sair do Sistema</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </div>

          <SidebarFooter className="p-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Avatar className="h-7 w-7 border shrink-0">
                    <AvatarFallback className="text-[10px] font-medium">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-xs font-medium truncate leading-none">
                      {user?.name || "-"}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate mt-1">
                      {user?.email || "-"}
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-3.5 w-3.5" />
                  <span className="text-sm">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? APP_TITLE}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4" style={{ transform: 'scale(0.80)', transformOrigin: 'top left', width: '125%' }}>{children}</main>
      </SidebarInset>
    </>
  );
}
