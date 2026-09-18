import { Component, inject, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../services/reports';
import { interval, Subscription, switchMap, takeWhile, catchError, EMPTY } from 'rxjs';

@Component({selector:'app-reports',imports:[CommonModule],templateUrl:'./reports.html',styleUrl:'./reports.css'})
export class Reports implements OnDestroy {
  private readonly service=inject(ReportService);
  private polling?:Subscription;
  readonly busy=signal(false);
  readonly status=signal('');
  readonly error=signal('');

  export(format:'json'|'csv'){
    this.error.set('');this.busy.set(true);
    this.service.exportTasks(format).subscribe({
      next:b=>{this.download(b,`tasks.${format}`);this.busy.set(false)},
      error:e=>{this.error.set(e?.error?.error?.message??'Failed to download export.');this.busy.set(false)}
    });
  }

  generate(){
    this.error.set('');this.busy.set(true);this.status.set('Starting report...');
    this.service.createReport().subscribe({
      next:r=>this.poll(r.jobId),
      error:e=>{this.error.set(e?.error?.error?.message??'Failed to create report.');this.busy.set(false)}
    });
  }

  private poll(jobId:string){
    this.polling?.unsubscribe();
    this.polling=interval(1500).pipe(
      switchMap(()=>this.service.getStatus(jobId)),
      takeWhile(r=>r.job.status==='queued'||r.job.status==='processing',true),
      catchError(e=>{this.error.set(e?.error?.error?.message??'Report polling failed.');this.busy.set(false);return EMPTY;})
    ).subscribe(r=>{
      this.status.set(`Report status: ${r.job.status}`);
      if(r.job.status==='completed'){this.service.downloadReport(jobId).subscribe({
        next:b=>{this.download(b,'task-report.json');this.busy.set(false);this.status.set('Report completed and downloaded.');},
        error:e=>{this.error.set(e?.error?.error?.message??'Failed to download report.');this.busy.set(false);}
      });}
      if(r.job.status==='failed'){this.busy.set(false);this.error.set(r.job.error??'Report generation failed.');}
    });
  }

  private download(blob:Blob,name:string){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);}
  ngOnDestroy(){this.polling?.unsubscribe();}
}
