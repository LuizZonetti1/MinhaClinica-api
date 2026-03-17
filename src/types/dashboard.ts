export interface DashboardSummary {
  totalPatients: number;
  appointmentsToday: number;
  appointmentsThisMonth: number;
  totalProfessionals: number;
  monthlyBalance: number;
  referenceDate: string;
}

export interface ReceptionDashboardSummary {
  date: string;
  waitingCheckin: number;
  checkinsDone: number;
  pendingConfirmations: number;
}

export interface MonthlyFinancials {
  income: number;
  expense: number;
  balance: number;
}
