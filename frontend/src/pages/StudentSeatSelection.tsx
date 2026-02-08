/**
 * Student Seat Selection Page
 * Luxury Cinema-Style Seat Booking Interface
 */

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  GraduationCap,
  Calendar,
  Users,
  ArrowLeft,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import SeatGrid from "@/components/student/SeatGrid";
import { Seat } from "@/services/seatService";
import { useNavigate } from "react-router-dom";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

interface StudentInfo {
  _id: string;
  name: string;
  studentId: string;
  gender: 'Male' | 'Female';
  class: string;
  section?: string;
  session?: {
    _id: string;
    name: string;
  };
}

export default function StudentSeatSelection() {
  const navigate = useNavigate();
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // For demo purposes, we'll use hardcoded student info
  // In production, this would come from auth context or API
  useEffect(() => {
    // Simulating student data fetch
    // In real implementation, this would use useAuth() hook or fetch from API
    const mockStudent: StudentInfo = {
      _id: "675e55fc5aa09e3a5c51adef", // Example student ID
      name: "Muhammad Muzammil",
      studentId: "STU-2024-001",
      gender: "Male",
      class: "10th Grade",
      section: "A",
      session: {
        _id: "675e3bb75aa09e3a5c51adb3", // Example session ID
        name: "2024-2025",
      },
    };

    setTimeout(() => {
      setStudentInfo(mockStudent);
      setLoading(false);
    }, 500);
  }, []);

  const handleSeatBooked = (seat: Seat) => {
    console.log("Seat booked:", seat);
  };

  const handleSeatReleased = () => {
    console.log("Seat released");
  };

  if (loading || !studentInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-amber-500 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate("/student-portal")}
              className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portal
            </Button>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
              🪑 Book Your Seat
            </h1>
            <p className="text-slate-400 mt-2">
              Select your preferred seat from the available options
            </p>
          </div>
        </motion.div>

        {/* Student Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-slate-800/50 border-amber-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400">
                <User className="h-5 w-5" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Name</p>
                  <p className="text-lg font-semibold text-slate-200">
                    {studentInfo.name}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Class & Section</p>
                  <p className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-amber-500" />
                    {studentInfo.class} {studentInfo.section}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Session</p>
                  <p className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-500" />
                    {studentInfo.session?.name || "2024-2025"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-400">Gender Zone</p>
                  <Badge
                    className={cn(
                      "text-sm",
                      studentInfo.gender === "Male"
                        ? "bg-blue-500/20 text-blue-300 border-blue-500/50"
                        : "bg-pink-500/20 text-pink-300 border-pink-500/50"
                    )}
                  >
                    <Users className="h-3 w-3 mr-1" />
                    {studentInfo.gender === "Male" ? "Right Side" : "Left Side"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Instructions Panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-amber-900/20 via-amber-800/10 to-amber-900/20 border-amber-500/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400 text-lg">
                <Info className="h-5 w-5" />
                Seating Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-300">
              <p>
                ✅ <strong>Step 1:</strong> Select your preferred seat from the
                {" "}
                <span className={studentInfo.gender === "Male" ? "text-blue-400" : "text-pink-400"}>
                  {studentInfo.gender === "Male" ? "RIGHT" : "LEFT"}
                </span>
                {" "}side (gender-based zone)
              </p>
              <p>
                ✅ <strong>Step 2:</strong> Click on an available (green) seat
              </p>
              <p>
                ✅ <strong>Step 3:</strong> Confirm your selection by clicking "Book My Seat"
              </p>
              <p className="text-amber-400/80">
                ℹ️ Seats are assigned based on gender policy for student safety and comfort
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Seat Grid Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-slate-800/50 border-amber-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">
                Select Your Seat
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {studentInfo.session?._id ? (
                <SeatGrid
                  classId={studentInfo.class} // Using class name as ID for demo
                  sessionId={studentInfo.session._id}
                  studentId={studentInfo._id}
                  onSeatBooked={handleSeatBooked}
                  onSeatReleased={handleSeatReleased}
                />
              ) : (
                <div className="text-center text-slate-400 py-12">
                  <p>Session information not available</p>
                  <p className="text-sm mt-2">Please contact administration</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
