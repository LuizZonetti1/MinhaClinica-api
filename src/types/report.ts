export type ReportPeriod = "1m" | "3m" | "6m" | "12m";

export interface ReportSummary {
  consultationsCount: number;
  totalRevenue: number;
  cancellationsCount: number;
  estimatedProfit: number;
}

export interface MonthlyData {
  month: string;
  consultations: number;
  cancellations: number;
  revenue: number;
}

export interface FinancialData {
  month: string;
  entradas: number;
  saidas: number;
  lucro: number;
}

export interface StatusDistributionItem {
  name: string;
  value: number;
}

export interface RevenueTrendItem {
  month: string;
  consultations: number;
  revenue: number;
}

export interface TopProfessionalItem {
  rank: number;
  name: string;
  specialty: string;
  consultations: number;
}

export interface TopSpecialtyItem {
  rank: number;
  name: string;
  consultations: number;
}

export interface ReportData {
  summary: ReportSummary;
  monthly: MonthlyData[];
  financial: FinancialData[];
  statusDistribution: StatusDistributionItem[];
  revenueTrend: RevenueTrendItem[];
  topProfessionals: TopProfessionalItem[];
  topSpecialties: TopSpecialtyItem[];
  referenceLabel: string;
}
