import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ==================== CONSTANTS ====================
const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const GRID_TIME_SLOTS = [
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
];

// Subject colors for PDF (solid colors, no gradients in react-pdf)
const SUBJECT_COLORS = [
  { bg: "#d1fae5", border: "#6ee7b7", text: "#065f46" },
  { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
  { bg: "#fce7f3", border: "#f9a8d4", text: "#9d174d" },
  { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" },
  { bg: "#e0e7ff", border: "#a5b4fc", text: "#3730a3" },
  { bg: "#ffe4e6", border: "#fda4af", text: "#9f1239" },
  { bg: "#ccfbf1", border: "#5eead4", text: "#115e59" },
  { bg: "#fef9c3", border: "#fde047", text: "#854d0e" },
  { bg: "#f3e8ff", border: "#c4b5fd", text: "#6b21a8" },
  { bg: "#fed7aa", border: "#fdba74", text: "#9a3412" },
];

const getSubjectColor = (subject: string) => {
  let hash = 0;
  for (let i = 0; i < subject.length; i++) {
    hash = subject.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
};

// Parse time string to minutes for comparison
const parseTimeToMinutes = (t: string): number => {
  const match12 = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let h = parseInt(match12[1]);
    const m = parseInt(match12[2]);
    const period = match12[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return h * 60 + m;
  }
  const match24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    return parseInt(match24[1]) * 60 + parseInt(match24[2]);
  }
  return 0;
};

// ==================== STYLES ====================
const COL_COUNT = 7; // Time + 6 days
const TIME_COL_WIDTH = "11%";
const DAY_COL_WIDTH = `${(100 - 11) / 6}%`;

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontFamily: "Helvetica",
    fontSize: 7,
    backgroundColor: "#ffffff",
  },
  container: {
    border: "1.5pt solid #1a365d",
    borderRadius: 4,
    overflow: "hidden",
    flex: 1,
  },

  // Header
  headerBar: {
    backgroundColor: "#1a365d",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 32,
    height: 32,
    objectFit: "contain",
  },
  academyName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  academyContact: {
    fontSize: 6,
    color: "#93c5fd",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  headerLabel: {
    fontSize: 6,
    color: "#93c5fd",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: 700,
  },
  className: {
    fontSize: 11,
    fontWeight: 700,
    color: "#ffffff",
    marginTop: 1,
  },
  dateStamp: {
    fontSize: 6,
    color: "#93c5fd",
    marginTop: 2,
  },

  // Grid container
  gridContainer: {
    flex: 1,
  },

  // Grid header row
  gridHeader: {
    flexDirection: "row",
    backgroundColor: "#d97706",
  },
  gridHeaderTimeCell: {
    width: TIME_COL_WIDTH,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRight: "0.5pt solid #b45309",
  },
  gridHeaderDayCell: {
    width: DAY_COL_WIDTH,
    paddingVertical: 6,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRight: "0.5pt solid #b45309",
  },
  gridHeaderText: {
    fontSize: 7,
    fontWeight: 700,
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  // Grid body rows
  gridRow: {
    flexDirection: "row",
    borderBottom: "0.5pt solid #e2e8f0",
    minHeight: 38,
  },
  gridRowAlt: {
    backgroundColor: "#f8fafc",
  },
  timeCell: {
    width: TIME_COL_WIDTH,
    paddingVertical: 4,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    borderRight: "0.5pt solid #e2e8f0",
    backgroundColor: "#f1f5f9",
  },
  timeCellText: {
    fontSize: 6,
    fontWeight: 600,
    color: "#64748b",
  },
  dayCell: {
    width: DAY_COL_WIDTH,
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRight: "0.5pt solid #e2e8f0",
  },

  // Entry card
  entryCard: {
    borderRadius: 3,
    padding: 3,
    marginBottom: 1,
    border: "0.5pt solid #e2e8f0",
  },
  entrySubject: {
    fontSize: 6.5,
    fontWeight: 700,
  },
  entryTeacher: {
    fontSize: 5.5,
    marginTop: 1,
    opacity: 0.8,
  },
  entryRoom: {
    fontSize: 5,
    marginTop: 0.5,
    opacity: 0.6,
  },
  entryTime: {
    fontSize: 5,
    marginTop: 0.5,
    opacity: 0.6,
  },

  // Footer
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderTop: "1pt solid #e2e8f0",
    backgroundColor: "#fafafa",
  },
  footerText: {
    fontSize: 6,
    color: "#94a3b8",
  },
  footerAddress: {
    fontSize: 5,
    color: "#94a3b8",
    textAlign: "right",
    maxWidth: 250,
  },

  // Legend
  legendContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderBottom: "0.5pt solid #e2e8f0",
    backgroundColor: "#fafafa",
    alignItems: "center",
  },
  legendLabel: {
    fontSize: 6,
    fontWeight: 700,
    color: "#64748b",
    marginRight: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 1,
    border: "0.5pt solid #e2e8f0",
  },
  legendText: {
    fontSize: 5.5,
    color: "#334155",
  },
});

// ==================== INTERFACES ====================
export interface TimetableEntry {
  _id: string;
  subject: string;
  day: string;
  startTime: string;
  endTime: string;
  room?: string;
  classId?: {
    _id: string;
    classTitle?: string;
    className?: string;
    gradeLevel?: string;
  };
  teacherId?: {
    _id: string;
    name: string;
  };
}

export interface TimetablePDFProps {
  className: string;
  entries: TimetableEntry[];
  logoDataUrl?: string;
}

// ==================== HELPERS ====================
const formatDate = (): string => {
  return new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getTeacherName = (entry: TimetableEntry): string => {
  if (entry.teacherId && typeof entry.teacherId === "object") {
    return entry.teacherId.name;
  }
  return "";
};

const getEntriesForDayAndSlot = (
  entries: TimetableEntry[],
  day: string,
  slotTime: string,
): TimetableEntry[] => {
  const slotMins = parseTimeToMinutes(slotTime);
  const nextSlotMins = slotMins + 60;
  return entries.filter((entry) => {
    if (entry.day !== day) return false;
    const entryStart = parseTimeToMinutes(entry.startTime);
    return entryStart >= slotMins && entryStart < nextSlotMins;
  });
};

// Get unique subjects from entries
const getUniqueSubjects = (entries: TimetableEntry[]): string[] => {
  const subjects = new Set<string>();
  entries.forEach((e) => subjects.add(e.subject));
  return Array.from(subjects).sort();
};

// Filter out empty time slots (no entries in any day for that slot)
const getActiveTimeSlots = (entries: TimetableEntry[]): string[] => {
  return GRID_TIME_SLOTS.filter((slot) => {
    return DAYS.some(
      (day) => getEntriesForDayAndSlot(entries, day, slot).length > 0,
    );
  });
};

// ==================== COMPONENT ====================
export const TimetablePDF = ({
  className,
  entries,
  logoDataUrl,
}: TimetablePDFProps) => {
  const subjects = getUniqueSubjects(entries);
  const activeSlots = getActiveTimeSlots(entries);
  // If no active slots, show all for an empty timetable display
  const displaySlots = activeSlots.length > 0 ? activeSlots : GRID_TIME_SLOTS;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.container}>
          {/* ===== HEADER ===== */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              {logoDataUrl ? (
                <Image src={logoDataUrl} style={styles.logo} />
              ) : null}
              <View>
                <Text style={styles.academyName}>
                  GENIUS ISLAMIAN'S ACADEMY
                </Text>
                <Text style={styles.academyContact}>
                  091-5601600 / 0334-5852326
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={styles.headerLabel}>Class Timetable</Text>
              <Text style={styles.className}>{className}</Text>
              <Text style={styles.dateStamp}>Printed: {formatDate()}</Text>
            </View>
          </View>

          {/* ===== SUBJECT LEGEND ===== */}
          {subjects.length > 0 && (
            <View style={styles.legendContainer}>
              <Text style={styles.legendLabel}>Subjects:</Text>
              {subjects.map((subject) => {
                const color = getSubjectColor(subject);
                return (
                  <View key={subject} style={styles.legendItem}>
                    <View
                      style={[
                        styles.legendDot,
                        {
                          backgroundColor: color.bg,
                          borderColor: color.border,
                        },
                      ]}
                    />
                    <Text style={styles.legendText}>{subject}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ===== GRID ===== */}
          <View style={styles.gridContainer}>
            {/* Grid Header */}
            <View style={styles.gridHeader}>
              <View style={styles.gridHeaderTimeCell}>
                <Text style={styles.gridHeaderText}>Time</Text>
              </View>
              {DAYS.map((day, i) => (
                <View
                  key={day}
                  style={[
                    styles.gridHeaderDayCell,
                    i === DAYS.length - 1
                      ? { borderRight: "none" as any }
                      : {},
                  ]}
                >
                  <Text style={styles.gridHeaderText}>{day}</Text>
                </View>
              ))}
            </View>

            {/* Grid Body */}
            {displaySlots.map((timeSlot, idx) => (
              <View
                key={timeSlot}
                style={[
                  styles.gridRow,
                  idx % 2 !== 0 ? styles.gridRowAlt : {},
                ]}
              >
                <View style={styles.timeCell}>
                  <Text style={styles.timeCellText}>{timeSlot}</Text>
                </View>
                {DAYS.map((day, dayIdx) => {
                  const slotEntries = getEntriesForDayAndSlot(
                    entries,
                    day,
                    timeSlot,
                  );
                  return (
                    <View
                      key={`${day}-${timeSlot}`}
                      style={[
                        styles.dayCell,
                        dayIdx === DAYS.length - 1
                          ? { borderRight: "none" as any }
                          : {},
                      ]}
                    >
                      {slotEntries.map((entry) => {
                        const color = getSubjectColor(entry.subject);
                        const teacher = getTeacherName(entry);
                        return (
                          <View
                            key={entry._id}
                            style={[
                              styles.entryCard,
                              {
                                backgroundColor: color.bg,
                                borderColor: color.border,
                              },
                            ]}
                          >
                            <Text
                              style={[styles.entrySubject, { color: color.text }]}
                            >
                              {entry.subject}
                            </Text>
                            {teacher ? (
                              <Text
                                style={[
                                  styles.entryTeacher,
                                  { color: color.text },
                                ]}
                              >
                                {teacher}
                              </Text>
                            ) : null}
                            {entry.room ? (
                              <Text
                                style={[styles.entryRoom, { color: color.text }]}
                              >
                                {entry.room}
                              </Text>
                            ) : null}
                            <Text
                              style={[styles.entryTime, { color: color.text }]}
                            >
                              {entry.startTime} - {entry.endTime}
                            </Text>
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* ===== FOOTER ===== */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Total Entries: {entries.length} | Generated on {formatDate()}
            </Text>
            <Text style={styles.footerAddress}>
              Opp. Islamia College, Danishabad, University Road, Peshawar
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default TimetablePDF;
