import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** A single categorical datum — the shape ngx-charts consumes for bar/pie/donut. */
export interface NameValue {
  name: string;
  value: number;
}

/** A named series of points — the shape ngx-charts consumes for line/area. */
export interface MultiSeries {
  name: string;
  series: NameValue[];
}

/**
 * The 14 headline figures.
 *
 * `averageResponseTimeHours` is mean hours from job creation to work starting.
 * `conversionRate`, `successRate` and `monthlyGrowth` are already percentages —
 * do not multiply by 100 again in the view.
 */
export interface AnalyticsKpis {
  totalRevenue: number;
  platformRevenue: number;
  escrowBalance: number;
  pendingPayments: number;
  withdrawals: number;
  activeWorkers: number;
  activeClients: number;
  jobsCompleted: number;
  jobsPending: number;
  conversionRate: number;
  averageResponseTimeHours: number;
  walletBalance: number;
  monthlyGrowth: number;
  successRate: number;
}

/** Everything the enterprise dashboard renders, from one request. */
export interface EnterpriseAnalytics {
  kpis: AnalyticsKpis;

  revenueTrend: MultiSeries[];
  bookingsTrend: MultiSeries[];
  earningsTrend: MultiSeries[];
  transactionsTrend: MultiSeries[];
  platformGrowth: MultiSeries[];

  jobsByCategory: NameValue[];
  completedJobs: NameValue[];
  pendingJobs: NameValue[];
  workerPerformance: NameValue[];
  clientGrowth: NameValue[];

  bookingStatuses: NameValue[];
  paymentMethods: NameValue[];
  escrowDistribution: NameValue[];
  workerCategories: NameValue[];

  platformActivity: MultiSeries[];

  walletDistribution: NameValue[];
  platformFeeDistribution: NameValue[];
  userRegistrations: NameValue[];
}

export interface RevenueData {
  period: string;
  revenue: number;
  platformFees: number;
  workerPayouts: number;
}

export interface UserGrowthData {
  period: string;
  newClients: number;
  newWorkers: number;
  totalUsers: number;
}

export interface JobStatisticsData {
  period: string;
  jobsPosted: number;
  jobsCompleted: number;
  jobsInProgress: number;
  jobsPending: number;
  jobsByCategory: Record<string, number>;
}

export interface PlatformFeeData {
  period: string;
  totalFees: number;
  availableForWithdrawal: number;
  withdrawn: number;
  pending: number;
}

export interface DashboardOverview {
  totalRevenue: number;
  totalPlatformFees: number;
  totalJobs: number;
  completedJobs: number;
  completionRate: number;
  availableForWithdrawal: number;
}

export interface ClientSpendingData {
  period: string;
  amount: number;
  category: string;
}

export interface WorkerEarningsData {
  period: string;
  earnings: number;
  jobsCompleted: number;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  getRevenueData(startDate: string, endDate: string): Observable<RevenueData[]> {
    return this.http.get<RevenueData[]>(`${this.apiUrl}/revenue`, {
      params: { startDate, endDate }
    });
  }

  getUserGrowthData(startDate: string, endDate: string): Observable<UserGrowthData> {
    return this.http.get<UserGrowthData>(`${this.apiUrl}/users`, {
      params: { startDate, endDate }
    });
  }

  getJobStatistics(startDate: string, endDate: string): Observable<JobStatisticsData> {
    return this.http.get<JobStatisticsData>(`${this.apiUrl}/jobs`, {
      params: { startDate, endDate }
    });
  }

  getPlatformFeeData(startDate: string, endDate: string): Observable<PlatformFeeData> {
    return this.http.get<PlatformFeeData>(`${this.apiUrl}/platform-fees`, {
      params: { startDate, endDate }
    });
  }

  getDashboardOverview(): Observable<DashboardOverview> {
    return this.http.get<DashboardOverview>(`${this.apiUrl}/dashboard`);
  }

  getClientSpendingData(clientId: string, startDate: string, endDate: string): Observable<ClientSpendingData[]> {
    return this.http.get<ClientSpendingData[]>(`${this.apiUrl}/client/${clientId}/spending`, {
      params: { startDate, endDate }
    });
  }

  getWorkerEarningsData(workerId: string, startDate: string, endDate: string): Observable<WorkerEarningsData[]> {
    return this.http.get<WorkerEarningsData[]>(`${this.apiUrl}/worker/${workerId}/earnings`, {
      params: { startDate, endDate }
    });
  }

  /**
   * Fetches every KPI and chart series for the enterprise dashboard in one request.
   * @param months size of the trailing window, 1–24 (clamped server-side).
   */
  getEnterpriseAnalytics(months = 6): Observable<EnterpriseAnalytics> {
    return this.http.get<EnterpriseAnalytics>(`${this.apiUrl}/enterprise`, {
      params: { months: months.toString() }
    });
  }
}
