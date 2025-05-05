import { useState } from 'react';
import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from '@/components/Layout';
import { ImportModal } from '@/components/ImportModal';
import { BudgetDetailsModal } from '@/components/BudgetDetailsModal';
import Dashboard from '@/pages/Dashboard';
import BudgetList from '@/pages/BudgetList';
import TaskList from '@/pages/TaskList';
import Reports from '@/pages/Reports';
import NotFound from "@/pages/not-found";
import { useBudgets } from '@/hooks/useBudgets';

function App() {
  const [location, setLocation] = useLocation();
  const {
    budgets,
    isLoading,
    selectedBudget,
    isImportModalOpen,
    isBudgetDetailsOpen,
    completedTasks,
    notes,
    actionStatus,
    contactsData,
    selectedFile,
    uploadProgress,
    importOptions,
    setSelectedBudget,
    setIsImportModalOpen,
    setIsBudgetDetailsOpen,
    setSelectedFile,
    setUploadProgress,
    setImportOptions,
    toggleTask,
    saveNotes,
    markActionCompleted,
    saveContactInfo,
    finalizeBudget,
    openBudgetDetails,
    importCsvFile,
    changeBudgetType,
    advanceBudgetStage
  } = useBudgets();

  // If no route is active, redirect to dashboard
  if (location === '/') {
    setLocation('/');
  }

  return (
    <TooltipProvider>
      <Layout onImport={() => setIsImportModalOpen(true)}>
        <Switch>
          <Route 
            path="/" 
            component={() => <Dashboard budgets={budgets} isLoading={isLoading} />}
          />
          <Route 
            path="/budgets" 
            component={() => (
              <BudgetList 
                budgets={budgets} 
                isLoading={isLoading} 
                onOpenBudgetDetails={openBudgetDetails} 
              />
            )}
          />
          <Route 
            path="/tasks" 
            component={() => (
              <TaskList 
                budgets={budgets} 
                isLoading={isLoading} 
                completedTasks={completedTasks} 
                onToggleTask={toggleTask} 
                onOpenBudgetDetails={openBudgetDetails} 
              />
            )}
          />
          <Route path="/reports" component={Reports} />
          <Route component={NotFound} />
        </Switch>
      </Layout>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={importCsvFile}
        options={importOptions}
        setOptions={setImportOptions}
        uploadProgress={uploadProgress}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
      />

      {/* Budget Details Modal */}
      <BudgetDetailsModal
        isOpen={isBudgetDetailsOpen}
        onClose={() => setIsBudgetDetailsOpen(false)}
        budget={selectedBudget}
        contactInfo={selectedBudget ? contactsData[selectedBudget.id] : undefined}
        onSaveNotes={(budgetId, notes) => saveNotes(budgetId, notes)}
        onMarkAction={(budgetId) => markActionCompleted(budgetId)}
        onFinalizeBudget={(budgetId, status) => finalizeBudget(budgetId, status)}
        onSaveContact={(budgetId, data) => saveContactInfo(budgetId, data)}
        onChangeBudgetType={(budgetId, isLicitacion) => changeBudgetType(budgetId, isLicitacion)}
        isActionCompleted={selectedBudget ? actionStatus[selectedBudget.id] || false : false}
      />

      <Toaster />
    </TooltipProvider>
  );
}

export default App;
