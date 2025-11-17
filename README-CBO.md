# Banco de Dados CBO - Classificação Brasileira de Ocupações

## 📋 Sobre

Este sistema inclui um banco de dados de referência com cargos conforme a **Classificação Brasileira de Ocupações (CBO)**, mantida pelo Ministério do Trabalho e Emprego (MTE).

## 🎯 Objetivo

O banco CBO permite que ao cadastrar um cargo, o usuário possa:
- Buscar e selecionar cargos pré-cadastrados do CBO
- Preencher automaticamente nome, descrição e código CBO
- Garantir padronização e consistência nos cadastros
- Otimizar o tempo de cadastro

## 📊 Estrutura

### Tabela `cargosCbo`
- `codigoCbo`: Código único do CBO (ex: "2251-05")
- `nomeCargo`: Nome oficial do cargo
- `descricao`: Descrição completa da ocupação
- `familiaOcupacional`: Família da ocupação
- `sinonimia`: Nomes alternativos/variantes

## 🚀 Como Importar os Dados

### Opção 1: Importar arquivo de exemplo (20 cargos comuns)

```bash
pnpm importar:cargos-cbo
```

Este comando importa o arquivo `data/cargos-cbo-exemplo.json` com 20 cargos comuns da área de SST e construção.

### Opção 2: Importar arquivo customizado

```bash
pnpm importar:cargos-cbo:custom caminho/para/seu/arquivo.json
```

## 📥 Onde Obter a Base Completa do CBO

### 1. **Fonte Oficial (MTE)**
- Site: http://www.mtecbo.gov.br
- Formato: PDF ou planilhas Excel
- **Nota**: Pode ser necessário converter para JSON

### 2. **APIs Públicas**
Existem algumas APIs não-oficiais que fornecem dados do CBO:
- Pesquise por "CBO API" ou "Classificação Brasileira de Ocupações API"
- Algumas fornecem dados em JSON

### 3. **Arquivos Estruturados**
Alguns desenvolvedores disponibilizam o CBO completo em formato JSON/CSV:
- GitHub: Pesquise por "CBO JSON" ou "cbo-brasil"
- Pode encontrar repositórios com a base completa

### 4. **Criar seu próprio arquivo JSON**

Formato do arquivo JSON:

```json
[
  {
    "codigoCbo": "2251-05",
    "nomeCargo": "Médico do trabalho",
    "descricao": "Descrição completa da ocupação...",
    "familiaOcupacional": "Médicos",
    "sinonimia": "Médico do trabalho, Médico ocupacional"
  }
]
```

## 🔄 Como Funciona a Importação

1. O script lê o arquivo JSON
2. Para cada cargo:
   - Se o código CBO já existe → **atualiza** o registro
   - Se o código CBO não existe → **insere** novo registro
3. Mantém a integridade (código CBO é único)

## 📝 Exemplo de Uso

1. **Importar cargos iniciais:**
   ```bash
   pnpm importar:cargos-cbo
   ```

2. **Adicionar mais cargos depois:**
   - Baixe ou crie um arquivo JSON com mais cargos
   - Execute: `pnpm importar:cargos-cbo:custom caminho/arquivo.json`
   - O script atualizará os existentes e adicionará os novos

## 🎨 Próximos Passos (Integração no Frontend)

Após importar os dados, será necessário:

1. **Criar rota no backend** para buscar cargos CBO:
   ```typescript
   cargosCbo: router({
     list: protectedProcedure
       .input(z.object({ searchTerm: z.string().optional() }))
       .query(async ({ input }) => {
         return db.getAllCargosCbo(input.searchTerm);
       }),
   })
   ```

2. **Adicionar busca no formulário de cargos:**
   - Campo de busca com lupa (similar ao de empresas)
   - Ao selecionar um cargo CBO, preencher automaticamente:
     - Nome do cargo
     - Descrição
     - Código CBO

3. **Manter flexibilidade:**
   - Permitir cadastrar cargos customizados (sem CBO)
   - Permitir editar cargos mesmo que venham do CBO

## 📚 Recursos Adicionais

- **CBO Completo**: A CBO possui mais de 2.000 ocupações
- **Atualizações**: O CBO é atualizado periodicamente pelo MTE
- **Sinonímia**: Muitos cargos têm nomes alternativos (ex: "TST" = "Técnico de Segurança do Trabalho")

## ⚠️ Nota Legal

Os dados do CBO são de domínio público e mantidos pelo Ministério do Trabalho e Emprego. Este sistema apenas facilita o uso desses dados para padronização de cadastros.

