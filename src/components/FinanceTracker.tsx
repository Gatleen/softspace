import { useState, useEffect, useRef, useMemo } from "react";
import { Box, Button, Input, Text, IconButton } from "@chakra-ui/react";
import { Plus, Trash2, Target, Upload, Printer } from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Legend,
} from "recharts";
import { supabase } from "../lib/supabase";
import SectionHeader from "./ui/SectionHeader";
import SoftSpaceCard from "./ui/SoftSpaceCard";
import { recordFinanceState } from "../lib/achievements";

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

// ─── Shared visual bits ───────────────────────────────────────────────────────
const selectStyle: React.CSSProperties = {
  fontSize: "12px", fontWeight: 700, color: "#5C4A63", background: "white",
  border: "1.5px solid #FFDDEB", borderRadius: "10px", padding: "6px 8px", outline: "none",
};

const BarTrack = ({ pct, color }: { pct: number; color: string }) => (
  <Box h="13px" borderRadius="999px" background="#FFF0F6" border="1.5px solid #FFE9F1" overflow="hidden">
    <Box h="100%" borderRadius="999px" style={{ width: `${Math.min(pct, 100)}%`, background: color, opacity: 0.75, transition: "width 0.4s ease" }} />
  </Box>
);

const Pill = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <Box
    as="button"
    onClick={onClick}
    px="14px"
    py="6px"
    borderRadius="999px"
    background={active ? "linear-gradient(135deg,#FFC2DA,#CDB4F6)" : "white"}
    border={active ? "2.5px solid white" : "2px solid #FFDDEB"}
    boxShadow={active ? "0 4px 0 rgba(196,87,127,.22)" : "none"}
    cursor="pointer"
    flexShrink={0}
  >
    <Text
      fontFamily="'Jersey 25', cursive"
      fontSize="13px"
      letterSpacing=".3px"
      color={active ? "white" : "#B79ACB"}
      textShadow={active ? "0 1px 0 rgba(196,87,127,.3)" : "none"}
      textTransform="capitalize"
      lineHeight="1.1"
    >
      {children}
    </Text>
  </Box>
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
      recordFinanceState({ transactionsCount: transactions.length + 1 });
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
    if (data) {
      setGoals((prev) => [...prev, data]);
      setGoalForm({ name: "", target: "", banner: "" });
      recordFinanceState({ goalsCount: goals.length + 1 });
    }
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
    if (newSaved >= goal.target_amount) recordFinanceState({ goalCompleted: true });
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
    { name: "Income", value: totalIncome, color: "#0E9F6E" },
    { name: "Expenses", value: totalExpenses, color: "#E11D48" },
    ...(balance > 0 ? [{ name: "Savings", value: balance, color: "#8A6BD1" }] : []),
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

  // Same "spend by category" computation used by both the Ledger sidebar
  // ("Where it went") and the Analytics tab — logic unchanged, just shared.
  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map).sort(([, a], [, b]) => b - a);
  }, [transactions]);

  return (
    <Box>
      <SectionHeader
        title="Money Diary"
        meta={
          <Box display="flex" gap="8px">
            {(["ledger", "analytics", "goals"] as TabView[]).map((t) => (
              <Pill key={t} active={tab === t} onClick={() => setTab(t)}>
                {t === "ledger" ? "Ledger" : t === "analytics" ? "Analytics" : "Goals"}
              </Pill>
            ))}
          </Box>
        }
      />

      {/* Summary cards */}
      <Box display="flex" flexDirection={{ base: "column", sm: "row" }} gap="18px" mb="22px">
        <Box flex="1" p="18px 22px" borderRadius="22px" bg="white" border="2.5px solid #FFDDEB" boxShadow="0 6px 0 rgba(255,199,222,.45)">
          <Text fontSize="10.5px" fontWeight="800" letterSpacing="2px" color="#F27DAB">THIS MONTH IN</Text>
          <Text fontFamily="'Jersey 25', cursive" fontSize={{ base: "28px", md: "40px" }} color="#0E9F6E" lineHeight="1.1">{fmt(totalIncome)}</Text>
        </Box>
        <Box flex="1" p="18px 22px" borderRadius="22px" bg="white" border="2.5px solid #FFDDEB" boxShadow="0 6px 0 rgba(255,199,222,.45)">
          <Text fontSize="10.5px" fontWeight="800" letterSpacing="2px" color="#F27DAB">THIS MONTH OUT</Text>
          <Text fontFamily="'Jersey 25', cursive" fontSize={{ base: "28px", md: "40px" }} color="#E11D48" lineHeight="1.1">{fmt(totalExpenses)}</Text>
        </Box>
        <Box flex="1" p="18px 22px" borderRadius="22px" background="linear-gradient(135deg,#FDF2F8,#F4EEFF)" border="2.5px solid #EEDCFB" boxShadow="0 6px 0 rgba(205,180,246,.35)">
          <Text fontSize="10.5px" fontWeight="800" letterSpacing="2px" color="#8A6BD1">BALANCE LEFT</Text>
          <Text fontFamily="'Jersey 25', cursive" fontSize={{ base: "28px", md: "40px" }} color="#8A6BD1" lineHeight="1.1">{fmt(balance)}</Text>
        </Box>
      </Box>

      {/* ══════════ LEDGER TAB ══════════ */}
      {tab === "ledger" && (
        <Box display="flex" flexDirection={{ base: "column", lg: "row" }} gap="22px" alignItems={{ base: "stretch", lg: "flex-start" }}>

          {/* Left — transactions table */}
          <Box flex="1">
            <SoftSpaceCard
              title="Transactions"
              subtitle="All · Income · Expense"
              bodyPadding="0"
              headerRight={
                <Box
                  as="button"
                  onClick={addTransaction}
                  display="flex"
                  alignItems="center"
                  gap="4px"
                  px="12px"
                  py="5px"
                  borderRadius="999px"
                  bg="rgba(255,255,255,.4)"
                  color="white"
                  fontSize="11px"
                  fontWeight="800"
                  flexShrink={0}
                  cursor="pointer"
                >
                  <Plus size={12} /> Add row
                </Box>
              }
            >
              {/* Filter pills */}
              <Box display="flex" gap="8px" p="16px 20px 12px">
                {(["all", "income", "expense"] as const).map((f) => (
                  <Pill key={f} active={filterType === f} onClick={() => setFilterType(f)}>{f}</Pill>
                ))}
              </Box>

              {/* Dashed add-row */}
              <Box
                display="flex"
                alignItems="center"
                gap="8px"
                p="10px 14px"
                m="0 20px 14px"
                border="2px dashed #FFC8DE"
                borderRadius="14px"
                background="#FFFBFD"
                flexWrap="wrap"
              >
                <Input
                  type="date" value={newRow.date} size="xs" w="130px"
                  bg="white" border="1.5px solid #FFDDEB" borderRadius="10px" fontWeight="600" color="#5C4A63"
                  _focus={{ borderColor: "#F27DAB" }}
                  onChange={(e) => setNewRow({ ...newRow, date: e.target.value })}
                />
                <Input
                  placeholder="Description..." value={newRow.description} size="xs" flex="1" minW="120px"
                  bg="white" border="1.5px solid #FFDDEB" borderRadius="10px" fontWeight="600" color="#5C4A63"
                  _placeholder={{ color: "#C2AECF" }}
                  _focus={{ borderColor: "#F27DAB" }}
                  onChange={(e) => setNewRow({ ...newRow, description: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addTransaction()}
                />
                <Box
                  as="button"
                  onClick={() => setNewRow({ ...newRow, type: newRow.type === "expense" ? "income" : "expense", category: "Other" })}
                  px="10px" py="5px" borderRadius="999px"
                  background={newRow.type === "income" ? "#E6F9F1" : "#FFF0F6"}
                  border={`1.5px solid ${newRow.type === "income" ? "#0E9F6E" : "#F27DAB"}`}
                  cursor="pointer" flexShrink={0}
                >
                  <Text fontSize="10px" fontWeight="800" color={newRow.type === "income" ? "#0E9F6E" : "#F27DAB"}>
                    {newRow.type === "income" ? "↑ IN" : "↓ OUT"}
                  </Text>
                </Box>
                <select
                  value={newRow.category}
                  style={{ ...selectStyle, width: "110px" }}
                  onChange={(e) => setNewRow({ ...newRow, category: e.target.value })}
                >
                  {(newRow.type === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <Input
                  type="number" placeholder="0.00" value={newRow.amount} size="xs" w="90px"
                  bg="white" border="1.5px solid #FFDDEB" borderRadius="10px" fontWeight="700" color="#5C4A63"
                  _focus={{ borderColor: "#F27DAB" }}
                  onChange={(e) => setNewRow({ ...newRow, amount: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && addTransaction()}
                />
                <IconButton
                  aria-label="Add row" size="xs" borderRadius="full" flexShrink={0}
                  background="linear-gradient(135deg,#FFC2DA,#CDB4F6)" color="white"
                  onClick={addTransaction}
                >
                  <Plus size={14} />
                </IconButton>
              </Box>

              {/* Table (header + rows share one horizontal scroll container so columns stay aligned) */}
              <Box overflowX="auto">
                <Box minW="480px">
                  {/* Table header */}
                  <Box
                    display="grid" gridTemplateColumns="70px 1fr 120px 120px 32px"
                    background="#FFF6FA" borderBottom="2.5px solid #FFDDEB" p="10px 20px"
                  >
                    <Text fontSize="10px" fontWeight="800" letterSpacing="1.5px" color="#C0577E">DATE</Text>
                    <Text fontSize="10px" fontWeight="800" letterSpacing="1.5px" color="#C0577E">DESCRIPTION</Text>
                    <Text fontSize="10px" fontWeight="800" letterSpacing="1.5px" color="#C0577E">CATEGORY</Text>
                    <Text fontSize="10px" fontWeight="800" letterSpacing="1.5px" color="#C0577E" textAlign="right">AMOUNT</Text>
                    <Box />
                  </Box>

                  {/* Rows */}
                  {txLoading ? (
                    <Text textAlign="center" py="40px" color="#C2AECF" fontWeight="700">Loading...</Text>
                  ) : filtered.length === 0 ? (
                    <Text textAlign="center" py="40px" color="#C2AECF" fontSize="13px" fontWeight="600">No transactions yet — add one above 🌸</Text>
                  ) : (
                    filtered.map((t) => (
                      <Box
                        key={t.id}
                        className="group"
                        position="relative"
                        display="grid"
                        gridTemplateColumns="70px 1fr 120px 120px 32px"
                        alignItems="center"
                        p="11px 20px"
                        borderBottom="1.5px solid #FFF0F6"
                      >
                        <Text fontSize="11.5px" fontWeight="700" color="#B79ACB">{t.date}</Text>
                        <Text
                          fontSize="13px" fontWeight="600" color="#5C4A63"
                          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: "8px" }}
                        >
                          {t.description}
                        </Text>
                        <Box display="flex" alignItems="center" gap="6px" minW={0}>
                          <Box w="8px" h="8px" borderRadius="full" flexShrink={0} background={CATEGORY_COLORS[t.category] || "#9CA3AF"} />
                          <Text fontSize="11.5px" fontWeight="800" color="#8A7690" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {t.category}
                          </Text>
                        </Box>
                        <Text fontSize="13.5px" fontWeight="800" textAlign="right" color={t.type === "income" ? "#0E9F6E" : "#E11D48"}>
                          {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                        </Text>
                        <Box display="flex" justifyContent="flex-end">
                          <IconButton
                            aria-label="Delete" size="xs" variant="ghost" borderRadius="md"
                            opacity={0} _groupHover={{ opacity: 1 }}
                            onClick={() => deleteTransaction(t.id)}
                          >
                            <Trash2 size={12} color="#C2AECF" />
                          </IconButton>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </Box>

              {/* Print footer */}
              <Box display="flex" alignItems="center" gap="10px" flexWrap="wrap" p="16px 20px" borderTop="2px solid #FFF0F6">
                <Text fontSize="12px" fontWeight="700" color="#8A7690">Print report:</Text>
                <Box display="flex" gap="6px">
                  {(["day", "month", "year"] as const).map((p) => (
                    <Pill key={p} active={printPeriod === p} onClick={() => setPrintPeriod(p)}>{p}</Pill>
                  ))}
                </Box>
                <Input
                  type={printPeriod === "year" ? "number" : printPeriod === "month" ? "month" : "date"}
                  value={printPeriod === "year" ? printDate.slice(0, 4) : printPeriod === "month" ? printDate.slice(0, 7) : printDate}
                  size="xs" w="130px" bg="white" border="1.5px solid #FFDDEB" borderRadius="10px" fontWeight="600" color="#5C4A63"
                  onChange={(e) => setPrintDate(e.target.value)}
                />
                <IconButton
                  aria-label="Print" size="xs" borderRadius="full"
                  background="linear-gradient(135deg,#FFC2DA,#CDB4F6)" color="white"
                  onClick={printStatement}
                >
                  <Printer size={13} />
                </IconButton>
              </Box>
            </SoftSpaceCard>
          </Box>

          {/* Right column */}
          <Box w={{ base: "100%", lg: "400px" }} flexShrink={0} display="flex" flexDirection="column" gap="18px">

            {/* Where it went */}
            <Box bg="white" border="2.5px solid #EEDCFB" borderRadius="24px" boxShadow="0 6px 0 rgba(205,180,246,.35)" p="18px 20px">
              <Text fontSize="10.5px" fontWeight="800" letterSpacing="2px" color="#8A6BD1" mb="14px">WHERE IT WENT</Text>
              {categoryBreakdown.length === 0 ? (
                <Text textAlign="center" fontSize="12px" color="#C2AECF">No expenses yet 🌸</Text>
              ) : (
                <Box display="flex" flexDirection="column" gap="12px">
                  {categoryBreakdown.map(([cat, total]) => {
                    const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                    return (
                      <Box key={cat}>
                        <Box display="flex" justifyContent="space-between" mb="4px">
                          <Text fontSize="12px" fontWeight="700" color="#5C4A63">{cat}</Text>
                          <Text fontSize="12px" fontWeight="800" color="#8A6BD1">{fmt(total)}</Text>
                        </Box>
                        <BarTrack pct={pct} color={CATEGORY_COLORS[cat] || "#9CA3AF"} />
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* Savings goals summary */}
            <Box bg="white" border="2.5px solid #FFDDEB" borderRadius="24px" boxShadow="0 6px 0 rgba(255,199,222,.45)" p="18px 20px">
              <Text fontSize="10.5px" fontWeight="800" letterSpacing="2px" color="#F27DAB" mb="14px">SAVINGS GOALS</Text>
              {goalsLoading ? (
                <Text textAlign="center" fontSize="12px" color="#C2AECF" fontWeight="700">Loading...</Text>
              ) : goals.length === 0 ? (
                <Text textAlign="center" fontSize="12px" color="#C2AECF">No goals yet — dream big! 🌸</Text>
              ) : (
                <Box display="flex" flexDirection="column" gap="14px" mb="14px">
                  {goals.map((goal) => {
                    const pct = Math.min((goal.saved_amount / goal.target_amount) * 100, 100);
                    return (
                      <Box key={goal.id} display="flex" gap="12px" alignItems="center">
                        <Box
                          w="52px" h="52px" borderRadius="14px" overflow="hidden" flexShrink={0}
                          background="linear-gradient(160deg,#FFF0F6,#F6F0FF)"
                          display="flex" alignItems="center" justifyContent="center"
                        >
                          {goal.banner_url ? (
                            <img src={goal.banner_url} alt={goal.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <Target size={20} color="#F27DAB" opacity={0.5} />
                          )}
                        </Box>
                        <Box flex="1" minW={0}>
                          <Box display="flex" justifyContent="space-between" alignItems="baseline" gap="6px">
                            <Text
                              fontFamily="'Jersey 25', cursive" fontSize="23px" color="#C0577E" lineHeight="1"
                              style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                              {goal.name}
                            </Text>
                            <Text fontSize="11px" fontWeight="800" color="#8A6BD1" flexShrink={0}>{pct.toFixed(0)}%</Text>
                          </Box>
                          <Box mt="4px">
                            <BarTrack pct={pct} color="#F9A8CB" />
                          </Box>
                          <Text fontSize="11px" fontWeight="700" color="#A08B9B" mt="4px">
                            {fmt(goal.saved_amount)} of {fmt(goal.target_amount)}
                          </Text>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
              <Box
                as="button"
                onClick={() => setTab("goals")}
                w="100%" p="12px" borderRadius="16px" border="2px dashed #FFC8DE"
                textAlign="center" cursor="pointer" background="transparent"
              >
                <Text fontFamily="'Jersey 25', cursive" fontSize="16px" color="#F27DAB">+ New goal</Text>
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* ══════════ ANALYTICS TAB ══════════ */}
      {tab === "analytics" && (
        <Box display="grid" gridTemplateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap="18px">

          {/* Donut chart */}
          <SoftSpaceCard title="Income vs Expenses" subtitle="Breakdown of your money flow">
            {totalIncome === 0 && totalExpenses === 0 ? (
              <Text textAlign="center" color="#C2AECF" py="40px" fontSize="13px" fontWeight="600">Add some transactions to see your breakdown 🌸</Text>
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
                  <Box position="absolute" top="50%" left="50%" transform="translate(-50%, -50%)" textAlign="center" pointerEvents="none">
                    <Text fontSize="10px" fontWeight="800" color="#A08B9B" letterSpacing="1.5px">SAVINGS RATE</Text>
                    <Text fontFamily="'Jersey 25', cursive" fontSize="28px" color="#C0577E">{savingsRate}%</Text>
                  </Box>
                </Box>
                <Box display="flex" justifyContent="center" gap="18px" mt="14px" flexWrap="wrap">
                  {donutData.map((d) => (
                    <Box key={d.name} display="flex" alignItems="center" gap="6px">
                      <Box w="10px" h="10px" borderRadius="full" style={{ background: d.color }} />
                      <Text fontSize="12px" fontWeight="700" color="#5C4A63">{d.name}</Text>
                      <Text fontSize="12px" color="#A08B9B">{fmt(d.value)}</Text>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </SoftSpaceCard>

          {/* Bar chart */}
          <SoftSpaceCard title="Monthly Overview" subtitle="Income vs expenses over the last 6 months">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlyData} barCategoryGap="30%">
                <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700, fill: "#A08B9B" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => `RM ${v}`} tick={{ fontSize: 10, fill: "#A08B9B" }} axisLine={false} tickLine={false} width={55} />
                <ReTooltip formatter={(v: any) => fmt(v)} contentStyle={{ borderRadius: "12px", border: "1.5px solid #FFDDEB", fontSize: "12px" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px", fontWeight: 700 }} />
                <Bar dataKey="income" name="Income" fill="#0E9F6E" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#E11D48" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </SoftSpaceCard>

          {/* Category breakdown */}
          <SoftSpaceCard title="Spending by Category" subtitle="Where your expense money goes" borderColor="#EEDCFB" shadowColor="rgba(205,180,246,.35)">
            {categoryBreakdown.length === 0 ? (
              <Text color="#C2AECF" fontSize="13px" fontWeight="600">No expenses yet 🌸</Text>
            ) : (
              <Box display="flex" flexDirection="column" gap="14px">
                {categoryBreakdown.map(([cat, total]) => {
                  const pct = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
                  return (
                    <Box key={cat}>
                      <Box display="flex" justifyContent="space-between" mb="4px">
                        <Box display="flex" alignItems="center" gap="6px">
                          <Box w="8px" h="8px" borderRadius="full" style={{ background: CATEGORY_COLORS[cat] || "#9CA3AF" }} />
                          <Text fontSize="13px" fontWeight="700" color="#5C4A63">{cat}</Text>
                        </Box>
                        <Box display="flex" alignItems="center" gap="8px">
                          <Text fontSize="11px" color="#A08B9B">{pct.toFixed(0)}%</Text>
                          <Text fontSize="13px" fontWeight="800" color="#C0577E">{fmt(total)}</Text>
                        </Box>
                      </Box>
                      <BarTrack pct={pct} color={CATEGORY_COLORS[cat] || "#9CA3AF"} />
                    </Box>
                  );
                })}
              </Box>
            )}
          </SoftSpaceCard>

          {/* Quick stats */}
          <SoftSpaceCard title="Quick Stats" subtitle="At a glance">
            <Box display="grid" gridTemplateColumns="1fr 1fr" gap="12px">
              {[
                { label: "Total Transactions", value: String(transactions.length), color: "#8A6BD1" },
                { label: "Savings Rate", value: `${savingsRate}%`, color: balance >= 0 ? "#0E9F6E" : "#E11D48" },
                { label: "Avg Income/mo", value: fmt(totalIncome / Math.max(monthlyData.filter((m) => m.income > 0).length, 1)), color: "#0E9F6E" },
                { label: "Avg Expense/mo", value: fmt(totalExpenses / Math.max(monthlyData.filter((m) => m.expenses > 0).length, 1)), color: "#E11D48" },
              ].map((s) => (
                <Box key={s.label} p="14px" background="#FFF6FA" borderRadius="16px" textAlign="center">
                  <Text fontSize="9.5px" fontWeight="800" color="#B79ACB" letterSpacing="1.5px" mb="4px">{s.label.toUpperCase()}</Text>
                  <Text fontFamily="'Jersey 25', cursive" fontSize="22px" style={{ color: s.color }}>{s.value}</Text>
                </Box>
              ))}
            </Box>
          </SoftSpaceCard>
        </Box>
      )}

      {/* ══════════ GOALS TAB ══════════ */}
      {tab === "goals" && (
        <Box display="flex" flexDirection="column" gap="18px">
          {/* Add goal form */}
          <SoftSpaceCard title="New Savings Goal" subtitle="Dream it, save for it">
            <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap="14px" mb="14px">
              <Box>
                <Text fontSize="10px" fontWeight="800" color="#B79ACB" letterSpacing="1.5px" mb="6px">GOAL NAME</Text>
                <Input
                  placeholder="e.g. New Laptop, Trip to Paris..." value={goalForm.name}
                  bg="#FFF6FA" border="1.5px solid #FFDDEB" borderRadius="12px" color="#5C4A63"
                  _placeholder={{ color: "#C2AECF" }}
                  _focus={{ borderColor: "#F27DAB" }}
                  onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
                />
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="800" color="#B79ACB" letterSpacing="1.5px" mb="6px">TARGET AMOUNT</Text>
                <Input
                  type="number" placeholder="0.00" value={goalForm.target} fontWeight="700"
                  bg="#FFF6FA" border="1.5px solid #FFDDEB" borderRadius="12px" color="#5C4A63"
                  _placeholder={{ color: "#C2AECF" }}
                  _focus={{ borderColor: "#F27DAB" }}
                  onChange={(e) => setGoalForm({ ...goalForm, target: e.target.value })}
                />
              </Box>
              <Box>
                <Text fontSize="10px" fontWeight="800" color="#B79ACB" letterSpacing="1.5px" mb="6px">BANNER IMAGE</Text>
                <input type="file" accept="image/*" ref={bannerInputRef} style={{ display: "none" }} onChange={handleBannerUpload} />
                <Button
                  w="100%" borderRadius="12px" border="2px dashed #FFC8DE" background="white" color="#F27DAB" fontWeight="700"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <Upload size={15} style={{ marginRight: "6px" }} />
                  {goalForm.banner ? "Change Image" : "Upload Banner"}
                </Button>
              </Box>
            </Box>
            {goalForm.banner && (
              <Box mb="14px" borderRadius="16px" overflow="hidden" h="80px" w="160px">
                <img src={goalForm.banner} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Box>
            )}
            {goalError && (
              <Box mb="12px" px="14px" py="10px" background="#FFF0F0" borderRadius="12px" border="1.5px solid #FFC9C9">
                <Text fontSize="13px" color="#E11D48" fontWeight="700">⚠️ {goalError}</Text>
              </Box>
            )}
            <Box
              as="button"
              onClick={addGoal}
              display="inline-flex" alignItems="center" gap="6px"
              px="22px" py="10px"
              background="linear-gradient(135deg,#FFC2DA,#CDB4F6)"
              border="2.5px solid white"
              borderRadius="999px"
              boxShadow="0 5px 0 rgba(196,87,127,.22)"
              cursor="pointer"
            >
              <Plus size={16} color="white" />
              <Text fontFamily="'Jersey 25', cursive" fontSize="17px" color="white" textShadow="0 2px 0 rgba(196,87,127,.3)">
                Add Goal
              </Text>
            </Box>
          </SoftSpaceCard>

          {/* Goal cards */}
          {goalsLoading ? (
            <Text textAlign="center" color="#F27DAB" fontWeight="700" py="24px">Loading...</Text>
          ) : goals.length === 0 ? (
            <Text textAlign="center" color="#C2AECF" py="24px" fontSize="13px">No goals yet — dream big! 🌸</Text>
          ) : (
            <Box display="grid" gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="16px">
              {goals.map((goal) => {
                const pct = Math.min((goal.saved_amount / goal.target_amount) * 100, 100);
                const remaining = goal.target_amount - goal.saved_amount;
                const done = pct >= 100;
                const calc = goalCalc[goal.id] || { months: "", monthly: "" };

                return (
                  <Box
                    key={goal.id} bg="white" borderRadius="24px" overflow="hidden"
                    border="2.5px solid" borderColor={done ? "#B9EBD3" : "#FFDDEB"}
                    boxShadow={done ? "0 6px 0 rgba(14,159,110,.2)" : "0 6px 0 rgba(255,199,222,.45)"}
                  >
                    {/* Banner */}
                    <Box position="relative" w="100%">
                      {goal.banner_url ? (
                        <img src={goal.banner_url} alt={goal.name} style={{ width: "100%", height: "100px", objectFit: "cover", display: "block" }} />
                      ) : (
                        <Box w="100%" h="70px" display="flex" alignItems="center" justifyContent="center" background="linear-gradient(160deg,#FFF0F6,#F6F0FF)">
                          <Target size={28} color="#F27DAB" opacity={0.4} />
                        </Box>
                      )}
                      {done && (
                        <Box position="absolute" inset={0} bg="blackAlpha.400" display="flex" alignItems="center" justifyContent="center">
                          <Text fontSize="26px">🎉</Text>
                        </Box>
                      )}
                      <IconButton
                        aria-label="Delete" size="xs" borderRadius="full" position="absolute" top="8px" right="8px"
                        background="white" color="#E11D48"
                        onClick={() => deleteGoal(goal.id)}
                      >
                        <Trash2 size={12} />
                      </IconButton>
                    </Box>

                    {/* Content */}
                    <Box p="16px 18px">
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb="8px">
                        <Text
                          fontFamily="'Jersey 25', cursive" fontSize="23px" color="#C0577E"
                          style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}
                        >
                          {goal.name}
                        </Text>
                        {done ? (
                          <Box px="10px" py="3px" borderRadius="999px" background="#0E9F6E">
                            <Text fontSize="10px" fontWeight="800" color="white">Done!</Text>
                          </Box>
                        ) : (
                          <Text fontSize="12px" fontWeight="800" color="#8A6BD1">{pct.toFixed(0)}%</Text>
                        )}
                      </Box>

                      {/* Progress */}
                      <Box mb="12px">
                        <Box display="flex" justifyContent="space-between" mb="4px">
                          <Text fontSize="12px" color="#5C4A63" fontWeight="600">
                            {fmt(goal.saved_amount)} <Text as="span" color="#C2AECF">/ {fmt(goal.target_amount)}</Text>
                          </Text>
                          {!done && <Text fontSize="10.5px" color="#A08B9B">{fmt(remaining)} left</Text>}
                        </Box>
                        <BarTrack pct={pct} color={done ? "#0E9F6E" : "#F27DAB"} />
                      </Box>

                      {/* Add savings + calculator */}
                      {!done && (
                        <Box>
                          {addingToGoal === goal.id ? (
                            <Box display="flex" gap="8px" mb="12px">
                              <Input
                                type="number" placeholder="Amount" value={addAmount} size="sm" flex="1"
                                bg="#FFF6FA" border="1.5px solid #FFDDEB" borderRadius="12px" fontWeight="700" color="#5C4A63"
                                onChange={(e) => setAddAmount(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addToGoal(goal)}
                              />
                              <Button size="sm" borderRadius="12px" fontWeight="800" background="linear-gradient(135deg,#FFC2DA,#CDB4F6)" color="white" onClick={() => addToGoal(goal)}>
                                Add
                              </Button>
                              <Button size="sm" variant="ghost" borderRadius="12px" color="#B79ACB" onClick={() => { setAddingToGoal(null); setAddAmount(""); }}>
                                ✕
                              </Button>
                            </Box>
                          ) : (
                            <Box
                              as="button"
                              onClick={() => setAddingToGoal(goal.id)}
                              px="14px" py="6px" mb="12px" display="inline-block"
                              border="2px solid #FFDDEB" borderRadius="999px" background="white" color="#F27DAB" fontWeight="800" fontSize="12px"
                              cursor="pointer"
                            >
                              + Add Savings
                            </Box>
                          )}

                          {/* Compact calculator */}
                          <Box background="linear-gradient(135deg,#FDF2F8,#F4EEFF)" border="1.5px solid #EEDCFB" px="12px" py="10px" borderRadius="14px">
                            <Text fontSize="9px" fontWeight="800" color="#8A6BD1" letterSpacing="1.5px" mb="8px">MONTHLY CALC</Text>
                            <Box display="flex" gap="8px" alignItems="flex-end">
                              <Box flex="1">
                                <Text fontSize="9px" color="#A08B9B" fontWeight="700" mb="2px">MONTHS</Text>
                                <Input
                                  type="number" placeholder="12" value={calc.months} size="xs"
                                  bg="white" border="1.5px solid #EEDCFB" borderRadius="8px" fontWeight="700" color="#5C4A63"
                                  onChange={(e) => updateGoalCalc(goal.id, "months", e.target.value, remaining)}
                                />
                              </Box>
                              <Text fontSize="12px" color="#B79ACB" fontWeight="800" pb="6px">÷</Text>
                              <Box flex="1">
                                <Text fontSize="9px" color="#A08B9B" fontWeight="700" mb="2px">PER MONTH</Text>
                                <Input
                                  type="number" placeholder="100" value={calc.monthly} size="xs"
                                  bg="white" border="1.5px solid #EEDCFB" borderRadius="8px" fontWeight="700" color="#5C4A63"
                                  onChange={(e) => updateGoalCalc(goal.id, "monthly", e.target.value, remaining)}
                                />
                              </Box>
                              {calc.months && calc.monthly && (
                                <Box>
                                  <Text fontSize="9px" color="#A08B9B" fontWeight="700" mb="2px">DONE BY</Text>
                                  <Text fontSize="9.5px" fontWeight="800" color="#8A6BD1">
                                    {(() => {
                                      const d = new Date();
                                      d.setMonth(d.getMonth() + parseInt(calc.months));
                                      return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
                                    })()}
                                  </Text>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default FinanceTracker;
