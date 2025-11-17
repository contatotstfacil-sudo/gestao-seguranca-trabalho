# 📦 Sistema de Pontos de Restauração

Este projeto possui um sistema de pontos de restauração que permite voltar facilmente a um estado anterior do sistema.

## 🎯 Como Funciona

Os pontos de restauração são criados usando **Git tags** com o formato `restore-point-YYYY-MM-DD_HH-mm-ss`. Cada ponto captura o estado completo do código no momento da criação.

## 📋 Comandos Disponíveis

### Listar Pontos de Restauração

```powershell
.\listar-pontos-restauracao.ps1
```

Lista todos os pontos de restauração disponíveis com suas informações.

### Restaurar um Ponto

**Opção 1: Seleção Interativa**
```powershell
.\restaurar-ponto-restauracao.ps1
```
O script mostrará uma lista numerada e você escolhe qual restaurar.

**Opção 2: Especificar a Tag**
```powershell
.\restaurar-ponto-restauracao.ps1 restore-point-2025-11-10_23-55-21
```

## 🔒 Sistema de Backup Automático

**IMPORTANTE**: O script de restauração SEMPRE cria backups completos antes de qualquer operação destrutiva!

### O que é feito automaticamente:

1. **Stash de mudanças não commitadas**: Todas as alterações não salvas são guardadas em um stash com nome único
2. **Branch de backup**: Um backup completo do estado atual é criado em uma branch separada
3. **Verificação de integridade**: O sistema verifica se o backup foi criado corretamente antes de prosseguir
4. **Recuperação automática**: Se algo der errado durante a restauração, o sistema tenta restaurar automaticamente do backup

### Formato dos backups:

- **Branch**: `backup-before-restore-YYYYMMDD-HHmmss`
- **Stash**: `backup-stash-YYYYMMDD-HHmmss` (se houver mudanças não commitadas)

## ⚠️ Importante

- **Todas as mudanças não commitadas serão descartadas** ao restaurar, mas são salvas em backup primeiro
- **Backups são criados automaticamente** - você não precisa se preocupar em perder dados
- Após restaurar, pode ser necessário executar `pnpm install` para reinstalar dependências
- Se algo der errado, o sistema tenta restaurar automaticamente do backup criado

## 🔄 Criar um Novo Ponto de Restauração

**Opção 1: Usar o Script Automático (Recomendado)**

```powershell
.\criar-ponto-restauracao.ps1
```

Ou com descrição personalizada:
```powershell
.\criar-ponto-restauracao.ps1 -descricao "Descrição do que foi feito"
```

**Opção 2: Criar Manualmente**

```powershell
# Adicionar todas as mudanças
git add -A

# Criar commit
$data = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
git commit -m "Ponto de restauração - $data"

# Criar tag
$tagName = "restore-point-$data"
git tag -a $tagName -m "Ponto de restauração criado em $data"
```

## 📝 Pontos Criados

- **restore-point-2025-11-14_19-02-11**: Correções nos riscos ocupacionais, remoção da página Riscos Ocupacionais, ajustes no PGRO com scroll no dialog, e melhorias na barra lateral (14/11/2025 19:02:11)
- **restore-point-2025-11-12_11-56-34**: Otimizações SEO completas - Meta tags, Schema.org, Open Graph, robots.txt, sitemap.xml, performance (12/11/2025 11:56:34)
- **restore-point-2025-11-10_23-55-21**: Sistema funcional antes de mudanças futuras (10/11/2025 23:55:21)

## 💡 Dicas

- Crie um ponto de restauração antes de fazer mudanças grandes
- Use nomes descritivos nos commits para facilitar a identificação
- Os backups automáticos ficam em branches com o formato `backup-before-restore-YYYYMMDD-HHmmss`
- Você pode ver todos os backups com: `git branch | grep backup-before-restore`
- Para ver os stashes de backup: `git stash list | grep backup-stash`
- Para restaurar um backup manualmente: `git checkout backup-before-restore-YYYYMMDD-HHmmss`

## 🔄 Recuperar de um Backup

Se precisar voltar ao estado antes da restauração:

```powershell
# Ver branches de backup disponíveis
git branch | grep backup-before-restore

# Restaurar um backup específico
git checkout backup-before-restore-YYYYMMDD-HHmmss

# Se houver mudanças no stash, aplicar também
git stash list
git stash apply stash@{N}  # Substitua N pelo índice do stash
```

