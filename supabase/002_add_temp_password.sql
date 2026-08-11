-- Migration: Adicionar flag de alteração de senha obrigatória
-- Executar no Supabase SQL Editor para garantir suporte a senhas temporárias.

ALTER TABLE wiki.profiles 
ADD COLUMN IF NOT EXISTS needs_password_change BOOLEAN DEFAULT FALSE;
