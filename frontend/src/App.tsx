import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Navbar from "@/components/layout/Navbar";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Team from "./pages/Team";
import Transfers from "./pages/Transfers";
import Gameweek from "./pages/Gameweek";
import Leaderboard from "./pages/Leaderboard"; // Import the new page
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-pl-purple">
            <Navbar />
            <Routes>
              <Route path="/" element={<Splash />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Login />} />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/team" element={
                <ProtectedRoute>
                  <Team />
                </ProtectedRoute>
              } />
              <Route path="/transfers" element={
                <ProtectedRoute>
                  <Transfers />
                </ProtectedRoute>
              } />
              <Route path="/gameweek/:gw" element={
                <ProtectedRoute>
                  <Gameweek />
                </ProtectedRoute>
              } />
              {/* Add the new Leaderboard route */}
              <Route path="/leaderboard" element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
