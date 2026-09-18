import { Component, OnDestroy, inject, signal } from '@angular/core';
import { ReportService } from '../services/reports';
import { Subject, catchError, EMPTY, switchMap, takeWhile, timer, takeUntil } from 'rxjs';

@Component({
  selector: 'app-reports',
  imports: [],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports implements OnDestroy {
  private readonly service = inject(ReportService);
  private readonly destroy$ = new Subject<void>();
  private pollingStop$ = new Subject<void>();

  readonly busy = signal(false);
  readonly status = signal('');
  readonly error = signal('');

  export(format: 'json' | 'csv'): void {
    this.error.set('');
    this.status.set(`Preparing ${format.toUpperCase()} export...`);
    this.busy.set(true);

    this.service.exportTasks(format).pipe(takeUntil(this.destroy$)).subscribe({
      next: blob => {
        this.download(blob, `tasks.${format}`);
        this.busy.set(false);
        this.status.set(`Tasks exported as ${format.toUpperCase()}.`);
      },
      error: error => {
        this.error.set(this.getErrorMessage(error, 'Failed to download export.'));
        this.busy.set(false);
        this.status.set('');
      }
    });
  }

  generate(): void {
    this.error.set('');
    this.status.set('Generating report...');
    this.busy.set(true);
    this.stopPolling();

    this.service.createReport().pipe(takeUntil(this.destroy$)).subscribe({
      next: response => this.poll(response.jobId),
      error: error => {
        this.error.set(this.getErrorMessage(error, 'Failed to create report.'));
        this.busy.set(false);
        this.status.set('');
      }
    });
  }

  private poll(jobId: string): void {
    const startedAt = Date.now();
    const stop$ = this.pollingStop$;

    timer(0, 1000).pipe(
      takeUntil(stop$),
      takeUntil(this.destroy$),
      switchMap(() => this.service.getStatus(jobId)),
      takeWhile(response => response.job.status === 'queued' || response.job.status === 'processing', true),
      catchError(error => {
        this.error.set(this.getErrorMessage(error, 'Report polling failed.'));
        this.busy.set(false);
        this.status.set('');
        return EMPTY;
      })
    ).subscribe(response => {
      if (Date.now() - startedAt >= 5 * 60 * 1000 && response.job.status !== 'completed') {
        this.error.set('Report generation is taking longer than expected. Please try again.');
        this.busy.set(false);
        this.status.set('');
        this.stopPolling();
        return;
      }

      this.status.set(`Report status: ${response.job.status}`);

      if (response.job.status === 'completed') {
        this.stopPolling();
        this.status.set('Downloading report...');

        this.service.downloadReport(jobId).pipe(takeUntil(this.destroy$)).subscribe({
          next: blob => {
            this.download(blob, 'task-report.json');
            this.busy.set(false);
            this.status.set('Report downloaded.');
          },
          error: error => {
            this.error.set(this.getErrorMessage(error, 'Failed to download report.'));
            this.busy.set(false);
            this.status.set('');
          }
        });
      } else if (response.job.status === 'failed') {
        this.stopPolling();
        this.busy.set(false);
        this.error.set(response.job.error ?? 'Report generation failed.');
        this.status.set('');
      }
    });
  }

  private stopPolling(): void {
    this.pollingStop$.next();
    this.pollingStop$.complete();
    this.pollingStop$ = new Subject<void>();
  }

  private getErrorMessage(error: any, fallback: string): string {
    return error?.error?.error?.message ?? error?.error?.message ?? fallback;
  }

  private download(blob: Blob, name: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopPolling();
  }
}
