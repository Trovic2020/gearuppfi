# 🚗 GearUp

Plataforma web para gerenciamento completo de veículos — manutenção, abastecimentos, gastos, documentação e informações importantes do automóvel em um único lugar.

## Objetivo

O GearUp ajuda o usuário a manter seu veículo organizado, reduzir custos inesperados, evitar esquecimentos (revisões, seguro, documentos) e ter acesso rápido ao histórico completo do veículo.

**Público-alvo:** proprietários de carros e motos, motoristas de aplicativo, pequenas frotas, e qualquer pessoa que queira acompanhar gastos e manutenção preventiva.

---

## Stack utilizada

| Camada | Tecnologia |
|---|---|
| Front-end | HTML, CSS e JavaScript puro (sem frameworks) |
| Back-end | Node.js + Express.js |
| Banco de dados | MySQL |
| Autenticação | JWT (JSON Web Token) + bcrypt |
| Upload de arquivos | Multer |
| Geração de PDF | PDFKit |

---

## Estrutura de pastas

```
gearuppfi/
├── backend/
│   ├── config/
│   │   ├── database.js         # conexão com o MySQL
│   │   ├── upload.js           # upload de documentos (PDF/JPG/PNG)
│   │   └── uploadFoto.js       # upload de foto do veículo (JPG/PNG/WEBP)
│   ├── controllers/            # lógica de cada módulo (um arquivo por entidade)
│   ├── routes/                 # definição das rotas de cada módulo
│   ├── middlewares/
│   │   └── authMiddleware.js   # valida o token JWT nas rotas protegidas
│   ├── uploads/                # arquivos enviados pelos usuários (não versionado)
│   ├── .env                    # variáveis de ambiente (não versionado)
│   ├── server.js                # ponto de entrada da API
│   └── package.json
│
└── frontend/
    ├── css/                     # estilos globais e por módulo
    ├── js/
    │   ├── api.js               # camada única de comunicação com o backend
    │   ├── utils.js             # funções auxiliares (formatação, sessão, etc)
    │   └── ...                  # um arquivo de lógica por tela
    ├── index.html                # login
    ├── cadastro.html
    ├── veiculos.html             # tela "hub" após o login
    ├── dashboard.html
    └── ... (demais telas)
```

---

## Como rodar o projeto localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado
- MySQL instalado (Workbench, XAMPP ou similar)
- Extensão **Live Server** no VS Code (para rodar o front-end)

### 1. Banco de dados

Crie o banco e rode o script de criação das tabelas (10 tabelas: `usuarios`, `veiculos`, `manutencoes`, `abastecimentos`, `pneus`, `seguros`, `documentos`, `oficinas`, `gastos`, `alertas`).

```sql
CREATE DATABASE IF NOT EXISTS gearup
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` na pasta `backend/` com:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_do_mysql
DB_NAME=gearup
JWT_SECRET=uma_frase_aleatoria_e_secreta
```

Rode o servidor:

```bash
npm run dev
```

A API sobe em `http://localhost:3000`.

### 3. Frontend

Abra a pasta `frontend/` no VS Code e clique com o botão direito em `index.html` → **Open with Live Server**.

> O front-end é HTML/CSS/JS puro — não precisa de `npm install` nem build. O Live Server só serve os arquivos estáticos.

---

## Funcionalidades

- **Autenticação** — cadastro, login, recuperação de senha, edição de perfil (JWT)
- **Gerenciamento de veículos** — CRUD completo, com foto e soft delete
- **Manutenções** — histórico de serviços, vinculado a oficinas
- **Abastecimentos** — histórico com cálculo automático de consumo médio (km/l) e preço médio por litro
- **Pneus** — controle de vida útil com status (OK / Atenção / Trocar)
- **Seguro** — controle de apólices com status de vencimento
- **Documentação digital** — upload/download/exclusão de CRLV, IPVA, laudos etc (PDF/JPG/PNG)
- **Oficinas** — cadastro compartilhado entre todos os veículos do usuário
- **Controle financeiro** — todos os gastos consolidados por categoria, mês e ano
- **Sistema de alertas** — gerados automaticamente a partir de pneus, seguro e documentos vencendo
- **Dashboard** — indicadores e gráficos (em CSS puro, sem bibliotecas externas)
- **Saúde do veículo** — índice de 0 a 100 baseado em 5 critérios
- **Relatórios em PDF** — relatório completo do veículo para download

---

## Resumo da API

Todas as rotas (exceto cadastro/login) exigem o header:
```
Authorization: Bearer <token>
```

| Módulo | Base da rota |
|---|---|
| Autenticação | `/api/auth` |
| Veículos | `/api/veiculos` |
| Oficinas | `/api/oficinas` |
| Manutenções | `/api/veiculos/:veiculoId/manutencoes` |
| Abastecimentos | `/api/veiculos/:veiculoId/abastecimentos` |
| Pneus | `/api/veiculos/:veiculoId/pneus` |
| Seguros | `/api/veiculos/:veiculoId/seguros` |
| Documentos | `/api/veiculos/:veiculoId/documentos` |
| Gastos | `/api/veiculos/:veiculoId/gastos` |
| Alertas | `/api/veiculos/:veiculoId/alertas` |
| Dashboard | `/api/veiculos/:veiculoId/dashboard` |
| Saúde do veículo | `/api/veiculos/:veiculoId/saude` |
| Relatórios | `/api/veiculos/:veiculoId/relatorios/completo` |
| Foto do veículo | `POST /api/veiculos/:id/foto` |

---

## Próximos passos possíveis

- [ ] Deploy do backend, banco e frontend (ex: Railway/Render + hospedagem estática)
- [ ] Envio de e-mail real na recuperação de senha (Nodemailer) — hoje o token aparece na própria tela, em modo desenvolvimento
- [ ] Exportação de dados em CSV/Excel
- [ ] Notificações por e-mail quando novos alertas forem gerados
- [ ] Tema claro/escuro

---

## Licença

Projeto de uso pessoal/educacional.