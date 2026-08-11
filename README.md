# Wiki / Intranet A2F

Intranet corporativa da A2F (wiki, mural, documentos de colaboradores, PDI, gestao de projetos internos, eventos). Aplicacao Vite + React + Supabase.

## Banco de dados

Usa o **mesmo projeto Supabase do sistema A2F Gestao** (projeto `Site_a2f`, ref `ltuaaankunjsatowwekn`). O login e compartilhado: a mesma conta de `auth.users` entra nos dois sistemas.

A conexao vem de variaveis de ambiente. Copie `.env.local.example` para `.env.local`:

```
VITE_SUPABASE_URL=https://ltuaaankunjsatowwekn.supabase.co
VITE_SUPABASE_ANON_KEY=...   # anon key do projeto Site_a2f
```

## Rodar local

```
npm install
npm run dev      # http://localhost:3000
```

## Atencao — tabelas ainda nao criadas no banco compartilhado

Este app foi exportado do Horizons apontando para outro projeto Supabase, entao as tabelas
que ele usa (`wiki_articles`, `wiki_categories`, `profiles`, `mural_posts`, `pdi`,
`employee_documents`, `projects_module`, `project_tasks`, `company_events`, etc.) **ainda
nao existem** no projeto `Site_a2f`. Elas precisam ser criadas la antes do app funcionar.

Ha duas tabelas cujo nome **colide** com o sistema A2F Gestao, que ja roda em producao
nesse mesmo banco:

- `projects`  (Gestao = workspaces Ayumana/A2F/EPIC)
- `notifications`  (Gestao = notificacoes internas de tarefas)

Recomendado: renomear essas duas no codigo da wiki (ex.: `wiki_projects`,
`wiki_notifications`) antes de criar o schema, para nao conflitar com o sistema em producao.
