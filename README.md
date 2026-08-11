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

## Schema "wiki" (isolado)

Todo o conteudo do wiki foi migrado do projeto Supabase antigo para dentro do
`Site_a2f`, num **schema separado chamado `wiki`**. Isso isola 100% do schema `public`
(que roda o A2F Gestao, o site DriveData, o CRM etc.) — sem colisao de nomes de tabela.

O cliente Supabase ja aponta para esse schema (`db: { schema: 'wiki' }` em
`src/lib/customSupabaseClient.js`).

### Passo manual necessario (uma vez)
Para o PostgREST aceitar o schema `wiki`, ele precisa estar exposto na API do projeto:

- Supabase (projeto Site_a2f) > **Settings > API > Exposed schemas** > adicionar **`wiki`** > Save.

Sem isso, as consultas do app retornam erro de schema.

### O que ja foi migrado
- 28 tabelas no schema `wiki` (artigos, versoes, categorias, mural, PDI, documentos de
  colaborador, eventos, gestao de projetos interna), com constraints, indices, 54 policies
  RLS e 3 triggers.
- 14 usuarios do wiki foram trazidos para o `auth.users` do Site_a2f (login preservado).
- 3 usuarios que ja existiam no Site_a2f (`joao.silvestrim`, `juliana.ferreira`,
  `luiz.alcoba` @a2f.com.br) **nao** foram duplicados — a reconciliacao deles fica pendente.

### Pendencias
- **Arquivos do Storage** (anexos, documentos de colaborador, imagens do mural) ainda
  apontam para os buckets do projeto Supabase antigo. A copia dos binarios e uma etapa
  separada, se necessario.
- Reconciliar os 3 usuarios acima (ligar o conteudo deles as contas do Site_a2f).
