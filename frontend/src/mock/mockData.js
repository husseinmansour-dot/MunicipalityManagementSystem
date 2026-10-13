/**
 * High-fidelity Mock Data for Municipality Management System
 * Perfectly aligned with Prisma Schema & Express Route Models
 */

export const mockCurrentUser = {
  id: 1,
  fullName: "Eleanor Vance",
  email: "e.vance@municipality.gov",
  role: "ADMIN",
  department: "Directorate of Public Administration",
  avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
  notificationsCount: 4,
};

export const mockDashboardMetrics = {
  totalCitizens: {
    value: 18450,
    formatted: "18,450",
    change: "+4.2%",
    isPositive: true,
    timeframe: "vs previous month",
    subtext: "142 registered this month",
  },
  activeRequests: {
    value: 328,
    formatted: "328",
    change: "+12.5%",
    isPositive: false, // higher pending requests requires attention
    timeframe: "active in queue",
    subtext: "48 flagged as priority",
  },
  pendingPermits: {
    value: 64,
    formatted: "64",
    change: "-8.3%",
    isPositive: true, // fewer backlog permits is good
    timeframe: "awaiting inspection",
    subtext: "Avg. turnaround: 3.8 days",
  },
  outstandingInvoices: {
    value: 52400.00,
    formatted: "$52,400.00",
    change: "-5.1%",
    isPositive: true, // reduced outstanding amount
    timeframe: "42 pending invoices",
    subtext: "11 invoices overdue",
  },
  totalRevenue: {
    value: 684250.00,
    formatted: "$684,250.00",
    change: "+16.8%",
    isPositive: true,
    timeframe: "Fiscal Year 2026",
    subtext: "Target: $750,000 (91.2% reached)",
  },
  recentPayments: {
    value: 38940.00,
    formatted: "$38,940.00",
    change: "+22.4%",
    isPositive: true,
    timeframe: "past 7 days",
    subtext: "98 transactions cleared",
  },
};

export const mockMonthlyRevenue = [
  { month: "Jan", revenue: 42500, billed: 48000, target: 45000 },
  { month: "Feb", revenue: 46200, billed: 51000, target: 45000 },
  { month: "Mar", revenue: 54100, billed: 59000, target: 50000 },
  { month: "Apr", revenue: 49800, billed: 52400, target: 50000 },
  { month: "May", revenue: 58900, billed: 63000, target: 55000 },
  { month: "Jun", revenue: 64200, billed: 67500, target: 55000 },
  { month: "Jul", revenue: 61500, billed: 66000, target: 60000 },
  { month: "Aug", revenue: 67800, billed: 71200, target: 60000 },
  { month: "Sep", revenue: 72400, billed: 76000, target: 65000 },
  { month: "Oct", revenue: 68900, billed: 74500, target: 65000 },
  { month: "Nov", revenue: 74200, billed: 79000, target: 70000 },
  { month: "Dec", revenue: 81800, billed: 85000, target: 75000 },
];

export const mockRequestsByStatus = [
  { name: "Completed", count: 184, value: 184, color: "#16A34A", percentage: 56.1 },
  { name: "Pending", count: 88, value: 88, color: "#F59E0B", percentage: 26.8 },
  { name: "Approved", count: 42, value: 42, color: "#2563EB", percentage: 12.8 },
  { name: "Rejected", count: 14, value: 14, color: "#DC2626", percentage: 4.3 },
];

export const mockRecentRequests = [
  {
    id: 1042,
    type: "Commercial Building Permit Inspection",
    status: "PENDING",
    submissionDate: "2026-10-10T14:32:00.000Z",
    completionDate: null,
    urgency: "High",
    citizen: {
      id: 12,
      firstName: "Marcus",
      lastName: "Sterling",
      nationalId: "NAT-883921",
      phoneNumber: "+1 (555) 234-8921",
    },
  },
  {
    id: 1041,
    type: "Residential Solar Installation Approval",
    status: "APPROVED",
    submissionDate: "2026-10-10T11:15:00.000Z",
    completionDate: "2026-10-10T16:00:00.000Z",
    urgency: "Normal",
    citizen: {
      id: 45,
      firstName: "Sophia",
      lastName: "Chen",
      nationalId: "NAT-774019",
      phoneNumber: "+1 (555) 492-3810",
    },
  },
  {
    id: 1040,
    type: "Road Maintenance & Pothole Repair",
    status: "COMPLETED",
    submissionDate: "2026-10-09T09:40:00.000Z",
    completionDate: "2026-10-10T10:20:00.000Z",
    urgency: "Normal",
    citizen: {
      id: 29,
      firstName: "Robert",
      lastName: "Kovacs",
      nationalId: "NAT-921804",
      phoneNumber: "+1 (555) 831-2940",
    },
  },
  {
    id: 1039,
    type: "Zoning Variance Petition (District 4)",
    status: "PENDING",
    submissionDate: "2026-10-09T08:12:00.000Z",
    completionDate: null,
    urgency: "Urgent",
    citizen: {
      id: 88,
      firstName: "Elena",
      lastName: "Rostova",
      nationalId: "NAT-450192",
      phoneNumber: "+1 (555) 109-7741",
    },
  },
  {
    id: 1038,
    type: "Public Park Event License (Autumn Festival)",
    status: "APPROVED",
    submissionDate: "2026-10-08T16:45:00.000Z",
    completionDate: "2026-10-09T14:30:00.000Z",
    urgency: "Normal",
    citizen: {
      id: 63,
      firstName: "Julian",
      lastName: "Moreau",
      nationalId: "NAT-338291",
      phoneNumber: "+1 (555) 672-0019",
    },
  },
  {
    id: 1037,
    type: "Industrial Waste Discharge Assessment",
    status: "REJECTED",
    submissionDate: "2026-10-08T10:00:00.000Z",
    completionDate: "2026-10-08T17:10:00.000Z",
    urgency: "High",
    citizen: {
      id: 112,
      firstName: "David",
      lastName: "Miller",
      nationalId: "NAT-662890",
      phoneNumber: "+1 (555) 902-4412",
    },
  },
];

export const mockRecentPayments = [
  {
    id: 508,
    invoiceId: 1204,
    amount: "1,250.00",
    paymentMethod: "BANK_TRANSFER",
    transactionReference: "TXN-20261010-8839",
    paymentDate: "2026-10-10T15:20:00.000Z",
    invoice: {
      id: 1204,
      description: "Annual Commercial Trade License Fee",
      citizen: {
        firstName: "Marcus",
        lastName: "Sterling",
      },
    },
  },
  {
    id: 507,
    invoiceId: 1198,
    amount: "450.00",
    paymentMethod: "CARD",
    transactionReference: "TXN-20261010-4491",
    paymentDate: "2026-10-10T13:45:00.000Z",
    invoice: {
      id: 1198,
      description: "Residential Building Survey & Permit",
      citizen: {
        firstName: "Sophia",
        lastName: "Chen",
      },
    },
  },
  {
    id: 506,
    invoiceId: 1182,
    amount: "120.00",
    paymentMethod: "CASH",
    transactionReference: "TXN-20261010-1102",
    paymentDate: "2026-10-10T11:05:00.000Z",
    invoice: {
      id: 1182,
      description: "Municipal Archive Documentation Certificate",
      citizen: {
        firstName: "Robert",
        lastName: "Kovacs",
      },
    },
  },
  {
    id: 505,
    invoiceId: 1179,
    amount: "3,800.00",
    paymentMethod: "BANK_TRANSFER",
    transactionReference: "TXN-20261009-9923",
    paymentDate: "2026-10-09T16:30:00.000Z",
    invoice: {
      id: 1179,
      description: "Urban Infrastructure Development Levy (Q3)",
      citizen: {
        firstName: "Apex",
        lastName: "Properties LLC",
      },
    },
  },
];

export const mockRecentActivities = [
  {
    id: "act-1",
    type: "PERMIT_APPROVED",
    title: "Permit #PMT-4092 Approved",
    description: "Commercial Building Permit approved by Building Inspector Department.",
    timestamp: "2026-10-10T15:42:00.000Z",
    user: "Eleanor Vance",
    badge: "Approved",
    badgeType: "success",
  },
  {
    id: "act-2",
    type: "PAYMENT_RECORDED",
    title: "Payment Received — $1,250.00",
    description: "Marcus Sterling settled Invoice #INV-1204 via Wire Transfer.",
    timestamp: "2026-10-10T15:20:00.000Z",
    user: "System / Finance",
    badge: "Payment",
    badgeType: "info",
  },
  {
    id: "act-3",
    type: "CITIZEN_REGISTERED",
    title: "New Citizen Registered",
    description: "Elena Rostova (NAT-450192) added to the municipal registry.",
    timestamp: "2026-10-10T14:15:00.000Z",
    user: "Clerk J. Reynolds",
    badge: "Citizen",
    badgeType: "neutral",
  },
  {
    id: "act-4",
    type: "REQUEST_SUBMITTED",
    title: "Urgent Service Request #1039",
    description: "Zoning Variance Petition submitted for District 4 redevelopment zone.",
    timestamp: "2026-10-10T12:05:00.000Z",
    user: "Online Citizen Portal",
    badge: "Pending",
    badgeType: "warning",
  },
  {
    id: "act-5",
    type: "PERMIT_RENEWED",
    title: "Permit Renewal Granted",
    description: "Outdoor Dining Permit #PMT-3810 extended through Dec 2027.",
    timestamp: "2026-10-10T09:30:00.000Z",
    user: "Eleanor Vance",
    badge: "Renewed",
    badgeType: "success",
  },
];

export const mockSystemAlerts = [
  {
    id: "alt-1",
    severity: "warning",
    title: "18 Permits Expiring Within 14 Days",
    message: "Automated renewal reminder notifications dispatched to registered citizens.",
  },
  {
    id: "alt-2",
    severity: "info",
    title: "Scheduled Maintenance: MySQL Backup",
    message: "Automated daily snapshot configured for 02:00 UTC.",
  },
];
