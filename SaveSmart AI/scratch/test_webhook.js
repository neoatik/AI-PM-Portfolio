
async function test() {
  const url = "https://nonempathically-mercapto-leoma.ngrok-free.dev/webhook/savesmart";
  try {
     const res = await fetch(url, {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({
          transaction: { amount: 5000, description: "Rent" },
          goal: { target_amount: 150000, duration_months: 6, monthly_saving_target: 25000, monthly_salary: 100000 },
          overall: { totalSpent: 100, gap: 0, monthly_salary: 100000 },
          wants: []
       })
     });
     console.log("Status:", res.status);
     const text = await res.text();
     console.log("Response:", text);
  } catch(e) {
     console.error("Error:", e);
  }
}

test();
