export interface DashboardSummary {
  totalPatients: number;
  appointmentsToday: number;
  appointmentsThisMonth: number;
  totalProfessionals: number;
  monthlyBalance: number;
  referenceDate: string;
}

export interface MonthlyFinancials {
  income: number;
  expense: number;
  balance: number;
}
