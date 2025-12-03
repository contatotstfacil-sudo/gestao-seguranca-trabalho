# 📋 Script: Adicionar ASO Admissional para Colaboradores

## 📝 Descrição

Este script adiciona automaticamente o primeiro ASO admissional para todos os colaboradores cadastrados no sistema, com as seguintes características:

- **Data de emissão**: 2 dias antes da data de admissão do colaborador
- **Data de validade**: 1 ano (365 dias) a partir da data de emissão
- **Tipo**: Admissional
- **Status**: Ativo (se ainda não venceu) ou Vencido (se já passou a validade)
- **Apto**: Sim (padrão)

## ⚙️ Pré-requisitos

1. **Configurar DATABASE_URL no arquivo `.env`**:
   ```env
   DATABASE_URL=mysql://usuario:senha@host:porta/nomedobanco
   ```

2. **Ter colaboradores cadastrados** com data de admissão preenchida

## 🚀 Como Executar

### Windows PowerShell:
```powershell
cd tst-facil
npx tsx scripts/adicionar-aso-admissional-colaboradores.ts
```

### Linux/Mac:
```bash
cd tst-facil
npx tsx scripts/adicionar-aso-admissional-colaboradores.ts
```

## 📊 O que o Script Faz

1. ✅ Busca todos os colaboradores cadastrados
2. ✅ Para cada colaborador:
   - Verifica se já possui ASO admissional
   - Se não tiver, cria um novo ASO admissional
   - Calcula data de emissão (2 dias antes da admissão)
   - Calcula data de validade (1 ano após emissão)
   - Define status (ativo ou vencido)
3. ✅ Ignora colaboradores sem data de admissão
4. ✅ Ignora colaboradores que já possuem ASO admissional

## 📈 Resumo da Execução

Ao final, o script exibe um resumo:

```
📊 Resumo da execução:
   ✅ ASOs criados: X
   ⏭️  ASOs já existentes: Y
   ⚠️  Colaboradores sem data de admissão: Z
   ❌ Erros: W
```

## ⚠️ Observações

- O script **não duplica** ASOs admissionais existentes
- Colaboradores **sem data de admissão** são ignorados
- O script é **seguro** para executar múltiplas vezes (idempotente)

## 🔍 Verificação

Após executar o script, você pode verificar:

1. **No dashboard de ASOs**:
   - Total de ASOs deve aumentar
   - Cobertura de colaboradores deve melhorar

2. **Na lista de ASOs**:
   - Filtre por tipo "Admissional"
   - Verifique se os ASOs foram criados corretamente

3. **No banco de dados**:
   ```sql
   SELECT COUNT(*) FROM asos WHERE tipoAso = 'admissional';
   ```

## 🐛 Troubleshooting

### Erro: "DATABASE_URL não configurada"
- Verifique se o arquivo `.env` existe na raiz do projeto `tst-facil`
- Verifique se a `DATABASE_URL` está configurada corretamente
- A URL deve ser do formato: `mysql://usuario:senha@host:porta/nomedobanco`

### Erro: "Nenhum colaborador encontrado"
- Verifique se há colaboradores cadastrados no sistema
- Verifique se os colaboradores têm `tenantId` correto

### Erro de conexão com banco
- Verifique se o MySQL está rodando
- Verifique se as credenciais estão corretas
- Verifique se o banco de dados existe

## 📝 Exemplo de Saída

```
🚀 Iniciando adição de ASOs admissionais para colaboradores...

📋 Total de colaboradores encontrados: 550

✅ ASO admissional criado para colaborador 1 (João Silva) - Emissão: 01/01/2024, Validade: 01/01/2025, Status: ativo
✅ ASO admissional criado para colaborador 2 (Maria Santos) - Emissão: 15/02/2024, Validade: 15/02/2025, Status: ativo
✓ Colaborador 3 (Pedro Costa) já possui ASO admissional.
⚠️  Colaborador 4 (Ana Lima) não tem data de admissão. Pulando...

============================================================
📊 Resumo da execução:
   ✅ ASOs criados: 548
   ⏭️  ASOs já existentes: 1
   ⚠️  Colaboradores sem data de admissão: 1
   ❌ Erros: 0
============================================================

🎉 Processo concluído!
```















