-- Script para habilitar políticas de segurança (RLS) para os Buckets de Armazenamento do Supabase
-- IMPORTANTE: Execute este script no "SQL Editor" do painel do Supabase.

-- Garantir que os buckets existem
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('employee_uploads', 'employee_uploads', false),
  ('company_documents', 'company_documents', true),
  ('wiki_attachments', 'wiki_attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Habilitar RLS na tabela storage.objects (se não estiver ativado)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

----------------------------------------------------------------
-- 1. Políticas para o Bucket: employee_uploads
-- (Documentos de colaboradores na seção "Meu Portal" / "Meus Documentos")
----------------------------------------------------------------

-- Permitir leitura dos próprios arquivos e para administradores
DROP POLICY IF EXISTS "Permitir leitura de uploads próprios ou admins" ON storage.objects;
CREATE POLICY "Permitir leitura de uploads próprios ou admins"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'employee_uploads' AND 
  (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR 
    EXISTS (
      SELECT 1 FROM wiki.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  )
);

-- Permitir envio (inserção) de arquivos na sua própria pasta ou por administradores
DROP POLICY IF EXISTS "Permitir inserção na própria pasta" ON storage.objects;
CREATE POLICY "Permitir inserção na própria pasta"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'employee_uploads' AND 
  (
    (storage.foldername(name))[1] = auth.uid()::text
    OR 
    EXISTS (
      SELECT 1 FROM wiki.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  )
);

-- Permitir exclusão de arquivos na sua própria pasta ou por admins
DROP POLICY IF EXISTS "Permitir exclusão da própria pasta ou por admins" ON storage.objects;
CREATE POLICY "Permitir exclusão da própria pasta ou por admins"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'employee_uploads' AND 
  (
    (storage.foldername(name))[1] = auth.uid()::text 
    OR 
    EXISTS (
      SELECT 1 FROM wiki.profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  )
);

----------------------------------------------------------------
-- 2. Políticas para o Bucket: company_documents
-- (Documentos gerais da empresa)
----------------------------------------------------------------

-- Permitir leitura a todos os usuários autenticados
DROP POLICY IF EXISTS "Permitir leitura de docs da empresa para todos" ON storage.objects;
CREATE POLICY "Permitir leitura de docs da empresa para todos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'company_documents');

-- Permitir modificações apenas para administradores
DROP POLICY IF EXISTS "Permitir escrita de docs da empresa apenas para admins" ON storage.objects;
CREATE POLICY "Permitir escrita de docs da empresa apenas para admins"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'company_documents' AND 
  EXISTS (
    SELECT 1 FROM wiki.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
)
WITH CHECK (
  bucket_id = 'company_documents' AND 
  EXISTS (
    SELECT 1 FROM wiki.profiles 
    WHERE id = auth.uid() AND is_admin = true
  )
);

----------------------------------------------------------------
-- 3. Políticas para o Bucket: wiki_attachments
-- (Imagens e anexos de artigos do Wiki)
----------------------------------------------------------------

-- Permitir leitura a todos os usuários autenticados
DROP POLICY IF EXISTS "Permitir leitura de anexos do wiki para todos" ON storage.objects;
CREATE POLICY "Permitir leitura de anexos do wiki para todos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'wiki_attachments');

-- Permitir inserção e deleção a todos os usuários autenticados
DROP POLICY IF EXISTS "Permitir escrita de anexos do wiki para todos" ON storage.objects;
CREATE POLICY "Permitir escrita de anexos do wiki para todos"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'wiki_attachments')
WITH CHECK (bucket_id = 'wiki_attachments');
