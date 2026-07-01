# Sistema de Frequência — Juventude Tech v3.0

Sistema web de **registro de frequência aos sábados de aulão** dos 3 cursos do
Juventude Tech (Ceará de Valores / ALECE / Centec):

- **Programação Full Stack** (192h)
- **Inteligência Artificial** (96h)
- **Marketing Digital** (192h)

> De segunda a sexta o conteúdo é assíncrono pelo Moodle — este sistema **não**
> controla presença nesses dias. Ele existe só para os aulões ao vivo de sábado.

---

## 🆕 O que mudou na v3.0

Esta versão parte do sistema v2.0 e ajusta o que estava pendente para o
programa real de 2026:

1. **Cronograma real**: as datas de aulão de cada curso foram extraídas
   diretamente da planilha oficial (`Cronograma_Juventude_Tech_2026.xlsx`) —
   só sábados, com o feriado de 15/08 já excluído. Antes o sistema tinha datas
   de fevereiro/abril como placeholder.
2. **Validação de horário de verdade**: antes, o backend aceitava check-in e
   check-out a **qualquer hora do dia** — só o frontend escondia os botões.
   Agora o servidor valida dia + horário antes de gravar qualquer ponto.
3. **Login sem dados sensíveis**: continua sendo só e-mail + data de
   nascimento (já era assim na v2, mantido).
4. **Feedback obrigatório no check-out**: nota de 1 a 5 + comentário opcional
   (já existia na v2, mantido e revisado).
5. **Identidade visual oficial**: paleta trocada para as cores reais do
   material institucional do Juventude Tech (azul royal `#2a3fae`,
   azul-marinho `#15215e`, azul claro `#3882ff`) — antes usava um laranja que
   não é da marca.
6. **Manual do Aluno**: nova página dentro do sistema (e acessível antes mesmo
   de logar) explicando como tudo funciona.
7. **Segredo de produção removido**: o arquivo `backend/.env` que veio no zip
   original continha uma chave real do Supabase e um JWT secret em texto
   puro. Foi removido deste pacote — **veja o aviso de segurança no
   [DEPLOY.md](./DEPLOY.md)**.

---

## 🚀 Como rodar localmente

### 1. Banco de dados (Supabase)
Antes de tudo, rode o script `backend/schema.sql` no SQL Editor do seu projeto
Supabase — ele cria as tabelas `alunos`, `presencas` e `justificativas_logs`.
Detalhes em [DEPLOY.md](./DEPLOY.md).

### 2. Backend (Node.js)
```bash
cd backend
npm install
cp .env.example .env
# edite o .env com suas credenciais do Supabase (veja DEPLOY.md)
npm start
# Rodando em http://localhost:3001
```

### 3. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
# Rodando em http://localhost:5173
```

Abra `http://localhost:5173`. Para testar check-in/check-out fora do
horário real do sábado, veja "Testando localmente fora do horário" abaixo.

---

## 📁 Estrutura

```
juventude-tech/
├── backend/
│   ├── index.js          # API Express — TODAS as regras de negócio/validação
│   ├── schema.sql         # Schema do banco (rode no Supabase antes de tudo)
│   ├── .env.example       # Modelo de variáveis de ambiente
│   └── package.json
├── frontend/
│   └── src/
│       ├── App.jsx                     # App principal + roteamento
│       ├── App.css                     # Design System (paleta oficial)
│       ├── Constants.js                # Cursos, cronograma, horários, helpers
│       ├── Api.js                      # Utilitário de fetch autenticado
│       ├── Login.jsx                   # Tela de login
│       ├── Manual.jsx                  # Manual do Aluno
│       ├── HomeAdmin.jsx               # Dashboard do administrador
│       ├── Admin.jsx                   # Gerenciamento de alunos
│       ├── GestaoRapida.jsx            # Edição e gestão em massa
│       ├── ImportacaoJustificativas.jsx# Importação CSV/Excel
│       └── Perfil.jsx                  # Perfil do aluno
├── .gitignore
└── DEPLOY.md              # Passo a passo de GitHub + deploy + hospedagem grátis
```

---

## ✅ Funcionalidades

### Aluno
- Login com e-mail + data de nascimento (sem nenhum outro dado sensível)
- Check-in e check-out **somente aos sábados de aulão do seu curso**, dentro
  da janela de horário liberada (validado no servidor, não só na tela)
- Feedback obrigatório no check-out (nota 1–5 + comentário opcional)
- Histórico completo de presenças com status
- Frequência (%) calculada com base no cronograma real do curso
- Manual do Aluno explicando tudo, acessível mesmo sem login
- Edição de perfil e avatar

### Administrador
- Dashboard em tempo real (alunos ativos, estatísticas)
- Próximos aulões de cada curso (data + tema)
- Busca e filtros avançados (turma, status, data)
- Modal de gerenciamento por aluno (histórico, edição, ponto manual)
- Detecção e remoção de e-mails duplicados
- Exportação de relatórios CSV com período customizável
- Importação de justificativas via CSV/Excel

---

## 📅 Editando o cronograma ou os horários

Tudo fica em **dois arquivos espelhados** (frontend e backend leem o mesmo
cronograma, mas como são dois ambientes/runtimes separados, cada um tem sua
própria cópia das constantes):

- `frontend/src/Constants.js`
- `backend/index.js` (seção `CRONOGRAMAS OFICIAIS`, no topo do arquivo)

Em cada um, edite:
- `CRONOGRAMAS` → lista de datas (sábados) de cada curso
- `HORARIOS_AULAO` → horário de início/fim de cada curso (hoje: 08:00–12:00
  para os 3, conforme combinado)
- `TOLERANCIA_ANTES_MIN` / `TOLERANCIA_DEPOIS_MIN` → margem de tolerância do
  check-in/check-out (hoje: 15 min antes / 30 min depois do horário oficial)

**Sempre altere os dois arquivos juntos.** O backend é quem decide de
verdade se o ponto é aceito — o frontend só usa essas constantes para a tela
não deixar clicar à toa.

---

## 🧪 Testando localmente fora do horário do sábado

Por padrão, fora do horário/dia real do aulão os botões de check-in/check-out
ficam bloqueados — isso é proposital. Para testar localmente sem esperar o
sábado, abra o console do navegador (F12) rodando `npm run dev` e digite:

```js
localStorage.setItem("jt_modo_teste", "1")
```
Recarregue a página. Para desligar, rode `localStorage.removeItem("jt_modo_teste")`.

Isso só funciona em `npm run dev` — em produção (`npm run build`) o modo
teste fica sempre desligado, mesmo que alguém tente forçar essa chave no
navegador.

---

## 🔒 Variáveis de Ambiente

### `backend/.env`
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua-chave-service-role-aqui
JWT_SECRET=um-segredo-longo-e-aleatorio
ADMIN_EMAIL=admin@juventudetech.com
ADMIN_PASS=uma-senha-de-admin
PORT=3001
```

### `frontend/.env` (opcional, só se backend estiver em domínio separado)
```env
VITE_API_URL=https://seu-backend.onrender.com/api
```

---

## 📘 Próximos passos

Veja **[DEPLOY.md](./DEPLOY.md)** para:
- ⚠️ Aviso de segurança (chave exposta no zip original)
- Como criar as tabelas no Supabase
- Como subir o projeto no GitHub
- Como colocar no ar de graça (Vercel + Render)
- Checklist final antes de divulgar o link para os alunos
