# Guia do Usuário - Sistema de Gestão de Segurança do Trabalho

## Informações do Sistema

**Propósito:** Gerencie empresas, colaboradores, obras, treinamentos e EPIs em um único sistema integrado de segurança do trabalho.

**Acesso:** Login obrigatório via Manus OAuth

## Powered by Manus

Este sistema foi construído com tecnologias modernas e escaláveis. O **frontend** utiliza React 19 com TypeScript, Tailwind CSS 4 e shadcn/ui para uma interface responsiva e profissional. O **backend** roda em Node.js com Express 4 e tRPC 11, garantindo comunicação type-safe entre cliente e servidor. O **banco de dados** MySQL gerenciado armazena todos os dados com segurança e performance. A **autenticação** é gerenciada pelo Manus OAuth, oferecendo login seguro e gerenciamento de sessões. A **implantação** acontece em infraestrutura auto-escalável com CDN global, garantindo alta disponibilidade e velocidade de carregamento em qualquer lugar do mundo.

## Usando Seu Sistema

O sistema possui seis módulos principais acessíveis pelo menu lateral. No **Dashboard**, você visualiza indicadores em tempo real como empresas ativas, colaboradores, obras em andamento, treinamentos vencidos e EPIs vencidos. Alertas importantes aparecem destacados em vermelho ou amarelo quando há itens que precisam de atenção.

Para cadastrar uma nova empresa, clique em "Empresas" no menu lateral e depois no botão "Nova Empresa". Preencha os campos de razão social, CNPJ, responsável técnico e e-mail de contato, depois clique em "Cadastrar". Você pode editar qualquer empresa clicando no ícone de lápis ou excluir clicando no ícone de lixeira.

No módulo de **Colaboradores**, clique em "Novo Colaborador" e preencha nome completo, função, selecione a empresa vinculada, adicione data de admissão e validade do ASO. O sistema mostra automaticamente quais colaboradores têm ASO vencido através de indicadores coloridos na listagem.

Para registrar uma **Obra**, acesse o menu "Obras", clique em "Nova Obra", preencha nome da obra, endereço, selecione a empresa, defina datas de início e fim. O status pode ser "Ativa" ou "Concluída".

No módulo de **Treinamentos**, você registra cursos obrigatórios como NR-10, NR-33 e NR-35. Clique em "Novo Treinamento", selecione o tipo de NR, escolha a empresa e o colaborador, adicione datas de realização e validade. O sistema calcula automaticamente o status como "Válido", "A Vencer" ou "Vencido".

Para controlar **EPIs**, clique em "Registrar EPI", selecione o tipo de equipamento (capacete, luvas, óculos, etc), escolha a empresa e colaborador, registre as datas de entrega e validade. O histórico completo de entregas fica disponível para cada colaborador.

## Gerenciando Seu Sistema

Todas as configurações do sistema estão disponíveis no painel de gerenciamento. Acesse **Settings** para alterar nome e logo do sistema, configurar domínios personalizados e gerenciar variáveis de ambiente. No **Dashboard** você monitora métricas de uso e status do sistema. O painel **Database** permite visualizar e editar dados diretamente com interface CRUD completa. Use **Code** para baixar todos os arquivos do projeto ou visualizar a estrutura de código.

## Próximos Passos

Converse com a Manus AI a qualquer momento para solicitar mudanças ou adicionar funcionalidades. Comece cadastrando suas primeiras empresas e colaboradores para testar o sistema completo.
