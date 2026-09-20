import {
  Injectable,
  inject
} from '@angular/core';

import {
  HttpClient,
  HttpResponse
} from '@angular/common/http';

import {
  Observable,
  Subject,
  map,
  switchMap,
  takeUntil,
  takeWhile,
  timer
} from 'rxjs';

import { API_BASE_URL } from '../api-config';

export type ReportJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export interface ReportJob {
  id: string;
  status: ReportJobStatus;
  attempts: number;
  maxAttempts: number;
  error?: string | null;
  createdAt: string;
}

export interface CreateReportResponse {
  success: boolean;
  message: string;
  jobId: string;
}

export interface ReportStatusResponse {
  success: boolean;
  job: ReportJob;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private readonly http =
    inject(HttpClient);

  private readonly apiUrl =
    `${API_BASE_URL}/reports`;

  private pollingStop$ =
    new Subject<void>();

  exportTasks(
    format: 'json' | 'csv'
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.apiUrl}/tasks/${format}`,
      {
        observe: 'response',
        responseType: 'blob'
      }
    );
  }

  createReport(): Observable<CreateReportResponse> {
    return this.http.post<CreateReportResponse>(
      `${this.apiUrl}/tasks/report`,
      {}
    );
  }

  getStatus(
    jobId: string
  ): Observable<ReportStatusResponse> {
    return this.http.get<ReportStatusResponse>(
      `${this.apiUrl}/jobs/${jobId}`
    );
  }

  downloadReport(
    jobId: string
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(
      `${this.apiUrl}/jobs/${jobId}/download`,
      {
        observe: 'response',
        responseType: 'blob'
      }
    );
  }

  pollReport(
    jobId: string
  ): Observable<ReportJob> {
    this.stopPolling();

    const stop$ =
      this.pollingStop$;

    return timer(0, 1000).pipe(
      takeUntil(stop$),

      switchMap(() =>
        this.getStatus(jobId)
      ),

      takeWhile(
        response =>
          response.job.status === 'pending' ||
          response.job.status === 'processing',
        true
      ),

      map(response => response.job)
    );
  }

  stopPolling(): void {
    this.pollingStop$.next();
    this.pollingStop$.complete();

    this.pollingStop$ =
      new Subject<void>();
  }
}