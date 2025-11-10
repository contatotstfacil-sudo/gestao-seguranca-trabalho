# TODO - Sistema de Gestão de Segurança do Trabalho

## Infraestrutura e Autenticação
- [x] Configurar schema do banco de dados com todas as tabelas
- [x] Implementar sistema de autenticação e controle de acesso por perfil
- [x] Criar layout principal com menu lateral

## Módulo de Empresas
- [x] Criar tabela de empresas no banco
- [x] Implementar CRUD de empresas (cadastrar, editar, listar, desativar)
- [x] Adicionar filtros por status (ativa/inativa)
- [x] Criar interface de listagem de empresas
- [x] Criar formulário de cadastro/edição de empresas

## Módulo de Colaboradores
- [x] Criar tabela de colaboradores no banco
- [x] Implementar CRUD de colaboradores
- [x] Adicionar vínculo com empresas
- [x] Implementar filtros (empresa, status, obra, validade ASO)
- [x] Criar listagem de colaboradores com ASO vencido/a vencer
- [x] Criar interface de listagem de colaboradores
- [x] Criar formulário de cadastro/edição de colaboradores

## Módulo de Obras
- [x] Criar tabela de obras no banco
- [x] Implementar CRUD de obras
- [x] Adicionar vínculo de colaboradores à obra
- [x] Implementar filtros (empresa, status, período)
- [x] Criar interface de listagem de obras
- [x] Criar formulário de cadastro/edição de obras

## Módulo de Treinamentos
- [x] Criar tabela de treinamentos no banco
- [x] Implementar CRUD de treinamentos (NR-35, NR-33, NR-10, etc)
- [x] Adicionar controle de validade e status automático
- [x] Implementar filtros (empresa, vencidos, a vencer em 30 dias)
- [x] Criar interface de listagem de treinamentos
- [x] Criar formulário de cadastro/edição de treinamentos

## Módulo de EPIs
- [x] Criar tabela de EPIs no banco
- [x] Implementar CRUD de EPIs
- [x] Adicionar controle de entrega, validade e devolução
- [x] Implementar histórico de entregas por colaborador
- [x] Criar interface de listagem de EPIs
- [x] Criar formulário de registro de entrega de EPI

## Dashboard e Relatórios
- [x] Criar dashboard principal com indicadores
- [x] Implementar cards de métricas (empresas ativas, colaboradores, obras, etc)
- [x] Criar gráficos de treinamentos e EPIs
- [x] Implementar alertas visuais para vencimentos
- [ ] Adicionar geração de relatórios básicos

## Funcionalidades Futuras (Não Implementadas Nesta Versão)
- [ ] Módulo Financeiro
- [ ] Sistema de Notificações Automáticas por E-mail
- [ ] Módulo de Auditoria e Logs
- [ ] Exportação de relatórios em PDF/Excel

## Correções de Bugs
- [x] Corrigir validação de e-mail no formulário de empresas para aceitar campo vazio

## Melhorias Solicitadas
- [x] Adicionar filtro de pesquisa por nome/razão social no módulo de Empresas
- [x] Adicionar filtro por data de cadastro no módulo de Empresas
- [x] Adicionar filtro de pesquisa por nome no módulo de Colaboradores
- [x] Adicionar filtro por data de admissão no módulo de Colaboradores
- [x] Adicionar filtro por data de cadastro no módulo de Colaboradores

## Expansão de Ficha de Colaborador
- [x] Adicionar campos RG, CPF, PIS ao banco de dados
- [x] Adicionar campos de endereço e telefones
- [x] Adicionar campos de contato de emergência
- [x] Adicionar campo de observações
- [x] Atualizar formulário de cadastro com novos campos
- [x] Atualizar tabela de listagem com novos campos

## Expansão Adicional de Ficha de Colaborador
- [x] Adicionar campo de foto ao banco de dados
- [x] Separar endereço em campos individuais (tipo de logradouro, nome, número, cidade, estado, CEP)
- [x] Adicionar data de nascimento ao banco de dados
- [x] Adicionar cidade e estado de nascimento ao banco de dados
- [x] Implementar upload de foto no formulário
- [x] Atualizar formulário com novos campos de endereço detalhado
- [x] Atualizar formulário com campos de nascimento

## Expansão de Ficha de Empresa
- [x] Adicionar campo CNPJ ao banco de dados
- [x] Adicionar grau de risco ao banco de dados
- [x] Adicionar CNAE principal ao banco de dados
- [x] Separar endereço em campos individuais (tipo de logradouro, nome, número, cidade, estado, CEP)
- [x] Atualizar formulário de empresas com novos campos
- [x] Atualizar listagem de empresas

## Funcionalidade de Exportação
- [x] Adicionar checkboxes na tabela de colaboradores para seleção
- [x] Implementar botão de exportação com opções (selecionados/todos)
- [x] Modificar exportação para PDF formatado como ficha de cadastro

## Melhorias na Exportação PDF
- [x] Adicionar foto no formato 3x4 na ficha de exportação em PDF

## Bugs a Corrigir
- [x] Corrigir upload de foto - imagem não está sendo salva
- [x] Corrigir salvamento de dados do formulário de colaboradores
- [x] Foto não aparece na exportação em PDF

## Bugs Recentes
- [x] Botão de salvar na ficha de colaboradores não está funcionando

- [x] Corrigir tamanho de foto - base64 muito grande causando erro de validação

- [x] Adicionar máscara de formatação automática nos campos de telefone (xxxx) x xxxx-xxxx

- [x] Corrigir máscara de telefone para (xx) x xxxx-xxxx (2 dígitos entre parênteses, não 4)

## Expans\u00e3o de ## Expansão de Ficha de Obra
- [x] Adicionar campos CNPJ, CNO, CNAE ao banco de dados
- [x] Adicionar campo descrição da atividade
- [x] Adicionar campo grau de risco
- [x] Adicionar campo quantidade prevista de colaboradores
- [x] Atualizar formulário de obras com novos campos

- [x] Separar campo de endereço da obra em campos individuais (tipo, rua, número, complemento, bairro, cidade, estado, CEP)

## Bugs Críticos
- [x] Menu lateral desapareceu na página de Obras
- [x] Dados não estão sendo salvos corretamente em Obras

## Sistema de Treinamentos Obrigatórios por Cargo
- [x] Criar tabela de vínculo entre cargos e treinamentos no banco de dados
- [x] Criar interface para gerenciar treinamentos obrigatórios por cargo
- [x] Atualizar formulário de colaboradores para pré-selecionar treinamentos baseado na função
- [x] Atualizar página de treinamentos para consumir os dados de treinamentos obrigatórios


## Filtros Avançados de Treinamentos
- [x] Adicionar filtro por nome do colaborador
- [x] Adicionar filtro por função/cargo
- [x] Adicionar filtro por empresa
- [x] Adicionar filtro por tipo de treinamento
- [x] Implementar filtros em tempo real na página de Treinamentos


## Sistema de Tipos de Treinamentos (Catálogo)
- [x] Criar tabela tiposTreinamentos no banco de dados
- [x] Atualizar tabela cargoTreinamentos para vincular aos tipos
- [x] Criar backend routes para CRUD de tipos de treinamentos
- [x] Criar página de Tipos de Treinamentos com listagem, cadastro, edição e exclusão
- [x] Atualizar página de Cargos para selecionar tipos de treinamentos obrigatórios
- [x] Atualizar formulário de Colaboradores para pré-preencher com tipos obrigatórios


## Bugs a Corrigir
- [x] Tipo de NR deve ser opcional (permitir deixar em branco)
- [x] Cadastro de Tipos de Treinamentos não está salvando
- [x] Exibição de treinamentos obrigatórios vinculados aos cargos estava em branco

## Dashboard de Colaboradores
- [x] Criar queries backend para estatísticas de colaboradores (total, por setor, por idade, por sexo, etc)
- [x] Criar componentes de gráficos (barras, pizza, linhas) usando Recharts
- [x] Implementar página de Dashboard de Colaboradores com todas as visualizações
- [x] Adicionar métricas principais (total, com rescisão, por status)
- [x] Adicionar gráficos de distribuição por status (ativo/inativo)
- [x] Adicionar gráficos de distribuição por setor
- [ ] Adicionar gráficos de distribuição por idade (faixas etárias)
- [x] Adicionar gráficos de distribuição por sexo
- [ ] Adicionar seção de estatísticas detalhadas
- [x] Adicionar lista de colaboradores com mais tempo de empresa
- [x] Testar e validar dashboard completo

## Pré-preenchimento de Treinamentos Obrigatórios
- [x] Adicionar campo sexo ao schema de colaboradores
- [x] Adicionar queries backend para estatísticas por sexo e setor
- [x] Expandir Dashboard de Colaboradores com gráficos de sexo e setor
- [x] Adicionar seção de treinamentos obrigatórios no formulário de colaboradores
- [x] Implementar pré-seleção de treinamentos baseada no cargo selecionado

## Abreviação de Nomes de Cargos nos Gráficos
- [x] Criar função de abreviação que pega 3 primeiras letras de cada palavra
- [x] Atualizar Dashboard de Colaboradores para usar abreviações nos gráficos
- [x] Testar abreviações com diferentes nomes de cargos
- [x] Validar que os gráficos ficam mais compactos e legíveis
- [x] Implementar tooltip customizado para mostrar nome completo ao passar o mouse

## Correção de Cálculo de Tempo de Empresa
- [x] Corrigir função de cálculo de tempo de empresa
- [x] Atualizar Dashboard para exibir tempo em anos e meses
- [x] Testar e validar o cálculo com dados reais

## Criação de Colaboradores de Teste
- [x] Criar script para gerar 36 colaboradores (30 adultos + 6 aprendizes)
- [x] Inserir colaboradores no banco de dados
- [x] Validar dados inseridos
- [x] Verificar visualização no Dashboard

## Criação de Colaboradores Inativos
- [x] Criar script para gerar 5 colaboradores inativos
- [x] Inserir colaboradores no banco de dados
- [x] Validar dados inseridos
- [x] Verificar visualização no Dashboard

## Correção de Função de Busca de Colaboradores
- [x] Investigar problema na função de busca
- [x] Corrigir query de busca no backend
- [x] Testar busca com diferentes nomes
- [x] Validar que a busca encontra colaboradores corretamente
