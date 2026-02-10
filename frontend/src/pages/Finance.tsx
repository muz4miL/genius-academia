import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Wallet,
  TrendingUp,
  Plus,
  Trash2,
  Package,
  CheckSquare,
  Receipt,
  Loader2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ==================== TYPES ====================
interface Asset {
  id: string;
  itemName: string;
  investorName: string;
  purchaseDate: string;
  originalCost: number;
  depreciationRate: number; // % per year
}

interface Expense {
  _id: string;
  title: string;
  category: string;
  amount: number;
  vendorName: string;
  dueDate: string;
  expenseDate: string;
  description?: string;
  paidBy?: {
    fullName?: string;
    username?: string;
  };
  createdAt: string;
}

interface FinanceHistoryItem {
  _id: string;
  type: string;
  category: string;
  amount: number;
  description?: string;
  date?: string;
  createdAt?: string;
  source?: "transaction" | "expense";
}

// ==================== HELPERS ====================
function calculateCurrentValue(
  originalCost: number,
  depreciationRate: number,
  purchaseDate: string,
): number {
  const purchase = new Date(purchaseDate);
  const now = new Date();
  const yearsElapsed =
    (now.getTime() - purchase.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  if (yearsElapsed < 0) return originalCost;
  // Reducing balance method
  const currentValue =
    originalCost * Math.pow(1 - depreciationRate / 100, yearsElapsed);
  return Math.max(0, Math.round(currentValue));
}

function formatCurrency(amount: number): string {
  return `PKR ${amount.toLocaleString()}`;
}

// ==================== FINANCE OVERVIEW TAB ====================
const FinanceOverview = () => {
  const [search, setSearch] = useState("");

  const { data: statsData } = useQuery({
    queryKey: ["finance", "stats"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/finance/stats/overview`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load finance stats");
      return res.json();
    },
  });

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ["finance", "history"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/finance/history?limit=200`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load finance history");
      return res.json();
    },
  });

  const stats = statsData?.data;
  const history: FinanceHistoryItem[] = historyData?.data || [];

  const filteredHistory = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return history;
    return history.filter((item) => {
      const haystack = [
        item.type,
        item.category,
        item.description,
        item.source,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [history, search]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-emerald-500">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              Fee Collections
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(stats?.totalIncome || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-red-500">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              Expenses
            </p>
            <p className="text-2xl font-bold text-red-700 mt-1">
              {formatCurrency(stats?.totalExpenses || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-slate-800">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              Net Balance
            </p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {formatCurrency(stats?.netProfit || 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue - Expenses
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-red-600" />
            Finance Overview
          </CardTitle>
          <CardDescription>
            Genius Islamian's Academy — Revenue & Expense Tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Student Fees − (Teacher Salaries + Expenses) = Net Balance
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Use the sidebar to manage expenses and payroll individually.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-red-600" />
              Finance Ledger
            </CardTitle>
            <CardDescription>
              All income and expense transactions in one scrollable log
            </CardDescription>
          </div>
          <div className="w-64">
            <Input
              placeholder="Search by type, category, or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              <span className="ml-3 text-muted-foreground">
                Loading transactions...
              </span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No transactions yet</p>
              <p className="text-sm mt-1">
                Admissions and expenses will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="max-h-96 overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Type</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold text-right">
                      Amount (PKR)
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHistory.map((item) => (
                    <TableRow key={item._id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(item.date || item.createdAt || Date.now())
                          .toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.type === "EXPENSE"
                              ? "text-red-600"
                              : "text-emerald-600"
                          }
                        >
                          {item.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{item.category || "—"}</TableCell>
                      <TableCell className="font-medium">
                        {item.description || "—"}
                      </TableCell>
                      <TableCell
                        className={
                          item.type === "EXPENSE"
                            ? "text-right font-bold text-red-600"
                            : "text-right font-bold text-emerald-700"
                        }
                      >
                        {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ==================== ASSET REGISTRY TAB ====================
const STORAGE_KEY = "genius_asset_registry";

function loadAssets(): Asset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveAssets(assets: Asset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
}

const AssetRegistry = () => {
  const [assets, setAssets] = useState<Asset[]>(loadAssets);
  const [showDialog, setShowDialog] = useState(false);

  // Form state
  const [itemName, setItemName] = useState("");
  const [investorName, setInvestorName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [originalCost, setOriginalCost] = useState("");
  const [depreciationRate, setDepreciationRate] = useState("10");
  const [alsoRecordExpense, setAlsoRecordExpense] = useState(false);

  const totalOriginal = assets.reduce((sum, a) => sum + a.originalCost, 0);
  const totalCurrent = assets.reduce(
    (sum, a) =>
      sum +
      calculateCurrentValue(a.originalCost, a.depreciationRate, a.purchaseDate),
    0,
  );

  const handleAdd = () => {
    if (!itemName || !purchaseDate || !originalCost) {
      toast.error("Please fill all required fields");
      return;
    }
    const newAsset: Asset = {
      id: Date.now().toString(),
      itemName,
      investorName: investorName || "Academy",
      purchaseDate,
      originalCost: Number(originalCost),
      depreciationRate: Number(depreciationRate),
    };
    const updated = [...assets, newAsset];
    setAssets(updated);
    saveAssets(updated);
    toast.success(`${itemName} added to registry`);

    // Also record as expense if checkbox is checked
    if (alsoRecordExpense) {
      const API_BASE_URL =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
      fetch(`${API_BASE_URL}/api/finance/record-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          type: "expense",
          category: "Equipment/Asset",
          amount: Number(originalCost),
          description: `Asset Purchase: ${itemName}${investorName ? ` (Investor: ${investorName})` : ""}`,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            toast.success("Expense record created automatically");
          } else {
            toast.info("Asset saved, but expense record could not be created");
          }
        })
        .catch(() => {
          toast.info("Asset saved locally. Expense record requires login.");
        });
    }

    // Reset form
    setItemName("");
    setInvestorName("");
    setPurchaseDate("");
    setOriginalCost("");
    setDepreciationRate("10");
    setAlsoRecordExpense(false);
    setShowDialog(false);
  };

  const handleDelete = (id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    saveAssets(updated);
    toast.success("Asset removed");
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-blue-500">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              Total Assets
            </p>
            <p className="text-2xl font-bold text-blue-700 mt-1">
              {assets.length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-emerald-500">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              Original Value
            </p>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {formatCurrency(totalOriginal)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-amber-500">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-muted-foreground">
              Current Value
            </p>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {formatCurrency(totalCurrent)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Depreciated by {formatCurrency(totalOriginal - totalCurrent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Asset Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-red-600" />
              Asset Registry
            </CardTitle>
            <CardDescription>
              Track investments and their declining value over time
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Asset
          </Button>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No assets registered</p>
              <p className="text-sm mt-1">
                Add generators, ACs, furniture, and other investments to track
                depreciation.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="font-semibold">Item Name</TableHead>
                  <TableHead className="font-semibold">Investor</TableHead>
                  <TableHead className="font-semibold">Purchase Date</TableHead>
                  <TableHead className="font-semibold text-right">
                    Original Cost
                  </TableHead>
                  <TableHead className="font-semibold text-center">
                    Depr. Rate
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Current Value
                  </TableHead>
                  <TableHead className="font-semibold text-right">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assets.map((asset) => {
                  const currentVal = calculateCurrentValue(
                    asset.originalCost,
                    asset.depreciationRate,
                    asset.purchaseDate,
                  );
                  const depreciatedPct = (
                    (1 - currentVal / asset.originalCost) *
                    100
                  ).toFixed(1);
                  return (
                    <TableRow key={asset.id}>
                      <TableCell className="font-medium">
                        {asset.itemName}
                      </TableCell>
                      <TableCell>{asset.investorName}</TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {new Date(asset.purchaseDate).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(asset.originalCost)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {asset.depreciationRate}% / yr
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div>
                          <span className="font-bold text-amber-700">
                            {formatCurrency(currentVal)}
                          </span>
                          <p className="text-xs text-red-500">
                            -{depreciatedPct}%
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(asset.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Asset Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
            <DialogDescription>
              Register a new investment asset to track its depreciation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Item Name *</Label>
              <Input
                placeholder="e.g. Generator 5kW"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Investor Name</Label>
              <Input
                placeholder="e.g. Owner / Academy"
                value={investorName}
                onChange={(e) => setInvestorName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase Date *</Label>
                <Input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Original Cost (PKR) *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={originalCost}
                  onChange={(e) => setOriginalCost(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Depreciation Rate (% per Year)</Label>
              <Input
                type="number"
                placeholder="10"
                value={depreciationRate}
                onChange={(e) => setDepreciationRate(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Standard: 10% for electronics, 5% for furniture
              </p>
            </div>

            {/* Also Record as Expense Checkbox */}
            <div className="flex items-start space-x-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
              <Checkbox
                id="alsoRecordExpense"
                checked={alsoRecordExpense}
                onCheckedChange={(checked) =>
                  setAlsoRecordExpense(checked === true)
                }
                className="mt-0.5"
              />
              <div className="grid gap-0.5 leading-none">
                <label
                  htmlFor="alsoRecordExpense"
                  className="text-sm font-medium cursor-pointer"
                >
                  Also record as Expense
                </label>
                <p className="text-xs text-muted-foreground">
                  Automatically create an expense entry for this asset purchase
                  in the finance system.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} className="bg-red-600 hover:bg-red-700">
              Add Asset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ==================== DAILY EXPENSES TAB ====================
const DailyExpenses = () => {
  const queryClient = useQueryClient();
  const [showExpenseDialog, setShowExpenseDialog] = useState(false);

  // Form state
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseVendor, setExpenseVendor] = useState("");

  // Peshawar-specific expense categories
  const EXPENSE_CATEGORIES = [
    "Generator Fuel",
    "Electricity Bill",
    "Staff Tea & Refreshments",
    "Marketing / Ads",
    "Stationery",
    "Rent",
    "Salaries",
    "Utilities",
    "Equipment/Asset",
    "Misc",
  ];

  // Fetch expenses
  const { data: expensesData, isLoading } = useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/expenses`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load expenses");
      return res.json();
    },
  });

  const expenses: Expense[] = expensesData?.data || [];

  // Create expense mutation
  const createExpenseMutation = useMutation({
    mutationFn: async (expenseData: any) => {
      const res = await fetch(`${API_BASE_URL}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(expenseData),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to record expense");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense Recorded", {
        description: "Expense has been added to the daily log.",
      });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notifications:refresh"));
      }
      setExpenseTitle("");
      setExpenseCategory("");
      setExpenseAmount("");
      setExpenseDescription("");
      setExpenseVendor("");
      setShowExpenseDialog(false);
    },
    onError: (error: any) => {
      toast.error("Failed to Record Expense", {
        description: error.message || "An error occurred.",
      });
    },
  });

  const handleAddExpense = () => {
    if (
      !expenseTitle ||
      !expenseCategory ||
      !expenseAmount ||
      !expenseVendor
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    createExpenseMutation.mutate({
      title: expenseTitle,
      category: expenseCategory,
      amount: Number(expenseAmount),
      vendorName: expenseVendor,
      description: expenseDescription || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-red-600" />
              Daily Expense Log
            </CardTitle>
            <CardDescription>
              Track and record all academy expenses in real-time
            </CardDescription>
          </div>
          <Button
            onClick={() => setShowExpenseDialog(true)}
            className="bg-red-600 hover:bg-red-700 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Record Expense
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-red-600" />
              <span className="ml-3 text-muted-foreground">
                Loading expenses...
              </span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No expenses recorded yet</p>
              <p className="text-sm mt-1">
                Click "Record Expense" to add your first entry.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Category</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="font-semibold text-right">
                    Amount (PKR)
                  </TableHead>
                  <TableHead className="font-semibold">Recorded By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense._id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(
                        expense.expenseDate || expense.createdAt,
                      ).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-medium">
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {expense.title || expense.description || "—"}
                    </TableCell>
                    <TableCell className="text-right font-bold text-red-600">
                      {formatCurrency(expense.amount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {expense.paidBy?.fullName ||
                        expense.paidBy?.username ||
                        "System"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-red-600" />
              Record New Expense
            </DialogTitle>
            <DialogDescription>
              Add a new expense entry to the daily log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Expense Title *</Label>
              <Input
                placeholder="e.g. Generator Diesel - January"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={expenseCategory}
                onValueChange={setExpenseCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount (PKR) *</Label>
              <Input
                type="number"
                placeholder="0"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Vendor/Supplier *</Label>
              <Input
                placeholder="e.g. PESCO, SNGPL"
                value={expenseVendor}
                onChange={(e) => setExpenseVendor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Description (Optional)</Label>
              <Input
                placeholder="Additional details..."
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExpenseDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddExpense}
              disabled={createExpenseMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {createExpenseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Expense"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ==================== MAIN FINANCE COMPONENT ====================
const Finance = () => {
  // Get tab from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get("tab") || "overview";
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  useEffect(() => {
    // Update active tab if URL changes
    const urlTab = new URLSearchParams(window.location.search).get("tab");
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, []);

  return (
    <DashboardLayout title="Finance">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Finance Dashboard
            </h1>
            <p className="text-slate-600 mt-1">
              Track revenue, expenses, and academy assets
            </p>
          </div>
          <Badge variant="outline" className="text-sm px-4 py-2">
            <Wallet className="mr-2 h-4 w-4" />
            Finance
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="expenses" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Daily Expenses
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Asset Registry
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <FinanceOverview />
          </TabsContent>

          <TabsContent value="expenses" className="mt-6">
            <DailyExpenses />
          </TabsContent>

          <TabsContent value="assets" className="mt-6">
            <AssetRegistry />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Finance;
