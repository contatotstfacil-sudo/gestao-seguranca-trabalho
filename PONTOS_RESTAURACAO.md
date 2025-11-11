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

## ⚠️ Importante

- **Todas as mudanças não commitadas serão descartadas** ao restaurar
- Um backup automático será criado em uma branch antes da restauração
- Após restaurar, pode ser necessário executar `pnpm install` para reinstalar dependências

## 🔄 Criar um Novo Ponto de Restauração

Para criar um novo ponto de restauração manualmente:

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

- **restore-point-2025-11-10_23-55-21**: Sistema funcional antes de mudanças futuras (10/11/2025 23:55:21)

## 💡 Dicas

- Crie um ponto de restauração antes de fazer mudanças grandes
- Use nomes descritivos nos commits para facilitar a identificação
- Os backups automáticos ficam em branches com o formato `backup-before-restore-YYYYMMDD-HHmmss`

