import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import GradesPage from "./pages/GradesPage";
import GradePage from "./pages/GradePage";
import VocabPage from "./pages/VocabPage";
import GrammarPage from "./pages/GrammarPage";
import ExercisesPage from "./pages/ExercisesPage";
import Grade10VocabPage from "./pages/Grade10VocabPage";
import Grade10GrammarPage from "./pages/Grade10GrammarPage";
import Grade10ReadingPage from "./pages/Grade10ReadingPage";
import Grade10TestsPage from "./pages/Grade10TestsPage";
import ProgressPage from "./pages/ProgressPage";
import PracticePage from "./pages/PracticePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/grades" element={<GradesPage />} />
          <Route path="/grade/10/vocab" element={<Grade10VocabPage />} />
          <Route path="/grade/10/grammar" element={<Grade10GrammarPage />} />
          <Route path="/grade/10/exercises" element={<Grade10ReadingPage />} />
          <Route path="/grade/10/tests" element={<Grade10TestsPage />} />
          <Route path="/grade/:gradeId" element={<GradePage />} />
          <Route path="/grade/:gradeId/vocab/:unitKey" element={<VocabPage />} />
          <Route path="/grade/:gradeId/grammar/:unitKey" element={<GrammarPage />} />
          <Route path="/grade/:gradeId/exercises/:unitKey" element={<ExercisesPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
