import { useState, useEffect, useRef, useMemo } from "react";
import {
  Box, Button, Input, VStack, HStack, Text, Badge, IconButton, SimpleGrid,
} from "@chakra-ui/react";
import { Plus, Trash2, Target, Upload, Wallet, Printer } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Legend,
} from "recharts";
import { supabase } from "../lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
type TransactionType = "income" | "expense";
type TabView = "ledger" | "analytics" | "goals";

interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  saved_amount: number;
  banner_url: string | null;
}

// ─── Config ───────────────────────────────────────────────────────────────────
const EXPENSE_CATEGORIES = ["Food", "Shopping", "Bills", "Entertainment", "Health", "Transport", "Other"];
const INCOME_CATEGORIES = ["Salary", "Freelance", "Gift", "Savings", "Other"];

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#FB923C", Shopping: "#EC4899", Bills: "#EF4444",
  Entertainment: "#A855F7", Health: "#10B981", Transport: "#3B82F6",
  Salary: "#14B8A6", Freelance: "#06B6D4", Gift: "#F472B6",
  Savings: "#22C55E", Other: "#9CA3AF",
};

const fmt = (n: number) =>
  "RM " + new Intl.NumberFormat("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

// ─── Table primitives ─────────────────────────────────────────────────────────
const TH = ({ children, w }: { children?: React.ReactNode; w?: string }) => (
  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "11px", fontWeight: 800,
    letterSpacing: "0.08em", color: "#be185d", background: "#fdf2f8",
    borderBottom: "2px solid #fbcfe8", borderRight: "1px solid #fce7f3", width: w }}>
    {children}
  </th>
);

const TD = ({ children, color, align }: { children: React.ReactNode; color?: string; align?: string }) => (
  <td style={{ padding: "10px 16px", fontSize: "14px", color: color || "#374151",
    fontWeight: color ? 700 : 500, borderBottom: "1px solid #fce7f3",
    borderRight: "1px solid #fce7f3", textAlign: (align as any) || "left" }}>
    {children}
  </td>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const FinanceTracker = () => {
  const [tab, setTab] = useState<TabView>("ledger");

  // Transactions
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | TransactionType>("all");
  const [newRow, setNewRow] = useState({
    type: "expense" as TransactionType, amount: "", category: "Other",
    description: "", date: new Date().toISOString().split("T")[0],
  });

  // Print
  const [printPeriod, setPrintPeriod] = useState<"day" | "month" | "year">("month");
  const [printDate, setPrintDate] = useState(new Date().toISOString().split("T")[0]);

  // Goals
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(true);
  const [goalForm, setGoalForm] = useState({ name: "", target: "", banner: "" });
  const [addingToGoal, setAddingToGoal] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [goalCalc, setGoalCalc] = useState<Record<string, { months: string; monthly: string }>>({});
  const [goalError, setGoalError] = useState("");
  const [goalAddError, setGoalAddError] = useState<Record<string, string>>({}); // eslint-disable-line
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchTransactions(); fetchGoals(); }, []);

  const fetchTransactions = async () => {
    setTxLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("id,type,amount,category,description,date")
        .order("date", { ascending: false })
        .limit(500);
      if (!error && data) setTransactions(data);
    } catch (e) {
      console.warn("fetchTransactions:", e);
    } finally {
      setTxLoading(false);
    }
  };

  const fetchGoals = async () => {
    setGoalsLoading(true);
    try {
      const { data, error } = await supabase
        .from("savings_goals")
        .select("id,name,target_amount,saved_amount,banner_url")
        .order("created_at", { ascending: true });
      if (!error && data) setGoals(data);
    } catch (e) {
      console.warn("fetchGoals:", e);
    } finally {
      setGoalsLoading(false);
    }
  };

  const addTransaction = async () => {
    const amount = parseFloat(newRow.amount);
    if (!newRow.amount || isNaN(amount) || amount <= 0) return;
    const { data, error } = await supabase.from("transactions").insert({
      type: newRow.type, amount, category: newRow.category,
      description: newRow.description.trim() || newRow.category, date: newRow.date,
    }).select().single();
    if (!error && data) {
      setTransactions((prev) => [data, ...prev]);
      setNewRow({ type: "expense", amount: "", category: "Other", description: "", date: new Date().toISOString().split("T")[0] });
    }
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (!error) setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const addGoal = async () => {
    setGoalError("");
    const target = parseFloat(goalForm.target);
    if (!goalForm.name.trim()) { setGoalError("Please enter a goal name."); return; }
    if (isNaN(target) || target <= 0) { setGoalError("Please enter a valid target amount."); return; }
    const { data, error } = await supabase.from("savings_goals").insert({
      name: goalForm.name.trim(), target_amount: target, saved_amount: 0, banner_url: goalForm.banner || null,
    }).select().single();
    if (error) { setGoalError(`Supabase error: ${error.message}`); return; }
    if (data) { setGoals((prev) => [...prev, data]); setGoalForm({ name: "", target: "", banner: "" }); }
  };

  const deleteGoal = async (id: string) => {
    const { error } = await supabase.from("savings_goals").delete().eq("id", id);
    if (!error) setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const addToGoal = async (goal: SavingsGoal) => {
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) return;
    const newSaved = Math.min(goal.saved_amount + amount, goal.target_amount);
    const { error } = await supabase.from("savings_goals").update({ saved_amount: newSaved }).eq("id", goal.id);
    if (!error) {
    setGoals((prev) => prev.map((g) => g.id === goal.id ? { ...g, saved_amount: newSaved } : g));
    setAddingToGoal(null); setAddAmount("");
    }
  };

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setGoalForm((f) => ({ ...f, banner: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const updateGoalCalc = (id: string, field: "months" | "monthly", value: string, remaining: number) => {
    const parsed = parseFloat(value);
    if (field === "months" && !isNaN(parsed) && parsed > 0) {
      setGoalCalc((prev) => ({ ...prev, [id]: { months: value, monthly: (remaining / parsed).toFixed(2) } }));
    } else if (field === "monthly" && !isNaN(parsed) && parsed > 0) {
      setGoalCalc((prev) => ({ ...prev, [id]: { months: String(Math.ceil(remaining / parsed)), monthly: value } }));
    } else {
      setGoalCalc((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
    }
  };

  const printStatement = () => {
    const prefix = printPeriod === "day" ? printDate : printPeriod === "month" ? printDate.slice(0, 7) : printDate.slice(0, 4);
    const rows = transactions.filter((t) => t.date.startsWith(prefix));
    const inc = rows.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const exp = rows.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Finance Statement</title>
    <style>
      body{font-family:sans-serif;padding:48px;color:#1f2937}
      h1{color:#EC4899;font-size:26px;margin-bottom:2px}
      .sub{color:#FDA4AF;font-size:12px;margin-bottom:32px}
      table{width:100%;border-collapse:collapse;margin-bottom:24px}
      th{background:#fdf2f8;color:#be185d;font-size:11px;letter-spacing:.08em;padding:10px 14px;text-align:left;border-bottom:2px solid #fbcfe8}
      td{padding:10px 14px;font-size:13px;border-bottom:1px solid #fce7f3}
      .inc{color:#10B981;font-weight:700}.exp{color:#EC4899;font-weight:700}
      .cards{display:flex;gap:20px;margin-top:20px}
      .card{padding:14px 22px;border-radius:12px;border:2px solid #fce7f3}
      .cl{font-size:10px;font-weight:800;color:#9CA3AF;letter-spacing:.08em}
      .cv{font-size:20px;font-weight:900;margin-top:4px}
    </style></head><body>
    <h1>Finance Statement ✨</h1>
    <p class="sub">Period: ${prefix} &nbsp;|&nbsp; Printed ${new Date().toLocaleDateString()}</p>
    <table><thead><tr><th>DATE</th><th>DESCRIPTION</th><th>CATEGORY</th><th>TYPE</th><th style="text-align:right">AMOUNT</th></tr></thead>
    <tbody>${rows.map((t) => `<tr>
      <td>${t.date}</td><td>${t.description}</td><td>${t.category}</td>
      <td class="${t.type}">${t.type}</td>
      <td class="${t.type}" style="text-align:right">${t.type === "income" ? "+" : "-"}${fmt(t.amount)}</td>
    </tr>`).join("")}</tbody></table>
    <div class="cards">
      <div class="card"><div class="cl">INCOME</div><div class="cv" style="color:#10B981">${fmt(inc)}</div></div>
      <div class="card"><div class="cl">EXPENSES</div><div class="cv" style="color:#EC4899">${fmt(exp)}</div></div>
      <div class="card"><div class="cl">BALANCE</div><div class="cv" style="color:${inc - exp >= 0 ? "#EC4899" : "#EF4444"}">${fmt(inc - exp)}</div></div>
    </div></body></html>`);
    win.document.close();
    win.print();
  };

  // ─── Computed ────────────────────────────────────────────────────────────────
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;
  const filtered = filterType === "all" ? transactions : transactions.filter((t) => t.type === filterType);

  const donutData = [
    { name: "Income", value: totalIncome, color: "#10B981" },
    { name: "Expenses", value: totalExpenses, color: "#EC4899" },
    ...(balance > 0 ? [{ name: "Savings", value: balance, color: "#A855F7" }] : []),
  ].filter((d) => d.value > 0);

  const monthlyData = useMemo(() => {
    const map: Record<string, { month: string; income: number; expenses: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = { month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }), income: 0, expenses: 0 };
    }
    transactions.forEach((t) => {
      const key = t.date.slice(0, 7);
      if (map[key]) {
        if (t.type === "income") map[key].income += t.amount;
        else map[key].expenses += t.amount;
      }
    });
    return Object.values(map);
  }, [transactions]);

  const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(0) : "0";

  return (
    <Box bg="linear-gradient(135deg, #fff0f6 0%, #f8f0ff 100%)" minH="100vh" p={8}>

      {/* Header */}
      <HStack mb={8} gap={3}>
        <Box w="40px" h="40px" bg="pink.100" borderRadius="xl" display="flex" alignItems="center" justifyContent="center">
          <Wallet size={22} color="#EC4899" />
        </Box>
        <VStack align="start" gap={0}>
          <Text fontSize="2xl" fontWeight="900" color="pink.500">Finance Tracker</Text>
          <Text fontSize="xs" color="pink.300" fontWeight="bold">Your money, your glow ✨</Text>
        </VStack>
      </HStack>

      {/* Summary Cards */}
      <SimpleGrid columns={3} gap={5} mb={8}>
        {[
          { label: "BALANCE", value: balance, color: balance >= 0 ? "#EC4899" : "#EF4444", border: balance >= 0 ? "#fce7f3" : "#fee2e2" },
          { label: "INCOME", value: totalIncome, color: "#10B981", border: "#d1fae5" },
          { label: "EXPENSES", value: totalExpenses, color: "#EF4444", border: "#fee2e2" },
        ].map((card) => (
          <Box key={card.label} bg="white" p={5} borderRadius="2xl" boxShadow="0 4px 20px rgba(255,182,193,0.2)"
            border="2px solid" style={{ borderColor: card.border }} textAlign="center">
            <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">{card.label}</Text>
            <Text fontSize="2xl" fontWeight="900" style={{ color: card.color }}>{fmt(card.value)}</Text>
          </Box>
        ))}
      </SimpleGrid>

      {/* Tabs */}
      <HStack mb={6} bg="white" p={1} borderRadius="full" w="fit-content" boxShadow="sm" border="1px solid" borderColor="pink.100">
        {(["ledger", "analytics", "goals"] as TabView[]).map((t) => (
          <Button key={t} size="sm" borderRadius="full"
            variant={tab === t ? "solid" : "ghost"}
            colorPalette={tab === t ? "pink" : "gray"}
            fontWeight="800" onClick={() => setTab(t)}>
            {t === "ledger" ? "📊 Ledger" : t === "analytics" ? "📈 Analytics" : "🎯 Goals"}
          </Button>
        ))}
      </HStack>

      {/* ══════════ LEDGER TAB ══════════ */}
      {tab === "ledger" && (
        <Box bg="white" borderRadius="3xl" boxShadow="0 8px 30px rgba(255,182,193,0.15)"
          border="2px solid" borderColor="pink.100" overflow="hidden">

          <HStack px={6} py={4} borderBottom="2px solid" borderColor="pink.100" justify="space-between" flexWrap="wrap" gap={3}>
            <Text fontWeight="800" fontSize="lg" color="pink.500">Transaction Ledger 📋</Text>
            <HStack gap={2} flexWrap="wrap">
              {/* Filter */}
              <HStack gap={1}>
                {(["all", "income", "expense"] as const).map((f) => (
                  <Button key={f} size="xs" borderRadius="full"
                    variant={filterType === f ? "solid" : "ghost"}
                    colorPalette={f === "income" ? "green" : f === "expense" ? "pink" : "purple"}
                    onClick={() => setFilterType(f)} fontWeight="bold" textTransform="capitalize">{f}</Button>
                ))}
              </HStack>
              {/* Print controls */}
              <HStack gap={2} bg="pink.50" px={3} py={1.5} borderRadius="full">
                <select value={printPeriod}
                  style={{ fontSize: "12px", fontWeight: 700, color: "#EC4899", background: "transparent", border: "none", outline: "none" }}
                  onChange={(e) => setPrintPeriod(e.target.value as any)}>
                  <option value="day">Day</option>
                  <option value="month">Month</option>
                  <option value="year">Year</option>
                </select>
                <Input type={printPeriod === "year" ? "number" : printPeriod === "month" ? "month" : "date"}
                  value={printPeriod === "year" ? printDate.slice(0, 4) : printPeriod === "month" ? printDate.slice(0, 7) : printDate}
                  size="xs" bg="white" border="none" borderRadius="md" w="120px" fontWeight="600"
                  onChange={(e) => setPrintDate(e.target.value)} />
                <IconButton aria-label="Print" size="xs" colorPalette="pink" borderRadius="full" onClick={printStatement}>
                  <Printer size={13} />
                </IconButton>
              </HStack>
            </HStack>
          </HStack>

          <Box overflowX="auto">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH w="110px">DATE</TH>
                  <TH>DESCRIPTION</TH>
                  <TH w="130px">CATEGORY</TH>
                  <TH w="100px">TYPE</TH>
                  <TH w="120px">AMOUNT</TH>
                  <TH w="50px" />
                </tr>
              </thead>
              <tbody>
                {/* Add row */}
                <tr style={{ background: "#faf5ff" }}>
                  <TD>
                    <Input type="date" value={newRow.date} size="xs" bg="white" border="1px solid" borderColor="purple.200" borderRadius="md"
                      onChange={(e) => setNewRow({ ...newRow, date: e.target.value })} />
                  </TD>
                  <TD>
                    <Input placeholder="Description..." value={newRow.description} size="xs" bg="white" border="1px solid" borderColor="purple.200" borderRadius="md"
                      onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && addTransaction()} />
                  </TD>
                  <TD>
                    <select value={newRow.category}
                      style={{ fontSize: "12px", fontWeight: 600, color: "#374151", background: "white", border: "1px solid #d8b4fe", borderRadius: "6px", padding: "4px 8px", width: "100%" }}
                      onChange={(e) => setNewRow({ ...newRow, category: e.target.value })}>
                      {(newRow.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </TD>
                  <TD>
                    <select value={newRow.type}
                      style={{ fontSize: "12px", fontWeight: 700, color: newRow.type === "income" ? "#10B981" : "#EC4899", background: "white", border: "1px solid #d8b4fe", borderRadius: "6px", padding: "4px 8px", width: "100%" }}
                      onChange={(e) => setNewRow({ ...newRow, type: e.target.value as TransactionType, category: "Other" })}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </TD>
                  <TD>
                    <Input type="number" placeholder="0.00" value={newRow.amount} size="xs" bg="white" border="1px solid" borderColor="purple.200" borderRadius="md" fontWeight="700"
                      onChange={(e) => setNewRow({ ...newRow, amount: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && addTransaction()} />
                  </TD>
                  <td style={{ padding: "10px 16px", borderBottom: "1px solid #fce7f3" }}>
                    <IconButton aria-label="Add row" size="xs" colorPalette="purple" borderRadius="md" onClick={addTransaction}>
                      <Plus size={14} />
                    </IconButton>
                  </td>
                </tr>

                {txLoading ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#FDA4AF", fontWeight: "bold" }}>Loading... ✨</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#9CA3AF", fontSize: "14px" }}>No transactions yet — add one above 🌸</td></tr>
                ) : (
                  filtered.map((t, i) => (
                    <tr key={t.id} className="group" style={{ background: i % 2 === 0 ? "white" : "#fff9fb" }}>
                      <TD color="#6B7280">{t.date}</TD>
                      <TD>
                        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: "220px" }}>
                          {t.description}
                        </span>
                      </TD>
                      <TD>
                        <HStack gap={1.5}>
                          <span style={{ width: "8px", height: "8px", borderRadius: "50%", flexShrink: 0, display: "inline-block", background: CATEGORY_COLORS[t.category] || "#9CA3AF" }} />
                          <Text fontSize="xs" fontWeight="600">{t.category}</Text>
                        </HStack>
                      </TD>
                      <TD>
                        <Badge colorPalette={t.type === "income" ? "green" : "pink"} variant="subtle" fontSize="10px" borderRadius="full" px={2}>
                          {t.type === "income" ? "↑ Income" : "↓ Expense"}
                        </Badge>
                      </TD>
                      <TD color={t.type === "income" ? "#10B981" : "#EC4899"} align="right">
                        {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                      </TD>
                      <td style={{ padding: "10px 16px", borderBottom: "1px solid #fce7f3" }}>
                        <IconButton aria-label="Delete" size="xs" variant="ghost" colorPalette="red" borderRadius="md"
                          opacity={0} _groupHover={{ opacity: 1 }} onClick={() => deleteTransaction(t.id)}>
                          <Trash2 size={12} />
                        </IconButton>
                      </td>
                    </tr>
                  ))
                )}

                {filtered.length > 0 && (
                  <tr style={{ background: "#fdf2f8" }}>
                    <td colSpan={4} style={{ padding: "12px 16px", borderTop: "2px solid #fce7f3" }}>
                      <Text fontSize="xs" fontWeight="800" color="pink.400" letterSpacing="wider">TOTAL</Text>
                    </td>
                    <td style={{ padding: "12px 16px", borderTop: "2px solid #fce7f3", textAlign: "right" }}>
                      <Text fontWeight="900" fontSize="md" color={balance >= 0 ? "#EC4899" : "#EF4444"}>{fmt(balance)}</Text>
                    </td>
                    <td style={{ borderTop: "2px solid #fce7f3" }} />
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        </Box>
      )}

      {/* ══════════ ANALYTICS TAB ══════════ */}
      {tab === "analytics" && (
        <SimpleGrid columns={{ base: 1, lg: 2 }} gap={8}>

          {/* Donut Chart */}
          <Box bg="white" p={6} borderRadius="3xl" boxShadow="0 8px 30px rgba(255,182,193,0.15)" border="2px solid" borderColor="pink.100">
            <Text fontWeight="800" fontSize="lg" color="pink.500" mb={1}>Income vs Expenses 🍩</Text>
            <Text fontSize="xs" color="gray.400" fontWeight="600" mb={6}>Breakdown of your money flow</Text>

            {totalIncome === 0 && totalExpenses === 0 ? (
              <Text textAlign="center" color="gray.400" py={12} fontSize="sm">Add some transactions to see your breakdown 🌸</Text>
            ) : (
              <>
                <Box position="relative">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie data={donutData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={3} dataKey="value">
                        {donutData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <ReTooltip formatter={(v) => fmt(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center label */}
                  <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" textAlign="center" pointerEvents="none">
                    <Text fontSize="xs" fontWeight="800" color="gray.400" letterSpacing="wider">SAVINGS RATE</Text>
                    <Text fontSize="2xl" fontWeight="900" color="pink.500">{savingsRate}%</Text>
                  </Box>
                </Box>
                {/* Legend */}
                <HStack justify="center" gap={6} mt={4} flexWrap="wrap">
                  {donutData.map((d) => (
                    <HStack key={d.name} gap={2}>
                      <Box w="10px" h="10px" borderRadius="full" style={{ background: d.color }} />
                      <Text fontSize="xs" fontWeight="700" color="gray.600">{d.name}</Text>
                      <Text fontSize="xs" color="gray.400">{fmt(d.value)}</Text>
                    </HStack>
                  ))}
                </HStack>
              </>
            )}
          </Box>

          {/* Bar Chart */}
          <Box bg="white" p={6} borderRadius="3xl" boxShadow="0 8px 30px rgba(255,182,193,0.15)" border="2px solid" borderColor="pink.100">
            <Text fontWeight="800" fontSize="lg" color="pink.500" mb={1}>Monthly Overview 📊</Text>
            <Text fontSize="xs" color="gray.400" fontWeight="600" mb={6}>Income vs expenses over the last 6 months</Text>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barCategoryGap="30%">
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `RM ${v}`} tick={{ fontSize: 10, fill: "#9CA3AF" }} axisLine={false} tickLine={false} width={55} />
                <ReTooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: "12px", border: "1px solid #fce7f3", fontSize: "12px" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", fontWeight: 700 }} />
                <Bar dataKey="income" name="Income" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#EC4899" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Category breakdown */}
          <Box bg="white" p={6} borderRadius="3xl" boxShadow="0 8px 30px rgba(255,182,193,0.15)" border="2px solid" borderColor="pink.100">
            <Text fontWeight="800" fontSize="lg" color="pink.500" mb={5}>Spending by Category 🏷️</Text>
            {transactions.filter((t) => t.type === "expense").length === 0 ? (
              <Text color="gray.400" fontSize="sm">No expenses yet 🌸</Text>
            ) : (
              <VStack gap={3} align="stretch">
                {Object.entries(
                  transactions.filter((t) => t.type === "expense").reduce((acc, t) => {
                    acc[t.category] = (acc[t.category] || 0) + t.amount;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, total]) => {
                    const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                    return (
                      <Box key={cat}>
                        <HStack justify="space-between" mb={1}>
                          <HStack gap={2}>
                            <Box w="8px" h="8px" borderRadius="full" style={{ background: CATEGORY_COLORS[cat] || "#9CA3AF" }} />
                            <Text fontSize="sm" fontWeight="700" color="gray.700">{cat}</Text>
                          </HStack>
                          <HStack gap={2}>
                            <Text fontSize="xs" color="gray.400">{pct.toFixed(0)}%</Text>
                            <Text fontSize="sm" fontWeight="800" color="pink.500">{fmt(total)}</Text>
                          </HStack>
                        </HStack>
                        <Box h="6px" bg="pink.50" borderRadius="full" overflow="hidden">
                          <Box h="100%" borderRadius="full" style={{ width: `${pct}%`, background: CATEGORY_COLORS[cat] || "#9CA3AF", transition: "width 0.5s ease" }} />
                        </Box>
                      </Box>
                    );
                  })}
              </VStack>
            )}
          </Box>

          {/* Quick stats */}
          <Box bg="white" p={6} borderRadius="3xl" boxShadow="0 8px 30px rgba(255,182,193,0.15)" border="2px solid" borderColor="pink.100">
            <Text fontWeight="800" fontSize="lg" color="pink.500" mb={5}>Quick Stats ✨</Text>
            <SimpleGrid columns={2} gap={4}>
              {[
                { label: "Total Transactions", value: String(transactions.length), color: "#A855F7" },
                { label: "Savings Rate", value: `${savingsRate}%`, color: balance >= 0 ? "#10B981" : "#EF4444" },
                { label: "Avg Income/mo", value: fmt(totalIncome / Math.max(monthlyData.filter((m) => m.income > 0).length, 1)), color: "#10B981" },
                { label: "Avg Expense/mo", value: fmt(totalExpenses / Math.max(monthlyData.filter((m) => m.expenses > 0).length, 1)), color: "#EC4899" },
              ].map((s) => (
                <Box key={s.label} p={4} bg="pink.50" borderRadius="2xl" textAlign="center">
                  <Text fontSize="10px" fontWeight="800" color="gray.400" letterSpacing="wider" mb={1}>{s.label.toUpperCase()}</Text>
                  <Text fontSize="xl" fontWeight="900" style={{ color: s.color }}>{s.value}</Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        </SimpleGrid>
      )}

      {/* ══════════ GOALS TAB ══════════ */}
      {tab === "goals" && (
        <VStack gap={6} align="stretch">
          {/* Add Goal Form */}
          <Box bg="white" p={6} borderRadius="3xl" boxShadow="0 8px 30px rgba(255,182,193,0.15)" border="2px solid" borderColor="pink.100">
            <Text fontWeight="800" fontSize="lg" color="pink.500" mb={5}>New Savings Goal 🎯</Text>
            <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={4}>
              <Box>
                <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">GOAL NAME</Text>
                <Input placeholder="e.g. New Laptop, Trip to Paris..."
                  value={goalForm.name} bg="pink.50" border="none" borderRadius="xl"
                  onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                  _focus={{ boxShadow: "0 0 0 2px #FFB6C1" }} />
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">TARGET AMOUNT</Text>
                <Input type="number" placeholder="0.00" value={goalForm.target} bg="pink.50" border="none" borderRadius="xl" fontWeight="bold"
                  onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                  _focus={{ boxShadow: "0 0 0 2px #FFB6C1" }} />
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="800" color="gray.400" mb={1} letterSpacing="wider">BANNER IMAGE</Text>
                <input type="file" accept="image/*" ref={bannerInputRef} style={{ display: "none" }} onChange={handleBannerUpload} />
                <Button w="100%" variant="outline" colorPalette="pink" borderRadius="xl" borderStyle="dashed" fontWeight="bold"
                  onClick={() => bannerInputRef.current?.click()}>
                  <Upload size={15} style={{ marginRight: "6px" }} />
                  {goalForm.banner ? "Change Image" : "Upload Banner"}
                </Button>
              </Box>
            </SimpleGrid>
            {goalForm.banner && (
              <Box mb={4} borderRadius="2xl" overflow="hidden" h="80px" w="160px">
                <img src={goalForm.banner} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Box>
            )}
            {goalError && (
              <Box mb={3} px={4} py={2.5} bg="red.50" borderRadius="xl" border="1px solid" borderColor="red.200">
                <Text fontSize="sm" color="red.500" fontWeight="700">⚠️ {goalError}</Text>
              </Box>
            )}
            <Button onClick={addGoal} colorPalette="pink" borderRadius="full" fontWeight="800" boxShadow="0 4px 12px rgba(255,105,180,0.3)">
              <Plus size={16} style={{ marginRight: "6px" }} /> Add Goal
            </Button>
          </Box>

          {/* Goal Cards — compact 2-column grid */}
          {goalsLoading ? (
            <Text textAlign="center" color="pink.300" fontWeight="bold" py={8}>Loading... ✨</Text>
          ) : goals.length === 0 ? (
            <Text textAlign="center" color="gray.400" py={8} fontSize="sm">No goals yet — dream big! 🌸</Text>
          ) : (
            <SimpleGrid columns={{ base: 1, md: 2 }} gap={4} alignItems="start">
              {goals.map((goal) => {
                const pct = Math.min((goal.saved_amount / goal.target_amount) * 100, 100);
                const remaining = goal.target_amount - goal.saved_amount;
                const done = pct >= 100;
                const calc = goalCalc[goal.id] || { months: "", monthly: "" };

                return (
                  <Box key={goal.id} bg="white" borderRadius="2xl" overflow="hidden"
                    boxShadow="0 4px 16px rgba(255,182,193,0.15)"
                    border="2px solid" style={{ borderColor: done ? "#bbf7d0" : "#fce7f3" }}>

                    {/* Banner */}
                    <Box position="relative" w="100%">
                      {goal.banner_url ? (
                        <img src={goal.banner_url} alt={goal.name}
                          style={{ width: "100%", height: "100px", objectFit: "cover", display: "block" }} />
                      ) : (
                        <div style={{ width: "100%", height: "60px", display: "flex", alignItems: "center",
                          justifyContent: "center", background: "linear-gradient(160deg, #fce7f3, #ede9fe)" }}>
                          <Target size={28} color="#EC4899" opacity={0.35} />
                        </div>
                      )}
                      {done && (
                        <Box position="absolute" inset={0} bg="blackAlpha.400"
                          display="flex" alignItems="center" justifyContent="center">
                          <Text fontSize="2xl">🎉</Text>
                        </Box>
                      )}
                      <IconButton aria-label="Delete" size="xs" colorPalette="red" variant="solid"
                        borderRadius="full" position="absolute" top={1.5} right={1.5}
                        onClick={() => deleteGoal(goal.id)}>
                        <Trash2 size={10} />
                      </IconButton>
                    </Box>

                    {/* Content */}
                    <Box p={4}>
                      <HStack justify="space-between" mb={2}>
                        <Text fontWeight="800" fontSize="sm" color="pink.600"
                          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>
                          {goal.name}
                        </Text>
                        {done
                          ? <Badge colorPalette="green" variant="solid" borderRadius="full" fontSize="9px">Done! 🎯</Badge>
                          : <Text fontSize="xs" fontWeight="800" color="pink.400">{pct.toFixed(0)}%</Text>
                        }
                      </HStack>

                      {/* Progress */}
                      <Box mb={3}>
                        <HStack justify="space-between" mb={1}>
                          <Text fontSize="xs" color="gray.500" fontWeight="600">
                            {fmt(goal.saved_amount)} <Text as="span" color="gray.300">/ {fmt(goal.target_amount)}</Text>
                          </Text>
                          {!done && <Text fontSize="10px" color="gray.400">{fmt(remaining)} left</Text>}
                        </HStack>
                        <Box h="6px" bg="pink.50" borderRadius="full" overflow="hidden">
                          <div style={{ height: "100%", borderRadius: "9999px", transition: "width 0.5s ease", width: `${pct}%`,
                            background: done ? "linear-gradient(90deg,#10B981,#34D399)" : "linear-gradient(90deg,#EC4899,#A855F7)" }} />
                        </Box>
                      </Box>

                      {/* Add savings + calculator */}
                      {!done && (
                        <Box>
                          {addingToGoal === goal.id ? (
                            <HStack gap={2} mb={3}>
                              <Input type="number" placeholder="Amount" value={addAmount} size="sm"
                                bg="pink.50" border="none" borderRadius="xl" fontWeight="bold" flex={1}
                                onChange={(e) => setAddAmount(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addToGoal(goal)} />
                              <Button size="sm" colorPalette="pink" borderRadius="xl" fontWeight="800" onClick={() => addToGoal(goal)}>Add</Button>
                              <Button size="sm" variant="ghost" borderRadius="xl" onClick={() => { setAddingToGoal(null); setAddAmount(""); }}>✕</Button>
                            </HStack>
                          ) : (
                            <Button size="xs" colorPalette="pink" variant="outline" borderRadius="xl" fontWeight="800" mb={3}
                              onClick={() => setAddingToGoal(goal.id)}>
                              + Add Savings
                            </Button>
                          )}

                          {/* Compact calculator */}
                          <Box bg="purple.50" px={3} py={2} borderRadius="xl">
                            <Text fontSize="9px" fontWeight="800" color="purple.400" letterSpacing="wider" mb={1.5}>MONTHLY CALC</Text>
                            <HStack gap={2}>
                              <VStack gap={0} align="start" flex={1}>
                                <Text fontSize="9px" color="gray.400" fontWeight="700">MONTHS</Text>
                                <Input type="number" placeholder="12" value={calc.months} size="xs"
                                  bg="white" border="none" borderRadius="lg" fontWeight="700"
                                  onChange={(e) => updateGoalCalc(goal.id, "months", e.target.value, remaining)} />
                              </VStack>
                              <Text fontSize="xs" color="purple.300" fontWeight="800" mt={3}>÷</Text>
                              <VStack gap={0} align="start" flex={1}>
                                <Text fontSize="9px" color="gray.400" fontWeight="700">PER MONTH</Text>
                                <Input type="number" placeholder="100" value={calc.monthly} size="xs"
                                  bg="white" border="none" borderRadius="lg" fontWeight="700"
                                  onChange={(e) => updateGoalCalc(goal.id, "monthly", e.target.value, remaining)} />
                              </VStack>
                              {calc.months && calc.monthly && (
                                <VStack gap={0} align="start">
                                  <Text fontSize="9px" color="gray.400" fontWeight="700">DONE BY</Text>
                                  <Text fontSize="9px" fontWeight="800" color="purple.500">
                                    {(() => {
                                      const d = new Date();
                                      d.setMonth(d.getMonth() + parseInt(calc.months));
                                      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                                    })()}
                                  </Text>
                                </VStack>
                              )}
                            </HStack>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </SimpleGrid>
          )}
        </VStack>
      )}
    </Box>
  );
};

export default FinanceTracker;
