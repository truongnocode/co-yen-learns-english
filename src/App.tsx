import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import GradesPage from "./pages/GradesPage";
import GradePage from "./pages/GradePage";
import FlashcardPage from "./pages/FlashcardPage";
import QuizPage from "./pages/QuizPage";
import SpellingPage from "./pages/SpellingPage";
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
          <Route path="/grade/:gradeId" element={<GradePage />} />
          <Route path="/learn/:unitId/flashcard" element={<FlashcardPage />} />
          <Route path="/learn/:unitId/quiz" element={<QuizPage />} />
          <Route path="/learn/:unitId/spelling" element={<SpellingPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/practice" element={<PracticePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
