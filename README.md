# 🎲 RPED: Sistema de Rolagem de Dados 🎲

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)![Version](https://img.shields.io/badge/version-1.0.0-blue)![License](https://img.shields.io/badge/license-ISC-orange)](N/A)

## 🌟 Descrição
A API RPED é uma aplicação em JavaScript desenvolvida para jogos de RPG de mesa, fornecendo um sistema avançado de rolagem de dados. Utiliza Node.js, Express e MongoDB para gerenciar os dados dos jogadores, estatísticas das guildas e a mecânica das rolagens. O sistema inclui recursos como rolagens com pesos, ajustes de karma e bônus de resgate (rescue), com o objetivo de manter as partidas equilibradas.

A aplicação conta com um painel web para a visualização dos dados, o que facilita o gerenciamento e o monitoramento das estatísticas do jogo por meio de uma interface responsiva.

## 📜 Índice
- [🌟 Descrição](#descrição)
- [🎲 Principais Funcionalidades](#principais-funcionalidades)
- [🚀 Tecnologias Utilizadas](#tecnologias-utilizadas)
- [⬇️ Instalação](#instalação)
- [▶️ Como Usar](#como-usar)
- [📂 Estrutura do Projeto](#estrutura-do-projeto)
- [🚀 Referência da API](#referência-da-api)
- [🤝 Como Contribuir](#como-contribuir)
- [📜 Licença](#licença)
- [🔗 Links Importantes](#links-importantes)

## 🚀 Principais Funcionalidades
- **Rolagem de Dados Avançada:** Suporta dados de tamanhos variados (d4 a d1000) com modificadores e um sistema de pesos influenciado pela sorte do jogador.
- **Sistema de Sorte Dinâmico:** Cada usuário possui um nível de sorte diário que afeta as probabilidades matemáticas da rolagem.
- **Sistema de Karma:** Ajusta os resultados com base no desempenho do jogador em comparação à média da guilda, aplicando penalidades caso as rolagens sejam consistentemente muito altas.
- **Sistema de Resgate:** Um sistema proativo que oferece bônus para jogadores com rolagens consistentemente abaixo da média, equilibrando os resultados.
- **Persistência de Dados:** Usa MongoDB para armazenar informações de usuários, guildas e histórico de rolagens.
- **Dados em Tempo Real:** Usa Redis para gerenciar sessões em cache, níveis de sorte diários e estatísticas rápidas.
- **API Segura:** Implementa autenticação por chave de API e limitação de requisições (rate limiting) para manter os endpoints seguros.
- **Painel Administrativo:** Interface web para administradores visualizarem usuários e guildas, com sistema de busca e visão geral.
- **Monitoramento:** Endpoint `/health` disponível para checar o status da aplicação e das conexões com o MongoDB e Redis.
- **Escalabilidade:** Arquitetura modular construída para lidar com um alto volume de requisições e processamento simultâneo.

## 🚀 Tecnologias Utilizadas
- **Linguagem:** JavaScript (Node.js)
- **Framework:** Express.js
- **Bancos de Dados:** MongoDB, Redis
- **Bibliotecas Principais:** Zod (validação), Helmet (segurança), dotenv (variáveis de ambiente), ioredis (cliente Redis), Mongoose (ODM MongoDB), express-rate-limit (limitação de tráfego)
- **Frontend do Painel:** HTML, CSS, JavaScript

## ⬇️ Instalação
1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/PedroMissola/rped.git
    cd rped
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Configure as variáveis de ambiente:**
    Crie um arquivo `.env` na raiz do diretório com as seguintes variáveis:

    ```env
    PORT=80
    MONGO_URI=mongodb://localhost:27017/rped
    REDIS_URI=redis://localhost:6379
    BOT_API_KEY=sua_chave_de_api
    BOT_API_SECRET=seu_segredo_de_api
    DASHBOARD_SECRET=sua_senha_do_painel
    # Adicione outras variáveis necessárias conforme o ambiente
    ```

4.  **Configure os Certificados TLS:**
    Coloque os certificados TLS para o MongoDB e o Redis nos diretórios `certs/mongo` e `certs/redis`. Os arquivos devem ser nomeados como `ca-certificate.crt`, `certificate.pem` e `private-key.key`.

5.  **Inicie o servidor:**
    ```bash
    npm start
    ```

## ▶️ Como Usar
A API pode ser utilizada como o serviço backend para aplicações de RPG de mesa, processando as rolagens, estatísticas e gerenciando os grupos (guildas).

### Funcionalidades Básicas:
1.  **Rolagem de Dados:**
    Envie uma requisição POST para `/api/roll` com o seguinte formato JSON:
    ```json
    {
      "guildId": "ID_DA_GUILDA",
      "usuarioId": "ID_DO_USUARIO",
      "tamanhoDado": 20, // Opcional, o padrão é 20
      "modificador": 0   // Opcional, o padrão é 0
    }
    ```
    A resposta retornará o resultado da face do dado, o valor total, qualquer ação tomada pelo sistema (Karma, Resgate) e as estatísticas.

2.  **Status do Jogador:**
    Para consultar as estatísticas de um jogador, envie uma requisição GET para `/api/player-status` informando `guildId` e `userId` na URL:
    ```bash
    GET /api/player-status?guildId=ID_DA_GUILDA&userId=ID_DO_USUARIO
    ```

3.  **Configurações da Guilda:**
    - Consultar configurações: `GET /api/guilds/:guildId/settings`
    - Atualizar configurações: `PUT /api/guilds/:guildId/settings` (exige o objeto `settings` no corpo)
    - Sincronizar membros: `POST /api/guilds/:guildId/sync-members` (exige o array `members` no corpo)

4.  **Estatísticas e Logs:**
    - Registrar um evento: `POST /api/stats/record`
    - Salvar um log no sistema: `POST /api/logs`

### Acesso ao Painel:
O sistema inclui um painel administrativo acessível pelo navegador na URL base (ex: `http://localhost:PORT`).

1.  **Login:** Você precisará inserir um token de acesso, que é o valor definido na variável de ambiente `DASHBOARD_SECRET`.
2.  **Lista de Usuários:** A página principal exibe uma tabela com os usuários, níveis de permissão, uso de comandos e pontuação de sorte. É possível filtrar usuários pelo ID da guilda.
3.  **Detalhes do Usuário:** Ao clicar em um usuário, você verá métricas específicas dele em cada guilda.

**Exemplo de Requisição (Rolando um d20 com modificador +2):**
```bash
curl -X POST   http://localhost:80/api/roll   -H 'Content-Type: application/json'   -d '{ 
    "guildId": "1234567890", 
    "usuarioId": "9876543210", 
    "tamanhoDado": 20, 
    "modificador": 2 
  }'
```

**Exemplo de Resposta:**
```json
{
  "success": true,
  "data": {
    "userId": "9876543210",
    "guildId": "1234567890",
    "diceSize": 20,
    "modifier": 2,
    "displayFace": 18,
    "finalTotal": 20,
    "systemAction": "Karma",
    "stats": {
      "individualAverage": 0.75,
      "globalAverage": 0.60,
      "luckLevel": 8
    }
  }
}
```

## 📂 Estrutura do Projeto
```
rped/
├── dashboard/
│   ├── css/
│   │   ├── additions.css
│   │   └── style.css
│   ├── js/
│   │   ├── main.js
│   │   └── user.js
│   ├── index.html
│   └── login.html
│   └── user.html
├── certs/
│   ├── mongo/
│   │   ├── ca-certificate.crt
│   │   ├── certificate.pem
│   │   └── private-key.key
│   └── redis/
│       ├── ca-certificate.crt
│       ├── certificate.pem
│       └── private-key.key
├── src/
│   ├── config/
│   │   ├── apiKeys.js
│   │   ├── mongo.js
│   │   ├── rpedConstants.js
│   │   └── redis.js
│   ├── controllers/
│   │   ├── analyticsController.js
│   │   ├── guildController.js
│   │   ├── playerStatusController.js
│   │   ├── rollController.js
│   │   └── statsController.js
│   ├── middlewares/
│   │   ├── authenticate.js
│   │   ├── dashboardAuth.js
│   │   ├── errorHandler.js
│   │   ├── rateLimiters.js
│   │   ├── sanitize.js
│   │   ├── validate.js
│   │   └── validateQuery.js
│   ├── models/
│   │   ├── Guild.js
│   │   ├── Log.js
│   │   ├── Rolagem.js
│   │   ├── Rped.js
│   │   └── User.js
│   ├── routes/
│   │   ├── analyticsRoutes.js
│   │   ├── dashboardRoutes.js
│   │   ├── guildRoutes.js
│   │   ├── playerStatusRoutes.js
│   │   ├── rollRoutes.js
│   │   └── statsRoutes.js
│   ├── schemas/
│   │   ├── analyticsSchema.js
│   │   ├── guildSchema.js
│   │   ├── playerStatusSchema.js
│   │   └── rollSchema.js
│   ├── services/
│   │   ├── rollService.js
│   │   └── rpedService.js
│   └── utils/
│       ├── AppError.js
│       ├── auditQueue.js
│       └── mathUtils.js
├── .env
├── .gitignore
├── index.js
├── package-lock.json
├── package.json
└── squarecloud.app
```

## 🚀 Referência da API
A API RPED expõe os seguintes endpoints e middlewares para interagir com o sistema:

### Middleware de Autenticação (`src/middlewares/authenticate.js`)
- Exige os cabeçalhos `x-api-key`, `x-timestamp` e `x-signature` para validar requisições.
- Compara as chaves e timestamps com as configurações em `src/config/apiKeys.js`.

### Middleware do Painel (`src/middlewares/dashboardAuth.js`)
- Protege as rotas do painel e os endpoints que começam com `/api`.
- Exige o cabeçalho `x-dashboard-token`, que é validado pela variável `DASHBOARD_SECRET`.
- Redireciona usuários sem acesso para `/dashboard/login.html`.

### Limite de Requisições (`src/middlewares/rateLimiters.js`)
- **`rollLimiter`:** Máximo de 120 rolagens a cada 10 segundos por usuário/chave.
- **`guildSettingsLimiter`:** Máximo de 20 atualizações de configuração por minuto, por guilda/chave.
- **`analyticsLimiter`:** Máximo de 500 requisições de log/estatística por minuto, por chave.

### Rotas:
- **`/api/roll` (POST):** Realiza uma rolagem. Parâmetros: `guildId`, `usuarioId`, `tamanhoDado` (opcional), `modificador` (opcional).
- **`/api/player-status` (GET):** Retorna os status de um jogador. Parâmetros de URL: `guildId` e `userId`.
- **`/api/guilds/:guildId/settings` (GET, PUT):** Lê ou atualiza as configurações da guilda.
- **`/api/guilds/:guildId/sync-members` (POST):** Sincroniza a lista de membros da guilda.
- **`/api/stats/record` (POST):** Registra eventos para análise.
- **`/api/logs` (POST):** Salva logs de sistema.
- **`/api/stats/bot` (GET):** Retorna estatísticas gerais da API.
- **`/api/stats/guild/:guildId` (GET):** Retorna estatísticas de uma guilda específica.
- **`/api/stats/user/:userId` (GET):** Retorna estatísticas de um usuário específico.
- **`/dashboard` (GET):** Carrega a interface principal do painel (`dashboard/index.html`).
- **`/dashboard/user/:userId` (GET):** Carrega a página de detalhes do usuário (`dashboard/user.html`).
- **`/dashboard/api/users` (GET):** Lista os usuários de forma paginada.
- **`/dashboard/api/users/:userId` (GET):** Retorna os dados detalhados de um usuário específico.
- **`/dashboard/api/guilds/:guildId/users` (GET):** Lista todos os usuários registrados em uma guilda.

## 🤝 Como Contribuir
Contribuições para o projeto são bem-vindas:

1.  Faça um Fork do repositório.
2.  Crie uma nova branch para a sua funcionalidade (`git checkout -b feature/nome-da-feature`).
3.  Faça os commits com as suas alterações (`git commit -m 'Adiciona nova funcionalidade'`).
4.  Envie para a branch principal (`git push origin feature/nome-da-feature`).
5.  Abra um Pull Request.

Certifique-se de manter o padrão de código do projeto.

## 📜 Licença
Este projeto está sob a licença ISC - veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🔗 Links Importantes
- **Repositório:** [https://github.com/PedroMissola/rped](https://github.com/PedroMissola/rped)
- **Reportar Problemas 🐞:** [https://github.com/PedroMissola/rped/issues](https://github.com/PedroMissola/rped/issues)

---
✨ **RPED API** | Feito por PedroMissola
© 2024 RPED. Todos os direitos reservados.
