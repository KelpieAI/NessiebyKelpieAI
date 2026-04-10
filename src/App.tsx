import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { NessieQueue } from './pages/NessieQueue';
import { CreateBatchPage } from './pages/CreateBatchPage';
import { SettingsPage } from './pages/SettingsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { DocsPage } from './pages/DocsPage';
import { AppShell } from './components/nessie/AppShell';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="/queue"     element={<NessieQueue />} />
          <Route path="/queue/new" element={<CreateBatchPage />} />
          <Route path="/settings"  element={<SettingsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/docs"      element={<DocsPage />} />
        </Route>

        <Route path="/" element={<Navigate to="/queue" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;