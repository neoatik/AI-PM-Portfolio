import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://plsiacgvnnuwucgactox.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsc2lhY2d2bm51d3VjZ2FjdG94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NDkyNTcsImV4cCI6MjA5MTQyNTI1N30.dOpBxmhy2qR3FFMwtYHR0zZDiJGLboUzjglM5TAo5PU";

const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Insert Goal
    const { error: goalError } = await supabase.from("goals").insert({
      name: body.goalName,
      target_amount: body.targetAmount,
      duration_months: body.durationMonths,
      start_date: body.startDate,
      monthly_saving_target: body.monthlySavingTarget,
      monthly_salary: body.monthlySalary
    });

    if (goalError) {
      return NextResponse.json({ error: goalError.message }, { status: 400 });
    }

    // 2. Clear Existing Categories to prevent duplicates during re-setup
    await supabase.from("categories").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all

    // 3. Insert Initial Categories
    if (body.categories && body.categories.length > 0) {
       const mappedCats = body.categories.map((c: any, index: number) => ({
           name: c.name,
           type: c.type,
           budgeted_amount: c.amount,
           sort_order: index
       }));
       const { error: catError } = await supabase.from("categories").insert(mappedCats);
       if (catError) {
         return NextResponse.json({ error: catError.message }, { status: 400 });
       }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
