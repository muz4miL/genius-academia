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
    fontSize: 10,
    backgroundColor: "#ffffff",
  },
  container: {
    border: "2pt solid #1a365d",
    borderRadius: 4,
    padding: 16,
    height: "100%",
    position: "relative",
  },

  // Subtle academy watermark
  academyWatermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-30deg)",
    fontSize: 48,
    fontWeight: 700,
    color: "rgba(184, 134, 11, 0.10)",
    letterSpacing: 10,
    zIndex: 10,
  },

  // ==================== HEADER ====================
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "2pt solid #1a365d",
    paddingBottom: 10,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 42,
    height: 42,
    objectFit: "contain",
  },
  academyInfo: {
    flexDirection: "column",
  },
  academyName: {
    fontSize: 14,
    fontWeight: 700,
    color: "#1a365d",
    letterSpacing: 0.5,
  },
  contactText: {
    fontSize: 7,
    color: "#dc2626",
    marginTop: 2,
    fontWeight: 500,
  },
  headerRight: {
    alignItems: "flex-end",
    gap: 3,
  },
  voucherBadge: {
    backgroundColor: "#1a365d",
    paddingVertical: 3,
    paddingHorizontal: 12,
    borderRadius: 3,
    marginBottom: 2,
  },
  voucherBadgeText: {
    fontSize: 8,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: 1.5,
  },
  voucherIdText: {
    fontSize: 11,
    fontWeight: 700,
    color: "#1a365d",
    fontFamily: "Courier",
    textAlign: "right",
  },
  dateText: {
    fontSize: 8,
    color: "#4b5563",
    textAlign: "right",
  },

  // ==================== MAIN CONTENT ====================
  mainContent: {
    flexDirection: "row",
    gap: 16,
    flex: 1,
  },

  // Left Section - Teacher Details
  leftSection: {
    flex: 1.4,
    flexDirection: "column",
  },
  detailsGrid: {
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 6,
    alignItems: "flex-end",
  },
  detailLabel: {
    width: 65,
    fontSize: 8,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailValue: {
    flex: 1,
    fontSize: 11,
    fontWeight: 600,
    color: "#111827",
    borderBottom: "1pt solid #e5e7eb",
    paddingBottom: 3,
  },
  detailRowInline: {
    flexDirection: "row",
    marginBottom: 6,
    gap: 20,
  },
  detailInlineItem: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  detailInlineLabel: {
    width: 50,
    fontSize: 8,
    fontWeight: 700,
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailInlineValue: {
    fontSize: 11,
    fontWeight: 600,
    color: "#111827",
    borderBottom: "1pt solid #e5e7eb",
    paddingBottom: 3,
    minWidth: 70,
  },

  // Notes section
  notesSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTop: "1pt solid #e5e7eb",
  },
  notesTitle: {
    fontSize: 7,
    fontWeight: 700,
    color: "#6b7280",
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  notesText: {
    fontSize: 9,
    color: "#374151",
  },

  // Right Section - Financial Box
  rightSection: {
    flex: 0.9,
    flexDirection: "column",
    justifyContent: "space-between",
  },
  feeBox: {
    width: "100%",
    border: "2pt solid #b8860b",
    borderRadius: 5,
    overflow: "hidden",
  },
  feeStatusHeader: {
    backgroundColor: "#b8860b",
    paddingVertical: 6,
    alignItems: "center",
  },
  feeStatusLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  feeStatusValue: {
    fontSize: 16,
    fontWeight: 700,
    color: "#ffffff",
    letterSpacing: 1,
  },
  feeDetails: {
    padding: 10,
    backgroundColor: "#fffef5",
  },
  feeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  feeRowLabel: {
    fontSize: 8,
    color: "#4b5563",
  },
  feeRowValue: {
    fontSize: 10,
    fontWeight: 700,
    color: "#111827",
  },
  feeRowTotal: {
    borderTop: "1.5pt solid #d1d5db",
    marginTop: 4,
    paddingTop: 5,
  },
  balanceBefore: {
    color: "#ea580c",
  },
  amountPaid: {
    color: "#16a34a",
  },
  remainingPositive: {
    color: "#ea580c",
  },
  remainingZero: {
    color: "#16a34a",
  },

  // Signature
  signatureSection: {
    alignItems: "flex-end",
    paddingTop: 10,
  },
  signatureLabel: {
    fontSize: 7,
    color: "#6b7280",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  signatureLine: {
    width: 130,
    borderBottom: "1.5pt solid #1a365d",
    height: 1,
  },

  // ==================== FOOTER ====================
  footer: {
    position: "absolute",
    bottom: 8,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderTop: "1pt solid #e5e7eb",
    paddingTop: 6,
  },
  footerWarning: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#b8860b",
  },
  footerReceipt: {
    fontSize: 7,
    color: "#9ca3af",
  },
  footerAddress: {
    fontSize: 7,
    color: "#6b7280",
    textAlign: "right",
    maxWidth: 220,
  },
});

// ==================== INTERFACES ====================
export interface TeacherPaymentPDFData {
  voucherId: string;
  teacherName: string;
  subject: string;
  amountPaid: number;
  remainingBalance: number;
  paymentDate: Date | string;
  description?: string;
  sessionName?: string;
  compensationType?: string;
}

interface TeacherPaymentPDFProps {
  data: TeacherPaymentPDFData;
  logoDataUrl?: string;
}

// ==================== HELPERS ====================
const formatCurrency = (amount: number): string => {
  return `PKR ${(amount || 0).toLocaleString()}`;
};

const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ==================== COMPONENT ====================
export const TeacherPaymentPDF = ({
  data,
  logoDataUrl,
}: TeacherPaymentPDFProps) => {
  const balanceBefore = data.remainingBalance + data.amountPaid;
  const isPaidOff = data.remainingBalance === 0;

  return (
    <Document>
      <Page size={[612, 396]} style={styles.page}>
        <View style={styles.container}>
          {/* ==================== HEADER ==================== */}
          <View style={styles.header}>
            {/* Left: Logo & Academy Name */}
            <View style={styles.headerLeft}>
              {logoDataUrl ? (
                <Image src={logoDataUrl} style={styles.logo} />
              ) : (
                <Image src="/logo.png" style={styles.logo} />
              )}
              <View style={styles.academyInfo}>
                <Text style={styles.academyName}>
                  GENIUS ISLAMIAN'S ACADEMY
                </Text>
                <Text style={styles.contactText}>
                  Contact: 091-5601600 / 0334-5852326
                </Text>
              </View>
            </View>

            {/* Right: Badge, Voucher No & Date */}
            <View style={styles.headerRight}>
              <View style={styles.voucherBadge}>
                <Text style={styles.voucherBadgeText}>PAYMENT VOUCHER</Text>
              </View>
              <Text style={styles.voucherIdText}>{data.voucherId}</Text>
              <Text style={styles.dateText}>
                {formatDate(data.paymentDate)}
              </Text>
            </View>
          </View>

          {/* ==================== MAIN CONTENT (2-column) ==================== */}
          <View style={styles.mainContent}>
            {/* Left Section - Teacher Details */}
            <View style={styles.leftSection}>
              <View style={styles.detailsGrid}>
                {/* Paid To */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Paid To:</Text>
                  <Text style={styles.detailValue}>{data.teacherName}</Text>
                </View>

                {/* Subject & Compensation Type - inline */}
                <View style={styles.detailRowInline}>
                  <View style={styles.detailInlineItem}>
                    <Text style={styles.detailInlineLabel}>Subject:</Text>
                    <Text style={styles.detailInlineValue}>
                      {data.subject
                        ? data.subject.charAt(0).toUpperCase() +
                          data.subject.slice(1)
                        : "—"}
                    </Text>
                  </View>
                  <View style={styles.detailInlineItem}>
                    <Text style={styles.detailInlineLabel}>Type:</Text>
                    <Text style={styles.detailInlineValue}>
                      {data.compensationType
                        ? data.compensationType.charAt(0).toUpperCase() +
                          data.compensationType.slice(1)
                        : "Percentage"}
                    </Text>
                  </View>
                </View>

                {/* Session */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Session:</Text>
                  <Text style={styles.detailValue}>
                    {data.sessionName || "N/A"}
                  </Text>
                </View>
              </View>

              {/* Notes */}
              {data.description && (
                <View style={styles.notesSection}>
                  <Text style={styles.notesTitle}>Payment Notes:</Text>
                  <Text style={styles.notesText}>{data.description}</Text>
                </View>
              )}
            </View>

            {/* Right Section - Financial Box + Signature */}
            <View style={styles.rightSection}>
              <View style={styles.feeBox}>
                {/* Status Header */}
                <View style={styles.feeStatusHeader}>
                  <Text style={styles.feeStatusLabel}>PAYMENT STATUS</Text>
                  <Text style={styles.feeStatusValue}>
                    {isPaidOff ? "SETTLED" : "PARTIAL"}
                  </Text>
                </View>

                {/* Financial Details */}
                <View style={styles.feeDetails}>
                  <View style={styles.feeRow}>
                    <Text style={styles.feeRowLabel}>Balance Before:</Text>
                    <Text style={[styles.feeRowValue, styles.balanceBefore]}>
                      {formatCurrency(balanceBefore)}
                    </Text>
                  </View>

                  <View style={styles.feeRow}>
                    <Text style={styles.feeRowLabel}>Amount Paid:</Text>
                    <Text style={[styles.feeRowValue, styles.amountPaid]}>
                      {formatCurrency(data.amountPaid)}
                    </Text>
                  </View>

                  <View style={[styles.feeRow, styles.feeRowTotal]}>
                    <Text style={[styles.feeRowLabel, { fontWeight: 700 }]}>
                      Remaining:
                    </Text>
                    <Text
                      style={[
                        styles.feeRowValue,
                        data.remainingBalance > 0
                          ? styles.remainingPositive
                          : styles.remainingZero,
                      ]}
                    >
                      {formatCurrency(data.remainingBalance)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Signature */}
              <View style={styles.signatureSection}>
                <Text style={styles.signatureLabel}>Authorized Signature</Text>
                <View style={styles.signatureLine} />
              </View>
            </View>
          </View>

          {/* ==================== FOOTER ==================== */}
          <View style={styles.footer}>
            <Text style={styles.footerWarning}>Computer-generated voucher</Text>
            <Text style={styles.footerReceipt}>Ref: {data.voucherId}</Text>
            <Text style={styles.footerAddress}>
              Opp. Islamia College, Danishabad, University Road, Peshawar
            </Text>
          </View>

          {/* Watermark */}
          <Text style={styles.academyWatermark}>GENIUS ISLAMIAN'S</Text>
        </View>
      </Page>
    </Document>
  );
};

export default TeacherPaymentPDF;
