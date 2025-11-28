# 📋 Script: Completar Cadastro de Colaboradores

## 📝 Descrição

Este script completa o cadastro de **TODOS** os colaboradores existentes com dados fictícios em **100% dos campos**, garantindo que a ficha esteja completamente preenchida. Além disso, cria ou atualiza o ASO admissional conforme as regras:

- **Data de emissão do ASO**: 2 dias antes da data de admissão
- **Data de validade do ASO**: 1 ano (365 dias) a partir da data de emissão do primeiro ASO

## ⚙️ Pré-requisitos

1. **Configurar DATABASE_URL no arquivo `.env`**:
   ```env
   DATABASE_URL=mysql://usuario:senha@host:porta/nomedobanco
   ```

2. **Ter colaboradores cadastrados** no sistema

## 🚀 Como Executar

### Windows PowerShell:
```powershell
cd tst-facil
npx tsx scripts/completar-cadastro-colaboradores.ts
```

### Linux/Mac:
```bash
cd tst-facil
npx tsx scripts/completar-cadastro-colaboradores.ts
```

## 📊 O que o Script Faz

### 1. Completa o Cadastro dos Colaboradores

Para cada colaborador, o script preenche **TODOS** os campos faltantes com dados fictícios:

- ✅ **Dados Pessoais**:
  - Data de nascimento (idade entre 18-55 anos)
  - Cidade e estado de nascimento
  - Sexo (masculino/feminino)

- ✅ **Documentos**:
  - RG (formato: XX.XXX.XXX-X)
  - CPF (formato: XXX.XXX.XXX-XX)
  - PIS (formato: XXX.XXXXX.XX-XX)

- ✅ **Endereço Completo**:
  - Tipo de logradouro (Rua, Avenida, etc.)
  - Nome do logradouro
  - Número
  - Complemento (opcional)
  - Cidade e estado
  - CEP (formato: XXXXX-XXX)

- ✅ **Contatos**:
  - Telefone principal
  - Telefone de recado (opcional)
  - Nome da pessoa para recado
  - Grau de parentesco

- ✅ **Dados Profissionais**:
  - Função (se não tiver)
  - Setor (se não tiver)
  - Data de admissão (se não tiver, gera uma data aleatória)

### 2. Cria/Atualiza ASO Admissional

Para cada colaborador com data de admissão:

- ✅ **Se não tiver ASO admissional**: Cria um novo
- ✅ **Se já tiver ASO admissional**: Atualiza as datas conforme as regras

**Regras do ASO:**
- Data de emissão: **2 dias antes** da data de admissão
- Data de validade: **1 ano** a partir da data de emissão
- Status: Ativo (se ainda não venceu) ou Vencido (se já passou)

## 📈 Resumo da Execução

Ao final, o script exibe um resumo:

```
📊 Resumo da execução:
   ✅ Colaboradores atualizados: X
   ✅ ASOs criados: Y
   📝 ASOs atualizados: Z
   ❌ Erros: W
```

## ⚠️ Observações

- O script **não remove** dados existentes, apenas **completa** campos vazios
- Dados já preenchidos **não são alterados**
- O script é **seguro** para executar múltiplas vezes
- Colaboradores **sem data de admissão** recebem uma data aleatória

## 🔍 Verificação

Após executar o script, você pode verificar:

1. **No cadastro de colaboradores**:
   - Todos os campos devem estar preenchidos
   - Dados devem ser realistas e consistentes

2. **No dashboard de ASOs**:
   - Total de ASOs deve aumentar
   - Cobertura de colaboradores deve melhorar

3. **Na lista de ASOs**:
   - Filtre por tipo "Admissional"
   - Verifique se as datas estão corretas (emissão 2 dias antes da admissão)
   - Verifique se a validade é 1 ano a partir da emissão

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
🚀 Iniciando completar cadastro de colaboradores...

📋 Total de colaboradores encontrados: 550

✅ Colaborador 1 (João Silva) - Cadastro completo atualizado
   ✅ ASO admissional criado - Emissão: 01/01/2024, Validade: 01/01/2025, Status: ativo
✅ Colaborador 2 (Maria Santos) - Cadastro completo atualizado
   📝 ASO admissional atualizado - Emissão: 15/02/2024, Validade: 15/02/2025
...

============================================================
📊 Resumo da execução:
   ✅ Colaboradores atualizados: 550
   ✅ ASOs criados: 548
   📝 ASOs atualizados: 2
   ❌ Erros: 0
============================================================

🎉 Processo concluído!
```







