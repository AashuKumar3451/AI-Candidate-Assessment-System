
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { JobsProvider } from "@/context/JobsContext";
import Header from "@/components/Header";
import ProtectedRoute from "@/components/ProtectedRoute";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import HRDashboard from "./pages/hr/HRDashboard";
import JobDetails from "./pages/hr/JobDetails";
import JobsListing from "./pages/candidate/JobsListing";
import TestPage from "./pages/candidate/TestPage"
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <JobsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen flex flex-col bg-gray-50">
              <Header />
              <main className="flex-1 py-6">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  
                  {/* HR Routes */}
                  <Route 
                    path="/hr/dashboard" 
                    element={
                      <ProtectedRoute allowedRoles={["hr"]}>
                        <HRDashboard />
                      </ProtectedRoute>
                    } 
                  />
                  <Route 
                    path="/hr/jobs/:jobId" 
                    element={
                      <ProtectedRoute allowedRoles={["hr"]}>
                        <JobDetails />
                      </ProtectedRoute>
                    } 
                  />
                  
                  {/* Candidate Routes */}
                  <Route 
                    path="/jobs" 
                    element={
                      <ProtectedRoute allowedRoles={["candidate"]}>
                        <JobsListing />
                      </ProtectedRoute>
                    } 
                  />

                  <Route 
                    path="/test/:candidateId/:JID" 
                    element={
                      <ProtectedRoute allowedRoles={["candidate"]}>
                        <TestPage />
                      </ProtectedRoute>
                    } 
                  />




                   <Route 
                    path="/test/:JID" 
                    element={
                      <ProtectedRoute allowedRoles={["candidate"]}>
                        <TestPage />
                      </ProtectedRoute>
                    } 
                  />
                      



                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </JobsProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
