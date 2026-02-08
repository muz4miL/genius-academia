// API Base URL - Auto-detect Codespaces or localhost
const getApiBaseUrl = () => {
  // Check if we're in GitHub Codespaces
  if (typeof window !== 'undefined' && window.location.hostname.includes('.app.github.dev')) {
    // Extract codespace name from current URL and construct backend URL
    const hostname = window.location.hostname;
    const codespaceBase = hostname.replace(/-\d+\.app\.github\.dev$/, '');
    return `https://${codespaceBase}-5000.app.github.dev/api`;
  }
  // Fallback to localhost for local development
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface Seat {
  _id: string;
  seatNumber: number;
  side: 'Left' | 'Right';
  position: {
    row: number;
    column: number;
  };
  isTaken: boolean;
  student: {
    _id: string;
    name: string;
    rollNum: string;
    gender: string;
  } | null;
  sclass: string;
  session: string;
  school: string;
  bookedAt?: Date;
}

export interface GetSeatsResponse {
  seats: Seat[];
  allowedSide: 'Left' | 'Right';
  studentGender: 'Male' | 'Female';
}

export interface BookSeatRequest {
  seatId: string;
  studentId: string;
}

export interface BookSeatResponse {
  message: string;
  seat: Seat;
}

// Seat Service API
export const seatService = {
  // Get available seats for a class/session (filtered by student's gender on backend)
  getSeats: async (classId: string, sessionId: string, studentId: string): Promise<GetSeatsResponse> => {
    const response = await fetch(`${API_BASE_URL}/seats/${classId}/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-student-id': studentId, // Using placeholder auth from backend
      },
      credentials: 'include',
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch seats');
    }

    return data;
  },

  // Book a seat
  bookSeat: async (seatId: string, studentId: string): Promise<BookSeatResponse> => {
    const response = await fetch(`${API_BASE_URL}/seats/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-student-id': studentId, // Using placeholder auth from backend
      },
      credentials: 'include',
      body: JSON.stringify({ seatId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to book seat');
    }

    return data;
  },

  // Release a seat
  releaseSeat: async (seatId: string, studentId: string): Promise<{ message: string; seat: Seat }> => {
    const response = await fetch(`${API_BASE_URL}/seats/release`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-student-id': studentId, // Using placeholder auth from backend
      },
      credentials: 'include',
      body: JSON.stringify({ seatId }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to release seat');
    }

    return data;
  },
};
