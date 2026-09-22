import {
  Component,
  OnDestroy,
  inject,
  signal
} from '@angular/core';

import {
  HttpResponse
} from '@angular/common/http';

import {
  Subject,
  takeUntil
} from 'rxjs';

import {
  ReportJob,
  ReportService
} from '../services/reports';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-reports',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatCardModule],
  templateUrl: './reports.html',
  styleUrl: './reports.css'
})
export class Reports
  implements OnDestroy
{
  private readonly service =
    inject(ReportService);

  private readonly destroy$ =
    new Subject<void>();

  readonly busy =
    signal(false);

  readonly status =
    signal('');

  readonly error =
    signal('');

  readonly reportJob =
    signal<ReportJob | null>(null);

  export(
    format: 'json' | 'csv'
  ): void {
    if (this.busy()) {
      return;
    }

    this.error.set('');

    this.status.set(
      `Preparing ${format.toUpperCase()} export...`
    );

    this.busy.set(true);

    this.service
      .exportTasks(format)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: response => {
          const fileName =
            this.getFileName(
              response,
              `tasks.${format}`
            );

          this.download(
            response.body,
            fileName
          );

          this.busy.set(false);

          this.status.set(
            `Tasks exported as ${format.toUpperCase()}.`
          );
        },

        error: error => {
          console.error(
            'Failed to export tasks:',
            error
          );

          this.error.set(
            this.getErrorMessage(
              error,
              'Failed to download export.'
            )
          );

          this.busy.set(false);
          this.status.set('');
        }
      });
  }

  generate(): void {
    if (this.busy()) {
      return;
    }

    this.error.set('');
    this.reportJob.set(null);

    this.status.set(
      'Starting report generation...'
    );

    this.busy.set(true);

    this.service
      .createReport()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: response => {
          this.startPolling(
            response.jobId
          );
        },

        error: error => {
          console.error(
            'Failed to create report:',
            error
          );

          this.error.set(
            this.getErrorMessage(
              error,
              'Failed to create report.'
            )
          );

          this.busy.set(false);
          this.status.set('');
        }
      });
  }

  private startPolling(
    jobId: string
  ): void {
    this.status.set(
      'Report queued...'
    );

    this.service
      .pollReport(jobId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: job => {
          this.reportJob.set(job);

          if (
            job.status ===
            'pending'
          ) {
            this.status.set(
              'Report queued...'
            );

            return;
          }

          if (
            job.status ===
            'processing'
          ) {
            this.status.set(
              'Generating report...'
            );

            return;
          }

          if (
            job.status ===
            'failed'
          ) {
            this.error.set(
              job.error ??
              'Report generation failed.'
            );

            this.busy.set(false);
            this.status.set('');

            this.service.stopPolling();

            return;
          }

          if (
            job.status ===
            'completed'
          ) {
            this.status.set(
              'Report generated. Downloading...'
            );

            this.service.stopPolling();

            this.downloadCompletedReport(
              jobId
            );
          }
        },

        error: error => {
          console.error(
            'Report polling failed:',
            error
          );

          this.error.set(
            this.getErrorMessage(
              error,
              'Report polling failed.'
            )
          );

          this.busy.set(false);
          this.status.set('');

          this.service.stopPolling();
        },

        complete: () => {

        }
      });
  }

  private downloadCompletedReport(
    jobId: string
  ): void {
    this.service
      .downloadReport(jobId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: response => {
          const fileName =
            this.getFileName(
              response,
              'task-report.json'
            );

          this.download(
            response.body,
            fileName
          );

          this.busy.set(false);

          this.status.set(
            'Report downloaded.'
          );
        },

        error: error => {
          console.error(
            'Failed to download report:',
            error
          );

          this.error.set(
            this.getErrorMessage(
              error,
              'Failed to download report.'
            )
          );

          this.busy.set(false);
          this.status.set('');

          this.service.stopPolling();
        }
      });
  }

  private getFileName(
    response: HttpResponse<Blob>,
    fallback: string
  ): string {
    const disposition =
      response.headers.get(
        'Content-Disposition'
      );

    if (!disposition) {
      return fallback;
    }

    const match =
      disposition.match(
        /filename="([^"]+)"/i
      );

    return match?.[1] ?? fallback;
  }

  private download(
    blob: Blob | null,
    name: string
  ): void {
    if (!blob) {
      this.error.set(
        'The server returned an empty file.'
      );

      this.busy.set(false);
      this.status.set('');

      return;
    }

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;
    link.download = name;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  private getErrorMessage(
    error: unknown,
    fallback: string
  ): string {
    if (
      typeof error === 'object' &&
      error !== null
    ) {
      const candidate =
        error as {
          error?: {
            error?: {
              message?: string;
            };
            message?: string;
          };
        };

      return (
        candidate.error?.error?.message ??
        candidate.error?.message ??
        fallback
      );
    }

    return fallback;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.service.stopPolling();
  }
}