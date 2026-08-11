import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/customSupabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Loader2, User, Mail, Phone, Building, MapPin, Save, Key, Eye, EyeOff, Upload, Trash2, Download, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logAction } from '@/lib/auditLog';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFileName } from '@/lib/utils';

const EmployeeProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setUploading] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCategory, setUploadCategory] = useState('');
  const [documents, setDocuments] = useState([]);
  const [documentCategories, setDocumentCategories] = useState([]);

  const fetchEmployeeData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      toast({ title: 'Erro', description: 'Funcionário não encontrado.', variant: 'destructive' });
      navigate('/dashboard/employees');
    } else {
      setEmployee(data);
      setFormData({
        name: data.name || '',
        role: data.role || '',
        department: data.department || '',
        phone: data.phone || '',
        location: data.location || '',
        bio: data.bio || '',
      });
    }
    setLoading(false);
  };

  const fetchDocuments = async () => {
    const { data, error } = await supabase
      .from('employee_documents')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao buscar documentos', description: error.message, variant: 'destructive' });
    } else {
      setDocuments(data);
    }
  };

  const fetchDocumentCategories = async () => {
    const { data, error } = await supabase.from('document_categories').select('name').order('name');
    if (!error && data) {
      setDocumentCategories(data.map(c => c.name));
      if (data.length > 0) setUploadCategory(data[0].name);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
    fetchDocuments();
    fetchDocumentCategories();
  }, [id]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update(formData)
      .eq('id', id);

    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso!', description: 'Perfil atualizado.' });
      await logAction('profile_updated', { targetUserId: id, updatedBy: currentUser.id });
      setIsEditing(false);
      fetchEmployeeData();
    }
    setIsSaving(false);
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Senha muito curta', description: 'A senha deve ter no mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    const { error } = await supabase.functions.invoke('update-user-password', {
      body: { userId: id, password: newPassword }
    });

    if (error) {
      toast({ title: 'Erro ao alterar senha', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso!', description: 'Senha alterada.' });
      await logAction('password_changed', { targetUserId: id, changedBy: currentUser.id });
      setIsPasswordModalOpen(false);
      setNewPassword('');
    }
    setIsSaving(false);
  };

  const handleFileUpload = async () => {
    if (!fileToUpload || !uploadCategory) {
      toast({ title: 'Campos obrigatórios', description: 'Selecione um arquivo e uma categoria.', variant: 'destructive' });
      return;
    }
    setUploading(true);
    const sanitizedFileName = sanitizeFileName(fileToUpload.name);
    const filePath = `${id}/${uuidv4()}-${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('employee_uploads')
      .upload(filePath, fileToUpload);

    if (uploadError) {
      toast({ title: 'Erro no upload', description: uploadError.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from('employee_documents').insert({
      user_id: id,
      file_name: fileToUpload.name,
      file_path: filePath,
      file_type: fileToUpload.type,
      file_size: fileToUpload.size,
      description: uploadDescription,
      category: uploadCategory,
      uploaded_by: currentUser.id,
    });

    if (dbError) {
      toast({ title: 'Erro ao salvar documento', description: dbError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Documento enviado com sucesso!' });
      await logAction('admin_document_upload', { targetUserId: id, fileName: fileToUpload.name });
      fetchDocuments();
      setIsUploadModalOpen(false);
      setFileToUpload(null);
      setUploadDescription('');
    }
    setUploading(false);
  };

  const handleDeleteDocument = async (doc) => {
    const { error: storageError } = await supabase.storage.from('employee_uploads').remove([doc.file_path]);
    if (storageError) {
      toast({ title: 'Erro ao deletar do armazenamento', description: storageError.message, variant: 'destructive' });
      return;
    }
    const { error: dbError } = await supabase.from('employee_documents').delete().eq('id', doc.id);
    if (dbError) {
      toast({ title: 'Erro ao deletar do banco', description: dbError.message, variant: 'destructive' });
    } else {
      toast({ title: 'Documento deletado com sucesso!' });
      fetchDocuments();
    }
  };

  const handleDownloadDocument = async (filePath, fileName) => {
    const { data, error } = await supabase.storage.from('employee_uploads').download(filePath);
    if (error) {
      toast({ title: 'Erro no download', description: error.message, variant: 'destructive' });
      return;
    }
    const blob = new Blob([data]);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="w-16 h-16 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="flex items-center space-x-4">
            <img src={employee.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${employee.name}`} alt={employee.name} className="w-24 h-24 rounded-full border-4 border-primary" />
            <div>
              <CardTitle className="text-3xl">{employee.name}</CardTitle>
              <CardDescription className="text-lg">{employee.role}</CardDescription>
              <p className="text-muted-foreground">{employee.email}</p>
            </div>
          </div>
          <div className="flex space-x-2 mt-4 md:mt-0">
            {isEditing ? (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Salvar
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancelar</Button>
              </>
            ) : (
              <>
                <Button onClick={() => setIsEditing(true)}>Editar Perfil</Button>
                <Button variant="outline" onClick={() => setIsPasswordModalOpen(true)}>
                  <Key className="mr-2 h-4 w-4" /> Alterar Senha
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <div className="space-y-4">
            <InfoItem icon={<User />} label="Nome Completo" value={formData.name} id="name" isEditing={isEditing} onChange={handleInputChange} />
            <InfoItem icon={<Building />} label="Departamento" value={formData.department} id="department" isEditing={isEditing} onChange={handleInputChange} />
            <InfoItem icon={<Phone />} label="Telefone" value={formData.phone} id="phone" isEditing={isEditing} onChange={handleInputChange} />
            <InfoItem icon={<MapPin />} label="Localização" value={formData.location} id="location" isEditing={isEditing} onChange={handleInputChange} />
          </div>
          <div className="space-y-4">
            <InfoItem icon={<User />} label="Cargo" value={formData.role} id="role" isEditing={isEditing} onChange={handleInputChange} />
            <div className="space-y-2">
              <Label>Biografia</Label>
              {isEditing ? (
                <textarea id="bio" value={formData.bio} onChange={handleInputChange} className="form-input min-h-[120px]" />
              ) : (
                <p className="text-muted-foreground">{formData.bio || 'Nenhuma biografia informada.'}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Documentos do Funcionário</CardTitle>
              <CardDescription>Arquivos enviados para este funcionário.</CardDescription>
            </div>
            <Button onClick={() => setIsUploadModalOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Enviar Arquivo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <ul className="space-y-3">
              {documents.map(doc => (
                <li key={doc.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium">{doc.file_name}</p>
                      <p className="text-sm text-muted-foreground">{doc.category} - {new Date(doc.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleDownloadDocument(doc.file_path, doc.file_name)}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteDocument(doc)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhum documento encontrado.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>Digite a nova senha para {employee.name}.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="new-password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Cancelar</Button>
            <Button onClick={handlePasswordChange} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Salvar Nova Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Arquivo para {employee.name}</DialogTitle>
            <DialogDescription>Selecione um arquivo, adicione uma descrição e categoria.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="file-upload">Arquivo</Label>
              <Input id="file-upload" type="file" onChange={(e) => setFileToUpload(e.target.files[0])} />
            </div>
            <div>
              <Label htmlFor="upload-description">Descrição (opcional)</Label>
              <Input id="upload-description" value={uploadDescription} onChange={(e) => setUploadDescription(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="upload-category">Categoria</Label>
              <select id="upload-category" value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)} className="form-input">
                {documentCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleFileUpload} disabled={isUploading}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

const InfoItem = ({ icon, label, value, id, isEditing, onChange }) => (
  <div className="space-y-2">
    <Label htmlFor={id} className="flex items-center">
      {icon}
      <span className="ml-2">{label}</span>
    </Label>
    {isEditing ? (
      <Input id={id} value={value} onChange={onChange} />
    ) : (
      <p className="text-muted-foreground">{value || 'Não informado'}</p>
    )}
  </div>
);

export default EmployeeProfilePage;