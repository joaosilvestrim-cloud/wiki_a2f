import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import DashboardHome from '@/components/dashboard/DashboardHome';
import EmployeesPage from '@/components/dashboard/EmployeesPage';
import ProjectsPage from '@/components/dashboard/ProjectsPage';
import DocumentsPage from '@/components/dashboard/DocumentsPage';
import SettingsPage from '@/components/dashboard/SettingsPage';
import UserManagementPage from '@/pages/admin/UserManagementPage';
import WikiAdminDashboard from '@/pages/wiki/WikiAdminDashboard';
import WikiCategoryManagement from '@/pages/wiki/WikiCategoryManagement';
import WikiArticleManagement from '@/pages/wiki/WikiArticleManagement';
import WikiArticleEditor from '@/pages/wiki/WikiArticleEditor';
import WikiArticleVersions from '@/pages/wiki/WikiArticleVersions';
import SitePageEditor from '@/pages/admin/SitePageEditor';
import MyPortalPage from '@/pages/employee/MyPortalPage';
import AdminEmployeeDocuments from '@/pages/admin/AdminEmployeeDocuments';
import PublicPageViewer from '@/pages/PublicPageViewer';
import PageManager from '@/pages/admin/PageManager';
import MediaManager from '@/pages/admin/MediaManager';
import EmployeeProfilePage from '@/pages/admin/EmployeeProfilePage';
import AuditLogPage from '@/pages/admin/AuditLogPage';
import EventsManager from '@/pages/admin/EventsManager';
import HelpChatbot from '@/components/dashboard/HelpChatbot';
import DocumentSettingsPage from '@/pages/admin/DocumentSettingsPage';
import PdiManagerPage from '@/pages/admin/PdiManagerPage';
import PdiDetailPage from '@/pages/admin/PdiDetailPage';
import MyPdiPage from '@/pages/employee/MyPdiPage';
import ProjectManagementPage from '@/pages/project-management/ProjectManagementPage';
import ProjectDetailPage from '@/pages/project-management/ProjectDetailPage';
import EmployeeMonitoringPage from '@/pages/admin/EmployeeMonitoringPage';
import InvoiceMonitoringPage from '@/pages/admin/InvoiceMonitoringPage';
import { useAuth } from '@/contexts/AuthContext';

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user?.is_admin) {
    return <Navigate to="/dashboard" />;
  }
  return children;
};

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      if (desktop) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); 

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <>
      <Helmet>
        <title>Dashboard - Intranet Corporativa</title>
        <meta name="description" content="Painel principal da intranet corporativa" />
      </Helmet>
      
      <div className="min-h-screen bg-background flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} isDesktop={isDesktop} />
        
        <div className="flex-1 flex flex-col min-w-0">
          <Header onMenuClick={() => setSidebarOpen(true)} />
          
          <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/my-documents" element={<MyPortalPage />} />
              <Route path="/my-pdi" element={<MyPdiPage />} />
              <Route path="/employees" element={<EmployeesPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/documents" element={<DocumentsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/page/*" element={<PublicPageViewer />} />
              <Route path="/project-management" element={<ProjectManagementPage />} />
              <Route path="/project-management/:projectId" element={<ProjectDetailPage />} />
              
              <Route path="/users" element={<AdminRoute><UserManagementPage /></AdminRoute>} />
              <Route path="/employees/:id" element={<AdminRoute><EmployeeProfilePage /></AdminRoute>} />
              <Route path="/employee-documents" element={<AdminRoute><AdminEmployeeDocuments /></AdminRoute>} />
              <Route path="/employee-monitoring" element={<AdminRoute><EmployeeMonitoringPage /></AdminRoute>} />
              <Route path="/invoice-monitoring" element={<AdminRoute><InvoiceMonitoringPage /></AdminRoute>} />
              <Route path="/pages/edit/:pageId" element={<AdminRoute><SitePageEditor /></AdminRoute>} />
              <Route path="/page-manager" element={<AdminRoute><PageManager /></AdminRoute>} />
              <Route path="/media-manager" element={<AdminRoute><MediaManager /></AdminRoute>} />
              <Route path="/audit-logs" element={<AdminRoute><AuditLogPage /></AdminRoute>} />
              <Route path="/events-manager" element={<AdminRoute><EventsManager /></AdminRoute>} />
              <Route path="/document-settings" element={<AdminRoute><DocumentSettingsPage /></AdminRoute>} />
              <Route path="/pdi" element={<AdminRoute><PdiManagerPage /></AdminRoute>} />
              <Route path="/pdi/:id" element={<AdminRoute><PdiDetailPage /></AdminRoute>} />

              <Route path="/content-manager" element={<AdminRoute><div className="wiki-admin-bg p-6 rounded-xl"><WikiAdminDashboard /></div></AdminRoute>} />
              <Route path="/content-manager/categories" element={<AdminRoute><div className="wiki-admin-bg p-6 rounded-xl"><WikiCategoryManagement /></div></AdminRoute>} />
              <Route path="/content-manager/articles" element={<AdminRoute><div className="wiki-admin-bg p-6 rounded-xl"><WikiArticleManagement /></div></AdminRoute>} />
              <Route path="/content-manager/articles/new" element={<AdminRoute><div className="wiki-admin-bg p-6 rounded-xl"><WikiArticleEditor /></div></AdminRoute>} />
              <Route path="/content-manager/articles/edit/:id" element={<AdminRoute><div className="wiki-admin-bg p-6 rounded-xl"><WikiArticleEditor /></div></AdminRoute>} />
              <Route path="/content-manager/articles/versions/:id" element={<AdminRoute><div className="wiki-admin-bg p-6 rounded-xl"><WikiArticleVersions /></div></AdminRoute>} />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
        <HelpChatbot />
      </div>
    </>
  );
};

export default Dashboard;