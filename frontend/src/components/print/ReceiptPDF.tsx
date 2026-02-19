import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

// ==================== STYLES ====================
const styles = StyleSheet.create({
  page: {
    width: "8.5in",
    height: "5.5in",
    padding: 20,
    fontFamily: "Helvetica",
    fontSize: 9,
    backgroundColor: "#ffffff",
  },
  container: {
    border: "2pt solid #1a365d",
    borderRadius: 3,
    height: "100%",
    position: "relative",
    overflow: "hidden",
  },

  // ===== HEADER BAR =====
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
    width: 38,
    height: 38,
    objectFit: "contain",
  },
  academyName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: 0.3,
  },
  academyContact: {
    fontSize: 7,
    color: "#93c5fd",
    marginTop: 2,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  receiptLabel: {
    fontSize: 7,
    color: "#93c5fd",
    letterSpacing: 1,
    textTransform: "uppercase",
    fontWeight: 700,
  },
  serialNo: {
    fontSize: 12,
    fontWeight: 700,
    color: "#ffffff",
    marginTop: 1,
  },
  dateStamp: {
    fontSize: 7,
    color: "#93c5fd",
    marginTop: 2,
  },

  // ===== VERSION STRIP =====
  versionStrip: {
    paddingVertical: 3,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  versionOriginal: {
    backgroundColor: "#dcfce7",
  },
  versionCopy: {
    backgroundColor: "#fee2e2",
  },
  versionText: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  versionOriginalText: {
    color: "#166534",
  },
  versionCopyText: {
    color: "#991b1b",
  },

  // ===== BODY =====
  body: {
    flexDirection: "row",
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },

  // Left column: student info + photo
  leftCol: {
    flex: 1,
    paddingRight: 14,
  },
  studentHeader: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  photoBox: {
    width: 64,
    height: 64,
    border: "1.5pt solid #cbd5e1",
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  studentPhoto: {
    width: 64,
    height: 64,
    objectFit: "cover",
  },
  photoPlaceholder: {
    fontSize: 8,
    color: "#94a3b8",
    textAlign: "center",
  },
  studentBasicInfo: {
    flex: 1,
    justifyContent: "center",
  },
  studentName: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 3,
  },
  studentId: {
    fontSize: 8,
    color: "#64748b",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  groupBadge: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 2,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  groupMedical: { backgroundColor: "#fef2f2", border: "0.5pt solid #fecaca" },
  groupEngineering: {
    backgroundColor: "#eff6ff",
    border: "0.5pt solid #bfdbfe",
  },
  groupText: { fontSize: 7, fontWeight: 700 },
  groupMedicalText: { color: "#dc2626" },
  groupEngineeringText: { color: "#2563eb" },

  // Details grid
  detailsGrid: {
    marginTop: 4,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    width: 48,
    fontSize: 7,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailValue: {
    flex: 1,
    fontSize: 9,
    color: "#1e293b",
    fontWeight: 500,
  },

  // Subjects
  subjectsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 6,
    paddingTop: 6,
    borderTop: "0.5pt solid #e2e8f0",
  },
  subjectsLabel: {
    width: 48,
    fontSize: 7,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    paddingTop: 1,
  },
  subjectsList: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  subjectChip: {
    backgroundColor: "#f1f5f9",
    border: "0.5pt solid #e2e8f0",
    borderRadius: 2,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  subjectChipText: {
    fontSize: 7,
    color: "#334155",
    fontWeight: 600,
  },

  // Divider
  verticalDivider: {
    width: 1,
    backgroundColor: "#e2e8f0",
  },

  // Right column: financial summary
  rightCol: {
    width: 185,
    paddingLeft: 14,
  },
  feeCard: {
    border: "1.5pt solid #e2e8f0",
    borderRadius: 3,
    overflow: "hidden",
  },
  feeCardPaid: { borderColor: "#86efac" },
  feeCardPending: { borderColor: "#fca5a5" },
  feeStatusBar: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: "center",
  },
  feeStatusBarPaid: { backgroundColor: "#166534" },
  feeStatusBarPending: { backgroundColor: "#991b1b" },
  feeStatusText: {
    fontSize: 10,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: 1,
  },
  feeBody: {
    padding: 8,
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  feeLabel: {
    fontSize: 8,
    color: "#64748b",
    fontWeight: 500,
  },
  feeValue: {
    fontSize: 9,
    color: "#1e293b",
    fontWeight: 700,
  },
  feeTotalRow: {
    borderTop: "1pt solid #e2e8f0",
    marginTop: 4,
    paddingTop: 5,
  },
  discountLabel: { color: "#16a34a" },
  discountValue: { color: "#16a34a" },
  balanceDue: { color: "#dc2626" },
  balanceClear: { color: "#16a34a" },

  // Signature
  signatureArea: {
    marginTop: "auto",
    paddingTop: 8,
    alignItems: "flex-end",
  },
  signatureLine: {
    width: 110,
    borderBottom: "1pt solid #334155",
    marginBottom: 3,
  },
  signatureLabel: {
    fontSize: 6,
    color: "#94a3b8",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // ===== FOOTER =====
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderTop: "1pt solid #e2e8f0",
    backgroundColor: "#fafafa",
  },
  footerWarning: {
    fontSize: 7,
    fontWeight: 700,
    color: "#dc2626",
  },
  footerAddress: {
    fontSize: 6,
    color: "#94a3b8",
    textAlign: "right",
    maxWidth: 190,
  },

  // Watermark
  watermark: {
    position: "absolute",
    top: "48%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-30deg)",
    fontSize: 48,
    fontWeight: 700,
    color: "rgba(220, 38, 38, 0.05)",
    letterSpacing: 6,
  },
  academyWatermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-30deg)",
    fontSize: 36,
    fontWeight: 700,
    color: "rgba(26, 54, 93, 0.04)",
    letterSpacing: 8,
  },
});

// ==================== INTERFACES ====================
export interface StudentPDFData {
  _id?: string;
  studentId: string;
  studentName: string;
  fatherName: string;
  class: string;
  group: string;
  parentCell?: string;
  studentCell?: string;
  totalFee: number;
  sessionRate?: number;
  paidAmount: number;
  discountAmount?: number;
  feeStatus: string;
  admissionDate?: string | Date;
  subjects?: Array<{ name: string; fee: number }>;
  photo?: string | null;
}

export interface ReceiptPDFConfig {
  receiptId: string;
  version: number;
  isOriginal: boolean;
  printedAt: Date | string;
}

interface ReceiptPDFProps {
  student: StudentPDFData;
  receiptConfig: ReceiptPDFConfig;
  barcodeDataUrl?: string;
  logoDataUrl?: string;
  studentPhotoDataUrl?: string;
}

// ==================== HELPERS ====================
const formatDate = (date: Date | string | undefined): string => {
  if (!date) return new Date().toLocaleDateString("en-GB");
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (amount: number): string => {
  return `PKR ${(amount || 0).toLocaleString()}`;
};

const formatPhone = (phone: string | undefined): string => {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length >= 10) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return phone;
};

const formatClassName = (className: string | undefined): string => {
  if (!className) return "-";
  return className.replace(/-/g, " ").replace(/\s+/g, " ").trim();
};

// ==================== COMPONENT ====================
export const ReceiptPDF = ({
  student,
  receiptConfig,
  logoDataUrl,
  studentPhotoDataUrl,
}: ReceiptPDFProps) => {
  const balance = Math.max(
    0,
    (student.totalFee || 0) - (student.paidAmount || 0),
  );
  const isPaid = student.feeStatus === "paid" || balance === 0;
  const isMedical = student.group?.toLowerCase().includes("medical");

  return (
    <Document>
      <Page size={[612, 396]} style={styles.page}>
        <View style={styles.container}>
          {/* ===== HEADER BAR ===== */}
          <View style={styles.headerBar}>
            <View style={styles.headerLeft}>
              {logoDataUrl ? (
                <Image src={logoDataUrl} style={styles.logo} />
              ) : (
                <Image src="/logo.png" style={styles.logo} />
              )}
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
              <Text style={styles.receiptLabel}>Admission Receipt</Text>
              <Text style={styles.serialNo}>S.No: {student.studentId}</Text>
              <Text style={styles.dateStamp}>
                {formatDate(receiptConfig.printedAt)}
              </Text>
            </View>
          </View>

          {/* ===== VERSION STRIP ===== */}
          <View
            style={[
              styles.versionStrip,
              receiptConfig.isOriginal
                ? styles.versionOriginal
                : styles.versionCopy,
            ]}
          >
            <Text
              style={[
                styles.versionText,
                receiptConfig.isOriginal
                  ? styles.versionOriginalText
                  : styles.versionCopyText,
              ]}
            >
              {receiptConfig.isOriginal
                ? "ORIGINAL COPY"
                : `DUPLICATE — COPY #${receiptConfig.version}`}
            </Text>
            <Text
              style={[
                styles.versionText,
                { fontSize: 6, fontWeight: 500 },
                receiptConfig.isOriginal
                  ? styles.versionOriginalText
                  : styles.versionCopyText,
              ]}
            >
              Receipt: {receiptConfig.receiptId}
            </Text>
          </View>

          {/* ===== BODY ===== */}
          <View style={styles.body}>
            {/* LEFT COLUMN — Student Info */}
            <View style={styles.leftCol}>
              {/* Student photo + name row */}
              <View style={styles.studentHeader}>
                {/* Photo — squared */}
                <View style={styles.photoBox}>
                  {studentPhotoDataUrl ? (
                    <Image
                      src={studentPhotoDataUrl}
                      style={styles.studentPhoto}
                    />
                  ) : (
                    <Text style={styles.photoPlaceholder}>No{"\n"}Photo</Text>
                  )}
                </View>
                <View style={styles.studentBasicInfo}>
                  <Text style={styles.studentName}>{student.studentName}</Text>
                  <Text style={styles.studentId}>ID: {student.studentId}</Text>
                  <View
                    style={[
                      styles.groupBadge,
                      isMedical ? styles.groupMedical : styles.groupEngineering,
                    ]}
                  >
                    <Text
                      style={[
                        styles.groupText,
                        isMedical
                          ? styles.groupMedicalText
                          : styles.groupEngineeringText,
                      ]}
                    >
                      {student.group || "General"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Details */}
              <View style={styles.detailsGrid}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Father</Text>
                    <Text style={styles.detailValue}>{student.fatherName}</Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Class</Text>
                    <Text style={styles.detailValue}>
                      {formatClassName(student.class)}
                    </Text>
                  </View>
                  <View style={[styles.detailItem, { marginLeft: 10 }]}>
                    <Text style={styles.detailLabel}>Contact</Text>
                    <Text style={styles.detailValue}>
                      {formatPhone(student.parentCell || student.studentCell)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Subjects as chips */}
              {student.subjects && student.subjects.length > 0 && (
                <View style={styles.subjectsRow}>
                  <Text style={styles.subjectsLabel}>Subjects</Text>
                  <View style={styles.subjectsList}>
                    {student.subjects.map((s, i) => (
                      <View key={i} style={styles.subjectChip}>
                        <Text style={styles.subjectChipText}>{s.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* VERTICAL DIVIDER */}
            <View style={styles.verticalDivider} />

            {/* RIGHT COLUMN — Financial Summary */}
            <View style={styles.rightCol}>
              <View
                style={[
                  styles.feeCard,
                  isPaid ? styles.feeCardPaid : styles.feeCardPending,
                ]}
              >
                {/* Status bar */}
                <View
                  style={[
                    styles.feeStatusBar,
                    isPaid
                      ? styles.feeStatusBarPaid
                      : styles.feeStatusBarPending,
                  ]}
                >
                  <Text style={styles.feeStatusText}>
                    {isPaid ? "FULLY PAID" : "PAYMENT PENDING"}
                  </Text>
                </View>

                {/* Fee details */}
                <View style={styles.feeBody}>
                  {student.sessionRate && student.sessionRate > 0 ? (
                    <>
                      <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Session Rate</Text>
                        <Text style={styles.feeValue}>
                          {formatCurrency(student.sessionRate)}
                        </Text>
                      </View>

                      {student.discountAmount && student.discountAmount > 0 && (
                        <View style={styles.feeRow}>
                          <Text style={[styles.feeLabel, styles.discountLabel]}>
                            Discount
                          </Text>
                          <Text style={[styles.feeValue, styles.discountValue]}>
                            -{formatCurrency(student.discountAmount)}
                          </Text>
                        </View>
                      )}

                      <View style={styles.feeRow}>
                        <Text style={styles.feeLabel}>Net Payable</Text>
                        <Text style={styles.feeValue}>
                          {formatCurrency(student.totalFee)}
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.feeRow}>
                      <Text style={styles.feeLabel}>Total Fee</Text>
                      <Text style={styles.feeValue}>
                        {formatCurrency(student.totalFee)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.feeRow}>
                    <Text style={styles.feeLabel}>Paid</Text>
                    <Text style={styles.feeValue}>
                      {formatCurrency(student.paidAmount)}
                    </Text>
                  </View>

                  <View style={[styles.feeRow, styles.feeTotalRow]}>
                    <Text style={[styles.feeLabel, { fontWeight: 700 }]}>
                      Balance
                    </Text>
                    <Text
                      style={[
                        styles.feeValue,
                        { fontSize: 11 },
                        balance > 0 ? styles.balanceDue : styles.balanceClear,
                      ]}
                    >
                      {formatCurrency(balance)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Signature */}
              <View style={styles.signatureArea}>
                <View style={styles.signatureLine} />
                <Text style={styles.signatureLabel}>Authorized Signature</Text>
              </View>
            </View>
          </View>

          {/* ===== FOOTER ===== */}
          <View style={styles.footer}>
            <Text style={styles.footerWarning}>Fee is non-refundable</Text>
            <Text style={styles.footerAddress}>
              Opp. Islamia College, Danishabad, University Road, Peshawar
            </Text>
          </View>

          {/* Watermarks */}
          {!receiptConfig.isOriginal && (
            <Text style={styles.watermark}>DUPLICATE</Text>
          )}
          <Text style={styles.academyWatermark}>GIA</Text>
        </View>
      </Page>
    </Document>
  );
};

export default ReceiptPDF;
