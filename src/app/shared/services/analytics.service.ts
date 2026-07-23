import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private apiUrl = 'http://localhost:8080/api/analytics';

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
}
