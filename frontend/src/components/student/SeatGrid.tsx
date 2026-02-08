import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { seatService, Seat, GetSeatsResponse } from "@/services/seatService";

interface SeatGridProps {
  classId: string;
  sessionId: string;
  studentId: string;
  onSeatBooked?: (seat: Seat) => void;
  onSeatReleased?: () => void;
}

export default function SeatGrid({
  classId,
  sessionId,
  studentId,
  onSeatBooked,
  onSeatReleased,
}: SeatGridProps) {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [allowedSide, setAllowedSide] = useState<'Left' | 'Right'>('Right');
  const [studentGender, setStudentGender] = useState<'Male' | 'Female'>('Male');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [bookedSeat, setBookedSeat] = useState<Seat | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingInProgress, setBookingInProgress] = useState(false);

  // Fetch seats
  const fetchSeats = async () => {
    try {
      setLoading(true);
      const data: GetSeatsResponse = await seatService.getSeats(
        classId,
        sessionId,
        studentId
      );
      setSeats(data.seats);
      setAllowedSide(data.allowedSide);
      setStudentGender(data.studentGender);

      // Find if student already has a booked seat
      const myBookedSeat = data.seats.find(
        (seat) => seat.isTaken && seat.student?._id === studentId
      );
      if (myBookedSeat) {
        setBookedSeat(myBookedSeat);
        setSelectedSeat(null);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load seats");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh seats every 10 seconds
  useEffect(() => {
    fetchSeats();
    const interval = setInterval(fetchSeats, 10000);
    return () => clearInterval(interval);
  }, [classId, sessionId, studentId]);

  // Handle seat selection
  const handleSeatClick = (seat: Seat) => {
    // If already booked by this student, show info
    if (bookedSeat && bookedSeat._id === seat._id) {
      toast.info("This is your current seat");
      return;
    }

    // If seat is taken by someone else
    if (seat.isTaken) {
      toast.error("Seat Already Taken!");
      return;
    }

    // If seat is on wrong side (shouldn't happen with backend filtering, but safety check)
    if (seat.side !== allowedSide) {
      toast.error(`Gender Restricted Zone: ${studentGender} students can only book ${allowedSide} side seats`);
      return;
    }

    // Select the seat
    setSelectedSeat(seat);
  };

  // Book selected seat
  const handleBookSeat = async () => {
    if (!selectedSeat) {
      toast.warning("Please select a seat first");
      return;
    }

    try {
      setBookingInProgress(true);
      const response = await seatService.bookSeat(selectedSeat._id, studentId);
      
      toast.success(`Seat ${response.seat.seatNumber} Reserved Successfully!`);
      setBookedSeat(response.seat);
      setSelectedSeat(null);
      
      // Refresh seat grid
      await fetchSeats();
      
      // Callback to parent
      if (onSeatBooked) {
        onSeatBooked(response.seat);
      }
    } catch (error: any) {
      if (error.message.includes("already taken") || error.message.includes("409")) {
        toast.error("Seat Already Taken!");
      } else if (error.message.includes("403") || error.message.includes("Access Denied")) {
        toast.error("Gender restriction: You cannot book this seat");
      } else {
        toast.error(error.message || "Booking Failed!");
      }
      // Refresh to show updated state
      await fetchSeats();
    } finally {
      setBookingInProgress(false);
    }
  };

  // Release current seat
  const handleReleaseSeat = async () => {
    if (!bookedSeat) return;

    try {
      setBookingInProgress(true);
      await seatService.releaseSeat(bookedSeat._id, studentId);
      
      toast.success("Seat Released Successfully!");
      setBookedSeat(null);
      setSelectedSeat(null);
      
      // Refresh seat grid
      await fetchSeats();
      
      // Callback to parent
      if (onSeatReleased) {
        onSeatReleased();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to release seat");
    } finally {
      setBookingInProgress(false);
    }
  };

  // Organize seats by rows
  const seatsByRow = seats.reduce((acc, seat) => {
    const row = seat.position.row;
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {} as Record<number, Seat[]>);

  // Get seat state color
  const getSeatColor = (seat: Seat) => {
    // Already booked by current student
    if (bookedSeat && bookedSeat._id === seat._id) {
      return "bg-blue-500 hover:bg-blue-600 text-white border-blue-600";
    }
    
    // Selected by user
    if (selectedSeat && selectedSeat._id === seat._id) {
      return "bg-blue-400 hover:bg-blue-500 text-white border-blue-500 ring-2 ring-blue-300";
    }
    
    // Taken by another student
    if (seat.isTaken) {
      return "bg-red-500/80 text-white border-red-600 cursor-not-allowed";
    }
    
    // Available
    return "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 hover:scale-105 transition-transform";
  };

  // Row labels (A, B, C, D, E)
  const getRowLabel = (rowNum: number) => {
    return String.fromCharCode(64 + rowNum); // A=65, so 64+1=A
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center items-center p-4 bg-gradient-to-br from-slate-800/50 via-slate-900/50 to-slate-800/50 rounded-lg border border-amber-500/20">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-emerald-500 rounded border-2 border-emerald-600"></div>
          <span className="text-sm text-slate-300">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-500 rounded border-2 border-blue-600"></div>
          <span className="text-sm text-slate-300">Your Seat</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-red-500/80 rounded border-2 border-red-600"></div>
          <span className="text-sm text-slate-300">Taken</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-amber-500" />
          <span className="text-sm text-slate-300">
            {studentGender === 'Male' ? 'Right Side Only' : 'Left Side Only'}
          </span>
        </div>
      </div>

      {/* Seat Grid */}
      <div className="space-y-4">
        <div className="text-center">
          <Badge variant="outline" className="bg-gradient-to-r from-amber-500/20 to-bronze-500/20 border-amber-500/50 text-amber-200 px-6 py-2">
            🎓 Front of Class
          </Badge>
        </div>

        {/* Rows */}
        <div className="space-y-3 max-w-4xl mx-auto">
          {Object.keys(seatsByRow)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((rowKey) => {
              const rowNum = parseInt(rowKey);
              const rowSeats = seatsByRow[rowNum].sort((a, b) => a.position.column - b.position.column);
              
              return (
                <div key={rowKey} className="flex items-center gap-2 justify-center">
                  {/* Row Label */}
                  <div className="w-8 h-10 flex items-center justify-center font-bold text-amber-400">
                    {getRowLabel(rowNum)}
                  </div>

                  {/* Seats */}
                  <div className="flex gap-2">
                    {rowSeats.map((seat) => (
                      <motion.button
                        key={seat._id}
                        whileHover={{ scale: seat.isTaken ? 1 : 1.05 }}
                        whileTap={{ scale: seat.isTaken ? 1 : 0.95 }}
                        onClick={() => handleSeatClick(seat)}
                        disabled={seat.isTaken && seat.student?._id !== studentId}
                        className={cn(
                          "w-12 h-12 rounded-lg border-2 font-semibold text-sm flex items-center justify-center shadow-lg",
                          getSeatColor(seat)
                        )}
                        title={
                          seat.isTaken && seat.student?._id !== studentId
                            ? `Taken by ${seat.student?.name || 'Another Student'}`
                            : seat.isTaken
                            ? 'Your Current Seat'
                            : `Seat ${seat.seatNumber}`
                        }
                      >
                        {seat.seatNumber}
                      </motion.button>
                    ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center items-center flex-wrap">
        {selectedSeat && !bookedSeat && (
          <Button
            onClick={handleBookSeat}
            disabled={bookingInProgress}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-8 py-6 text-lg shadow-xl"
          >
            {bookingInProgress ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Book Seat {selectedSeat.seatNumber}
              </>
            )}
          </Button>
        )}

        {bookedSeat && (
          <Button
            onClick={handleReleaseSeat}
            disabled={bookingInProgress}
            variant="destructive"
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-8 py-6 text-lg shadow-xl"
          >
            {bookingInProgress ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Releasing...
              </>
            ) : (
              <>
                <XCircle className="mr-2 h-5 w-5" />
                Release Seat {bookedSeat.seatNumber}
              </>
            )}
          </Button>
        )}
      </div>

      {/* Current Seat Info */}
      {bookedSeat && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-gradient-to-br from-blue-900/30 via-blue-800/20 to-blue-900/30 rounded-xl border border-blue-500/30 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <CheckCircle2 className="h-6 w-6 text-blue-400" />
            <h3 className="text-xl font-bold text-blue-300">Your Current Seat</h3>
          </div>
          <p className="text-3xl font-bold text-blue-200">
            Seat {bookedSeat.seatNumber}
          </p>
          <p className="text-sm text-slate-400 mt-2">
            Row {getRowLabel(bookedSeat.position.row)} • Position {bookedSeat.position.column}
          </p>
        </motion.div>
      )}
    </div>
  );
}
