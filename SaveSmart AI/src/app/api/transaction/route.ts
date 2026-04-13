import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://plsiacgvnnuwucgactox.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsc2lhY2d2bm51d3VjZ2FjdG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDkyNTcsImV4cCI6MjA5MTQyNTI1N30.dOpBxmhy2qR3FFMwtYHR0zZDiJGLboUzjglM5TAo5PU";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Fetch live data for validation and budget checking
    const { data: goals } = await supabase.from("goals").select("*").order("created_at", { ascending: false }).limit(1);
    const goal = goals?.[0];
    const { data: categories } = await supabase.from("categories").select("*");
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    
    const { data: transactions } = await supabase.from("transactions")
      .select("*")
      .gte("date", firstDayOfMonth);

    // 2. Check for budget overflow in the target category
    const catId = body.category_id && body.category_id !== "" ? body.category_id : null;
    const targetCat = categories?.find(c => c.id === catId);
    const budgetLimit = targetCat ? Number(targetCat.budgeted_amount) : 0;
    const currentCatSpent = transactions?.filter(t => t.category_id === catId)
      .reduce((acc, t) => acc + Number(t.amount), 0) || 0;
    
    const isOverBudget = budgetLimit > 0 && (currentCatSpent + Number(body.amount)) > budgetLimit;
    const shouldTriggerAi = body.is_unexpected || isOverBudget;

    // 3. Insert into Supabase
    const { error } = await supabase.from("transactions").insert({
      date: body.date,
      description: body.description,
      amount: body.amount,
      category_id: catId,
      is_unexpected: shouldTriggerAi
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    // ----------------------------------------------------
    // DYNAMIC  AI SCENARIO ENGINE via n8n (Gemini LLM)
    // ----------------------------------------------------
    let scenarios = null;
    let n8nError = null;

    if (shouldTriggerAi) {
      // Data is already fetched above, reuse it (but include the new transaction)
      // Note: transactions from DB don't have the new one yet, so we account for it.
      const allTransactions = [...(transactions || []), { amount: body.amount, category_id: catId }];

      
      let totalSpent = 0;
      const wants: any[] = [];

      categories?.forEach((cat) => {
        const catTransactions = allTransactions.filter((t) => t.category_id === cat.id);
        const spent = catTransactions.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const remaining = Number(cat.budgeted_amount) - spent;
        totalSpent += spent;

        if (cat.type === "Want" || cat.type === "Buffer") {
           wants.push({ name: cat.name, budgeted: cat.budgeted_amount, remaining });
        }
      });
      
      const salary = (goal?.monthly_salary && Number(goal.monthly_salary) > 0)
          ? Number(goal.monthly_salary)
          : ((categories?.reduce((acc, c) => acc + Number(c.budgeted_amount), 0) || 0) + (goal ? Number(goal.monthly_saving_target) : 0));
      
      const remainingForSavings = salary - totalSpent; 
      const gap = (goal ? Number(goal.monthly_saving_target) : 25000) - remainingForSavings;

      const payloadToN8n = {
         transaction: { amount: body.amount, description: body.description },
         goal: goal || { target_amount: 150000, duration_months: 6, monthly_saving_target: 25000, monthly_salary: salary },
         overall: { totalSpent, gap: gap > 0 ? gap : 0, monthly_salary: salary },
         wants
      };

      try {
             // Calling the newly created Dynamic SaveSmart AI Agent
             const n8nRes = await fetch("https://nonempathically-mercapto-leoma.ngrok-free.dev/webhook/savesmart", {
               method: "POST",
               headers: { "Content-Type": "application/json" },
               body: JSON.stringify(payloadToN8n)
             });
        
        if (n8nRes.ok) {
           const json = await n8nRes.json();
           
           // Robust parsing for various n8n/LLM return formats
           let rawContent = "";
           if (typeof json === 'string') rawContent = json;
           else if (json.scenarios) {
              scenarios = json.scenarios;
           } 
           else if (json.output) rawContent = json.output;
           else if (json.text) rawContent = json.text;
           else rawContent = JSON.stringify(json);

           if (!scenarios && rawContent) {
              try {
                const cleaned = rawContent.replace(/```json|```/g, "").trim();
                const p = JSON.parse(cleaned);
                scenarios = p.scenarios || (Array.isArray(p) ? p : null);
              } catch(e) {
                // If it's a plain string from AI, maybe it's just one text
                scenarios = [{ id: "A", name: "AI Insight", cutDescription: rawContent, savingsRecovered: 0, impact: "Direct Strategy" }];
              }
           }
        } else {
           n8nError = "n8n webhook error. Ensure workflow 'Dynamic SaveSmart AI Agent' is executing!";
           throw new Error("n8n workflow error");
        }
      } catch(e: any) {
        // Safe fallback placeholder
        scenarios = [
          {
            id: "ERROR",
            name: "Agent Offline",
            cutDescription: n8nError || "The n8n workflow 'Dynamic SaveSmart AI Agent' failed to execute.",
            savingsRecovered: 0,
            impact: "Open your n8n dashboard and click 'Listen for Test Events' on the active workflow."
          }
        ];
      }
    }

    return NextResponse.json({ success: true, scenarios });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
