# Pasta de Restauração - Sistema TST Fácil

Esta pasta contém os pontos de restauração do sistema.

## Formato dos Arquivos

Os arquivos de restauração seguem o padrão:
- **Nome**: `restauracao`
- **Data**: `dia-mes-ano` (exemplo: 26-11-2025)
- **Horário**: `HH-MM` (exemplo: 12-00)
- **Formato completo**: `restauracao_dia-mes-ano_HH-MM.txt`

**Exemplo**: `restauracao_26-11-2025_12-00.txt`

## Como usar

Cada ponto de restauração é um commit do Git com uma descrição do que foi implementado. Os arquivos de restauração são criados automaticamente com o formato acima.

## Pontos de Restauração

### 26/11/2025 12:00
- **Arquivo**: `restauracao_26-11-2025_12-00.txt`
- **Commit**: `9110013`
- **Descrição**: Atualização do formato de arquivos de restauração

### 26/11/2025 11:57:15
- **Commit**: `5ae2077`
- **Descrição**: Implementação de páginas dinâmicas por cargo com descrição
- **Funcionalidades**:
  - Criação de uma página para cada cargo na geração do Word
  - Busca automática da descrição do cargo do banco de dados
  - Preenchimento dinâmico de cargo, setor e descrição
  - Estrutura completa de tabela de inventário de riscos para cada cargo
