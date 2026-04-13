import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://plsiacgvnnuwucgactox.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsc2lhY2d2bm51d3VjZ2FjdG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDkyNTcsImV4cCI6MjA5MTQyNTI1N30.dOpBxmhy2qR3FFMwtYHR0zZDiJGLboUzjglM5TAo5PU";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  try {
    const { data: goals } = await supabase.from("goals").select("*").order("created_at", { ascending: false }).limit(1);
    const goal = goals?.[0] || null;

    const { data: categories } = await supabase.from("categories").select("*").order("sort_order");
    const { data: transactions } = await supabase.from("transactions").select("*");

    const runningTotals: Record<string, any> = {};
    let totalSpent = 0;
    
    categories?.forEach((cat) => {
      const catTransactions = transactions?.filter((t) => t.category_id === cat.id) || [];
      const spent = catTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const remaining = Number(cat.budgeted_amount) - spent;
      
      let status = "On Track";
      if (cat.type === "Emergency") status = "Emergency";
      else if (remaining < 0) status = "Over Budget";
      else if (remaining === 0) status = "Done";
      else if (remaining > 0 && remaining <= Math.max(500, Number(cat.budgeted_amount) * 0.1)) status = "Almost Spent";
      
      runningTotals[cat.id] = { spent, budgeted: Number(cat.budgeted_amount), remaining, status };
      totalSpent += spent;
    });

    let remainingForSavings = 0;
    let gap = 0;
    
    if (goal) {
       // Naively assume total budgeted is the user's income limit minus the monthly saving target, OR we just compute exactly what the logic implies:
       // The user sets a saving target per month. The target minus whatever they managed to save (or the gap between total expense and income)
       // Let's assume remainingForSavings is just the negative totalSpent if we don't know the exact income.
       // Actually, the goal defines `monthly_saving_target`. Let's assume total category budgets = Salary - SavingsTarget.
       const totalBudgeted = categories?.reduce((sum, c) => sum + Number(c.budgeted_amount), 0) || 0;
       const salary = (goal?.monthly_salary && Number(goal.monthly_salary) > 0)
          ? Number(goal.monthly_salary)
          : totalBudgeted + Number(goal.monthly_saving_target);
       remainingForSavings = salary - totalSpent;
       gap = Number(goal.monthly_saving_target) - remainingForSavings;
    }

    return NextResponse.json({
      goal,
      categories: categories || [],
      transactions: transactions || [],
      runningTotals,
      overall: {
        totalSpent,
        remainingForSavings,
        gap: gap > 0 ? gap : 0,
        onTrack: gap <= 0,
        monthlyTarget: goal ? Number(goal.monthly_saving_target) : 0,
        targetSavingsGoal: goal ? Number(goal.target_amount) : 0,
        currentSavings: 0 // Will be handled by frontend via transactions or start savings
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

