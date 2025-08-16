import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from './components/ui/toaster'
import LoginPage from './pages/login'
import RegisterPage from './pages/register'
import DashboardPage from './pages/dashboard-page'
import DocumentsPage from './pages/documents-page'
import DocumentDetailPage from './pages/document-detail-page'
import FoldersPage from './pages/folders-page'
import FolderDetailPage from './pages/folder-detail-page'
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
          <Route path="documents/:id" element={<DocumentDetailPage />} />
          <Route path="folders" element={<FoldersPage />} />
          <Route path="folders/:folderId" element={<FolderDetailPage />} />
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