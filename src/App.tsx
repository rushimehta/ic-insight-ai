import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/hooks/useTheme";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

// Lazy-style imports for page components
import { RoleDashboard } from "@/components/dashboard/RoleDashboard";
import { CRMDashboard } from "@/components/crm/CRMDashboard";
import { DealKanban } from "@/components/pipeline/DealKanban";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { DocumentRepository } from "@/components/repository/DocumentRepository";
import { ICDocumentGenerator } from "@/components/generator/ICDocumentGenerator";
import { AIChat } from "@/components/chat/AIChat";
import { QuestionPrep } from "@/components/questions/QuestionPrep";
import { ICHistory } from "@/components/history/ICHistory";
import { ChairmanNotes } from "@/components/chairman/ChairmanNotes";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { DataConnectors } from "@/components/connectors/DataConnectors";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
          <Routes>
            <Route path="/auth" element={
              <AuthRoute>
                <Auth />
              </AuthRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                <Index />
              </ProtectedRoute>
            }>
              <Route index element={<RoleDashboard />} />
              <Route path="dashboard" element={<RoleDashboard />} />
              <Route path="crm" element={<CRMDashboard />} />
              <Route path="pipeline" element={<DealKanban />} />
              <Route path="analytics" element={<AnalyticsDashboard />} />
              <Route path="documents" element={<DocumentUpload />} />
              <Route path="repository" element={<DocumentRepository />} />
              <Route path="generator" element={<ICDocumentGenerator />} />
              <Route path="chat" element={<AIChat />} />
              <Route path="questions" element={<QuestionPrep />} />
              <Route path="history" element={<ICHistory />} />
              <Route path="chairman" element={<ChairmanNotes />} />
              <Route path="connectors" element={<DataConnectors />} />
              <Route path="admin" element={<AdminPanel />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
