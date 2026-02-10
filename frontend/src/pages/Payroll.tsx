import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Banknote,
  Users,
  TrendingUp,
  AlertCircle,
  Loader2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useReactToPrint } from "react-to-print";
import TeacherPaymentReceipt from "@/components/dashboard/TeacherPaymentReceipt";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function Payroll() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [reportTeacher, setReportTeacher] = useState<any>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const receiptRef = useRef<HTMLDivElement>(null);
  const handlePrintReceipt = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: receiptData
      ? `Teacher-Payment-${receiptData.voucherId}`
      : "Teacher Payment",
  });

  // Redirect non-owners
  if (user?.role !== "OWNER") {
    return (
      <DashboardLayout title="Payroll">
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <AlertCircle className="h-16 w-16 text-red-500" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">
            Only the Owner can access the Payroll dashboard.
          </p>
          <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Fetch payroll dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ["payroll-dashboard"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/payroll/dashboard`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch payroll data");
      return res.json();
    },
  });

  const generateSalariesMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(
        `${API_BASE_URL}/payroll/generate-session-salaries`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to generate salaries");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Session Salaries Generated",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const payTeacherMutation = useMutation({
    mutationFn: async ({ teacherId, amount, notes }: any) => {
      const res = await fetch(`${API_BASE_URL}/finance/teacher-payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ teacherId, amount, notes }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to process payout");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Payout Processed",
        description: data.message,
      });
      if (data?.data?.voucher) {
        setReceiptData({
          voucherId: data.data.voucher.voucherId,
          teacherName: data.data.voucher.teacherName,
          subject: data.data.voucher.subject,
          amountPaid: data.data.voucher.amountPaid,
          remainingBalance: data.data.remainingBalance || 0,
          paymentDate: new Date(data.data.voucher.paymentDate),
          description: data.data.voucher.notes || "Teacher payout",
        });
        setTimeout(() => {
          handlePrintReceipt();
        }, 400);
      }
      setPayDialogOpen(false);
      setSelectedTeacher(null);
      setPayAmount("");
      setPayNotes("");
      queryClient.invalidateQueries({ queryKey: ["payroll-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["finance", "history"] });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("notifications:refresh"));
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Payout Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const dashboard = dashboardData?.data || {
    activeSession: null,
    totalPaidSession: 0,
    teachersWithBalances: [],
    totalTeacherLiability: 0,
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Payroll Management">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Payroll Management">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-amber-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Active Session
                  </p>
                  <p className="text-lg font-semibold text-amber-700">
                    {dashboard.activeSession?.sessionName || "No active session"}
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Liability
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    Rs. {dashboard.totalTeacherLiability.toLocaleString()}
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Paid This Session
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    Rs. {dashboard.totalPaidSession.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Teachers With Payable
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {dashboard.teachersWithBalances.filter(
                      (t: any) => (t.balance?.payable || 0) > 0,
                    ).length}
                  </p>
                </div>
                <Banknote className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Requests Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Teachers Payroll
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => generateSalariesMutation.mutate()}
              disabled={generateSalariesMutation.isPending}
            >
              {generateSalariesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate Session Salaries"
              )}
            </Button>
          </CardHeader>
          <CardContent>
            {dashboard.teachersWithBalances.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active teachers found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead>Teacher</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Compensation</TableHead>
                    <TableHead className="text-right">Payable</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.teachersWithBalances.map((teacher: any) => (
                    <TableRow key={teacher._id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {teacher.name}
                      </TableCell>
                      <TableCell className="capitalize">
                        {teacher.subject || "-"}
                      </TableCell>
                      <TableCell className="capitalize">
                        {teacher.compensation?.type || "percentage"}
                      </TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        Rs. {(teacher.balance?.payable || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        Rs. {(teacher.totalPaid || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setReportTeacher(teacher);
                              setReportOpen(true);
                            }}
                          >
                            Report
                          </Button>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => {
                              setSelectedTeacher(teacher);
                              setPayDialogOpen(true);
                            }}
                            disabled={(teacher.balance?.payable || 0) <= 0}
                          >
                            Pay
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Teacher Profiles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboard.teachersWithBalances.map((teacher: any) => (
                <div
                  key={teacher._id}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/teachers/${teacher._id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{teacher.name}</span>
                    <Badge className="capitalize">{teacher.subject}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Payable</span>
                    <span className="font-semibold text-green-600">
                      Rs. {(teacher.balance?.payable || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pay Teacher Dialog */}
      <Dialog
        open={payDialogOpen}
        onOpenChange={(open) => {
          setPayDialogOpen(open);
          if (!open) {
            setSelectedTeacher(null);
            setPayAmount("");
            setPayNotes("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pay Teacher</DialogTitle>
            <DialogDescription>
              {selectedTeacher
                ? `Pay ${selectedTeacher.name} (Available: Rs. ${(selectedTeacher.balance?.payable || 0).toLocaleString()})`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount (PKR)</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes (Optional)</label>
              <Textarea
                placeholder="Cash payment, bank transfer, etc."
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPayDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() =>
                payTeacherMutation.mutate({
                  teacherId: selectedTeacher?._id,
                  amount: Number(payAmount),
                  notes: payNotes,
                })
              }
              disabled={
                !selectedTeacher ||
                !payAmount ||
                Number(payAmount) <= 0 ||
                Number(payAmount) > (selectedTeacher.balance?.payable || 0) ||
                payTeacherMutation.isPending
              }
            >
              {payTeacherMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay Now"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {receiptData && (
        <TeacherPaymentReceipt
          ref={receiptRef}
          voucherId={receiptData.voucherId}
          teacherName={receiptData.teacherName}
          subject={receiptData.subject}
          amountPaid={receiptData.amountPaid}
          remainingBalance={receiptData.remainingBalance}
          paymentDate={receiptData.paymentDate}
          description={receiptData.description}
        />
      )}

      {/* Teacher Report Dialog */}
      <Dialog
        open={reportOpen}
        onOpenChange={(open) => {
          setReportOpen(open);
          if (!open) setReportTeacher(null);
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Teacher Payroll Report</DialogTitle>
            <DialogDescription>
              {reportTeacher ? `${reportTeacher.name} (${reportTeacher.subject})` : ""}
            </DialogDescription>
          </DialogHeader>
          {reportTeacher && (
            <TeacherReport teacherId={reportTeacher._id} />
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

const TeacherReport = ({ teacherId }: { teacherId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["teacher-report", teacherId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/payroll/teacher-report/${teacherId}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load report");
      return res.json();
    },
    enabled: !!teacherId,
  });

  if (isLoading) {
    return (
      <div className="py-6">
        <Skeleton className="h-6 w-1/3 mb-4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const report = data?.data;
  if (!report) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Payable Balance</p>
            <p className="text-xl font-bold text-emerald-600">
              Rs. {report.balances.payable.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Paid This Session</p>
            <p className="text-xl font-bold text-blue-600">
              Rs. {report.payouts.totalPaidSession.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Session</p>
            <p className="text-sm font-medium">
              {report.session?.sessionName || "No active session"}
            </p>
          </CardContent>
        </Card>
      </div>

      {report.teacher.compensation?.type === "percentage" ? (
        <Card>
          <CardHeader>
            <CardTitle>Revenue Split (Session)</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Teacher Share</p>
              <p className="text-lg font-semibold text-emerald-700">
                Rs. {report.incomeTotals.teacherShare.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Academy Share</p>
              <p className="text-lg font-semibold text-blue-700">
                Rs. {report.incomeTotals.academyShare.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-lg font-semibold">
                Rs. {report.incomeTotals.totalRevenue.toLocaleString()}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Fixed Salary (Session)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Accrued Amount</p>
            <p className="text-lg font-semibold text-emerald-700">
              Rs. {report.fixedSalaryAccrual?.amount?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Classes & Students (Session)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Classes</p>
              <p className="text-lg font-semibold">
                {report.classSummary?.totalClasses || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-lg font-semibold">
                {report.classSummary?.totalStudents || 0}
              </p>
            </div>
          </div>
          {report.classes?.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Shift</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.classes.map((c: any) => (
                  <TableRow key={c._id}>
                    <TableCell>{c.classTitle}</TableCell>
                    <TableCell>{c.group || "—"}</TableCell>
                    <TableCell>{c.shift || "—"}</TableCell>
                    <TableCell className="text-right">
                      {c.studentCount || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              No classes linked to this teacher for the active session.
            </p>
          )}
        </CardContent>
      </Card>

      {report.teacher.compensation?.type === "percentage" && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Class (Session)</CardTitle>
          </CardHeader>
          <CardContent>
            {report.classRevenueBreakdown?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Teacher</TableHead>
                    <TableHead className="text-right">Academy</TableHead>
                    <TableHead className="text-right">Transactions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.classRevenueBreakdown.map((row: any) => (
                    <TableRow key={row.classId || row.classTitle}>
                      <TableCell>{row.classTitle || "Unknown"}</TableCell>
                      <TableCell className="text-right">
                        Rs. {row.totalRevenue.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-emerald-700">
                        Rs. {row.teacherShare.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-blue-700">
                        Rs. {row.academyShare.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {row.transactionCount}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">
                No revenue transactions yet for this session.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Payouts (Session)</CardTitle>
        </CardHeader>
        <CardContent>
          {report.payouts.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payouts yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.payouts.items.map((p: any) => (
                  <TableRow key={p._id}>
                    <TableCell>
                      {new Date(p.paymentDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-semibold text-emerald-700">
                      Rs. {p.amountPaid.toLocaleString()}
                    </TableCell>
                    <TableCell>{p.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
