"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { Camera, AlertTriangle, Plus, Target, History, Sparkles, PlusCircle, ChevronDown, Edit2, Check, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- Types ---
type Category = {
  id: string;
  name: string;
  type: string;
  budgeted_amount: number;
};

type Transaction = {
  id: string;
  date: string;
  description: string;
  amount: number;
  category_id: string;
  is_unexpected: boolean;
};

type DashboardData = {
  goal: any;
  categories: Category[];
  transactions: Transaction[];
  runningTotals: Record<string, { spent: number; budgeted: number; remaining: number; status: string }>;
  overall: {
    totalSpent: number;
    remainingForSavings: number;
    gap: number;
    onTrack: boolean;
    monthlyTarget: number;
    targetSavingsGoal: number;
    currentSavings: number;
  };
};

export default function SaveSmartApp() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);
  
  // Form State
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [catId, setCatId] = useState("");
  const [isUnexpected, setIsUnexpected] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  // Setup Form
  const [setupGoalName, setSetupGoalName] = useState("Royal Enfield Classic 350");
  const [setupTarget, setSetupTarget] = useState("150000");
  const [setupMonths, setSetupMonths] = useState("6");
  const [setupStart, setSetupStart] = useState(new Date().toISOString().split("T")[0]);
  const [setupMonthlySave, setSetupMonthlySave] = useState("25000");
  const [setupSalary, setSetupSalary] = useState("50000");

  const [manageCatId, setManageCatId] = useState<string | null>(null);
  const [editBudgetAmount, setEditBudgetAmount] = useState("");
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Dynamic Categories in Modal
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatAmount, setNewCatAmount] = useState("");
  const [newCatType, setNewCatType] = useState("Need");



  // Scenarios State
  const [showScenarios, setShowScenarios] = useState(false);
  const [scenarios, setScenarios] = useState<any[]>([]);
  
  // Bike Image
  const [bikeImage, setBikeImage] = useState<string | null>(null);

  useEffect(() => {
    const savedImg = localStorage.getItem("bike_img");
    if (savedImg) setBikeImage(savedImg);
    const savedScenarios = localStorage.getItem("last_scenarios");
    if (savedScenarios) {
       try {
         const parsed = JSON.parse(savedScenarios);
         setScenarios(parsed);
         setShowScenarios(true);
       } catch(e) {}
    }
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
      if (!json.goal) setIsSettingUp(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgStr = event.target?.result as string;
      setBikeImage(imgStr);
      localStorage.setItem("bike_img", imgStr);
    };
    reader.readAsDataURL(file);
  };

  const submitSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
       const res = await fetch("/api/goal", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
            goalName: setupGoalName,
            targetAmount: Number(setupTarget),
            durationMonths: Number(setupMonths),
            startDate: setupStart,
            monthlySavingTarget: Number(setupMonthlySave),
            monthlySalary: Number(setupSalary),
            categories: [
              { name: "Rent", type: "Need", amount: 10000 },
              { name: "Groceries", type: "Need", amount: 4000 },
              { name: "Dining Out", type: "Want", amount: 3000 },
              { name: "Shopping", type: "Want", amount: 2000 },
            ]
         })
       });
       if(res.ok) {
         setIsSettingUp(false);
         fetchData();
       }
    } catch(err) {
       console.error(err);
    }
  };

  const handleUpdateBudget = async () => {
    if (!manageCatId || !editBudgetAmount) return;
    setIsSavingBudget(true);
    try {
      const res = await fetch("/api/category", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: manageCatId, budgeted_amount: Number(editBudgetAmount) })
      });
      if (res.ok) {
        setManageCatId(null);
        fetchData(); // reload
      }
    } catch(e) {
      console.error(e);
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!manageCatId) return;
    try {
      const res = await fetch(`/api/category?id=${manageCatId}`, { method: "DELETE" });
      if (res.ok) {
        setManageCatId(null);
        fetchData();
      }
    } catch(e) {
      console.error(e);
    }
  };

  const handleCreateCategory = async () => {
     if(!newCatName || !newCatAmount) return;
     try {
       const res = await fetch("/api/category", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ name: newCatName, amount: Number(newCatAmount), type: newCatType })
       });
       const json = await res.json();
       if (json.category) {
          // Optimistically add to UI to prevent raw ID rendering in dropdown
          setData((prev: any) => {
             if (!prev) return prev;
             return { ...prev, categories: [...prev.categories, json.category] };
          });
          setCatId(json.category.id);
          setIsCreatingCategory(false);
          setNewCatName("");
          setNewCatAmount("");
          fetchData(); // Refresh UI fully
       }
     } catch (e) {
       console.error(e);
     }
  };

  const handleAddTransaction = async (e: React.FormEvent, forcedCatId?: string) => {
    e.preventDefault();
    if (!desc || !amount || !date) return;
    
    const targetCatId = forcedCatId || catId;
    if (!targetCatId) return;

    // Check if user is creating a dynamic category on-the-fly
    if (targetCatId === "CREATE_NEW" || isCreatingCategory) {
       if(!targetCatId || targetCatId === "CREATE_NEW") {
          alert("Please select a valid category first. Dynamic DB insertion of category pending.");
          return;
       }
    }
    
    setShowExpenseModal(false);

    try {
      // Find if this specific transaction bursts the category budget limit
      let triggersAi = isUnexpected;
      const catRemaining = data?.runningTotals[targetCatId]?.remaining || 0;
      if (Number(amount) > catRemaining) {
         triggersAi = true; // Auto trigger over budget
      }

      const res = await fetch("/api/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc,
          amount: Number(amount),
          category_id: targetCatId,
          is_unexpected: triggersAi,
          date: date,
        }),
      });
      const responseData = await res.json();
      
      if (responseData.scenarios && responseData.scenarios.length > 0) {
        setScenarios(responseData.scenarios);
        setShowScenarios(true);
        localStorage.setItem("last_scenarios", JSON.stringify(responseData.scenarios));
      }

      fetchData(); // refresh dashboard
      
      // reset form
      setDesc("");
      setAmount("");
      setIsUnexpected(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-[#0C0E14]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EFAF00]"></div></div>;
  }

  // --- RENDERING SETUP WIZARD ---
  if (isSettingUp) {
    return (
       <div className="min-h-screen bg-[#0C0E14] text-[#E4E4E5] font-sans flex items-center justify-center p-4">
          <div className="bg-[#161822] border border-[#232533] rounded-3xl p-8 max-w-xl w-full shadow-2xl">
             <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#EFAF00]/10 p-3 rounded-full">
                   <Target className="w-8 h-8 text-[#EFAF00]" />
                </div>
                <div>
                   <h1 className="text-2xl font-semibold text-white">Let's set your Goal.</h1>
                   <p className="text-[#8B8D98]">Before tracking expenses, lock in your primary target.</p>
                </div>
             </div>
             
             <form onSubmit={submitSetup} className="space-y-6">
                 <div className="space-y-4">
                   <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-wider text-[#8B8D98]">Goal Title</Label>
                      <Input 
                        className="bg-[#0C0E14] border-[#232533] text-white h-12 text-base md:text-lg" 
                        value={setupGoalName} onChange={e=>setSetupGoalName(e.target.value)} required 
                      />
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label className="text-xs uppercase tracking-wider text-[#8B8D98]">Target Amount (₹)</Label>
                       <Input 
                         type="number" className="bg-[#0C0E14] border-[#232533] text-white h-12" 
                         value={setupTarget} onChange={e=>setSetupTarget(e.target.value)} required 
                       />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-xs uppercase tracking-wider text-[#8B8D98]">Monthly Salary/Income (₹)</Label>
                       <Input 
                         type="number" min="1" className="bg-[#0C0E14] border-[#232533] text-white h-12" 
                         value={setupSalary} onChange={e=>setSetupSalary(e.target.value)} required 
                       />
                     </div>
                   </div>
  
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <Label className="text-xs uppercase tracking-wider text-[#8B8D98]">Duration (Months)</Label>
                       <Input 
                         type="number" min="1" className="bg-[#0C0E14] border-[#232533] text-white h-12" 
                         value={setupMonths} onChange={e=>setSetupMonths(e.target.value)} required 
                       />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-xs uppercase tracking-wider text-[#8B8D98]">Monthly Saving Target (₹)</Label>
                       <Input 
                         type="number" className="bg-[#0C0E14] border-[#232533] text-white h-12" 
                         value={setupMonthlySave} onChange={e=>setSetupMonthlySave(e.target.value)} required 
                       />
                     </div>
                   </div>
  
                   <div className="grid grid-cols-1 gap-4">
                     <div className="space-y-2">
                       <Label className="text-xs uppercase tracking-wider text-[#8B8D98]">When to Start</Label>
                       <Input 
                         type="date" className="bg-[#0C0E14] border-[#232533] text-white h-12" 
                         value={setupStart} onChange={e=>setSetupStart(e.target.value)} required 
                       />
                     </div>
                   </div>
                 </div>

                <Button type="submit" className="w-full h-14 bg-[#EFAF00] hover:bg-[#D79A00] text-black font-bold text-lg mt-4">
                   Launch Dashboard <Sparkles className="w-5 h-5 ml-2 border-black" />
                </Button>
             </form>
          </div>
       </div>
    )
  }

  // --- RENDERING DASHBOARD ---
  if (!data || !data.goal) return null;

  const PERCENT = Math.round((data.overall.currentSavings / data.overall.targetSavingsGoal) * 100);

  return (
    <div className="min-h-screen bg-[#0C0E14] text-[#E4E4E5] font-sans pb-24 selection:bg-[#EFAF00]/30 selection:text-white">
      
      {/* GLOBAL MODALS */}
      {showExpenseModal && (
         <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#161822] border border-[#232533] rounded-2xl sm:rounded-3xl p-6 w-full max-w-md shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                 <div>
                   <h2 className="text-xl font-bold text-white">Log Expense</h2>
                   <p className="text-sm text-[#8B8D98]">Track a new transaction.</p>
                 </div>
                 <button onClick={() => setShowExpenseModal(false)} className="text-[#8B8D98] hover:text-white">✕</button>
               </div>
               
               <form onSubmit={handleAddTransaction} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label className="text-[#B5B7C0] text-xs font-medium uppercase tracking-wider">Date</Label>
                    <Input type="date" className="bg-[#0C0E14] border-[#232533] text-white h-11" value={date} onChange={e => setDate(e.target.value)} required />
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-[#B5B7C0] text-xs font-medium uppercase tracking-wider">Description</Label>
                    <Input placeholder="e.g. Swiggy - Pizza" className="bg-[#0C0E14] border-[#232533] text-white h-11" value={desc} onChange={e => setDesc(e.target.value)} required />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[#B5B7C0] text-xs font-medium uppercase tracking-wider">Amount (₹)</Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B8D98]">₹</span>
                        <Input type="number" min="1" className="bg-[#0C0E14] border-[#232533] text-white h-11 pl-8" value={amount} onChange={e => setAmount(e.target.value)} required />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[#B5B7C0] text-xs font-medium uppercase tracking-wider">Category</Label>
                      <Select value={catId} onValueChange={(v) => {
                         setCatId(v);
                         if(v === 'CREATE_NEW') setIsCreatingCategory(true);
                         else setIsCreatingCategory(false);
                      }} required>
                        <SelectTrigger className="bg-[#0C0E14] border-[#232533] text-white h-11">
                          {catId ? (
                             <span className="truncate">
                               {catId === 'CREATE_NEW' 
                                 ? '+ Create New Category' 
                                 : data?.categories.find(c => c.id === catId)?.name || catId
                               }
                             </span>
                          ) : (
                             <span className="text-[#8B8D98] truncate">Select one</span>
                          )}
                        </SelectTrigger>
                        <SelectContent className="bg-[#161822] border-[#232533] text-white">
                          {data?.categories.map(c => (
                             <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                          <SelectItem value="CREATE_NEW" className="text-[#EFAF00] font-bold border-t border-white/10 mt-1 rounded-none">+ Create New Category</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {isCreatingCategory && (
                     <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-4 bg-[#0C0E14] rounded-xl border border-[#EFAF00]/30 space-y-4">
                       <p className="text-xs text-[#EFAF00] uppercase font-bold">New Category details</p>
                       <div className="grid grid-cols-2 gap-3">
                         <Input placeholder="Name (e.g. Subs)" className="bg-[#161822] border-[#232533] h-10" value={newCatName} onChange={e=>setNewCatName(e.target.value)} />
                         <Input placeholder="Budget (₹)" type="number" className="bg-[#161822] border-[#232533] h-10" value={newCatAmount} onChange={e=>setNewCatAmount(e.target.value)} />
                       </div>
                       <Button type="button" onClick={handleCreateCategory} disabled={!newCatName || !newCatAmount} className="w-full h-10 bg-white text-black">Lock Category</Button>
                     </motion.div>
                  )}

                  <div className="flex items-center justify-between py-3 border-y border-[#232533] mt-2 group">
                    <div>
                      <Label className="text-white text-sm font-medium flex items-center gap-1.5 cursor-pointer">
                        Unexpected Expense?
                      </Label>
                      <p className="text-[11px] text-[#8B8D98] mt-0.5">Flag emergencies to manually trigger AI replan.</p>
                    </div>
                    <Switch className="data-[state=checked]:bg-red-500" checked={isUnexpected} onCheckedChange={setIsUnexpected} />
                  </div>

                  <Button type="submit" className="w-full h-12 rounded-xl bg-white hover:bg-gray-200 text-black font-semibold text-[15px] mt-2 group">
                    Execute Transaction
                    <Plus className="w-4 h-4 ml-1.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </Button>
               </form>
            </motion.div>
         </div>
      )}

      {manageCatId && (
         <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#161822] border border-[#232533] rounded-2xl sm:rounded-3xl p-6 w-full max-w-sm shadow-2xl">
               <div className="flex justify-between items-start mb-6">
                 <div>
                   <h2 className="text-xl font-bold text-white mb-1">Manage Category</h2>
                   <p className="text-sm text-[#EFAF00] font-medium">{data.categories.find(c => c.id === manageCatId)?.name}</p>
                 </div>
                 <button onClick={() => setManageCatId(null)} className="text-[#8B8D98] hover:text-white">✕</button>
               </div>
               
               <div className="space-y-6">
                 <div className="bg-[#0C0E14] p-5 rounded-2xl border border-[#232533] space-y-4 shadow-inner">
                   <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2">
                     <PlusCircle className="w-4 h-4 text-[#EFAF00]" /> Quick Log
                   </h3>
                   <form onSubmit={(e) => {
                      e.preventDefault();
                      // Use forced logic since state update is async
                      const actualCatId = manageCatId;
                      setCatId(actualCatId);
                      
                      // Manually call API logic with the right ID
                      handleAddTransaction(e, actualCatId);
                      setManageCatId(null);
                   }} className="space-y-4">
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1">
                          <Label className="text-[10px] text-[#8B8D98]">AMOUNT</Label>
                          <div className="relative">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8B8D98] text-xs">₹</span>
                             <Input type="number" min="1" className="bg-[#161822] border-[#232533] h-10 pl-7 text-sm" value={amount} onChange={e => setAmount(e.target.value)} required />
                          </div>
                       </div>
                       <div className="space-y-1">
                          <Label className="text-[10px] text-[#8B8D98]">DATE</Label>
                          <Input type="date" className="bg-[#161822] border-[#232533] h-10 text-xs" value={date} onChange={e => setDate(e.target.value)} required />
                       </div>
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[10px] text-[#8B8D98]">DESCRIPTION</Label>
                        <Input placeholder="e.g. Monthly Payment" className="bg-[#161822] border-[#232533] h-10 text-sm" value={desc} onChange={e => setDesc(e.target.value)} required />
                     </div>
                     <Button type="submit" className="w-full h-11 bg-[#EFAF00] text-black font-bold hover:bg-[#D79A00] transition-all">
                       Save Expense
                     </Button>
                   </form>
                 </div>

                 <div className="pt-4 border-t border-[#232533]">
                   <h3 className="text-[10px] font-bold text-[#8B8D98] uppercase tracking-widest mb-4">Settings</h3>
                   <div className="space-y-4">
                     <div className="space-y-2">
                        <Label className="text-xs text-[#B5B7C0]">Update Monthly Budget (₹)</Label>
                        <div className="flex gap-2">
                          <Input type="number" value={editBudgetAmount} onChange={e => setEditBudgetAmount(e.target.value)} className="bg-[#0C0E14] border-[#232533] h-10 text-sm" />
                          <Button disabled={isSavingBudget || !editBudgetAmount} onClick={handleUpdateBudget} className="bg-white/10 text-white hover:bg-white/20 h-10">
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                     </div>
                     
                     <div className="pt-2">
                       <button onClick={handleDeleteCategory} className="flex items-center gap-2 text-red-400/70 hover:text-red-400 text-xs font-medium transition-colors">
                         <Trash2 className="w-3.5 h-3.5" /> Delete this category permanently
                       </button>
                     </div>
                   </div>
                 </div>
               </div>
            </motion.div>
         </div>
      )}

      
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-col md:flex-row justify-between items-center md:items-end mb-8 gap-4 text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-3xl font-light tracking-tight text-white mb-1">
              Save<span className="font-semibold text-[#EFAF00]">Smart</span>
            </h1>
            <p className="text-[#8B8D98] text-sm">Adaptive dynamic dashboard.</p>
          </div>
        </header>

        {/* 1. HERO GOAL CARD — D-shape image + right-side arc progress */}
        <section className="relative bg-[#0F1017] rounded-3xl border border-[#1E2030] shadow-2xl overflow-hidden">
          <input type="file" id="goal-img" accept="image/*" className="hidden" onChange={handleImageUpload} />

          {/* ── TOP: Image (D-shape) + Arc indicator ── */}
          <div className="relative h-[240px] md:h-[280px] overflow-hidden">

            {/* Dark void behind the D-shape */}
            <div className="absolute inset-0 bg-[#090A0F]" />

            {/* D-shaped image: flat left edge, semicircular right edge */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: '87%', borderRadius: '0 140px 140px 0' }}
            >
              {bikeImage ? (
                <img src={bikeImage} alt="Goal" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-[#111318] flex flex-col items-center justify-center gap-2">
                  <Camera className="w-9 h-9 text-[#3A3D50]" />
                  <p className="text-[#3A3D50] text-xs font-medium">Add Goal Photo</p>
                </div>
              )}
              {/* Bottom-fade for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Update Photo pill */}
            <label
              htmlFor="goal-img"
              className="absolute top-3 left-3 z-30 bg-black/50 backdrop-blur-sm border border-white/10 hover:bg-black/70 transition-colors cursor-pointer text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5"
            >
              <Camera className="w-3 h-3" /> Update Photo
            </label>

            {/* ── ARC PROGRESS ──
                Center is aligned to the D-curve's center:
                  horizontal: 87% of parent width
                  vertical:   50% of image area height
                The 350×350 SVG is centered there; overflow-hidden on parent clips top/bottom.
            */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: 'calc(87% - 175px)',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '350px',
                height: '350px',
                zIndex: 20,
              }}
            >
              <svg width="350" height="350" viewBox="0 0 350 350">
                <defs>
                  {/* Gradient: gold at top → orange → deep red at bottom, matching screenshot */}
                  <linearGradient
                    id="goal-arc-grad"
                    gradientUnits="userSpaceOnUse"
                    x1="175" y1="305"
                    x2="175" y2="45"
                  >
                    <stop offset="0%"   stopColor="#AA2000" />
                    <stop offset="30%"  stopColor="#FF4400" />
                    <stop offset="65%"  stopColor="#FF7700" />
                    <stop offset="100%" stopColor="#FFAA00" />
                  </linearGradient>
                  <filter id="arc-glow-f" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Background arc track */}
                <path
                  d="M 175 305 A 130 130 0 0 1 175 45"
                  fill="none"
                  stroke="#1C1E30"
                  strokeWidth="32"
                  strokeLinecap="round"
                />

                {/* Animated progress arc (clockwise from bottom → right → top) */}
                <motion.path
                  d="M 175 305 A 130 130 0 0 1 175 45"
                  fill="none"
                  stroke="url(#goal-arc-grad)"
                  strokeWidth="32"
                  strokeLinecap="round"
                  strokeDasharray={408}
                  initial={{ strokeDashoffset: 408 }}
                  animate={{ strokeDashoffset: 408 - (408 * Math.max(PERCENT, 0) / 100) }}
                  transition={{ duration: 2.2, ease: 'circOut' }}
                  filter="url(#arc-glow-f)"
                />
              </svg>
            </div>
          </div>

          {/* ── MIDDLE: Goal title + amount + thin bar ── */}
          <div className="px-5 md:px-7 pt-4 pb-4">
            <p className="text-[#EFAF00] text-sm font-semibold tracking-wide">
              Goal: {data.goal.name}
            </p>
            <div className="flex items-baseline gap-2 mt-1 flex-wrap">
              <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">
                ₹{data.overall.currentSavings.toLocaleString()}
              </h2>
              <span className="text-[#3A3D52] text-base md:text-xl font-medium">
                / ₹{data.overall.targetSavingsGoal.toLocaleString()}
              </span>
            </div>

            {/* Thin progress bar */}
            <div className="mt-4 h-[6px] rounded-full overflow-hidden bg-[#1B1D2C]">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #AA2000 0%, #FF4400 40%, #FF7700 75%, #FFAA00 100%)' }}
                initial={{ width: '0%' }}
                animate={{ width: `${Math.max(PERCENT, 0)}%` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* ── BOTTOM: Stats row ── */}
          <div className="flex items-start sm:items-center justify-between px-5 md:px-7 py-4 border-t border-white/[0.04]">
            <div>
              <p className="text-[#474A5B] text-[9px] md:text-[10px] uppercase tracking-widest font-extrabold mb-1">Target</p>
              <p className="text-white text-sm md:text-xl font-bold">₹{data.overall.monthlyTarget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[#474A5B] text-[9px] md:text-[10px] uppercase tracking-widest font-extrabold mb-1">On Track</p>
              <p className="text-white text-sm md:text-xl font-bold">₹{data.overall.remainingForSavings.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[#474A5B] text-[9px] md:text-[10px] uppercase tracking-widest font-extrabold mb-1">Gap</p>
              <p className={`text-sm md:text-xl font-bold ${data.overall.gap > 0 ? 'text-[#FF4400]' : 'text-emerald-400'}`}>
                ₹{data.overall.gap.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[#EFAF00] text-2xl md:text-4xl font-black leading-none tracking-tight">
                {PERCENT}%
              </p>
              <p className="text-[#474A5B] text-[9px] md:text-[10px] uppercase tracking-widest font-extrabold mt-1">Completed</p>
            </div>
          </div>
        </section>



        {/* TRADE OFF AI PANEL */}
        <AnimatePresence>
          {showScenarios && scenarios.length > 0 && (
             <motion.section initial={{ opacity: 0, scale: 0.95, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full">
               <div className="bg-gradient-to-br from-[#1F1914] to-[#16120D] border border-[#EFAF00]/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                 <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
                   <div>
                     <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                        <Sparkles className="w-5 h-5 text-[#EFAF00]" /> AI Financial Strategy
                     </h2>
                     <p className="text-[#8B8D98] text-sm mt-1">Plan generated to follow your savings goal.</p>
                   </div>
                 </div>
 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                   {scenarios.map((scen, idx) => (
                     <div key={idx} className={`rounded-2xl p-5 border flex flex-col transition-all group ${scen.id === 'B' ? 'bg-[#1C1710] border-[#EFAF00]' : 'bg-[#161822] border-[#232533]'}`}>
                       <h3 className="text-lg font-semibold text-white mb-2">{scen.name}</h3>
                       <div className="mb-4"><Badge className="bg-transparent border border-[#EFAF00] text-[#EFAF00] text-[10px] md:text-sm">Recovers ₹{scen.savingsRecovered}</Badge></div>
                       <p className="text-[#B5B7C0] text-sm flex-1">{scen.cutDescription}</p>
                       <div className="mt-5 pt-4 border-t border-white/5">
                         <p className="text-xs text-[#8B8D98] italic mb-4">{scen.impact}</p>
                          <Button className="w-full bg-[#EFAF00] hover:bg-[#D79A00] text-black" onClick={() => fetchData()}>Select This Plan</Button>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </motion.section>
           )}
        </AnimatePresence>

        {/* BOTTOM DASHBOARD GRID */}
        <div className="grid lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-12 space-y-6">
             <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-medium text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#8B8D98]" /> Categories
                </h2>
                <button 
                  onClick={() => {
                    setCatId("CREATE_NEW");
                    setIsCreatingCategory(true);
                    setShowExpenseModal(true);
                  }}
                  className="text-xs font-bold text-[#EFAF00] hover:text-[#FFD04C] transition-colors uppercase tracking-widest bg-[#EFAF00]/10 px-3 py-1.5 rounded-full border border-[#EFAF00]/20"
                >
                  + Add Category
                </button>
             </div>
            
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.categories.filter(c => c.type !== 'Emergency').map(cat => {
                const running = data.runningTotals[cat.id];
                if (!running) return null;
                const progress = Math.min(100, Math.round((running.spent / cat.budgeted_amount) * 100));
                
                const isOver = running.remaining < 0;
                const isWarning = !isOver && running.remaining <= 500 && running.remaining > 0;
                
                return (
                  <div 
                    key={cat.id} 
                    onClick={() => {
                       setManageCatId(cat.id);
                       setEditBudgetAmount(cat.budgeted_amount.toString());
                    }}
                    className="cursor-pointer bg-[#161822] border border-[#232533] rounded-2xl p-5 hover:border-[#383A49] transition-colors relative overflow-hidden flex flex-col justify-between group"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-base font-medium text-white group-hover:text-[#EFAF00] transition-colors">{cat.name}</h3>
                        <p className="text-xs text-[#8B8D98] mt-0.5">{cat.type}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-md text-xs font-medium ${isOver ? 'bg-red-500/10 text-red-400' : isWarning ? 'bg-yellow-500/10 text-yellow-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                        {running.status}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#8B8D98]">Spent: <span className="text-white font-medium">₹{running.spent.toLocaleString()}</span></span>
                        <span className="text-[#8B8D98]">Left: <span className={`font-medium ${isOver ? 'text-red-400' : 'text-white'}`}>₹{running.remaining.toLocaleString()}</span></span>
                      </div>
                      <div className="w-full bg-[#0C0E14] h-2 rounded-full overflow-hidden border border-[#232533]">
                        <div 
                          className={`h-full rounded-full ${isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-400' : 'bg-emerald-500'}`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* DYNAMIC LOG EXPENSE ACTION BUTTON */}
              <button 
                onClick={() => setShowExpenseModal(true)}
                className="bg-transparent border-2 border-dashed border-[#232533] rounded-2xl flex flex-col items-center justify-center p-5 text-[#8B8D98] hover:border-[#EFAF00]/50 hover:text-[#EFAF00] hover:bg-[#EFAF00]/5 transition-all group min-h-[140px]"
              >
                <div className="w-12 h-12 rounded-full bg-[#0C0E14] border border-[#232533] flex items-center justify-center mb-3 group-hover:border-[#EFAF00]/30 transition-all shadow-xl group-hover:bg-[#EFAF00]/10">
                   <PlusCircle className="w-6 h-6" />
                </div>
                <span className="font-medium text-sm">Track Expense</span>
              </button>

            </div>
            
            {/* TRANSACTIONS */}
            <div className="pt-4">
               <div className="flex items-center justify-between cursor-pointer mb-4" onClick={() => setShowHistory(!showHistory)}>
                 <h2 className="text-xl font-medium text-white flex items-center gap-2">
                   <History className="w-5 h-5 text-[#8B8D98]" /> Recent History
                 </h2>
                 <ChevronDown className={`w-5 h-5 text-[#8B8D98] transition-transform ${showHistory ? 'rotate-180' : ''}`} />
               </div>
               <AnimatePresence>
                 {showHistory && (
                   <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                     <div className="bg-[#161822] border border-[#232533] rounded-2xl overflow-hidden mt-2">
                       <div className="max-h-[350px] overflow-y-auto">
                         {data.transactions.length === 0 ? (
                            <p className="text-[#8B8D98] p-6 text-center text-sm">No transactions logged yet.</p>
                         ) : (
                           data.transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => {
                             const cat = data.categories.find(c => c.id === t.category_id);
                             return (
                               <div key={t.id} className="p-4 border-b border-[#232533] last:border-0 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-[#1E202C] transition-colors gap-3">
                                 <div className="flex items-center gap-4">
                                   <div className="bg-[#0C0E14] border border-[#232533] text-[#8B8D98] text-[10px] font-medium rounded-lg w-10 h-10 md:w-12 md:h-12 flex flex-col items-center justify-center shrink-0">
                                     <span className="text-white font-semibold text-xs md:text-sm">{format(new Date(t.date), "d")}</span>
                                     <span className="text-[8px] md:text-[10px] uppercase tracking-wider">{format(new Date(t.date), "MMM")}</span>
                                   </div>
                                   <div className="min-w-0">
                                     <p className="font-medium text-white text-sm flex items-center gap-2 truncate">
                                       {t.is_unexpected && <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />} {t.description}
                                     </p>
                                     <p className="text-xs text-[#8B8D98] truncate">{cat?.name}</p>
                                   </div>
                                 </div>
                                 <div className="font-medium text-white text-sm sm:text-base self-end sm:self-center">-₹{Number(t.amount).toLocaleString()}</div>
                               </div>
                             )
                           })
                         )}
                       </div>
                     </div>
                   </motion.div>
                 )}
               </AnimatePresence>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
