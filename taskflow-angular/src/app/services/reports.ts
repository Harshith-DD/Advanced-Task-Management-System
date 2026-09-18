import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { API_BASE_URL } from '../api-config';

export interface ReportJob { id:string; status:string; attempts:number; maxAttempts:number; error?:string|null; createdAt:string; }

@Injectable({providedIn:'root'})
export class ReportService {
  private readonly http=inject(HttpClient);
  exportTasks(format:'json'|'csv'){return this.http.get(`${API_BASE_URL}/reports/tasks/${format}`,{responseType:'blob'});}
  createReport(){return this.http.post<{success:boolean;jobId:string}>(`${API_BASE_URL}/reports/tasks/report`,{});}
  getStatus(jobId:string){return this.http.get<{success:boolean;job:ReportJob}>(`${API_BASE_URL}/reports/jobs/${jobId}`);}
  downloadReport(jobId:string){return this.http.get(`${API_BASE_URL}/reports/jobs/${jobId}/download`,{responseType:'blob'});}
}
