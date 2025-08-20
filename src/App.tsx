import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from './components/ui/toaster'
import LoginPage from './pages/login'
import RegisterPage from './pages/register'
import DashboardPage from './pages/dashboard-page'
import DocumentsPage from './pages/documents-page'
import DocumentDetailPage from './pages/document-detail-page'
import DocumentPreviewPage from './pages/document-preview-page'
import FoldersPage from './pages/folders-page'
import FolderDetailPage from './pages/folder-detail-page'
import AdminActivityLogsPage from './pages/admin-activity-logs-page'
import DataManagementPage from './pages/data-management-page'
import SearchPage from './pages/search-page'
import EnhancedSettingsPage from './pages/enhanced-settings-page'
import UserManagementPage from './pages/user-management-page'
import CloudStorageConfigPage from './pages/cloud-storage-config-page'
import StorageTestPage from './pages/storage-test-page'
import Layout from './layout'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="document-preview" element={<DocumentPreviewPage />} />
          <Route path="documents/preview/:id/:filename" element={<DocumentPreviewPage />} />
          <Route path="documents/:id" element={<DocumentDetailPage />} />
          <Route path="folders" element={<FoldersPage />} />
          <Route path="folders/:folderId" element={<FolderDetailPage />} />
          <Route path="admin-activity-logs" element={<AdminActivityLogsPage />} />
          <Route path="data-management" element={<DataManagementPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="settings" element={<EnhancedSettingsPage />} />
          <Route path="cloud-storage-config" element={<CloudStorageConfigPage />} />
          <Route path="storage-test" element={<StorageTestPage />} />
          <Route path="user-management" element={<UserManagementPage />} />
        </Route>
      </Routes>
      <Toaster />
    </div>
  )
}

export default App