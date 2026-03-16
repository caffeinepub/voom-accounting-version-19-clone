import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import BillingView from "../components/BillingView";
import ExpenseView from "../components/ExpenseView";
import Footer from "../components/Footer";
import Header from "../components/Header";
import IncomeView from "../components/IncomeView";
import ReportsView from "../components/ReportsView";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("income");

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Header />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6"
          >
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="expenses">Expenses</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="income" className="space-y-6">
              <IncomeView />
            </TabsContent>

            <TabsContent value="expenses" className="space-y-6">
              <ExpenseView />
            </TabsContent>

            <TabsContent value="reports" className="space-y-6">
              <ReportsView />
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <BillingView />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
}
