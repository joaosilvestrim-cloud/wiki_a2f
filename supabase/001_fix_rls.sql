-- Correcao de RLS apos a migracao para o schema "wiki".
-- Contexto: na migracao, o RLS foi habilitado em todas as tabelas, mas algumas
-- tabelas nao receberam policies que cobrissem as operacoes que o app faz.
-- Resultado: leitura/escrita bloqueada nelas.
--
-- Este script mantem o RLS LIGADO (mais seguro que a origem, que estava aberta)
-- e adiciona policies para usuarios autenticados. Rode no SQL Editor do projeto
-- Site_a2f (o mesmo banco do wiki).

set search_path = wiki, public, auth;

-- document_categories: dados de referencia (categorias de documento).
-- Estava com RLS ON e ZERO policy => totalmente bloqueada.
drop policy if exists "wiki_doc_categories_auth_all" on wiki.document_categories;
create policy "wiki_doc_categories_auth_all"
  on wiki.document_categories for all to authenticated
  using (true) with check (true);

-- audit_logs: log de auditoria. So tinha policy de SELECT => INSERT do log falhava.
drop policy if exists "wiki_audit_insert_auth" on wiki.audit_logs;
create policy "wiki_audit_insert_auth"
  on wiki.audit_logs for insert to authenticated
  with check (true);

drop policy if exists "wiki_audit_select_auth" on wiki.audit_logs;
create policy "wiki_audit_select_auth"
  on wiki.audit_logs for select to authenticated
  using (true);

-- (opcional) notifications: hoje tem SELECT/UPDATE mas nao INSERT.
-- Descomente se o app/algum fluxo precisar criar notificacoes pelo cliente:
-- drop policy if exists "wiki_notifications_insert_auth" on wiki.notifications;
-- create policy "wiki_notifications_insert_auth"
--   on wiki.notifications for insert to authenticated with check (true);
