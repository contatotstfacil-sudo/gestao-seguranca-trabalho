-- Backup do banco de dados: sst
-- Data: 2025-11-12T14:13:26.294Z
-- Gerado automaticamente

SET FOREIGN_KEY_CHECKS=0;

-- Estrutura da tabela: __drizzle_migrations
DROP TABLE IF EXISTS `__drizzle_migrations`;
CREATE TABLE `__drizzle_migrations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `hash` text NOT NULL,
  `created_at` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: __drizzle_migrations
LOCK TABLES `__drizzle_migrations` WRITE;
INSERT INTO `__drizzle_migrations` (`id`, `hash`, `created_at`) VALUES
(1, '814a08e40d7fc2bcfd458759d18319198ca8ae394f2fa15617a78678e9c9c93b', 1762124538479),
(2, '13728b14242c5b53fef07a99379ca287488b721589ccbd0eeb932e523196936a', 1762124599148),
(3, '34277a4a5a3d8ebc081c538eafed6968547fe37d765bb188dab599ef3a493a39', 1762125793342),
(4, '106c452959dddfdebb7abd7be1b36362271bb9c2ef72e42312217685087fb64c', 1762126108548),
(5, '18f5f895fd51521103cb3fba6c844c2fbc8bf81e828a98669baf9ac0e493c125', 1762126399189),
(6, 'e5d5d8135185d33bed86834da814d6653a78a7666b2f8f591a90d114beefbcf9', 1762129683758),
(7, '9b7282605e28db8786bfae083ee84c4f90598e77fee315bc4b757279d6e0c81e', 1762130343099),
(8, '2ad0416b1a3ece2f9b8ed609a7e119d63c05d5da8583dd2fd4614fe1f3162cb4', 1762131050860),
(9, '0d7dcb60946c2ab4772eed67c518527918363ef3730852320bf25665347ef869', 1762132487831),
(10, '24d2d0889a1904b6843ed6600f4152bd72660bd316e7ebf03e5e80354d58221d', 1762174616687),
(11, 'bc3d6dd7140be81cff594011abc7205d294a0e9bd867267ab8f454fbfd451a67', 1762197248862),
(12, '9c4ca3c56da6fe94ba921999328b32e69789a91d554a693de221bedd9035ee97', 1762197862930),
(13, '7b1ee8869f57be1327eb780f5583d9d9d07284284449710ab9c7d9fd912d9d19', 1762198466197),
(14, 'dadd7263618cd00ffa12598dedacd949da60c546d75665011121563ae335c370', 1762199089953),
(15, 'f795a983faa0f482b4fe7df8896c683dd0ccf32e751c73dac1f22515cef72883', 1762212879081),
(16, 'de80ef7c27d77f1d42c2edf6f112e29a01877ccdc1f4ed2213cd6feb20dc8aa2', 1762214066966),
(17, 'e51d8c2b0f6e0fe4a6fb16899b1d5a288f95396467a0fa5f1899aa7d0c7ef737', 1762218114774),
(18, '38f2be9e1df227d8db9f300c63250fe7021ac540f634e1e009dc938db324c3d1', 1762219972256),
(19, 'ab0cc8ebdf601768d8870a7f7ca23fc92eda436e70b0f2a0e03a8370c2b0fa5d', 1762268527707),
(20, '44c159033f3cb313cd05ea224040712e96b13eb47a29b852f95f6c728dc7a73f', 1762290830853);

UNLOCK TABLES;

-- Estrutura da tabela: assinaturas
DROP TABLE IF EXISTS `assinaturas`;
CREATE TABLE `assinaturas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `planoId` int NOT NULL,
  `status` enum('ativa','cancelada','vencida','suspensa') NOT NULL DEFAULT 'ativa',
  `periodo` enum('mensal','trimestral','anual') NOT NULL DEFAULT 'mensal',
  `dataInicio` timestamp NOT NULL DEFAULT (now()),
  `dataFim` timestamp NOT NULL,
  `dataRenovacao` timestamp NULL DEFAULT NULL,
  `valorPago` int NOT NULL,
  `metodoPagamento` varchar(50) DEFAULT NULL,
  `idPagamento` varchar(255) DEFAULT NULL,
  `idAssinaturaGateway` varchar(255) DEFAULT NULL,
  `ultimoPagamento` timestamp NULL DEFAULT NULL,
  `proximoPagamento` timestamp NULL DEFAULT NULL,
  `tentativasPagamento` int DEFAULT '0',
  `observacoes` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: assinaturas
LOCK TABLES `assinaturas` WRITE;
INSERT INTO `assinaturas` (`id`, `userId`, `planoId`, `status`, `periodo`, `dataInicio`, `dataFim`, `dataRenovacao`, `valorPago`, `metodoPagamento`, `idPagamento`, `idAssinaturaGateway`, `ultimoPagamento`, `proximoPagamento`, `tentativasPagamento`, `observacoes`, `createdAt`, `updatedAt`) VALUES
(1, 4198, 1, 'ativa', 'mensal', Wed Nov 12 2025 00:47:20 GMT-0300 (Horário Padrão de Brasília), Fri Dec 12 2025 00:47:20 GMT-0300 (Horário Padrão de Brasília), NULL, 14700, NULL, NULL, NULL, NULL, NULL, 0, NULL, Wed Nov 12 2025 00:47:20 GMT-0300 (Horário Padrão de Brasília), Wed Nov 12 2025 00:47:20 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: cargoRiscos
DROP TABLE IF EXISTS `cargoRiscos`;
CREATE TABLE `cargoRiscos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cargoId` int NOT NULL,
  `riscoOcupacionalId` int NOT NULL,
  `empresaId` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `tipoAgente` varchar(255) DEFAULT NULL,
  `descricaoRiscos` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: cargoRiscos
LOCK TABLES `cargoRiscos` WRITE;
INSERT INTO `cargoRiscos` (`id`, `cargoId`, `riscoOcupacionalId`, `empresaId`, `createdAt`, `updatedAt`, `tipoAgente`, `descricaoRiscos`) VALUES
(3, 11, 1, NULL, Sun Nov 09 2025 20:24:57 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:24:57 GMT-0300 (Horário Padrão de Brasília), 'Físico', 'Ruido continuo'),
(4, 11, 2, NULL, Sun Nov 09 2025 20:24:57 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:24:57 GMT-0300 (Horário Padrão de Brasília), 'Químico', 'Sem risco'),
(5, 11, 3, NULL, Sun Nov 09 2025 20:24:58 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:24:58 GMT-0300 (Horário Padrão de Brasília), 'Biológico', 'Sem risco'),
(6, 11, 4, NULL, Sun Nov 09 2025 20:24:58 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:24:58 GMT-0300 (Horário Padrão de Brasília), 'Ergonômico', 'Postura inadequada, Excesso de trabalho'),
(7, 11, 5, NULL, Sun Nov 09 2025 20:24:58 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:24:58 GMT-0300 (Horário Padrão de Brasília), 'Agentes Mecânicos', 'Atropelamento');

UNLOCK TABLES;

-- Estrutura da tabela: cargoSetores
DROP TABLE IF EXISTS `cargoSetores`;
CREATE TABLE `cargoSetores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cargoId` int NOT NULL,
  `setorId` int NOT NULL,
  `empresaId` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: cargoSetores
LOCK TABLES `cargoSetores` WRITE;
INSERT INTO `cargoSetores` (`id`, `cargoId`, `setorId`, `empresaId`, `createdAt`, `updatedAt`) VALUES
(5, 11, 5, NULL, Sun Nov 09 2025 20:23:45 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:23:45 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: cargoTreinamentos
DROP TABLE IF EXISTS `cargoTreinamentos`;
CREATE TABLE `cargoTreinamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cargoId` int NOT NULL,
  `empresaId` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `tipoTreinamentoId` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: cargoTreinamentos
LOCK TABLES `cargoTreinamentos` WRITE;
INSERT INTO `cargoTreinamentos` (`id`, `cargoId`, `empresaId`, `createdAt`, `updatedAt`, `tipoTreinamentoId`) VALUES
(1, 1, NULL, Mon Nov 03 2025 19:31:16 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:31:16 GMT-0300 (Horário Padrão de Brasília), 1),
(2, 11, NULL, Sat Nov 08 2025 00:40:31 GMT-0300 (Horário Padrão de Brasília), Sat Nov 08 2025 00:40:31 GMT-0300 (Horário Padrão de Brasília), 2);

UNLOCK TABLES;

-- Estrutura da tabela: cargos
DROP TABLE IF EXISTS `cargos`;
CREATE TABLE `cargos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomeCargo` varchar(255) NOT NULL,
  `descricao` text,
  `empresaId` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=56 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: cargos
LOCK TABLES `cargos` WRITE;
INSERT INTO `cargos` (`id`, `nomeCargo`, `descricao`, `empresaId`, `createdAt`, `updatedAt`) VALUES
(1, 'Tecnico de Segurança do Trabalho', 'Elaboram, participam da elaboração e implementam políticas de Saúde e Segurança no Trabalho (SST); realizam auditorias, acompanhamentos e avaliações na área; identificam variáveis de controle de doenças, acidentes, qualidade de vida e meio ambiente. Desenvolvem ações educativas na área de Saúde e Segurança no Trabalho; participam de perícias e fiscalizações, além de integrarem processos de negociação. Participam da adoção de novas tecnologias e processos de trabalho; gerenciam a documentação de SST; investigam e analisam acidentes, recomendando medidas de prevenção e controle.', NULL, Mon Nov 03 2025 19:17:47 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:17:47 GMT-0300 (Horário Padrão de Brasília)),
(3, 'Diretor Geral', 'Planeja, coordena e controla as atividades estratégicas e operacionais da empresa, definindo políticas e diretrizes organizacionais. Responsável pela tomada de decisões de alto nível, gestão de recursos e relacionamento com stakeholders.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:24 GMT-0300 (Horário Padrão de Brasília)),
(4, 'Assistente de Diretoria', 'Presta suporte administrativo e executivo à diretoria, organizando agendas, preparando documentos, realizando pesquisas e facilitando a comunicação entre a diretoria e demais departamentos.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:24 GMT-0300 (Horário Padrão de Brasília)),
(5, 'Gerente Financeiro', 'Coordena e controla as atividades financeiras da empresa, incluindo planejamento orçamentário, análise de custos, gestão de fluxo de caixa, controle de receitas e despesas, e elaboração de relatórios financeiros.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:24 GMT-0300 (Horário Padrão de Brasília)),
(6, 'Analista Financeiro', 'Analisa dados financeiros, elabora relatórios, realiza projeções e estudos de viabilidade, acompanha indicadores financeiros e auxilia na tomada de decisões estratégicas relacionadas às finanças.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(7, 'Auxiliar Financeiro', 'Auxilia nas rotinas financeiras, como lançamentos contábeis, conciliações bancárias, controle de contas a pagar e receber, e organização de documentos financeiros.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(8, 'Coordenador de RH', 'Coordena as atividades de gestão de pessoas, incluindo recrutamento, seleção, treinamento, desenvolvimento, avaliação de desempenho, políticas de cargos e salários, e relações trabalhistas.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(9, 'Analista de RH', 'Analisa e executa processos de recursos humanos, como recrutamento, seleção, treinamento, folha de pagamento, benefícios, e elabora relatórios e indicadores de RH.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(10, 'Assistente de RH', 'Auxilia nas rotinas de recursos humanos, mantendo cadastros atualizados, organizando documentos, auxiliando em processos de admissão e demissão, e prestando apoio aos analistas de RH.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(11, 'Advogado', 'Presta assessoria jurídica, elabora contratos, analisa questões legais, acompanha processos judiciais e administrativos, e fornece orientações sobre questões trabalhistas, contratuais e regulatórias.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(12, 'Auxiliar Jurídico', 'Auxilia nas atividades jurídicas, organizando documentos, protocolando processos, mantendo arquivos atualizados, e prestando suporte aos advogados nas rotinas do departamento jurídico.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(13, 'Gerente Comercial', 'Coordena e gerencia as atividades comerciais, estabelecendo estratégias de vendas, definindo metas, acompanhando o desempenho da equipe comercial, e desenvolvendo relacionamento com clientes estratégicos.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(14, 'Representante de Vendas', 'Identifica oportunidades de negócios, realiza prospecção de clientes, apresenta produtos e serviços, negocia propostas comerciais, e mantém relacionamento com clientes para fidelização.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(15, 'Assistente Comercial', 'Auxilia nas atividades comerciais, prestando suporte aos vendedores, organizando propostas, atendendo clientes, atualizando cadastros, e auxiliando na prospecção de novos negócios.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(16, 'Analista de Marketing', 'Analisa mercado e comportamento do consumidor, desenvolve estratégias de marketing, planeja campanhas, monitora resultados, e utiliza ferramentas de marketing digital para promover a marca.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(17, 'Designer / Social Media', 'Cria peças gráficas e conteúdo visual, gerencia redes sociais, desenvolve materiais de comunicação, cria identidade visual, e produz conteúdo para campanhas publicitárias e marketing digital.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(18, 'Coordenador de Compras', 'Coordena as atividades de compras, estabelece estratégias de aquisição, negocia com fornecedores, gerencia contratos, controla estoques, e garante a qualidade e o melhor custo-benefício nas aquisições.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(19, 'Comprador', 'Realiza pesquisas de fornecedores, solicita cotações, analisa propostas, efetua compras de materiais e serviços, acompanha entregas, e mantém relacionamento com fornecedores.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(20, 'Auxiliar de Suprimentos', 'Auxilia nas atividades de compras e suprimentos, organizando documentos, atualizando cadastros de fornecedores, controlando pedidos, e prestando apoio ao setor de compras.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(21, 'Encarregado de Almoxarifado', 'Coordena as atividades de almoxarifado, controla entrada e saída de materiais, organiza estoques, gerencia equipe, e garante a disponibilidade de materiais necessários às operações.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(22, 'Almoxarife', 'Controla estoques, recebe e armazena materiais, realiza inventários, efetua entregas internas, controla movimentações, e mantém registros atualizados de entradas e saídas.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(23, 'Motorista / Entregador', 'Conduz veículos para transporte de pessoas ou cargas, realiza entregas, mantém o veículo em condições adequadas, cumpre rotas estabelecidas, e segue normas de segurança no trânsito.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(24, 'Analista de Suporte', 'Presta suporte técnico aos usuários, resolve problemas de sistemas e equipamentos, instala e configura software, realiza manutenção preventiva, e documenta soluções técnicas.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(25, 'Técnico de Informática', 'Realiza manutenção de equipamentos de informática, instala e configura sistemas, resolve problemas técnicos, realiza backup de dados, e presta suporte técnico aos usuários.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(26, 'Assistente Administrativo', 'Auxilia nas rotinas administrativas, organiza documentos, atende telefone, agenda compromissos, controla arquivos, e presta suporte geral às atividades administrativas da empresa.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(27, 'Recepcionista', 'Atende visitantes e clientes, recebe e encaminha ligações, agenda compromissos, controla entrada e saída de pessoas, e é responsável pelo primeiro atendimento da empresa.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(28, 'Engenheiro Civil', 'Projeta, coordena e supervisiona obras de construção civil, analisa projetos estruturais, calcula materiais e custos, gerencia equipes técnicas, e garante o cumprimento de normas técnicas e de segurança.', NULL, Mon Nov 03 2025 20:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(29, 'Engenheiro de Produção', 'Otimiza processos produtivos, planeja e controla produção, gerencia recursos, implementa melhorias, analisa custos, e desenvolve sistemas de gestão da qualidade e produtividade.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(30, 'Mestre de Obras', 'Coordena e supervisiona equipes de construção, orienta operários, controla execução de serviços, verifica qualidade das obras, gerencia materiais e equipamentos, e garante cumprimento de prazos e especificações técnicas.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(31, 'Encarregado de Obra', 'Coordena atividades na obra, supervisiona equipes, controla execução de serviços, gerencia materiais e equipamentos, verifica qualidade, e garante segurança e cumprimento de normas.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(32, 'Estagiário de Engenharia', 'Auxilia engenheiros em atividades técnicas, realiza levantamentos, participa de projetos, colabora em cálculos e análises, e adquire experiência prática na área de engenharia.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(33, 'Arquiteto', 'Projeta espaços arquitetônicos, elabora plantas e projetos, desenvolve soluções estéticas e funcionais, coordena projetos de construção, e acompanha a execução das obras.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(34, 'Desenhista Técnico', 'Elabora desenhos técnicos, plantas e projetos, utiliza software CAD, detalha projetos de engenharia e arquitetura, e atualiza documentação técnica conforme especificações.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(35, 'Estagiário de Projetos', 'Auxilia em atividades de projetos, realiza levantamentos, colabora na elaboração de desenhos técnicos, participa de estudos, e adquire experiência na área de projetos e planejamento.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(36, 'Engenheiro de Planejamento', 'Planeja e controla obras e projetos, elabora cronogramas, analisa recursos necessários, gerencia prazos, monitora indicadores de desempenho, e otimiza processos construtivos.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(37, 'Analista de Controle de Obras', 'Controla andamento de obras, elabora relatórios de acompanhamento, verifica cumprimento de prazos e metas, analisa indicadores, e auxilia no planejamento e gestão de obras.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(39, 'Auxiliar de Segurança', 'Auxilia nas atividades de segurança do trabalho, apoia inspeções, organiza documentos, controla EPIs, auxilia em treinamentos, e presta suporte ao técnico de segurança.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(40, 'Estagiário de SST', 'Auxilia nas atividades de segurança do trabalho, participa de inspeções, colabora em campanhas de prevenção, atualiza documentos, e adquire experiência prática na área de SST.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(41, 'Coordenador de Qualidade', 'Coordena o sistema de gestão da qualidade, estabelece padrões e procedimentos, realiza auditorias, gerencia certificações, implementa melhorias contínuas, e garante conformidade com normas.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(42, 'Inspetor de Qualidade', 'Inspeciona produtos e serviços, verifica conformidade com especificações, realiza testes e ensaios, documenta não conformidades, e garante padrões de qualidade estabelecidos.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(43, 'Técnico Ambiental', 'Desenvolve e executa programas ambientais, realiza monitoramento ambiental, elabora relatórios, acompanha licenças ambientais, implementa medidas de controle, e garante cumprimento da legislação ambiental.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(44, 'Auxiliar de Meio Ambiente', 'Auxilia nas atividades ambientais, coleta dados, organiza documentos, apoia monitoramentos, controla resíduos, e presta suporte ao técnico ambiental nas rotinas do departamento.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(45, 'Topógrafo', 'Realiza levantamentos topográficos, georreferenciamento e demarcação de terrenos, utiliza equipamentos de medição, elabora plantas e mapas, e fornece dados para projetos de engenharia.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(46, 'Auxiliar de Topografia', 'Auxilia nas atividades topográficas, opera equipamentos de medição, marca pontos no terreno, organiza instrumentos, e presta suporte ao topógrafo em levantamentos de campo.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(47, 'Mecânico de Equipamentos', 'Realiza manutenção e reparo de equipamentos e máquinas, diagnostica falhas, substitui peças, realiza ajustes, e garante funcionamento adequado dos equipamentos de construção.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(48, 'Eletricista de Manutenção', 'Realiza manutenção elétrica, instala e repara sistemas elétricos, identifica e corrige falhas, realiza testes, e garante segurança e funcionamento adequado das instalações elétricas.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(49, 'Operador de Máquinas', 'Opera máquinas e equipamentos de construção, como escavadeiras, retroescavadeiras, guindastes, realiza manutenção básica, e segue normas de segurança na operação.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(50, 'Auxiliar de Manutenção', 'Auxilia nas atividades de manutenção, realiza limpeza de equipamentos, organiza ferramentas, apoia reparos, controla estoque de peças, e presta suporte aos técnicos de manutenção.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(51, 'Engenheiro Orçamentista', 'Elabora orçamentos de obras e serviços, analisa custos, compõe preços, realiza levantamentos de quantitativos, analisa propostas, e fornece subsídios para licitações e negociações.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(52, 'Auxiliar de Custos', 'Auxilia na elaboração de orçamentos e controle de custos, realiza levantamentos, organiza dados, atualiza planilhas, controla preços de materiais, e presta suporte ao orçamentista.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(53, 'Encarregado de Assistência Técnica', 'Coordena serviços de assistência técnica pós-obra, gerencia equipes de manutenção, planeja atendimentos, controla garantias, e garante qualidade dos serviços de assistência ao cliente.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(54, 'Técnico de Manutenção', 'Realiza manutenção corretiva e preventiva em instalações e equipamentos, identifica problemas, executa reparos, realiza testes, e garante funcionamento adequado dos sistemas.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília)),
(55, 'Ajudante de Obras', 'Auxilia nas atividades de construção, realiza serviços gerais, prepara materiais, transporta cargas, executa limpeza, e presta suporte aos profissionais especializados nas obras.', NULL, Mon Nov 03 2025 20:06:09 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:09:25 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: certificadosEmitidos
DROP TABLE IF EXISTS `certificadosEmitidos`;
CREATE TABLE `certificadosEmitidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `modeloCertificadoId` int NOT NULL,
  `colaboradorId` int NOT NULL,
  `responsavelId` int DEFAULT NULL,
  `nomeColaborador` varchar(255) NOT NULL,
  `rgColaborador` varchar(50) DEFAULT NULL,
  `nomeEmpresa` varchar(255) DEFAULT NULL,
  `cnpjEmpresa` varchar(20) DEFAULT NULL,
  `datasRealizacao` text,
  `htmlGerado` text NOT NULL,
  `dataEmissao` timestamp NOT NULL DEFAULT (now()),
  `empresaId` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: certificadosEmitidos
LOCK TABLES `certificadosEmitidos` WRITE;
INSERT INTO `certificadosEmitidos` (`id`, `modeloCertificadoId`, `colaboradorId`, `responsavelId`, `nomeColaborador`, `rgColaborador`, `nomeEmpresa`, `cnpjEmpresa`, `datasRealizacao`, `htmlGerado`, `dataEmissao`, `empresaId`, `createdAt`, `updatedAt`) VALUES
(18, 8, 166, 1, 'Roberto Alves', '31259306', 'Construtora Horizonte Ltda', '37.285.947/8703-46', '["2025-01-01"]', '<!DOCTYPE html>
<html lang="pt-BR">
<head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>Certificado</title> <style> * { margin: 0; padding: 0; box-sizing: border-box; } @page { size: 297mm 210mm; margin: 0; } html, body { font-family: Arial, sans-serif; background: transparent; color: #000000; padding: 0; margin: 0; width: 297mm; height: 210mm; overflow: hidden; } body { page-break-after: avoid; page-break-inside: avoid; } .certificado { width: 297mm; height: 210mm; background: transparent; position: relative; margin: 0; overflow: hidden; page-break-after: avoid; page-break-inside: avoid; } @media print { html, body { width: 297mm; height: 210mm; margin: 0; padding: 0; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; } .certificado { width: 297mm; height: 210mm; margin: 0; padding: 0; page-break-after: avoid; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; } .cabecalho { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; background: #1e40af !important; color: #ffffff !important; } .conteudo { page-break-inside: avoid; } } .cabecalho { background: #1e40af !important; background-color: #1e40af !important; color: #ffffff !important; padding: 15px 20px; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; } .cabecalho h1 { font-size: 42px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 2px; } .cabecalho h2 { font-size: 18px; font-weight: normal; text-transform: uppercase; margin-top: 4px; opacity: 0.95; } .conteudo { padding: 20px 50px; max-height: calc(210mm - 120px); display: flex; flex-direction: column; overflow: hidden; page-break-inside: avoid; } .certificacao-empresa { font-size: 16px; text-align: center; margin-bottom: 12px; color: #000000; line-height: 1.5; } .nome-colaborador { font-size: 34px; font-weight: bold; text-align: center; margin: 10px 0 12px 0; text-transform: uppercase; color: #1e40af; line-height: 1.2; } .nome-colaborador .rg { font-size: 20px; font-weight: normal; text-transform: none; color: #000000; } .texto-treinamento { font-size: 13px; line-height: 1.6; margin: 10px 0; text-align: justify; color: #000000; } .detalhes-treinamento { margin: 10px 0; font-size: 13px; line-height: 1.5; color: #000000; } .detalhes-treinamento div { margin-bottom: 4px; } .conteudo-programatico-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin: 12px 0; gap: 20px; } .conteudo-programatico { flex: 1; padding: 8px 12px; background: transparent; } .conteudo-programatico h3 { font-weight: bold; font-size: 13px; margin-bottom: 6px; color: #1e40af; } .conteudo-programatico ul { list-style: none; padding-left: 0; font-size: 11px; line-height: 1.5; color: #000000; } .conteudo-programatico li { margin-bottom: 3px; } .data-emissao-lateral { text-align: right; font-size: 12px; color: #000000; white-space: nowrap; padding-top: 8px; } .assinaturas { display: flex; justify-content: space-between; gap: 96px; margin-top: 64px; align-items: center; } .assinatura { display: flex; flex-direction: column; align-items: center; } .endereco-treinamento strong { font-weight: bold; } .rodape { position: absolute; bottom: 3cm !important; left: 0; right: 0; width: 100%; padding: 0 50px; z-index: 1 !important; } .endereco-treinamento { position: absolute; bottom: 0.5cm !important; left: 50px; font-size: 10px; color: #000000; opacity: 0.7; z-index: 0 !important; max-width: 400px !important; } .assinaturas { display: flex !important; justify-content: space-between !important; gap: 96px !important; margin-top: 64px !important; align-items: flex-start !important; } .assinatura { display: flex !important; flex-direction: column !important; align-items: center !important; } .assinatura-linha { width: 192px !important; border-top: 1px solid #000000 !important; margin-bottom: 0px !important; } .assinatura-nome { font-size: 12px !important; font-weight: 600 !important; line-height: 1.2 !important; color: #000000 !important; margin-top: 1px !important; } .assinatura-cargo { font-size: 10px !important; line-height: 1.2 !important; color: #374151 !important; margin-top: 1px !important; } </style>
</head>
<body> <div class="certificado"> <div class="cabecalho"> <h1>CERTIFICADO</h1> </div> <div class="conteudo"> <div class="certificacao-empresa">Certifico que o Empregado: <strong>Roberto Alves</strong>, Rg: <strong>31259306</strong>, da Empresa: <strong>Construtora Horizonte Ltda</strong> e CNPJ: <strong>37.285.947/8703-46</strong></div> <div class="texto-treinamento">Participou do Treinamento admissional (Básico em segurança do trabalho ), quadro 1 do Anexo I da Norma Regulamentadora—18, item 18.14, com carga horaria de 4horas.	</div> <div class="detalhes-treinamento"> <div>Realizado no dia <strong>01/01/2025</strong></div> </div> <div class="conteudo-programatico-wrapper"> <div class="conteudo-programatico"> <h3>Conteúdo Programático:</h3> <ul><li>a) dsfdsfsd</li><li>b) dsfsdfdsf</li><li>c) sdfsdfdsf</li><li>d) sdfsdfsdfdsf</li></ul> </div> <div class="data-emissao-lateral">01 de janeiro de 2025</div> </div> </div> <div class="endereco-treinamento"><strong>Endereço do Treinamento:</strong> svsvs f sdf ds ds vz vv scv szv szc c</div> <div class="rodape"> <div class="assinaturas" style="margin-top: 64px; display: flex; justify-content: space-between; gap: 96px;"> <div style="display: flex; flex-direction: column; align-items: center;"> <div style="width: 192px; border-top: 1px solid #000000; margin-bottom: 0px;"></div> <p style="font-size: 12px; font-weight: 600; line-height: 1.2; margin: 0; padding: 0; margin-top: 1px;"> Roberto Alves </p> <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;"> Representante de Vendas </p> <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;"> RG: 31259306 </p> </div> <div style="display: flex; flex-direction: column; align-items: center;"> <div style="width: 192px; border-top: 1px solid #000000; margin-bottom: 0px;"></div> <p style="font-size: 12px; font-weight: 600; line-height: 1.2; margin: 0; padding: 0; margin-top: 1px;"> João Silva Santos </p> <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;"> Engenheiro de Segurança do Trabalho / Bombeiro Civil </p> </div> </div> </div> </div>
</body>
</html>', Fri Nov 07 2025 22:02:09 GMT-0300 (Horário Padrão de Brasília), NULL, Fri Nov 07 2025 22:02:09 GMT-0300 (Horário Padrão de Brasília), Fri Nov 07 2025 22:02:09 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: colaboradores
DROP TABLE IF EXISTS `colaboradores`;
CREATE TABLE `colaboradores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomeCompleto` varchar(255) NOT NULL,
  `funcao` varchar(255) DEFAULT NULL,
  `empresaId` int NOT NULL,
  `obraId` int DEFAULT NULL,
  `dataAdmissao` date DEFAULT NULL,
  `validadeAso` date DEFAULT NULL,
  `status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `dataPrimeiroAso` date DEFAULT NULL,
  `rg` varchar(20) DEFAULT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `pis` varchar(20) DEFAULT NULL,
  `telefonePrincipal` varchar(20) DEFAULT NULL,
  `telefoneRecado` varchar(20) DEFAULT NULL,
  `nomePessoaRecado` varchar(255) DEFAULT NULL,
  `grauParentesco` varchar(50) DEFAULT NULL,
  `observacoes` text,
  `dataNascimento` date DEFAULT NULL,
  `cidadeNascimento` varchar(255) DEFAULT NULL,
  `estadoNascimento` varchar(2) DEFAULT NULL,
  `tipoLogradouro` varchar(50) DEFAULT NULL,
  `nomeLogradouro` varchar(255) DEFAULT NULL,
  `numeroEndereco` varchar(20) DEFAULT NULL,
  `complementoEndereco` varchar(255) DEFAULT NULL,
  `cidadeEndereco` varchar(255) DEFAULT NULL,
  `estadoEndereco` varchar(2) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `fotoUrl` text,
  `sexo` enum('masculino','feminino','outro') DEFAULT NULL,
  `setor` varchar(255) DEFAULT NULL,
  `cargoId` int DEFAULT NULL,
  `setorId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=167 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: colaboradores
LOCK TABLES `colaboradores` WRITE;
INSERT INTO `colaboradores` (`id`, `nomeCompleto`, `funcao`, `empresaId`, `obraId`, `dataAdmissao`, `validadeAso`, `status`, `createdAt`, `updatedAt`, `dataPrimeiroAso`, `rg`, `cpf`, `pis`, `telefonePrincipal`, `telefoneRecado`, `nomePessoaRecado`, `grauParentesco`, `observacoes`, `dataNascimento`, `cidadeNascimento`, `estadoNascimento`, `tipoLogradouro`, `nomeLogradouro`, `numeroEndereco`, `complementoEndereco`, `cidadeEndereco`, `estadoEndereco`, `cep`, `fotoUrl`, `sexo`, `setor`, `cargoId`, `setorId`) VALUES
(101, 'Daniel Dias', 'Engenheiro Civil', 1, NULL, Tue Feb 18 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu Mar 12 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed Mar 12 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '78105944', '540.686.003-84', '27268848213', '(51) 95996-23978', NULL, 'Kleber Teixeira', 'Filho', 'Colaborador 1 - Gerado automaticamente para testes', Mon Dec 21 1970 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Sousa', 'PB', 'Estrada', 'Estrada 507', '7885', 'Apto 128', 'Sena Madureira', 'AC', '99183-637', NULL, 'masculino', 'Qualidade', 11, 5),
(102, 'Diego Silva', 'Engenheiro Civil', 1, NULL, Mon Oct 20 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu Nov 05 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed Nov 05 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '85592440', '932.195.367-19', '29069261553', '(61) 95665-64939', NULL, 'Paulo Silva', 'Filha', 'Colaborador 2 - Gerado automaticamente para testes', Thu Apr 27 1989 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Ariquemes', 'RO', 'Estrada', 'Estrada 731', '1052', NULL, 'Cariacica', 'ES', '53307-438', NULL, 'masculino', 'Logística', 53, 21),
(103, 'João Lopes', 'Encanador', 1, NULL, Sat Aug 03 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Tue Aug 05 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Mon Aug 05 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '56305962', '175.941.998-20', '60117668250', '(78) 99519-21249', NULL, 'Carlos Dias', 'Irmã', 'Colaborador 3 - Gerado automaticamente para testes', Fri Nov 14 1975 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Cachoeiro de Itapemirim', 'ES', 'Caminho', 'Caminho 559', '5847', NULL, 'Santana', 'AP', '66833-772', NULL, 'masculino', 'Financeiro', 9, 4),
(104, 'Bruno Tavares', 'Pedreiro', 1, NULL, Mon Oct 07 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Mon Oct 20 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sun Oct 20 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '51354921', '806.385.492-64', '44184036722', '(30) 93560-99264', NULL, 'Felipe Gomes', 'Filha', 'Colaborador 4 - Gerado automaticamente para testes', Sun May 22 1983 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Nossa Senhora do Socorro', 'SE', 'Alameda', 'Alameda 525', '6900', NULL, 'Parnamirim', 'RN', '40406-148', NULL, 'masculino', 'Segurança', 41, 16),
(105, 'Gilsa Pereira', 'Técnico de Segurança do Trabalho', 1, NULL, Wed Jan 08 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sat Jan 24 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Fri Jan 24 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '78355544', '426.829.973-41', '72850468601', '(32) 97946-48674', NULL, 'Lucas Tavares', 'Mãe', 'Colaborador 5 - Gerado automaticamente para testes', Wed Jun 11 1980 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Blumenau', 'SC', 'Praça', 'Praça 677', '2489', NULL, 'Caucaia', 'CE', '16867-264', NULL, 'feminino', 'Produção', 24, 15),
(106, 'Kleber Carvalho', 'Eletricista', 1, NULL, Sun Apr 06 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sat Apr 25 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Fri Apr 25 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '49030792', '631.629.236-89', '42392524495', '(18) 99861-20890', '(86) 94409-07695', 'Thiago Campos', 'Irmã', 'Colaborador 6 - Gerado automaticamente para testes', Sat May 21 1994 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Três Lagoas', 'MS', 'Travessa', 'Travessa 39', '6161', 'Apto 400', 'Rorainópolis', 'RR', '75706-745', NULL, 'masculino', 'Qualidade', 16, 7),
(107, 'Diego Martins', 'Gerente de Projeto', 1, NULL, Tue Oct 08 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Wed Oct 22 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Tue Oct 22 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '54188437', '202.987.404-35', '52191675116', '(52) 98139-37361', '(20) 96244-28326', 'Thiago Rocha', 'Pai', 'Colaborador 7 - Gerado automaticamente para testes', Fri Jan 23 1987 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Barreiras', 'BA', 'Estrada', 'Estrada 841', '866', NULL, 'Cabo de Santo Agostinho', 'PE', '32153-016', NULL, 'masculino', 'Recursos Humanos', 42, 16),
(108, 'Helena Campos', 'Pintor Interno', 1, NULL, Tue May 28 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sun Jun 08 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sat Jun 08 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '57319682', '151.852.713-29', '49447452390', '(56) 94701-58873', NULL, 'Sergio Gomes', 'Filha', 'Colaborador 8 - Gerado automaticamente para testes', Sun Sep 22 1985 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Betim', 'MG', 'Travessa', 'Travessa 70', '5955', NULL, 'Rio Largo', 'AL', '26224-693', NULL, 'feminino', 'Logística', 24, 10),
(109, 'Daniel Carvalho', 'Pintor Interno', 1, NULL, Tue Mar 04 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Tue Mar 17 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Mon Mar 17 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '91504020', '170.667.598-42', '68546975967', '(48) 93986-59306', NULL, 'André Teixeira', 'Filha', 'Colaborador 9 - Gerado automaticamente para testes', Wed Jul 23 1986 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Paragominas', 'PA', 'Caminho', 'Caminho 50', '6262', NULL, 'Cuiabá', 'MT', '32665-716', NULL, 'masculino', 'Qualidade', 29, 12),
(110, 'Rodrigo Oliveira', 'Eletricista', 1, NULL, Thu Aug 22 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Mon Sep 01 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sun Sep 01 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '92464144', '879.514.281-91', '87718161306', '(27) 92862-84909', NULL, 'Jair Teixeira', 'Filha', 'Colaborador 10 - Gerado automaticamente para testes', Thu Dec 08 2005 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Taguatinga', 'DF', 'Estrada', 'Estrada 745', '4488', NULL, 'Itapipoca', 'CE', '26336-465', NULL, 'masculino', 'Recursos Humanos', 37, 14),
(111, 'Paulo Rocha', 'Encanador', 1, NULL, Wed Feb 26 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sun Mar 22 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sat Mar 22 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '47240820', '283.197.465-82', '90905429422', '(41) 98954-59568', NULL, 'Cesar Barbosa', 'Irmão', 'Colaborador 11 - Gerado automaticamente para testes', Thu Aug 06 1992 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Aparecida de Goiânia', 'GO', 'Estrada', 'Estrada 339', '3351', NULL, 'Santa Rita', 'PB', '29933-422', NULL, 'masculino', 'Logística', 48, 19),
(112, 'Roberto Ferreira', 'Técnico de Segurança do Trabalho', 1, NULL, Wed Oct 23 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri Nov 21 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Thu Nov 21 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '17524667', '779.922.159-31', '72801767552', '(54) 94559-01274', NULL, 'Fabio Mota', 'Mãe', 'Colaborador 12 - Gerado automaticamente para testes', Sat Nov 28 1998 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Montes Claros', 'MG', 'Travessa', 'Travessa 840', '1725', NULL, 'Laranjal do Jari', 'AP', '38312-933', NULL, 'masculino', 'Logística', 6, 3),
(113, 'Rodrigo Pinto', 'Assistente Administrativo', 1, NULL, Fri Jul 11 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sun Aug 02 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sat Aug 02 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '38008761', '029.203.327-32', '83983972365', '(56) 96443-51460', NULL, 'André Gomes', 'Filho', 'Colaborador 13 - Gerado automaticamente para testes', Wed Nov 25 1981 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Corumbá', 'MS', 'Rua', 'Rua 831', '6533', NULL, 'Campina Grande', 'PB', '33136-650', NULL, 'masculino', 'Logística', 42, 16),
(114, 'Edson Teixeira', 'Carpinteiro', 1, NULL, Thu Jul 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu Jul 23 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed Jul 23 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '63227158', '518.555.779-68', '80218633139', '(69) 96468-66628', NULL, 'Fernando Oliveira', 'Irmão', 'Colaborador 14 - Gerado automaticamente para testes', Tue Nov 09 1971 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Macaíba', 'RN', 'Alameda', 'Alameda 470', '9264', NULL, 'Dourados', 'MS', '40008-250', NULL, 'masculino', 'Segurança', 36, 14),
(115, 'Carla Tavares', 'Soldador', 1, NULL, Thu Jun 12 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Mon Jun 15 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sun Jun 15 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '27573796', '421.450.862-93', '03384350733', '(90) 99997-64249', NULL, 'Sergio Mota', 'Cônjuge', 'Colaborador 15 - Gerado automaticamente para testes', Fri Dec 02 2005 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Cachoeiro de Itapemirim', 'ES', 'Estrada', 'Estrada 595', '7692', NULL, 'Ponta Grossa', 'PR', '77447-202', NULL, 'feminino', 'Financeiro', 26, 11),
(116, 'João Dias', 'Assistente Administrativo', 1, NULL, Mon Mar 11 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Wed Apr 02 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Tue Apr 02 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '47795865', '453.324.995-74', '46181119437', '(79) 95508-10652', '(60) 94544-76039', 'Leandro Correia', 'Mãe', 'Colaborador 16 - Gerado automaticamente para testes', Wed Jul 22 1970 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Samambaia', 'DF', 'Rua', 'Rua 855', '2306', NULL, 'Sena Madureira', 'AC', '71421-366', NULL, 'masculino', 'Segurança', 20, 8),
(117, 'Maria Campos', 'Operador de Máquina', 1, NULL, Mon Jul 21 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu Aug 06 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed Aug 06 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '33056323', '491.928.299-02', '20112649739', '(20) 92745-87389', '(71) 99712-57406', 'Julio Barbosa', 'Irmã', 'Colaborador 17 - Gerado automaticamente para testes', Sat Nov 12 2005 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Macaíba', 'RN', 'Rua', 'Rua 617', '5116', 'Apto 90', 'Brasília', 'DF', '32932-896', NULL, 'feminino', 'Financeiro', 5, 3),
(118, 'Claudio Machado', 'Soldador', 1, NULL, Thu Apr 25 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu May 01 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed May 01 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '75138945', '628.679.685-18', '41595678510', '(48) 98168-29709', '(30) 91916-51182', 'Lucas Campos', 'Pai', 'Colaborador 18 - Gerado automaticamente para testes', Fri Mar 01 1974 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Castanhal', 'PA', 'Avenida', 'Avenida 414', '3108', 'Apto 495', 'Sousa', 'PB', '57133-964', NULL, 'masculino', 'Administrativo', 49, 19),
(119, 'Claudia Correia', 'Encanador', 1, NULL, Fri May 09 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri Jun 05 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Thu Jun 05 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '90439129', '760.874.806-09', '05606622633', '(28) 93142-24979', '(77) 95483-64505', 'Claudio Martins', 'Irmão', 'Colaborador 19 - Gerado automaticamente para testes', Sat Jan 26 1991 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Caxias do Sul', 'RS', 'Travessa', 'Travessa 661', '8303', NULL, 'Rio Largo', 'AL', '57793-159', NULL, 'feminino', 'Produção', 33, 13),
(120, 'Jair Costa', 'Supervisor', 1, NULL, Mon Dec 09 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri Dec 26 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Thu Dec 26 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '84526857', '116.816.601-21', '92522214683', '(44) 91187-33530', NULL, 'Matheus Costa', 'Irmã', 'Colaborador 20 - Gerado automaticamente para testes', Sun Mar 16 1980 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Gravataí', 'RS', 'Alameda', 'Alameda 864', '9607', NULL, 'Picos', 'PI', '50287-955', NULL, 'masculino', 'Manutenção', 16, 7),
(121, 'Marta Alves', 'Encanador', 1, NULL, Mon Jul 21 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri Aug 14 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Thu Aug 14 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '97875715', '226.345.248-62', '74234569119', '(92) 99592-49831', NULL, 'Fabio Mendes', 'Filha', 'Colaborador 21 - Gerado automaticamente para testes', Sat Apr 13 1974 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Uberaba', 'MG', 'Alameda', 'Alameda 425', '8547', NULL, 'Petrolina', 'PE', '97887-233', NULL, 'feminino', 'Financeiro', 15, 6),
(122, 'Gustavo Teixeira', 'Carpinteiro', 1, NULL, Tue Sep 24 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu Oct 02 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed Oct 02 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '92438477', '245.697.342-94', '88927993159', '(95) 92971-19251', NULL, 'Sergio Rocha', 'Pai', 'Colaborador 22 - Gerado automaticamente para testes', Mon Sep 16 1985 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Cruzeiro do Sul', 'AC', 'Rua', 'Rua 502', '1136', NULL, 'Cacoal', 'RO', '43539-863', NULL, 'masculino', 'Logística', 4, 2),
(123, 'João Alves', 'Eletricista', 1, NULL, Mon Feb 10 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sat Feb 28 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Fri Feb 28 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '85239030', '056.890.618-75', '29179818544', '(72) 98434-40482', '(94) 96634-29305', 'Thiago Machado', 'Irmão', 'Colaborador 23 - Gerado automaticamente para testes', Fri Jan 16 1970 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Ponta Grossa', 'PR', 'Estrada', 'Estrada 77', '2789', 'Apto 30', 'São José', 'SC', '92457-355', NULL, 'masculino', 'Produção', 34, 13),
(124, 'Heitor Tavares', 'Soldador', 1, NULL, Sat Sep 27 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Mon Oct 19 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sun Oct 19 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '82271147', '484.743.847-70', '18948134324', '(41) 95735-38031', '(54) 95205-70367', 'Leandro Correia', 'Pai', 'Colaborador 24 - Gerado automaticamente para testes', Tue Nov 24 1970 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Itajaí', 'SC', 'Praça', 'Praça 770', '3517', 'Apto 297', 'Gurupi', 'TO', '58839-699', NULL, 'masculino', 'Administrativo', 34, 13),
(125, 'Felicia Santos', 'Eletricista', 1, NULL, Fri Mar 01 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu Mar 13 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed Mar 13 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '33283467', '397.475.614-09', '93323405070', '(12) 95105-43178', '(35) 97161-87752', 'Ricardo Castro', 'Irmão', 'Colaborador 25 - Gerado automaticamente para testes', Wed Nov 12 1986 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Vilhena', 'RO', 'Estrada', 'Estrada 745', '9126', NULL, 'Araguaína', 'TO', '73968-157', NULL, 'feminino', 'Financeiro', 49, 19),
(126, 'Thaisa Tavares', 'Assistente Administrativo', 1, NULL, Sat Oct 04 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Tue Oct 27 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Mon Oct 27 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '49478265', '022.230.242-97', '33124482127', '(21) 93092-77115', '(88) 93533-82196', 'Paulo Oliveira', 'Mãe', 'Colaborador 26 - Gerado automaticamente para testes', Sat Aug 11 1990 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Paço do Lumiar', 'MA', 'Praça', 'Praça 903', '1193', NULL, 'Uberaba', 'MG', '31375-533', NULL, 'feminino', 'Administrativo', 27, 11),
(127, 'Gustavo Machado', 'Encanador', 1, NULL, Sun Mar 03 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Mon Mar 17 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sun Mar 17 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '41651371', '536.169.309-01', '76851043763', '(14) 91593-22453', '(50) 98312-05314', 'Daniel Vieira', 'Pai', 'Colaborador 27 - Gerado automaticamente para testes', Mon Sep 18 1989 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Mazagão', 'AP', 'Travessa', 'Travessa 487', '5912', NULL, 'Feijó', 'AC', '37131-144', NULL, 'masculino', 'Qualidade', 36, 14),
(128, 'Marcos Campos', 'Técnico de Segurança do Trabalho', 1, NULL, Tue Apr 08 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Tue Apr 14 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:07 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Mon Apr 14 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '53712235', '330.913.760-01', '06677055349', '(37) 93930-96206', '(14) 99320-04292', 'Rodrigo Teixeira', 'Filha', 'Colaborador 28 - Gerado automaticamente para testes', Wed Feb 22 1978 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Cascavel', 'PR', 'Caminho', 'Caminho 55', '855', NULL, 'Lagarto', 'SE', '75609-917', NULL, 'masculino', 'Administrativo', 3, 2),
(129, 'André Moreira', 'Engenheiro Civil', 1, NULL, Tue Oct 21 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sun Nov 08 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sat Nov 08 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '49008486', '305.925.464-89', '52466549884', '(23) 95473-34679', NULL, 'Bruno Pereira', 'Filho', 'Colaborador 29 - Gerado automaticamente para testes', Sat Jan 01 1994 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Vila Velha', 'ES', 'Rua', 'Rua 623', '9724', NULL, 'Cachoeiro de Itapemirim', 'ES', '28256-855', NULL, 'masculino', 'Recursos Humanos', 44, 17),
(130, 'Bruno Correia', 'Gerente de Projeto', 1, NULL, Sat May 25 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Tue Jun 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Mon Jun 03 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '90109048', '162.523.202-00', '20939033377', '(38) 96200-73507', NULL, 'Thiago Alves', 'Mãe', 'Colaborador 30 - Gerado automaticamente para testes', Sat Aug 05 2006 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Criciúma', 'SC', 'Rua', 'Rua 708', '3208', 'Apto 347', 'Porto Nacional', 'TO', '72554-499', NULL, 'masculino', 'Administrativo', 34, 13),
(131, 'Daniel Campos', 'Técnico de Segurança do Trabalho', 1, NULL, Fri Apr 12 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Mon Apr 14 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sun Apr 14 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '49592959', '089.003.223-89', '73997787894', '(63) 96614-07827', '(34) 98667-60413', 'Paulo Costa', 'Cônjuge', 'Colaborador 31 - Gerado automaticamente para testes', Sat Apr 20 1974 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Campinas', 'SP', 'Rua', 'Rua 453', '1832', NULL, 'Ilhéus', 'BA', '26988-843', NULL, 'masculino', 'Financeiro', 7, 3),
(132, 'Cesar Alves', 'Pedreiro', 1, NULL, Tue Jan 16 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Tue Jan 21 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sun Jan 21 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '62941716', '463.534.941-14', '47273975834', '(83) 98058-11932', '(39) 97016-23349', 'Fabio Ribeiro', 'Irmão', 'Colaborador 32 - Gerado automaticamente para testes', Thu Oct 14 2004 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Cascavel', 'PR', 'Estrada', 'Estrada 912', '1327', NULL, 'Recife', 'PE', '20721-127', NULL, 'masculino', 'Qualidade', 43, 17),
(133, 'Rodriga Correia', 'Assistente Administrativo', 1, NULL, Sun Feb 04 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri Feb 28 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed Feb 28 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '42390727', '751.323.814-64', '03929766150', '(72) 92899-97387', NULL, 'Roberto Vieira', 'Pai', 'Colaborador 33 - Gerado automaticamente para testes', Mon Dec 09 1991 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Caxias', 'MA', 'Caminho', 'Caminho 641', '1102', NULL, 'Arapiraca', 'AL', '64639-889', NULL, 'feminino', 'Logística', 11, 5),
(134, 'Marta Pereira', 'Técnico de Segurança do Trabalho', 1, NULL, Thu Dec 26 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri Jan 02 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Thu Jan 02 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '54296664', '452.090.285-18', '16271345752', '(43) 93103-45728', NULL, 'Rodrigo Soares', 'Filho', 'Colaborador 34 - Gerado automaticamente para testes', Tue Mar 10 1987 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Salvador', 'BA', 'Estrada', 'Estrada 592', '1845', NULL, 'Rio Largo', 'AL', '25629-235', NULL, 'feminino', 'Qualidade', 24, 10),
(135, 'Gilson Costa', 'Engenheiro Civil', 1, NULL, Sun Oct 27 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri Nov 21 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Thu Nov 21 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '26205876', '624.435.715-99', '48216738487', '(25) 95179-38722', NULL, 'Ricardo Mendes', 'Pai', 'Colaborador 35 - Gerado automaticamente para testes', Sun Feb 25 2007 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Petrópolis', 'RJ', 'Praça', 'Praça 517', '4867', 'Apto 502', 'Caruaru', 'PE', '43875-012', NULL, 'masculino', 'Logística', 36, 14),
(136, 'Fabio Mendes', 'Eletricista', 1, NULL, Mon Nov 27 2023 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu Dec 26 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Tue Dec 26 2023 00:00:00 GMT-0300 (Horário Padrão de Brasília), '39144567', '122.841.959-03', '24711338814', '(33) 96449-05196', NULL, 'Fabio Machado', 'Mãe', 'Colaborador 36 - Gerado automaticamente para testes', Wed Jul 15 1970 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Ilhéus', 'BA', 'Alameda', 'Alameda 636', '4520', NULL, 'Vilhena', 'RO', '38447-535', NULL, 'masculino', 'Administrativo', 47, 19),
(137, 'Jaqueline Silva', 'Soldador', 1, NULL, Thu Oct 30 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri Oct 30 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Thu Oct 30 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '22226883', '159.143.101-80', '39255720888', '(25) 91534-12535', '(61) 93553-57034', 'Gilson Pinto', 'Filho', 'Colaborador 37 - Gerado automaticamente para testes', Thu Sep 08 1983 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Criciúma', 'SC', 'Avenida', 'Avenida 955', '1002', 'Apto 581', 'São Paulo', 'SP', '81786-772', NULL, 'feminino', 'Qualidade', 12, 15),
(138, 'Leandra Campos', 'Carpinteiro', 1, NULL, Tue Apr 08 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri May 01 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Thu May 01 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '45972590', '446.951.580-94', '35420491905', '(54) 98858-28710', '(82) 91579-44949', 'Claudio Soares', 'Cônjuge', 'Colaborador 38 - Gerado automaticamente para testes', Sun May 11 2003 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Maceió', 'AL', 'Praça', 'Praça 836', '1778', 'Apto 91', 'Parintins', 'AM', '85229-613', NULL, 'feminino', 'Logística', 6, 3),
(139, 'Jaqueline Pinto', 'Eletricista', 1, NULL, Sun May 18 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Tue Jun 02 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Mon Jun 02 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '28486312', '858.359.887-88', '85102570808', '(85) 97035-34321', '(19) 99287-79211', 'Ricardo Ferreira', 'Filha', 'Colaborador 39 - Gerado automaticamente para testes', Thu Sep 21 1989 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Porto Nacional', 'TO', 'Avenida', 'Avenida 938', '9853', 'Apto 355', 'Goiânia', 'GO', '91038-618', NULL, 'feminino', 'Segurança', 19, 8),
(140, 'Roberta Santos', 'Soldador', 1, NULL, Sun Jan 12 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri Jan 16 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Thu Jan 16 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '16456346', '895.204.331-63', '60915472329', '(46) 99413-24809', '(34) 99809-64065', 'Ricardo Costa', 'Mãe', 'Colaborador 40 - Gerado automaticamente para testes', Mon Jul 04 1983 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Lagarto', 'SE', 'Avenida', 'Avenida 68', '6084', NULL, 'Criciúma', 'SC', '20020-354', NULL, 'feminino', 'Produção', 34, 13),
(141, 'Gilson Neves', 'Pedreiro', 1, NULL, Fri Dec 06 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri Dec 26 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Thu Dec 26 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '80570904', '404.879.174-56', '70576238610', '(36) 91734-51845', NULL, 'Gilson Correia', 'Filha', 'Colaborador 41 - Gerado automaticamente para testes', Sun Oct 16 2005 01:00:00 GMT-0200 (Horário de Verão de Brasília), 'Macaíba', 'RN', 'Rua', 'Rua 593', '1692', 'Apto 781', 'Duque de Caxias', 'RJ', '59442-229', NULL, 'masculino', 'Logística', 5, 3),
(142, 'Gustavo Ribeiro', 'Pintor Interno', 1, NULL, Wed May 29 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Tue Jun 24 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Mon Jun 24 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '20902920', '857.787.180-04', '48888799041', '(97) 96547-96748', NULL, 'André Santos', 'Cônjuge', 'Colaborador 42 - Gerado automaticamente para testes', Sun Apr 13 1997 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Vitória', 'ES', 'Estrada', 'Estrada 673', '4038', NULL, 'Novo Hamburgo', 'RS', '18605-974', NULL, 'masculino', 'Manutenção', 19, 8),
(143, 'Jaqueline Oliveira', 'Aprendiz', 1, NULL, Mon Feb 19 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu Feb 20 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Tue Feb 20 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '54053500', '873.448.110-90', '34693078167', '(16) 97972-37934', NULL, 'Fabio Oliveira', 'Filho', 'Colaborador 43 - Gerado automaticamente para testes', Tue Feb 27 2007 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Arapiraca', 'AL', 'Caminho', 'Caminho 263', '8093', NULL, 'Tangará da Serra', 'MT', '42309-105', NULL, 'feminino', 'Financeiro', 42, 16),
(144, 'Claudio Pinto', 'Aprendiz', 1, NULL, Thu Jun 26 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Wed Jul 08 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Tue Jul 08 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '86643213', '505.123.601-46', '17265720561', '(99) 91043-01677', NULL, 'Ricardo Soares', 'Mãe', 'Colaborador 44 - Gerado automaticamente para testes', Mon Dec 07 2009 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Taguatinga', 'DF', 'Alameda', 'Alameda 650', '1924', NULL, 'Mossoró', 'RN', '50837-073', NULL, 'masculino', 'Qualidade', 10, 4),
(145, 'Daniel Pinto', 'Aprendiz', 1, NULL, Thu Mar 27 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sun Apr 05 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sat Apr 05 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '03317534', '346.952.251-07', '84383722307', '(42) 94903-31371', NULL, 'André Monteiro', 'Filha', 'Colaborador 45 - Gerado automaticamente para testes', Mon Jul 27 2009 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Porto Alegre', 'RS', 'Alameda', 'Alameda 485', '7532', NULL, 'Barreiras', 'BA', '23072-186', NULL, 'masculino', 'Produção', 17, 15),
(146, 'Heitor Souza', 'Aprendiz', 1, NULL, Tue Oct 14 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sat Nov 07 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Fri Nov 07 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '33487852', '332.255.393-09', '94415236922', '(89) 97142-55030', '(94) 93942-24922', 'Paulo Neves', 'Irmã', 'Colaborador 46 - Gerado automaticamente para testes', Tue Feb 13 2007 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Curitiba', 'PR', 'Alameda', 'Alameda 163', '488', NULL, 'Corumbá', 'MS', '63060-770', NULL, 'masculino', 'Produção', 45, 18),
(147, 'Ricardo Neves', 'Aprendiz', 1, NULL, Wed Nov 29 2023 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri Dec 13 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed Dec 13 2023 00:00:00 GMT-0300 (Horário Padrão de Brasília), '45202577', '755.373.268-09', '88712786345', '(59) 92142-41369', '(32) 99537-50072', 'Matheus Dias', 'Filho', 'Colaborador 47 - Gerado automaticamente para testes', Wed Nov 11 2009 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Dourados', 'MS', 'Rua', 'Rua 570', '1179', NULL, 'Lagarto', 'SE', '17578-592', NULL, 'masculino', 'Administrativo', 37, 14),
(148, 'Iris Neves', 'Aprendiz', 1, NULL, Mon Dec 02 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sun Dec 07 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sat Dec 07 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '43412704', '632.407.361-01', '54856034524', '(12) 93414-01980', '(61) 99464-11899', 'Igor Tavares', 'Mãe', 'Colaborador 48 - Gerado automaticamente para testes', Tue Jan 23 2007 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Porto Nacional', 'TO', 'Alameda', 'Alameda 595', '9572', NULL, 'Feijó', 'AC', '81041-189', NULL, 'feminino', 'Segurança', 28, 12),
(149, 'Jair Gomes', 'Aprendiz', 1, NULL, Fri Sep 06 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Mon Sep 29 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sun Sep 29 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '93055403', '827.031.812-48', '49737878366', '(34) 92547-41158', NULL, 'Fernando Ferreira', 'Filho', 'Colaborador 49 - Gerado automaticamente para testes', Fri Oct 09 2009 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Sinop', 'MT', 'Rua', 'Rua 989', '3635', 'Apto 442', 'Rio Verde', 'GO', '36041-167', NULL, 'masculino', 'Produção', 45, 18),
(150, 'Diego Silva', 'Aprendiz', 1, NULL, Sun Jul 13 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sat Jul 25 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:06:08 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Fri Jul 25 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '89923641', '814.911.601-01', '37074140638', '(92) 98300-30375', NULL, 'Carlos Castro', 'Filha', 'Colaborador 50 - Gerado automaticamente para testes', Sun Jul 01 2007 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Águas Lindas', 'GO', 'Praça', 'Praça 469', '455', NULL, 'Novo Hamburgo', 'RS', '44360-403', NULL, 'masculino', 'Manutenção', 16, 7),
(151, 'Gilson Lopes', 'Gerente de Projeto', 1, NULL, Tue Nov 03 2020 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sun Feb 14 2021 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'inativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sat Nov 14 2020 00:00:00 GMT-0300 (Horário Padrão de Brasília), '33662312', '288.084.796-68', '58220125165', '(57) 93124-23505', NULL, 'Thiago Santos', 'Cônjuge', 'Colaborador inativo 1 - Gerado automaticamente', Tue Oct 05 1982 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'São Bernardo do Campo', 'SP', 'Travessa', 'Travessa 122', '3675', 'Apto 205', 'Cruzeiro do Sul', 'AC', '24611-039', NULL, 'masculino', 'Financeiro', 20, 8),
(152, 'Bruno Soares', 'Pintor Interno', 1, NULL, Fri Nov 03 2017 00:00:00 GMT-0200 (Horário de Verão de Brasília), Sat Aug 19 2017 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'inativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sun Nov 19 2017 00:00:00 GMT-0200 (Horário de Verão de Brasília), '28681378', '243.863.413-82', '18486395726', '(95) 94054-70577', '(90) 91829-11829', 'Paulo Gomes', 'Irmão', 'Colaborador inativo 2 - Gerado automaticamente', Mon Feb 15 1999 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Itabaiana', 'SE', 'Alameda', 'Alameda 599', '8187', NULL, 'Criciúma', 'SC', '67235-508', NULL, 'masculino', 'Logística', 42, 16),
(153, 'Diego Castro', 'Engenheiro Civil', 1, NULL, Fri Nov 02 2007 00:00:00 GMT-0200 (Horário de Verão de Brasília), Tue Oct 11 2016 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'inativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 23:11:03 GMT-0300 (Horário Padrão de Brasília), Fri Nov 11 2016 00:00:00 GMT-0200 (Horário de Verão de Brasília), '53054964', '425.449.551-04', '24211818639', '(42) 91936-62936', '(66) 94802-14612', 'Edson Dias', 'Pai', 'Colaborador inativo 3 - Gerado automaticamente', Sun Sep 25 1994 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Gravataí', 'RS', 'Avenida', 'Avenida 950', '9393', '', 'Oiapoque', 'AP', '62919-117', '', 'masculino', 'Produção', 17, 7),
(154, 'Fabio Silva', 'Eletricista', 1, NULL, Thu Nov 03 2016 00:00:00 GMT-0200 (Horário de Verão de Brasília), Thu Mar 16 2017 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'inativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed Nov 16 2016 00:00:00 GMT-0200 (Horário de Verão de Brasília), '84134608', '653.810.819-95', '06353108200', '(34) 97278-67765', NULL, 'Claudio Barbosa', 'Filha', 'Colaborador inativo 4 - Gerado automaticamente', Sun Jun 18 1967 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Chapecó', 'SC', 'Avenida', 'Avenida 217', '3152', NULL, 'Curitiba', 'PR', '36588-712', NULL, 'masculino', 'Qualidade', 53, 21),
(155, 'Diego Ferreira', 'Encanador', 1, NULL, Sun Nov 03 2019 00:00:00 GMT-0300 (Horário Padrão de Brasília), Sat Dec 21 2019 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'inativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Thu Nov 21 2019 00:00:00 GMT-0300 (Horário Padrão de Brasília), '63231572', '286.209.580-03', '91590422298', '(43) 95749-48564', '(77) 94581-35551', 'Julio Martins', 'Filho', 'Colaborador inativo 5 - Gerado automaticamente', Mon Aug 12 1974 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Sousa', 'PB', 'Avenida', 'Avenida 154', '3578', 'Apto 884', 'Macaíba', 'RN', '66556-287', NULL, 'masculino', 'Logística', 44, 17),
(156, 'Leandro Moreira', 'Gerente de Projeto', 1, NULL, Wed Nov 03 2021 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu Jan 06 2022 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'inativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sat Nov 06 2021 00:00:00 GMT-0300 (Horário Padrão de Brasília), '79648406', '249.474.567-52', '35629794122', '(88) 97760-04789', '(25) 99516-04801', 'João Campos', 'Filho', 'Colaborador inativo 6 - Gerado automaticamente', Sun Nov 22 1970 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Boa Vista', 'RR', 'Avenida', 'Avenida 88', '8383', NULL, 'Penedo', 'AL', '37613-557', NULL, 'masculino', 'Segurança', 55, 21),
(157, 'Igor Monteiro', 'Operador de Máquina', 1, NULL, Wed Nov 03 2021 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu Feb 10 2022 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'inativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed Nov 10 2021 00:00:00 GMT-0300 (Horário Padrão de Brasília), '03833875', '154.268.226-62', '55301136871', '(13) 99548-74383', '(34) 96739-46520', 'Julio Ferreira', 'Cônjuge', 'Colaborador inativo 7 - Gerado automaticamente', Mon Oct 13 1997 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Uberaba', 'MG', 'Praça', 'Praça 765', '1533', NULL, 'Cacoal', 'RO', '27165-501', NULL, 'masculino', 'Logística', 26, 11),
(158, 'Rodrigo Costa', 'Assistente Administrativo', 1, NULL, Thu Nov 03 2016 00:00:00 GMT-0200 (Horário de Verão de Brasília), Wed Jun 15 2016 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'inativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Tue Nov 15 2016 00:00:00 GMT-0200 (Horário de Verão de Brasília), '77668293', '223.820.993-05', '12982405980', '(84) 99251-39121', '(14) 92132-12064', 'Diego Neves', 'Irmã', 'Colaborador inativo 8 - Gerado automaticamente', Wed Sep 03 1969 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Caxias do Sul', 'RS', 'Alameda', 'Alameda 350', '8307', 'Apto 737', 'Sena Madureira', 'AC', '27659-915', NULL, 'masculino', 'Financeiro', 46, 18),
(159, 'Iris Lopes', 'Pedreiro', 1, NULL, Wed Nov 03 2021 00:00:00 GMT-0300 (Horário Padrão de Brasília), Fri Oct 15 2021 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'inativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Mon Nov 15 2021 00:00:00 GMT-0300 (Horário Padrão de Brasília), '29384522', '686.925.964-00', '41315709453', '(99) 93860-62010', '(79) 95687-92261', 'Leandro Martins', 'Irmão', 'Colaborador inativo 9 - Gerado automaticamente', Tue Feb 04 1975 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Foz do Iguaçu', 'PR', 'Rua', 'Rua 139', '7157', NULL, 'Porto Nacional', 'TO', '65158-344', NULL, 'feminino', 'Recursos Humanos', 16, 7),
(160, 'André Rocha', 'Eletricista', 1, NULL, Fri Nov 03 2017 00:00:00 GMT-0200 (Horário de Verão de Brasília), Thu Aug 10 2017 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'inativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Fri Nov 10 2017 00:00:00 GMT-0200 (Horário de Verão de Brasília), '59239153', '097.088.926-70', '72209580493', '(17) 92741-64581', '(27) 93257-86492', 'Paulo Carvalho', 'Filha', 'Colaborador inativo 10 - Gerado automaticamente', Sat Jun 06 1992 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Ponta Porã', 'MS', 'Estrada', 'Estrada 822', '5934', NULL, 'Olinda', 'PE', '70480-578', NULL, 'masculino', 'Manutenção', 7, 3),
(161, 'Fernando Barbosa', 'Eletricista', 1, NULL, Wed Nov 03 2021 00:00:00 GMT-0300 (Horário Padrão de Brasília), Wed Oct 13 2021 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'inativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sat Nov 13 2021 00:00:00 GMT-0300 (Horário Padrão de Brasília), '85880682', '888.689.517-89', '13617668339', '(39) 99242-81782', '(60) 91963-05477', 'Marcos Lopes', 'Mãe', 'Colaborador inativo 11 - Gerado automaticamente', Fri May 15 1998 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Vilhena', 'RO', 'Alameda', 'Alameda 438', '5211', 'Apto 162', 'Dourados', 'MS', '73332-516', NULL, 'masculino', 'Qualidade', 54, 21),
(162, 'Fernanda Soares', 'Pintor Interno', 1, NULL, Thu Nov 03 2022 00:00:00 GMT-0300 (Horário Padrão de Brasília), Mon Apr 03 2023 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'inativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Thu Nov 03 2022 00:00:00 GMT-0300 (Horário Padrão de Brasília), '97736305', '252.537.255-71', '71893914877', '(37) 96253-62292', '(21) 98590-37270', 'Leandro Mendes', 'Filha', 'Colaborador inativo 12 - Gerado automaticamente', Fri Apr 01 1994 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Caruaru', 'PE', 'Estrada', 'Estrada 791', '1589', NULL, 'Feijó', 'AC', '68996-010', NULL, 'feminino', 'Recursos Humanos', 17, 7),
(163, 'Marcia Ribeiro', 'Aprendiz', 1, NULL, Fri Jan 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu Jan 15 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed Jan 15 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '55623299', '951.911.226-07', '87183550396', '(55) 97029-85865', '(30) 98291-36557', 'Edson Costa', 'Filha', 'Aprendiz 13 - Gerado automaticamente', Thu Nov 27 2008 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Sinop', 'MT', 'Alameda', 'Alameda 377', '7494', 'Apto 4', 'Joinville', 'SC', '73817-747', NULL, 'feminino', 'Financeiro', 55, 21),
(164, 'Sergio Costa', 'Aprendiz', 1, NULL, Sat May 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), Wed May 20 2026 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Tue May 20 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), '33389375', '873.908.113-31', '78968492670', '(27) 96140-88774', NULL, 'Matheus Campos', 'Filha', 'Aprendiz 14 - Gerado automaticamente', Sat Nov 10 2007 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'São Luís', 'MA', 'Alameda', 'Alameda 719', '8258', 'Apto 636', 'Cacoal', 'RO', '17901-932', NULL, 'masculino', 'Logística', 45, 18),
(165, 'Cesar Silva', 'Aprendiz', 1, NULL, Tue Sep 03 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Thu Sep 11 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Wed Sep 11 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '85497319', '302.705.104-00', '90705632747', '(43) 93302-49456', NULL, 'Paulo Campos', 'Pai', 'Aprendiz 15 - Gerado automaticamente', Wed Jul 25 2007 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'Anápolis', 'GO', 'Alameda', 'Alameda 338', '4632', NULL, 'Ananindeua', 'PA', '43765-047', NULL, 'masculino', 'Recursos Humanos', 40, 15),
(166, 'Roberto Alves', 'Aprendiz', 1, NULL, Sun Nov 03 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Mon Nov 10 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'ativo', Mon Nov 03 2025 19:10:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 20:13:36 GMT-0300 (Horário Padrão de Brasília), Sun Nov 10 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), '31259306', '320.563.129-30', '07363040002', '(84) 93278-60801', NULL, 'Fernando Souza', 'Irmã', 'Aprendiz 16 - Gerado automaticamente', Fri Feb 23 2007 00:00:00 GMT-0200 (Horário de Verão de Brasília), 'Duque de Caxias', 'RJ', 'Alameda', 'Alameda 362', '5746', NULL, 'Bayeux', 'PB', '13878-647', NULL, 'masculino', 'Recursos Humanos', 14, 6);

UNLOCK TABLES;

-- Estrutura da tabela: empresas
DROP TABLE IF EXISTS `empresas`;
CREATE TABLE `empresas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `razaoSocial` varchar(255) NOT NULL,
  `cnpj` varchar(18) NOT NULL,
  `responsavelTecnico` varchar(255) DEFAULT NULL,
  `emailContato` varchar(320) DEFAULT NULL,
  `status` enum('ativa','inativa') NOT NULL DEFAULT 'ativa',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `grauRisco` varchar(50) DEFAULT NULL,
  `cnae` varchar(20) DEFAULT NULL,
  `tipoLogradouro` varchar(50) DEFAULT NULL,
  `nomeLogradouro` varchar(255) DEFAULT NULL,
  `numeroEndereco` varchar(20) DEFAULT NULL,
  `complementoEndereco` varchar(255) DEFAULT NULL,
  `cidadeEndereco` varchar(255) DEFAULT NULL,
  `estadoEndereco` varchar(2) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `descricaoAtividade` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `empresas_cnpj_unique` (`cnpj`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: empresas
LOCK TABLES `empresas` WRITE;
INSERT INTO `empresas` (`id`, `razaoSocial`, `cnpj`, `responsavelTecnico`, `emailContato`, `status`, `createdAt`, `updatedAt`, `grauRisco`, `cnae`, `tipoLogradouro`, `nomeLogradouro`, `numeroEndereco`, `complementoEndereco`, `cidadeEndereco`, `estadoEndereco`, `cep`, `descricaoAtividade`) VALUES
(1, 'Construtora Horizonte Ltda', '37.285.947/8703-46', 'Eng. Carlos Eduardo Mendes - CREA SP 123456', 'contato@horizont.com.br', 'ativa', Mon Nov 03 2025 19:13:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:13:54 GMT-0300 (Horário Padrão de Brasília), '4', '4120400', 'Avenida', 'Avenida República', '4466', NULL, 'Osasco', 'SP', '47297-652', NULL),
(2, 'Engenharia e Construções São Paulo S.A.', '51.775.446/4487-74', 'Eng. Fernanda Silva Santos - CREA RJ 234567', 'contato@sãopaulo.com.br', 'ativa', Mon Nov 03 2025 19:13:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:13:54 GMT-0300 (Horário Padrão de Brasília), '4', '4211103', 'Rua', 'Rua Constituição', '7103', 'Sala 389', 'Campos dos Goytacazes', 'RJ', '37794-157', NULL),
(3, 'Construtora Nacional do Brasil Ltda', '43.776.272/3383-96', 'Eng. Roberto Oliveira Costa - CREA MG 345678', 'contato@.com.br', 'ativa', Mon Nov 03 2025 19:13:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:13:54 GMT-0300 (Horário Padrão de Brasília), '4', '4211104', 'Alameda', 'Alameda Paulista', '6001', 'Sala 343', 'Juiz de Fora', 'MG', '40686-408', NULL),
(4, 'Obras e Empreendimentos Sudeste Ltda', '50.724.126/8897-70', 'Eng. Ana Paula Rodrigues - CREA PR 456789', 'contato@obrasmprndimnto.com.br', 'ativa', Mon Nov 03 2025 19:13:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:13:54 GMT-0300 (Horário Padrão de Brasília), '4', '4220100', 'Alameda', 'Alameda Independência', '7632', 'Sala 439', 'Maringá', 'PR', '77456-901', NULL),
(5, 'Construtora Rio Grande Engenharia S.A.', '63.127.949/8996-41', 'Eng. João Pedro Alves - CREA RS 567890', 'contato@riogrand.com.br', 'ativa', Mon Nov 03 2025 19:13:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:13:54 GMT-0300 (Horário Padrão de Brasília), '4', '4120400', 'Rua', 'Rua Atlântica', '4183', NULL, 'Pelotas', 'RS', '54598-336', NULL),
(6, 'Construções e Infraestrutura Brasil Ltda', '40.165.530/0655-83', 'Eng. Mariana Campos Lima - CREA SC 678901', 'contato@infrastrutura.com.br', 'ativa', Mon Nov 03 2025 19:13:54 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:15:58 GMT-0300 (Horário Padrão de Brasília), '4', '4212000', 'Avenida', 'Avenida Copacabana', '7203', NULL, 'Chapecó', 'SC', '68760-218', NULL),
(7, 'Construtora Horizonte Ltda', '54.899.660/7156-05', 'Eng. Carlos Eduardo Mendes - CREA SP 123456', 'contato@horizont.com.br', 'ativa', Mon Nov 03 2025 19:14:30 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:14:30 GMT-0300 (Horário Padrão de Brasília), '4', '4120400', 'Avenida', 'Avenida dos Imigrantes', '2599', 'Sala 140', 'Campinas', 'SP', '23889-926', 'Construção de edifícios residenciais e comerciais, incorporação imobiliária, execução de projetos arquitetônicos e de engenharia. Especializada em empreendimentos de alto padrão e médio porte.'),
(8, 'Engenharia e Construções São Paulo S.A.', '27.407.040/5891-45', 'Eng. Fernanda Silva Santos - CREA RJ 234567', 'contato@sãopaulo.com.br', 'ativa', Mon Nov 03 2025 19:14:30 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:14:30 GMT-0300 (Horário Padrão de Brasília), '4', '4211103', 'Rua', 'Rua Ipanema', '5484', 'Sala 463', 'Campos dos Goytacazes', 'RJ', '13373-794', 'Construção de rodovias, ferrovias, pontes, viadutos e obras de arte especiais. Infraestrutura de transporte e logística. Execução de obras públicas e privadas de grande porte.'),
(9, 'Construtora Nacional do Brasil Ltda', '30.756.551/3691-44', 'Eng. Roberto Oliveira Costa - CREA MG 345678', 'contato@.com.br', 'ativa', Mon Nov 03 2025 19:14:30 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:14:30 GMT-0300 (Horário Padrão de Brasília), '4', '4211104', 'Estrada', 'Estrada dos Imigrantes', '4800', NULL, 'Juiz de Fora', 'MG', '98299-593', 'Construção de edifícios residenciais, comerciais e industriais. Incorporação e construção para terceiros. Desenvolvimento de projetos de engenharia civil e arquitetura.'),
(10, 'Obras e Empreendimentos Sudeste Ltda', '25.730.338/0377-16', 'Eng. Ana Paula Rodrigues - CREA PR 456789', 'contato@obrasmprndimnto.com.br', 'ativa', Mon Nov 03 2025 19:14:30 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:14:30 GMT-0300 (Horário Padrão de Brasília), '4', '4220100', 'Avenida', 'Avenida Tiradentes', '2012', 'Sala 294', 'Maringá', 'PR', '56030-423', 'Construção de obras de infraestrutura urbana, saneamento básico, drenagem, pavimentação e obras de terraplanagem. Especializada em infraestrutura para desenvolvimento urbano.'),
(11, 'Construtora Rio Grande Engenharia S.A.', '26.640.905/6958-51', 'Eng. João Pedro Alves - CREA RS 567890', 'contato@riogrand.com.br', 'ativa', Mon Nov 03 2025 19:14:30 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:14:30 GMT-0300 (Horário Padrão de Brasília), '4', '4120400', 'Alameda', 'Alameda Democracia', '139', 'Sala 230', 'Caxias do Sul', 'RS', '44494-836', 'Construção de edifícios residenciais de alto padrão, condomínios fechados, torres residenciais e comerciais. Incorporação imobiliária e gestão de empreendimentos.'),
(12, 'Construções e Infraestrutura Brasil Ltda', '65.452.272/7328-61', 'Eng. Mariana Campos Lima - CREA SC 678901', 'contato@infrastrutura.com.br', 'ativa', Mon Nov 03 2025 19:14:30 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:14:30 GMT-0300 (Horário Padrão de Brasília), '4', '4212000', 'Avenida', 'Avenida Brasil', '7661', NULL, 'Chapecó', 'SC', '56978-559', 'Construção de obras de urbanização, pavimentação asfáltica, calçamento, drenagem pluvial, iluminação pública e paisagismo. Obras de infraestrutura urbana e melhorias públicas.');

UNLOCK TABLES;

-- Estrutura da tabela: epis
DROP TABLE IF EXISTS `epis`;
CREATE TABLE `epis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomeEquipamento` varchar(255) NOT NULL,
  `colaboradorId` int NOT NULL,
  `empresaId` int NOT NULL,
  `dataEntrega` date DEFAULT NULL,
  `dataValidade` date DEFAULT NULL,
  `status` enum('em_uso','vencido','devolvido') NOT NULL DEFAULT 'em_uso',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `quantidade` int DEFAULT '1',
  `caNumero` varchar(50) DEFAULT NULL,
  `tipoEpiId` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: epis
LOCK TABLES `epis` WRITE;
INSERT INTO `epis` (`id`, `nomeEquipamento`, `colaboradorId`, `empresaId`, `dataEntrega`, `dataValidade`, `status`, `createdAt`, `updatedAt`, `quantidade`, `caNumero`, `tipoEpiId`) VALUES
(5, 'Capacete Rosa', 166, 1, Tue Dec 31 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'em_uso', Thu Nov 06 2025 17:33:00 GMT-0300 (Horário Padrão de Brasília), Thu Nov 06 2025 17:33:00 GMT-0300 (Horário Padrão de Brasília), 1, '545454', 2),
(6, 'Luva de Raspa', 166, 1, Tue Dec 31 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'em_uso', Thu Nov 06 2025 17:33:00 GMT-0300 (Horário Padrão de Brasília), Thu Nov 06 2025 17:33:00 GMT-0300 (Horário Padrão de Brasília), 1, '3026', 1),
(7, 'Luva de Raspa', 133, 1, Tue Dec 31 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'em_uso', Sun Nov 09 2025 20:30:53 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:30:53 GMT-0300 (Horário Padrão de Brasília), 1, '3026', 1),
(8, 'Luva de Raspa', 133, 1, Tue Dec 31 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'em_uso', Sun Nov 09 2025 20:30:53 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:30:53 GMT-0300 (Horário Padrão de Brasília), 1, '3026', 1);

UNLOCK TABLES;

-- Estrutura da tabela: fichasEpiEmitidas
DROP TABLE IF EXISTS `fichasEpiEmitidas`;
CREATE TABLE `fichasEpiEmitidas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `empresaId` int NOT NULL,
  `colaboradorId` int NOT NULL,
  `nomeArquivo` varchar(255) NOT NULL,
  `caminhoArquivo` varchar(500) DEFAULT NULL,
  `urlArquivo` varchar(500) DEFAULT NULL,
  `dataEmissao` timestamp NOT NULL DEFAULT (now()),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: fichasEpiEmitidas
LOCK TABLES `fichasEpiEmitidas` WRITE;
INSERT INTO `fichasEpiEmitidas` (`id`, `empresaId`, `colaboradorId`, `nomeArquivo`, `caminhoArquivo`, `urlArquivo`, `dataEmissao`, `createdAt`, `updatedAt`) VALUES
(3, 1, 133, 'Ficha_EPI_Rodriga_Correia_2025-11-09_1762720310387.pdf', 'C:\\Projetos\\uploads\\fichas_epi\\Ficha_EPI_Rodriga_Correia_2025-11-09_1762720310387.pdf', '/uploads/fichas_epi/Ficha_EPI_Rodriga_Correia_2025-11-09_1762720310387.pdf', Sun Nov 09 2025 20:31:50 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:31:50 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:31:50 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: modelosCertificados
DROP TABLE IF EXISTS `modelosCertificados`;
CREATE TABLE `modelosCertificados` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `descricao` text,
  `htmlTemplate` text,
  `corFundo` varchar(7) DEFAULT '#ffffff',
  `corTexto` varchar(7) DEFAULT '#000000',
  `corPrimaria` varchar(7) DEFAULT '#1e40af',
  `orientacao` enum('portrait','landscape') NOT NULL DEFAULT 'landscape',
  `textoCabecalho` text,
  `textoRodape` text,
  `mostrarDataEmissao` tinyint(1) DEFAULT '1',
  `mostrarValidade` tinyint(1) DEFAULT '1',
  `mostrarNR` tinyint(1) DEFAULT '1',
  `empresaId` int DEFAULT NULL,
  `padrao` tinyint(1) DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `conteudoProgramatico` text,
  `tipoTreinamentoId` int DEFAULT NULL,
  `mostrarConteudoProgramatico` tinyint(1) DEFAULT '1',
  `descricaoCertificado` text,
  `cargaHoraria` varchar(20) DEFAULT NULL,
  `tipoNr` varchar(10) DEFAULT NULL,
  `datas` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: modelosCertificados
LOCK TABLES `modelosCertificados` WRITE;
INSERT INTO `modelosCertificados` (`id`, `nome`, `descricao`, `htmlTemplate`, `corFundo`, `corTexto`, `corPrimaria`, `orientacao`, `textoCabecalho`, `textoRodape`, `mostrarDataEmissao`, `mostrarValidade`, `mostrarNR`, `empresaId`, `padrao`, `createdAt`, `updatedAt`, `conteudoProgramatico`, `tipoTreinamentoId`, `mostrarConteudoProgramatico`, `descricaoCertificado`, `cargaHoraria`, `tipoNr`, `datas`) VALUES
(8, 'NR18 Admissional', 'Participou do Treinamento admissional (Básico em segurança do trabalho ), quadro 1 do Anexo I da Norma Regulamentadora—18, item 18.14, com carga horaria de 4horas.	', '<!DOCTYPE html>
<html lang="pt-BR">
<head> <meta charset="UTF-8"> <meta name="viewport" content="width=device-width, initial-scale=1.0"> <title>Certificado</title> <style> * { margin: 0; padding: 0; box-sizing: border-box; } @page { size: 297mm 210mm; margin: 0; } html, body { font-family: Arial, sans-serif; background: #ffffff; color: #000000; padding: 0; margin: 0; width: 297mm; height: 210mm; overflow: hidden; } body { page-break-after: avoid; page-break-inside: avoid; } .certificado { width: 297mm; height: 210mm; background: #ffffff; position: relative; margin: 0; overflow: hidden; page-break-after: avoid; page-break-inside: avoid; } @media print { html, body { width: 297mm; height: 210mm; margin: 0; padding: 0; overflow: hidden; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; } .certificado { width: 297mm; height: 210mm; margin: 0; padding: 0; page-break-after: avoid; page-break-inside: avoid; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; } .cabecalho { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; background: #1e40af !important; color: #ffffff !important; } .conteudo { page-break-inside: avoid; } .rodape { page-break-inside: avoid; } } .cabecalho { background: #1e40af !important; background-color: #1e40af !important; color: #ffffff !important; padding: 15px 20px; text-align: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; } .cabecalho h1 { font-size: 42px; font-weight: bold; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 2px; } .cabecalho h2 { font-size: 18px; font-weight: normal; text-transform: uppercase; margin-top: 4px; opacity: 0.95; } .conteudo { padding: 20px 50px; max-height: calc(210mm - 120px); display: flex; flex-direction: column; overflow: hidden; page-break-inside: avoid; } .certificacao-empresa { font-size: 16px; text-align: center; margin-bottom: 12px; color: #000000; line-height: 1.5; } .nome-colaborador { font-size: 34px; font-weight: bold; text-align: center; margin: 10px 0 12px 0; text-transform: uppercase; color: #1e40af; line-height: 1.2; } .nome-colaborador .rg { font-size: 20px; font-weight: normal; text-transform: none; color: #000000; } .texto-treinamento { font-size: 13px; line-height: 1.6; margin: 10px 0; text-align: justify; color: #000000; } .detalhes-treinamento { margin: 10px 0; font-size: 13px; line-height: 1.5; color: #000000; } .detalhes-treinamento div { margin-bottom: 4px; } .conteudo-programatico-wrapper { display: flex; justify-content: space-between; align-items: flex-start; margin: 12px 0; gap: 20px; } .conteudo-programatico { flex: 1; padding: 8px 12px; background: transparent; } .conteudo-programatico h3 { font-weight: bold; font-size: 13px; margin-bottom: 6px; color: #1e40af; } .conteudo-programatico ul { list-style: none; padding-left: 0; font-size: 11px; line-height: 1.5; color: #000000; } .conteudo-programatico li { margin-bottom: 3px; } .data-emissao-lateral { text-align: right; font-size: 12px; color: #000000; white-space: nowrap; padding-top: 8px; } .rodape { position: absolute; bottom: 3cm; left: 0; right: 0; width: 100%; padding: 0 50px; z-index: 1; } .assinaturas { display: flex; justify-content: space-between; gap: 96px; margin-top: 64px; align-items: flex-start; } .assinatura { display: flex; flex-direction: column; align-items: center; } .assinatura-linha { width: 192px; border-top: 1px solid #000000; margin-bottom: 0px; padding: 0; } .assinatura-nome { font-size: 12px; font-weight: 600; line-height: 1.2; color: #000000; margin: 0; padding: 0; margin-top: 1px; } .assinatura-cargo { font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px; } .endereco-treinamento { position: absolute; bottom: 0.5cm; left: 50px; font-size: 10px; color: #000000; opacity: 0.7; z-index: 0; max-width: 400px; } .endereco-treinamento strong { font-weight: bold; } </style>
</head>
<body> <div class="certificado"> <div class="cabecalho"> <h1>CERTIFICADO</h1> </div> <div class="conteudo"> <div class="certificacao-empresa">Certifico que o Empregado: <strong>[NOME DO COLABORADOR]</strong>, Rg: <strong>[RG DO COLABORADOR]</strong>, da Empresa: <strong>[NOME DA EMPRESA]</strong> e CNPJ: <strong>[CNPJ DA EMPRESA]</strong></div> <div class="texto-treinamento">Participou do Treinamento admissional (Básico em segurança do trabalho ), quadro 1 do Anexo I da Norma Regulamentadora—18, item 18.14, com carga horaria de 4horas.	</div> <div class="detalhes-treinamento"> <div>[TEXTO_DATA_REALIZACAO]</div> </div> <div class="conteudo-programatico-wrapper"> <div class="conteudo-programatico"> <h3>Conteúdo Programático:</h3> <ul>[CONTEUDO_PROGRAMATICO_LISTA]</ul> </div> <div class="data-emissao-lateral">[DATA DE EMISSÃO]</div> </div> </div> <div class="endereco-treinamento"><strong>Endereço do Treinamento:</strong> [ENDERECO_TREINAMENTO]</div> <div class="rodape"> <div class="assinaturas" style="margin-top: 64px; display: flex; justify-content: space-between; gap: 96px;"> <div style="display: flex; flex-direction: column; align-items: center;"> <div style="width: 192px; border-top: 1px solid #000000; margin-bottom: 0px;"></div> <p style="font-size: 12px; font-weight: 600; line-height: 1.2; margin: 0; padding: 0; margin-top: 1px;"> [NOME DO COLABORADOR] </p> <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;"> [CARGO DO COLABORADOR] </p> <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;"> RG: [RG DO COLABORADOR] </p> </div> <div style="display: flex; flex-direction: column; align-items: center;"> <div style="width: 192px; border-top: 1px solid #000000; margin-bottom: 0px;"></div> <p style="font-size: 12px; font-weight: 600; line-height: 1.2; margin: 0; padding: 0; margin-top: 1px;"> [NOME DO RESPONSÁVEL] </p> <p style="font-size: 10px; line-height: 1.2; color: #374151; margin: 0; padding: 0; margin-top: 1px;"> [CARGO DO RESPONSÁVEL] </p> </div> </div> </div> </div>
</body>
</html>', '#ffffff', '#000000', '#1e40af', 'landscape', NULL, 'svsvs f sdf ds ds vz vv scv szv szc c', 1, 1, 1, NULL, 0, Wed Nov 05 2025 03:18:22 GMT-0300 (Horário Padrão de Brasília), Wed Nov 05 2025 03:18:22 GMT-0300 (Horário Padrão de Brasília), '["dsfdsfsd","dsfsdfdsf","sdfsdfdsf","sdfsdfsdfdsf"]', 2, 1, 'Participou do Treinamento admissional (Básico em segurança do trabalho ), quadro 1 do Anexo I da Norma Regulamentadora—18, item 18.14, com carga horaria de 4horas.	', NULL, NULL, '[{"label":"Data 1","valor":""}]');

UNLOCK TABLES;

-- Estrutura da tabela: modelosOrdemServico
DROP TABLE IF EXISTS `modelosOrdemServico`;
CREATE TABLE `modelosOrdemServico` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `descricao` text,
  `htmlTemplate` text,
  `empresaId` int DEFAULT NULL,
  `padrao` tinyint(1) DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `medidasPreventivasEPC` text,
  `orientacoesSeguranca` text,
  `termoResponsabilidade` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: modelosOrdemServico
LOCK TABLES `modelosOrdemServico` WRITE;
INSERT INTO `modelosOrdemServico` (`id`, `nome`, `descricao`, `htmlTemplate`, `empresaId`, `padrao`, `createdAt`, `updatedAt`, `medidasPreventivasEPC`, `orientacoesSeguranca`, `termoResponsabilidade`) VALUES
(2, 'Modelo padrao 01', NULL, NULL, NULL, 0, Sun Nov 09 2025 20:35:51 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:41:37 GMT-0300 (Horário Padrão de Brasília), '["Uso correto de EPI`s;","Treinamento para execução das tarefas;","Correção das posturas de trabalho;","Guarda-corpo de proteção periferias, vãos das lajes e escadas."]', '["Não utilizar equipamentos improvisados ou irregulares, como tábuas suspensas por cordas no lugar das cadeirinhas suspensas recomendadas pela norma NR-18;","Não transite pela obra sem capacete e bota;","Use seus EPIs apenas para a finalidade a que se destinam e mantenha-os sob sua guarda e conservação;","Observe atentamente o meio ambiente do trabalho ao circular na obra, e corrija as condições, inseguras encontradas, imediatamente;","Não ultrapasse a barreira (cancela) de segurança sem o elevador esteja no seu pavimento;","Use corretamente o cinto de segurança ligado a um cabo de segurança, para trabalhos realizados em andaimes suspensos mecânicos, para trabalhos em altura superior a 2,00 metros (dois metros) ou na periferia da obra;","Mantenha o depósito de material isolado e protegido por extintores de incêndio adequados. Não fume nem porte qualquer coisa que provoque chamas e faíscas;","Não deixe restos de material nos locais de trabalho. Recolha-os ao deposito diariamente;","Participar dos DDS."]', 'Recebi treinamento de segurança e saúde no trabalho, bem com todos os equipamentos de proteção individual para neutralizar a ação dos agentes nocivos presentes no meu ambiente de trabalho. Serei cobrado, conforme ampara legal, com relação ao uso destes equipamentos e estou ciente de que a não utilização é passível de Sansões Legais. ');

UNLOCK TABLES;

-- Estrutura da tabela: obras
DROP TABLE IF EXISTS `obras`;
CREATE TABLE `obras` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomeObra` varchar(255) NOT NULL,
  `endereco` text,
  `empresaId` int NOT NULL,
  `dataInicio` date DEFAULT NULL,
  `dataFim` date DEFAULT NULL,
  `status` enum('ativa','concluida') NOT NULL DEFAULT 'ativa',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `cnpj` varchar(18) DEFAULT NULL,
  `cno` varchar(20) DEFAULT NULL,
  `cnae` varchar(20) DEFAULT NULL,
  `descricaoAtividade` text,
  `grauRisco` varchar(50) DEFAULT NULL,
  `quantidadePrevistoColaboradores` int DEFAULT NULL,
  `tipoLogradouro` varchar(50) DEFAULT NULL,
  `nomeLogradouro` varchar(255) DEFAULT NULL,
  `numeroEndereco` varchar(20) DEFAULT NULL,
  `complementoEndereco` varchar(255) DEFAULT NULL,
  `bairroEndereco` varchar(255) DEFAULT NULL,
  `cidadeEndereco` varchar(255) DEFAULT NULL,
  `estadoEndereco` varchar(2) DEFAULT NULL,
  `cepEndereco` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: obras
LOCK TABLES `obras` WRITE;
INSERT INTO `obras` (`id`, `nomeObra`, `endereco`, `empresaId`, `dataInicio`, `dataFim`, `status`, `createdAt`, `updatedAt`, `cnpj`, `cno`, `cnae`, `descricaoAtividade`, `grauRisco`, `quantidadePrevistoColaboradores`, `tipoLogradouro`, `nomeLogradouro`, `numeroEndereco`, `complementoEndereco`, `bairroEndereco`, `cidadeEndereco`, `estadoEndereco`, `cepEndereco`) VALUES
(1, 'Condomínio Residencial Mall Verde', 'Estrada Estrada Nacional, 4184 - Lote 83, Industrial, Niterói/RJ, CEP: 80166-342', 1, Thu Jul 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '37.285.947/8703-46', '530.417.507', '4120400', 'Construção de edifício residencial de alto padrão com 20 andares, 120 unidades, 4 elevadores, área de lazer completa com piscina, academia, salão de festas, playground e espaço gourmet. Obra prevista para 24 meses.', '4', 75, 'Estrada', 'Estrada Nacional', '4184', 'Lote 83', 'Industrial', 'Niterói', 'RJ', '14801-679'),
(2, 'Edifício Residencial Floresta', 'Alameda Alameda Atlântica, 1996 - Lote 31, Jardim América, Novo Hamburgo/RS, CEP: 31038-422', 2, Thu Jul 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '51.775.446/4487-74', '196.528.853', '4120400', 'Construção de condomínio horizontal fechado com 80 casas, infraestrutura completa, sistema de segurança, rede de esgoto, drenagem pluvial, pavimentação asfáltica e iluminação pública interna.', '4', 10, 'Alameda', 'Alameda Atlântica', '1996', 'Lote 31', 'Jardim América', 'Novo Hamburgo', 'RS', '46142-185'),
(3, 'Shopping Center Serra', 'Rodovia Rodovia 15 de Novembro, 2565, São Cristóvão, Montes Claros/MG, CEP: 39276-759', 3, Sun Nov 03 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '43.776.272/3383-96', '644.369.999', '4711301', 'Construção de shopping center com 3 pavimentos, 200 lojas, praça de alimentação, cinema, estacionamento para 500 veículos, área total de 50.000 m². Inclui obras de infraestrutura e acabamento.', '4', 10, 'Rodovia', 'Rodovia 15 de Novembro', '2565', NULL, 'São Cristóvão', 'Montes Claros', 'MG', '91770-796'),
(4, 'Prédio Comercial Parque Parque', 'Estrada Estrada Bandeirantes, 409 - Lote 46, São Cristóvão, Joinville/SC, CEP: 45403-745', 4, Thu Jul 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '50.724.126/8897-70', '247.215.618', '4110700', 'Construção de prédio comercial classe A com 25 andares, escritórios corporativos, 4 elevadores de alta velocidade, sistema de ar condicionado central, fachada envidraçada, estacionamento coberto.', '4', 21, 'Estrada', 'Estrada Bandeirantes', '409', 'Lote 46', 'São Cristóvão', 'Joinville', 'SC', '79426-801'),
(5, 'Obra de Infraestrutura Torre Verde', 'Rodovia Rodovia Atlântica, 1928, Industrial, Montes Claros/MG, CEP: 39647-921', 5, Fri Oct 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '63.127.949/8996-41', '197.514.506', '4220100', 'Obra de infraestrutura urbana: construção de rede de esgoto sanitário, drenagem pluvial, pavimentação asfáltica, calçamento, iluminação pública e sinalização viária em bairro residencial.', '4', 33, 'Rodovia', 'Rodovia Atlântica', '1928', NULL, 'Industrial', 'Montes Claros', 'MG', '42550-710'),
(6, 'Ponte e Viaduto Parque', 'Estrada Estrada dos Imigrantes, 1099, Bela Vista, Itajaí/SC, CEP: 88034-334', 6, Mon Mar 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '40.165.530/0655-83', '993.608.068', '4211104', 'Construção de ponte sobre rio com 200 metros de extensão, 4 faixas de rolamento, estrutura em concreto protendido, obras de arte especiais, terraplanagem e drenagem.', '4', 101, 'Estrada', 'Estrada dos Imigrantes', '1099', NULL, 'Bela Vista', 'Itajaí', 'SC', '52815-939'),
(7, 'Rodovia Plaza Alta', 'Rua Rua República, 1973, São José, Petrópolis/RJ, CEP: 15094-717', 7, Tue Jun 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '54.899.660/7156-05', '121.731.899', '4211103', 'Construção de rodovia pavimentada com 15 km de extensão, 2 pistas duplas, 4 faixas, acostamento, drenagem, sinalização horizontal e vertical, obras de arte correntes e especiais.', '4', 25, 'Rua', 'Rua República', '1973', NULL, 'São José', 'Petrópolis', 'RJ', '20885-372'),
(8, 'Hospital Alta', 'Estrada Estrada da Paz, 1712 - Lote 76, Jardim Primavera, Uberlândia/MG, CEP: 96438-945', 8, Thu Apr 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '27.407.040/5891-45', '743.655.215', '4110700', 'Construção de hospital geral com 200 leitos, 8 salas cirúrgicas, pronto-socorro, UTI, laboratórios, centro de diagnóstico por imagem, heliponto e estacionamento para 300 veículos.', '4', 32, 'Estrada', 'Estrada da Paz', '1712', 'Lote 76', 'Jardim Primavera', 'Uberlândia', 'MG', '57042-448'),
(9, 'Escola Jardim Azul', 'Avenida Avenida Nacional, 4557 - Lote 5, Jardim das Flores, Betim/MG, CEP: 99681-988', 9, Mon Mar 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '30.756.551/3691-44', '761.595.489', '4110700', 'Construção de escola pública com 12 salas de aula, laboratórios, biblioteca, quadra poliesportiva coberta, refeitório, área administrativa e estacionamento para professores e visitantes.', '4', 72, 'Avenida', 'Avenida Nacional', '4557', 'Lote 5', 'Jardim das Flores', 'Betim', 'MG', '83250-134'),
(10, 'Centro de Distribuição Alta', 'Alameda Alameda Independência, 4255, Jardim Bela Vista, Petrópolis/RJ, CEP: 17609-301', 10, Tue Jun 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '25.730.338/0377-16', '988.137.637', '4211103', 'Construção de centro de distribuição logístico com 10.000 m² de área coberta, docas de carga e descarga, sistema de armazenagem automatizado, escritórios e estacionamento para caminhões.', '4', 109, 'Alameda', 'Alameda Independência', '4255', NULL, 'Jardim Bela Vista', 'Petrópolis', 'RJ', '24570-230'),
(11, 'Indústria Tower Brasil', 'Rodovia Rodovia São Paulo, 7424 - Lote 97, Industrial, Rio de Janeiro/RJ, CEP: 49690-204', 11, Thu Jul 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '26.640.905/6958-51', '927.933.548', '4120400', 'Construção de galpão industrial com 8.000 m², estrutura metálica, sistema de combate a incêndio, escritórios administrativos, área de estacionamento e logística.', '4', 84, 'Rodovia', 'Rodovia São Paulo', '7424', 'Lote 97', 'Industrial', 'Rio de Janeiro', 'RJ', '77020-353'),
(12, 'Residencial Popular Floresta', 'Alameda Alameda São Pedro, 4365, Vila Rica, Juiz de Fora/MG, CEP: 39446-702', 12, Sun Aug 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '65.452.272/7328-61', '716.076.546', '4120400', 'Construção de conjunto habitacional popular com 200 unidades, infraestrutura completa, rede de água, esgoto, energia elétrica, pavimentação e área de lazer.', '4', 83, 'Alameda', 'Alameda São Pedro', '4365', NULL, 'Vila Rica', 'Juiz de Fora', 'MG', '79938-296'),
(13, 'Torre Empresarial Bela', 'Rodovia Rodovia 15 de Novembro, 1041 - Lote 72, Vila Rica, Betim/MG, CEP: 80262-828', 1, Wed Sep 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '37.285.947/8703-46', '377.244.260', '4110700', 'Construção de torre empresarial com 30 andares, escritórios corporativos, salas de reunião, restaurante, estacionamento automatizado, fachada inteligente e sistema de automação.', '4', 31, 'Rodovia', 'Rodovia 15 de Novembro', '1041', 'Lote 72', 'Vila Rica', 'Betim', 'MG', '22608-704'),
(14, 'Complexo Residencial Premium Serra', 'Estrada Estrada Tiradentes, 6678, Parque Verde, Florianópolis/SC, CEP: 89891-275', 2, Tue Dec 03 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '51.775.446/4487-74', '104.182.482', '4120400', 'Construção de complexo residencial misto com edifícios residenciais, área comercial, praça central, área de lazer compartilhada, estacionamento e infraestrutura completa.', '4', 46, 'Estrada', 'Estrada Tiradentes', '6678', NULL, 'Parque Verde', 'Florianópolis', 'SC', '14649-948'),
(15, 'Obra de Saneamento Lua', 'Alameda Alameda dos Imigrantes, 1783, Jardim Bela Vista, Itajaí/SC, CEP: 23457-922', 3, Mon Mar 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '43.776.272/3383-96', '703.345.951', '4220100', 'Obra de saneamento básico: construção de estação de tratamento de esgoto, rede coletora, elevatórias, lagoas de tratamento e sistema de disposição final do efluente tratado.', '4', 34, 'Alameda', 'Alameda dos Imigrantes', '1783', NULL, 'Jardim Bela Vista', 'Itajaí', 'SC', '42985-151'),
(16, 'Pavimentação Residencial Praia', 'Alameda Alameda Nacional, 9208, Parque Verde, Santa Maria/RS, CEP: 16104-956', 4, Mon Feb 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '50.724.126/8897-70', '910.272.900', '4212000', 'Pavimentação asfáltica de ruas e avenidas urbanas com 8 km de extensão, drenagem pluvial, sinalização horizontal e vertical, calçadas e ciclovia integrada.', '4', 100, 'Alameda', 'Alameda Nacional', '9208', NULL, 'Parque Verde', 'Santa Maria', 'RS', '50806-729'),
(17, 'Construção de Túnel Plaza Floresta', 'Estrada Estrada Brigadeiro, 6980, Jardim América, São José/SC, CEP: 47360-075', 5, Wed Sep 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '63.127.949/8996-41', '217.580.076', '4211104', 'Construção de túnel rodoviário com 500 metros de extensão, 2 pistas duplas, sistema de ventilação, iluminação, drenagem, segurança e monitoramento eletrônico.', '4', 71, 'Estrada', 'Estrada Brigadeiro', '6980', NULL, 'Jardim América', 'São José', 'SC', '23858-374'),
(18, 'Aeroporto Floresta', 'Estrada Estrada São Paulo, 6687, Jardim Primavera, Uberlândia/MG, CEP: 58214-019', 6, Thu Jul 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '40.165.530/0655-83', '160.602.089', '4220100', 'Ampliação e modernização de aeroporto: construção de nova pista, terminal de passageiros, estacionamento, sistema de bagagens e infraestrutura aeroportuária complementar.', '4', 12, 'Estrada', 'Estrada São Paulo', '6687', NULL, 'Jardim Primavera', 'Uberlândia', 'MG', '75228-816'),
(19, 'Porto Centro Vista', 'Rua Rua 15 de Novembro, 5657, Vila Esperança, Curitiba/PR, CEP: 49866-721', 7, Fri Oct 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '54.899.660/7156-05', '528.385.915', '4220100', 'Construção de terminal portuário com cais de atracação, armazéns, pátio de containers, sistema de guindastes, escritórios administrativos e infraestrutura portuária.', '4', 58, 'Rua', 'Rua 15 de Novembro', '5657', NULL, 'Vila Esperança', 'Curitiba', 'PR', '55660-106'),
(20, 'Usina Sol', 'Avenida Avenida Bandeirantes, 3811, Vila Rica, Contagem/MG, CEP: 51233-809', 8, Mon Mar 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '27.407.040/5891-45', '426.639.496', '4220100', 'Construção de usina hidrelétrica com barragem, casa de força, subestação, linhas de transmissão, obras civis auxiliares e sistema de controle e monitoramento.', '4', 85, 'Avenida', 'Avenida Bandeirantes', '3811', NULL, 'Vila Rica', 'Contagem', 'MG', '79528-519'),
(21, 'Estação de Tratamento Praia', 'Estrada Estrada Paulista, 4617 - Lote 52, Jardim das Flores, Campos dos Goytacazes/RJ, CEP: 65894-304', 9, Fri Jan 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '30.756.551/3691-44', '259.326.619', '4220100', 'Construção de estação de tratamento de água (ETA) com capacidade de 500 litros/segundo, sistema de captação, floculação, decantação, filtração, desinfecção e reservatórios.', '4', 12, 'Estrada', 'Estrada Paulista', '4617', 'Lote 52', 'Jardim das Flores', 'Campos dos Goytacazes', 'RJ', '67093-851'),
(22, 'Reforma e Ampliação Parque Vista', 'Estrada Estrada Getúlio Vargas, 8141 - Lote 50, Vila Rica, Joinville/SC, CEP: 82046-039', 10, Mon Feb 03 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, 'ativa', Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:20:19 GMT-0300 (Horário Padrão de Brasília), '25.730.338/0377-16', '300.757.714', '4120400', 'Reforma e ampliação de edifício existente: modernização de fachada, atualização de sistemas elétricos e hidráulicos, ampliação de área útil, reforma de elevadores e áreas comuns.', '4', 101, 'Estrada', 'Estrada Getúlio Vargas', '8141', 'Lote 50', 'Vila Rica', 'Joinville', 'SC', '15758-658');

UNLOCK TABLES;

-- Estrutura da tabela: ordensServico
DROP TABLE IF EXISTS `ordensServico`;
CREATE TABLE `ordensServico` (
  `id` int NOT NULL AUTO_INCREMENT,
  `numeroOrdem` varchar(50) NOT NULL,
  `empresaId` int NOT NULL,
  `colaboradorId` int DEFAULT NULL,
  `obraId` int DEFAULT NULL,
  `descricaoServico` text NOT NULL,
  `tipoServico` varchar(255) DEFAULT NULL,
  `prioridade` enum('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
  `status` enum('aberta','em_andamento','concluida','cancelada') NOT NULL DEFAULT 'aberta',
  `dataEmissao` date NOT NULL,
  `dataPrevistaConclusao` date DEFAULT NULL,
  `dataConclusao` date DEFAULT NULL,
  `observacoes` text,
  `responsavelEmissao` varchar(255) DEFAULT NULL,
  `valorServico` varchar(50) DEFAULT NULL,
  `tipoRisco` varchar(255) DEFAULT NULL,
  `nrRelacionada` varchar(50) DEFAULT NULL,
  `acaoCorretiva` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `modeloId` int DEFAULT NULL,
  `cidade` varchar(255) DEFAULT NULL,
  `uf` varchar(2) DEFAULT NULL,
  `responsavelId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ordensServico_numeroOrdem_unique` (`numeroOrdem`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: ordensServico
LOCK TABLES `ordensServico` WRITE;
INSERT INTO `ordensServico` (`id`, `numeroOrdem`, `empresaId`, `colaboradorId`, `obraId`, `descricaoServico`, `tipoServico`, `prioridade`, `status`, `dataEmissao`, `dataPrevistaConclusao`, `dataConclusao`, `observacoes`, `responsavelEmissao`, `valorServico`, `tipoRisco`, `nrRelacionada`, `acaoCorretiva`, `createdAt`, `updatedAt`, `modeloId`, `cidade`, `uf`, `responsavelId`) VALUES
(14, 'OS-0001', 1, 101, NULL, 'Ordem de serviço de teste - 30/03/2025', NULL, 'media', 'aberta', Tue May 20 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, Sun Nov 09 2025 22:01:35 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 22:32:06 GMT-0300 (Horário Padrão de Brasília), 2, 'Campinas', 'SP', 1),
(15, 'OS-0002', 1, 152, NULL, '', NULL, 'media', 'aberta', Wed Jan 01 2025 00:00:00 GMT-0300 (Horário Padrão de Brasília), NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, Sun Nov 09 2025 22:37:31 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 22:38:06 GMT-0300 (Horário Padrão de Brasília), 2, 'Campinas', 'SP', 2);

UNLOCK TABLES;

-- Estrutura da tabela: permissoes
DROP TABLE IF EXISTS `permissoes`;
CREATE TABLE `permissoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `codigo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nome` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `modulo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `acao` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissoes_codigo_unique` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=148 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dados da tabela: permissoes
LOCK TABLES `permissoes` WRITE;
INSERT INTO `permissoes` (`id`, `codigo`, `nome`, `descricao`, `modulo`, `acao`, `createdAt`, `updatedAt`) VALUES
(1, 'empresas.list', 'Listar Empresas', 'Visualizar lista de empresas', 'empresas', 'list', Sun Nov 09 2025 23:43:26 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:26 GMT-0300 (Horário Padrão de Brasília)),
(2, 'empresas.create', 'Criar Empresa', 'Cadastrar novas empresas', 'empresas', 'create', Sun Nov 09 2025 23:43:26 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:26 GMT-0300 (Horário Padrão de Brasília)),
(3, 'empresas.update', 'Editar Empresa', 'Editar empresas existentes', 'empresas', 'update', Sun Nov 09 2025 23:43:26 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:26 GMT-0300 (Horário Padrão de Brasília)),
(4, 'empresas.delete', 'Excluir Empresa', 'Excluir empresas', 'empresas', 'delete', Sun Nov 09 2025 23:43:26 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:26 GMT-0300 (Horário Padrão de Brasília)),
(5, 'empresas.read', 'Visualizar Empresa', 'Visualizar detalhes de uma empresa', 'empresas', 'read', Sun Nov 09 2025 23:43:26 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:26 GMT-0300 (Horário Padrão de Brasília)),
(6, 'colaboradores.list', 'Listar Colaboradores', 'Visualizar lista de colaboradores', 'colaboradores', 'list', Sun Nov 09 2025 23:43:26 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:26 GMT-0300 (Horário Padrão de Brasília)),
(7, 'colaboradores.create', 'Criar Colaborador', 'Cadastrar novos colaboradores', 'colaboradores', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(8, 'colaboradores.update', 'Editar Colaborador', 'Editar colaboradores existentes', 'colaboradores', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(9, 'colaboradores.delete', 'Excluir Colaborador', 'Excluir colaboradores', 'colaboradores', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(10, 'colaboradores.read', 'Visualizar Colaborador', 'Visualizar detalhes de um colaborador', 'colaboradores', 'read', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(11, 'obras.list', 'Listar Obras', 'Visualizar lista de obras', 'obras', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(12, 'obras.create', 'Criar Obra', 'Cadastrar novas obras', 'obras', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(13, 'obras.update', 'Editar Obra', 'Editar obras existentes', 'obras', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(14, 'obras.delete', 'Excluir Obra', 'Excluir obras', 'obras', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(15, 'obras.read', 'Visualizar Obra', 'Visualizar detalhes de uma obra', 'obras', 'read', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(16, 'cargos.list', 'Listar Cargos', 'Visualizar lista de cargos', 'cargos', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(17, 'cargos.create', 'Criar Cargo', 'Cadastrar novos cargos', 'cargos', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(18, 'cargos.update', 'Editar Cargo', 'Editar cargos existentes', 'cargos', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(19, 'cargos.delete', 'Excluir Cargo', 'Excluir cargos', 'cargos', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(20, 'setores.list', 'Listar Setores', 'Visualizar lista de setores', 'setores', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(21, 'setores.create', 'Criar Setor', 'Cadastrar novos setores', 'setores', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(22, 'setores.update', 'Editar Setor', 'Editar setores existentes', 'setores', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(23, 'setores.delete', 'Excluir Setor', 'Excluir setores', 'setores', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(24, 'treinamentos.list', 'Listar Treinamentos', 'Visualizar lista de treinamentos', 'treinamentos', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(25, 'treinamentos.create', 'Criar Treinamento', 'Cadastrar novos treinamentos', 'treinamentos', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(26, 'treinamentos.update', 'Editar Treinamento', 'Editar treinamentos existentes', 'treinamentos', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(27, 'treinamentos.delete', 'Excluir Treinamento', 'Excluir treinamentos', 'treinamentos', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(28, 'treinamentos.emitir_certificado', 'Emitir Certificado', 'Emitir certificados de treinamento', 'treinamentos', 'emitir_certificado', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(29, 'tipos_treinamentos.list', 'Listar Tipos de Treinamentos', 'Visualizar lista de tipos de treinamentos', 'tipos_treinamentos', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(30, 'tipos_treinamentos.create', 'Criar Tipo de Treinamento', 'Cadastrar novos tipos de treinamentos', 'tipos_treinamentos', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(31, 'tipos_treinamentos.update', 'Editar Tipo de Treinamento', 'Editar tipos de treinamentos existentes', 'tipos_treinamentos', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(32, 'tipos_treinamentos.delete', 'Excluir Tipo de Treinamento', 'Excluir tipos de treinamentos', 'tipos_treinamentos', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(33, 'epis.list', 'Listar EPIs', 'Visualizar lista de EPIs', 'epis', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(34, 'epis.create', 'Criar EPI', 'Cadastrar novos EPIs', 'epis', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(35, 'epis.update', 'Editar EPI', 'Editar EPIs existentes', 'epis', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(36, 'epis.delete', 'Excluir EPI', 'Excluir EPIs', 'epis', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(37, 'epis.emitir_ficha', 'Emitir Ficha de EPI', 'Emitir fichas de EPI', 'epis', 'emitir_ficha', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(38, 'tipos_epis.list', 'Listar Tipos de EPIs', 'Visualizar lista de tipos de EPIs', 'tipos_epis', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(39, 'tipos_epis.create', 'Criar Tipo de EPI', 'Cadastrar novos tipos de EPIs', 'tipos_epis', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(40, 'tipos_epis.update', 'Editar Tipo de EPI', 'Editar tipos de EPIs existentes', 'tipos_epis', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(41, 'tipos_epis.delete', 'Excluir Tipo de EPI', 'Excluir tipos de EPIs', 'tipos_epis', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(42, 'ordens_servico.list', 'Listar Ordens de Serviço', 'Visualizar lista de ordens de serviço', 'ordens_servico', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(43, 'ordens_servico.create', 'Criar Ordem de Serviço', 'Emitir novas ordens de serviço', 'ordens_servico', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(44, 'ordens_servico.update', 'Editar Ordem de Serviço', 'Editar ordens de serviço existentes', 'ordens_servico', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(45, 'ordens_servico.delete', 'Excluir Ordem de Serviço', 'Excluir ordens de serviço', 'ordens_servico', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(46, 'ordens_servico.download', 'Baixar Ordem de Serviço', 'Baixar ordens de serviço em PDF', 'ordens_servico', 'download', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(47, 'modelos_os.list', 'Listar Modelos de OS', 'Visualizar lista de modelos de ordem de serviço', 'modelos_os', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(48, 'modelos_os.create', 'Criar Modelo de OS', 'Criar novos modelos de ordem de serviço', 'modelos_os', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(49, 'modelos_os.update', 'Editar Modelo de OS', 'Editar modelos de ordem de serviço existentes', 'modelos_os', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(50, 'modelos_os.delete', 'Excluir Modelo de OS', 'Excluir modelos de ordem de serviço', 'modelos_os', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(51, 'modelos_certificados.list', 'Listar Modelos de Certificados', 'Visualizar lista de modelos de certificados', 'modelos_certificados', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(52, 'modelos_certificados.create', 'Criar Modelo de Certificado', 'Criar novos modelos de certificados', 'modelos_certificados', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(53, 'modelos_certificados.update', 'Editar Modelo de Certificado', 'Editar modelos de certificados existentes', 'modelos_certificados', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(54, 'modelos_certificados.delete', 'Excluir Modelo de Certificado', 'Excluir modelos de certificados', 'modelos_certificados', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(55, 'responsaveis.list', 'Listar Responsáveis', 'Visualizar lista de responsáveis', 'responsaveis', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(56, 'responsaveis.create', 'Criar Responsável', 'Cadastrar novos responsáveis', 'responsaveis', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(57, 'responsaveis.update', 'Editar Responsável', 'Editar responsáveis existentes', 'responsaveis', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(58, 'responsaveis.delete', 'Excluir Responsável', 'Excluir responsáveis', 'responsaveis', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(59, 'riscos_ocupacionais.list', 'Listar Riscos Ocupacionais', 'Visualizar lista de riscos ocupacionais', 'riscos_ocupacionais', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(60, 'riscos_ocupacionais.create', 'Criar Risco Ocupacional', 'Cadastrar novos riscos ocupacionais', 'riscos_ocupacionais', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(61, 'riscos_ocupacionais.update', 'Editar Risco Ocupacional', 'Editar riscos ocupacionais existentes', 'riscos_ocupacionais', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(62, 'riscos_ocupacionais.delete', 'Excluir Risco Ocupacional', 'Excluir riscos ocupacionais', 'riscos_ocupacionais', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(63, 'usuarios.list', 'Listar Usuários', 'Visualizar lista de usuários do sistema', 'usuarios', 'list', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(64, 'usuarios.create', 'Criar Usuário', 'Cadastrar novos usuários', 'usuarios', 'create', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(65, 'usuarios.update', 'Editar Usuário', 'Editar usuários existentes', 'usuarios', 'update', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(66, 'usuarios.delete', 'Excluir Usuário', 'Excluir usuários', 'usuarios', 'delete', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(67, 'usuarios.gerenciar_permissoes', 'Gerenciar Permissões', 'Gerenciar permissões de usuários', 'usuarios', 'gerenciar_permissoes', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(68, 'dashboard.view', 'Visualizar Dashboard', 'Acessar o dashboard principal', 'dashboard', 'view', Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:43:27 GMT-0300 (Horário Padrão de Brasília)),
(101, 'fichas_epi.list', 'Listar Fichas de EPI', 'Visualizar lista de fichas de EPI', 'fichas_epi', 'list', Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília)),
(102, 'fichas_epi.create', 'Criar Ficha de EPI', 'Cadastrar novas fichas de EPI', 'fichas_epi', 'create', Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília)),
(103, 'fichas_epi.update', 'Editar Ficha de EPI', 'Editar fichas de EPI existentes', 'fichas_epi', 'update', Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília)),
(104, 'fichas_epi.delete', 'Excluir Ficha de EPI', 'Excluir fichas de EPI', 'fichas_epi', 'delete', Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília)),
(141, 'dashboard.create', 'Criar Dashboard', 'Criar no dashboard', 'dashboard', 'create', Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília)),
(142, 'dashboard.update', 'Editar Dashboard', 'Editar no dashboard', 'dashboard', 'update', Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília)),
(143, 'dashboard.delete', 'Excluir Dashboard', 'Excluir no dashboard', 'dashboard', 'delete', Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília)),
(144, 'relatorios.list', 'Listar Relatórios', 'Visualizar lista de relatórios', 'relatorios', 'list', Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília)),
(145, 'relatorios.create', 'Criar Relatório', 'Criar novos relatórios', 'relatorios', 'create', Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília)),
(146, 'relatorios.update', 'Editar Relatório', 'Editar relatórios existentes', 'relatorios', 'update', Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília)),
(147, 'relatorios.delete', 'Excluir Relatório', 'Excluir relatórios', 'relatorios', 'delete', Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 23:51:45 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: permissoes_usuarios
DROP TABLE IF EXISTS `permissoes_usuarios`;
CREATE TABLE `permissoes_usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `empresas_view` tinyint(1) NOT NULL DEFAULT '0',
  `empresas_add` tinyint(1) NOT NULL DEFAULT '0',
  `empresas_edit` tinyint(1) NOT NULL DEFAULT '0',
  `empresas_delete` tinyint(1) NOT NULL DEFAULT '0',
  `empregados_view` tinyint(1) NOT NULL DEFAULT '0',
  `empregados_add` tinyint(1) NOT NULL DEFAULT '0',
  `empregados_edit` tinyint(1) NOT NULL DEFAULT '0',
  `empregados_delete` tinyint(1) NOT NULL DEFAULT '0',
  `fichas_view` tinyint(1) NOT NULL DEFAULT '0',
  `fichas_add` tinyint(1) NOT NULL DEFAULT '0',
  `fichas_edit` tinyint(1) NOT NULL DEFAULT '0',
  `fichas_delete` tinyint(1) NOT NULL DEFAULT '0',
  `os_view` tinyint(1) NOT NULL DEFAULT '0',
  `os_add` tinyint(1) NOT NULL DEFAULT '0',
  `os_edit` tinyint(1) NOT NULL DEFAULT '0',
  `os_delete` tinyint(1) NOT NULL DEFAULT '0',
  `treinamentos_view` tinyint(1) NOT NULL DEFAULT '0',
  `treinamentos_add` tinyint(1) NOT NULL DEFAULT '0',
  `treinamentos_edit` tinyint(1) NOT NULL DEFAULT '0',
  `treinamentos_delete` tinyint(1) NOT NULL DEFAULT '0',
  `certificados_view` tinyint(1) NOT NULL DEFAULT '0',
  `certificados_add` tinyint(1) NOT NULL DEFAULT '0',
  `certificados_edit` tinyint(1) NOT NULL DEFAULT '0',
  `certificados_delete` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuario_id_unique` (`usuario_id`),
  CONSTRAINT `permissoes_usuarios_usuario_id_fk` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela permissoes_usuarios está vazia

-- Estrutura da tabela: planos
DROP TABLE IF EXISTS `planos`;
CREATE TABLE `planos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(100) NOT NULL,
  `nomeExibicao` varchar(255) NOT NULL,
  `descricao` text,
  `precoMensal` int NOT NULL,
  `precoTrimestral` int DEFAULT NULL,
  `limiteEmpresas` int DEFAULT NULL,
  `limiteColaboradoresPorEmpresa` int DEFAULT NULL,
  `limiteColaboradoresTotal` int DEFAULT NULL,
  `recursos` text,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  `ordem` int DEFAULT '0',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `planos_nome_unique` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: planos
LOCK TABLES `planos` WRITE;
INSERT INTO `planos` (`id`, `nome`, `nomeExibicao`, `descricao`, `precoMensal`, `precoTrimestral`, `limiteEmpresas`, `limiteColaboradoresPorEmpresa`, `limiteColaboradoresTotal`, `recursos`, `ativo`, `ordem`, `createdAt`, `updatedAt`) VALUES
(1, 'basico', 'Básico', 'Para empresas que querem sistema fácil e barato', 14700, 39700, 1, NULL, 50, '["Gestão completa de treinamentos","Controle total de EPIs","Emissão de certificados digitais","Alertas automáticos","Suporte por email","Treinamento básico","Sistema fácil de usar"]', 1, 1, Wed Nov 12 2025 00:47:09 GMT-0300 (Horário Padrão de Brasília), Wed Nov 12 2025 00:47:09 GMT-0300 (Horário Padrão de Brasília)),
(2, 'tecnico', 'Técnico/Engenheiro', 'O plano perfeito para profissionais autônomos que querem otimizar e ganhar tempo', 14700, 39700, 6, 30, NULL, '["Até 6 empresas diferentes","Até 30 colaboradores por empresa","Total: até 180 colaboradores","Ganhe 40 horas/mês de tempo livre","Controle total e qualidade garantida","Emissão ilimitada de certificados","Sistema fácil - aprenda em minutos","Relatórios profissionais por empresa","Modelos personalizáveis","Suporte especializado","Acesso mobile completo","Preço justo e acessível"]', 1, 2, Wed Nov 12 2025 00:47:09 GMT-0300 (Horário Padrão de Brasília), Wed Nov 12 2025 00:47:09 GMT-0300 (Horário Padrão de Brasília)),
(3, 'profissional', 'Profissional', 'Para empresas que querem otimizar processos e garantir qualidade', 29700, 79700, NULL, NULL, 200, '["Até 200 colaboradores","Otimização completa de processos","Controle total e qualidade garantida","Múltiplas empresas ilimitadas","Relatórios avançados profissionais","Suporte prioritário 24/7","Ganhe tempo e eficiência","Sistema completo e fácil"]', 1, 3, Wed Nov 12 2025 00:47:09 GMT-0300 (Horário Padrão de Brasília), Wed Nov 12 2025 00:47:09 GMT-0300 (Horário Padrão de Brasília)),
(4, 'enterprise', 'Enterprise', 'Solução personalizada para grandes empresas', 0, 0, NULL, NULL, NULL, '["Colaboradores ilimitados","Customizações exclusivas","API completa integrada","Suporte dedicado 24/7","Treinamento completo da equipe","Consultoria especializada mensal","SLA garantido 99.9%","Onboarding personalizado"]', 1, 4, Wed Nov 12 2025 00:47:09 GMT-0300 (Horário Padrão de Brasília), Wed Nov 12 2025 00:47:09 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: responsaveis
DROP TABLE IF EXISTS `responsaveis`;
CREATE TABLE `responsaveis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomeCompleto` varchar(255) NOT NULL,
  `funcao` varchar(255) DEFAULT NULL,
  `registroProfissional` varchar(100) DEFAULT NULL,
  `empresaId` int DEFAULT NULL,
  `status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: responsaveis
LOCK TABLES `responsaveis` WRITE;
INSERT INTO `responsaveis` (`id`, `nomeCompleto`, `funcao`, `registroProfissional`, `empresaId`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'João Silva Santos', 'Engenheiro de Segurança do Trabalho / Bombeiro Civil', 'CREA 123456-SP', NULL, 'ativo', Tue Nov 04 2025 15:02:14 GMT-0300 (Horário Padrão de Brasília), Wed Nov 05 2025 15:44:33 GMT-0300 (Horário Padrão de Brasília)),
(2, 'Maria Oliveira Costa', 'Técnica em Segurança do Trabalho', 'CREA 789012-RJ', NULL, 'ativo', Tue Nov 04 2025 15:02:14 GMT-0300 (Horário Padrão de Brasília), Tue Nov 04 2025 15:02:14 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: riscosOcupacionais
DROP TABLE IF EXISTS `riscosOcupacionais`;
CREATE TABLE `riscosOcupacionais` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomeRisco` varchar(255) NOT NULL,
  `descricao` text,
  `tipoRisco` enum('fisico','quimico','biologico','ergonomico','mecanico') NOT NULL,
  `codigo` varchar(50) DEFAULT NULL,
  `empresaId` int DEFAULT NULL,
  `status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: riscosOcupacionais
LOCK TABLES `riscosOcupacionais` WRITE;
INSERT INTO `riscosOcupacionais` (`id`, `nomeRisco`, `descricao`, `tipoRisco`, `codigo`, `empresaId`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Físico', NULL, 'fisico', NULL, NULL, 'ativo', Sat Nov 08 2025 00:39:09 GMT-0300 (Horário Padrão de Brasília), Sat Nov 08 2025 00:39:09 GMT-0300 (Horário Padrão de Brasília)),
(2, 'Químico', NULL, 'quimico', NULL, NULL, 'ativo', Sat Nov 08 2025 00:39:09 GMT-0300 (Horário Padrão de Brasília), Sat Nov 08 2025 00:39:09 GMT-0300 (Horário Padrão de Brasília)),
(3, 'Biológico', NULL, 'biologico', NULL, NULL, 'ativo', Sun Nov 09 2025 20:24:57 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:24:57 GMT-0300 (Horário Padrão de Brasília)),
(4, 'Ergonômico', NULL, 'ergonomico', NULL, NULL, 'ativo', Sun Nov 09 2025 20:24:58 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:24:58 GMT-0300 (Horário Padrão de Brasília)),
(5, 'Agentes Mecânicos', NULL, 'mecanico', NULL, NULL, 'ativo', Sun Nov 09 2025 20:24:58 GMT-0300 (Horário Padrão de Brasília), Sun Nov 09 2025 20:24:58 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: setores
DROP TABLE IF EXISTS `setores`;
CREATE TABLE `setores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomeSetor` varchar(255) NOT NULL,
  `descricao` text,
  `empresaId` int DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: setores
LOCK TABLES `setores` WRITE;
INSERT INTO `setores` (`id`, `nomeSetor`, `descricao`, `empresaId`, `createdAt`, `updatedAt`) VALUES
(2, 'Diretoria / Presidência', 'Diretoria executiva e presidência da empresa, responsável pelas decisões estratégicas e governança corporativa.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(3, 'Departamento Financeiro', 'Gestão financeira, contabilidade, controle orçamentário, fluxo de caixa e análises financeiras da empresa.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(4, 'Recursos Humanos (RH)', 'Gestão de pessoas, recrutamento, seleção, treinamentos, folha de pagamento, benefícios e desenvolvimento organizacional.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(5, 'Departamento Jurídico', 'Assessoria jurídica, contratos, processos, compliance, questões regulatórias e questões legais da empresa.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(6, 'Departamento Comercial', 'Vendas, negociações comerciais, relacionamento com clientes, prospecção de novos negócios e gestão de carteira de clientes.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(7, 'Marketing e Comunicação', 'Estratégias de marketing, comunicação corporativa, publicidade, branding, eventos e relacionamento com a mídia.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(8, 'Compras e Suprimentos', 'Gestão de compras, negociação com fornecedores, controle de materiais, licitações e gestão de contratos de fornecimento.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(9, 'Almoxarifado / Logística', 'Controle de estoque, armazenamento de materiais, movimentação de cargas, distribuição e gestão logística.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(10, 'Tecnologia da Informação (TI)', 'Gestão de sistemas, infraestrutura de TI, suporte técnico, desenvolvimento, segurança da informação e tecnologia.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(11, 'Departamento Administrativo', 'Gestão administrativa, documentação, protocolo, arquivo, atendimento e serviços administrativos gerais.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(12, 'Engenharia de Obras', 'Projetos de engenharia, planejamento técnico, execução de obras, supervisão técnica e engenharia de campo.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(13, 'Departamento de Projetos', 'Gestão de projetos, planejamento, acompanhamento de prazos, escopo, recursos e entrega de projetos.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(14, 'Planejamento e Controle de Obras (PCO)', 'Planejamento de obras, cronogramas, controle de produção, acompanhamento físico-financeiro e gestão de obras.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(15, 'Segurança do Trabalho (SST)', 'Gestão de segurança do trabalho, prevenção de acidentes, saúde ocupacional, NRs, EPIs e treinamentos de segurança.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(16, 'Qualidade (SGQ)', 'Gestão da qualidade, controle de qualidade, auditorias, certificações, normas técnicas e garantia de qualidade.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(17, 'Meio Ambiente (SMA)', 'Gestão ambiental, licenciamento ambiental, sustentabilidade, monitoramento ambiental e compliance ambiental.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(18, 'Topografia', 'Levantamentos topográficos, georreferenciamento, locação de obras, cálculos de terraplanagem e serviços topográficos.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(19, 'Manutenção e Equipamentos', 'Manutenção de equipamentos, máquinas e veículos, gestão de frota, manutenção preventiva e corretiva.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(20, 'Custos e Orçamentos', 'Orçamentação de obras, composição de custos, análise de viabilidade, controle de custos e engenharia de custos.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília)),
(21, 'Pós-Obra / Assistência Técnica', 'Assistência técnica pós-obra, garantia de obras, manutenção pós-entrega, atendimento ao cliente e suporte técnico.', NULL, Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:28:31 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: tiposEpis
DROP TABLE IF EXISTS `tiposEpis`;
CREATE TABLE `tiposEpis` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tipoEpi` varchar(255) NOT NULL,
  `caNumero` varchar(50) DEFAULT NULL,
  `fabricante` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: tiposEpis
LOCK TABLES `tiposEpis` WRITE;
INSERT INTO `tiposEpis` (`id`, `tipoEpi`, `caNumero`, `fabricante`, `createdAt`, `updatedAt`) VALUES
(1, 'Luva de Raspa', '3026', 'Labrob', Thu Nov 06 2025 17:13:52 GMT-0300 (Horário Padrão de Brasília), Thu Nov 06 2025 17:14:41 GMT-0300 (Horário Padrão de Brasília)),
(2, 'Capacete Rosa', '545454', 'MSA', Thu Nov 06 2025 17:15:25 GMT-0300 (Horário Padrão de Brasília), Thu Nov 06 2025 17:15:25 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: tiposTreinamentos
DROP TABLE IF EXISTS `tiposTreinamentos`;
CREATE TABLE `tiposTreinamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomeTreinamento` varchar(255) NOT NULL,
  `descricao` text,
  `tipoNr` varchar(50) DEFAULT NULL,
  `validadeEmMeses` int DEFAULT NULL,
  `empresaId` int DEFAULT NULL,
  `status` enum('ativo','inativo') NOT NULL DEFAULT 'ativo',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: tiposTreinamentos
LOCK TABLES `tiposTreinamentos` WRITE;
INSERT INTO `tiposTreinamentos` (`id`, `nomeTreinamento`, `descricao`, `tipoNr`, `validadeEmMeses`, `empresaId`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Reciclagem de NR10', 'Curso de atualização com carga horária de 20 horas, voltado à revisão dos principais conceitos de segurança em instalações e serviços com eletricidade, medidas preventivas e procedimentos conforme a NR-10.', 'Outro', 24, NULL, 'ativo', Mon Nov 03 2025 19:19:47 GMT-0300 (Horário Padrão de Brasília), Mon Nov 03 2025 19:19:47 GMT-0300 (Horário Padrão de Brasília)),
(2, 'NR18 Admissional', 'Básico em segurança do
trabalho ', 'NR-10', 24, NULL, 'ativo', Tue Nov 04 2025 16:16:26 GMT-0300 (Horário Padrão de Brasília), Tue Nov 04 2025 16:16:26 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: treinamentos
DROP TABLE IF EXISTS `treinamentos`;
CREATE TABLE `treinamentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomeTreinamento` varchar(255) NOT NULL,
  `tipoNr` varchar(50) DEFAULT NULL,
  `colaboradorId` int NOT NULL,
  `empresaId` int NOT NULL,
  `dataRealizacao` date DEFAULT NULL,
  `dataValidade` date DEFAULT NULL,
  `status` enum('valido','vencido','a_vencer') NOT NULL DEFAULT 'valido',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: treinamentos
LOCK TABLES `treinamentos` WRITE;
INSERT INTO `treinamentos` (`id`, `nomeTreinamento`, `tipoNr`, `colaboradorId`, `empresaId`, `dataRealizacao`, `dataValidade`, `status`, `createdAt`, `updatedAt`) VALUES
(1, 'Treinamento 12', 'Outro', 166, 1, Tue Dec 31 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), Tue Dec 31 2024 00:00:00 GMT-0300 (Horário Padrão de Brasília), 'valido', Fri Nov 07 2025 22:01:32 GMT-0300 (Horário Padrão de Brasília), Fri Nov 07 2025 22:01:32 GMT-0300 (Horário Padrão de Brasília));

UNLOCK TABLES;

-- Estrutura da tabela: userPermissoes
DROP TABLE IF EXISTS `userPermissoes`;
CREATE TABLE `userPermissoes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `permissaoId` int NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `userPermissoes_userId_permissaoId_unique` (`userId`,`permissaoId`),
  KEY `userPermissoes_userId_idx` (`userId`),
  KEY `userPermissoes_permissaoId_idx` (`permissaoId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela userPermissoes está vazia

-- Estrutura da tabela: users
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `openId` varchar(64) DEFAULT NULL,
  `name` text,
  `email` varchar(320) DEFAULT NULL,
  `cpf` varchar(14) DEFAULT NULL,
  `cnpj` varchar(18) DEFAULT NULL,
  `passwordHash` varchar(255) DEFAULT NULL,
  `loginMethod` varchar(64) DEFAULT NULL,
  `role` enum('user','admin','gestor','tecnico') NOT NULL DEFAULT 'user',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  `lastSignedIn` timestamp NOT NULL DEFAULT (now()),
  `empresaId` int DEFAULT NULL,
  `planoId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_openId_unique` (`openId`),
  UNIQUE KEY `cpf` (`cpf`),
  UNIQUE KEY `cnpj` (`cnpj`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_cpf_unique` (`cpf`),
  UNIQUE KEY `users_cnpj_unique` (`cnpj`)
) ENGINE=InnoDB AUTO_INCREMENT=4363 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Dados da tabela: users
LOCK TABLES `users` WRITE;
INSERT INTO `users` (`id`, `openId`, `name`, `email`, `cpf`, `cnpj`, `passwordHash`, `loginMethod`, `role`, `createdAt`, `updatedAt`, `lastSignedIn`, `empresaId`, `planoId`) VALUES
(4198, 'local-cpf-38099529820', 'Administrador Geral', NULL, '38099529820', NULL, '$2b$10$bbewCYZn8QMndDXKwR7H.u5am4ahPf1R/M7K9WlCxjs.NwqZwW8AO', 'local', 'admin', Sun Nov 09 2025 23:38:59 GMT-0300 (Horário Padrão de Brasília), Wed Nov 12 2025 14:12:50 GMT-0300 (Horário Padrão de Brasília), Wed Nov 12 2025 14:12:50 GMT-0300 (Horário Padrão de Brasília), NULL, 1);

UNLOCK TABLES;

SET FOREIGN_KEY_CHECKS=1;
