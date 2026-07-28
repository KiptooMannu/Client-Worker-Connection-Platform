import { Component, Input } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SLICE_SCHEME } from './chart-palette';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <div class="chart-container">
      <ngx-charts-pie-chart
        [view]="$any(view)"
        [scheme]="scheme"
        [results]="sanitizedData"
        [legend]="legend"
        [legendTitle]="legendTitle"
        [doughnut]="doughnut"
        [labels]="labels"
        (select)="onSelect($event)">
      </ngx-charts-pie-chart>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      height: 210px;
      position: relative;
      overflow: hidden;
    }
    @media (min-width: 640px) { .chart-container { height: 250px; } }
  `]
})
export class PieChartComponent {
  @Input() data: any[] = [];
  @Input() view?: [number, number];

  get sanitizedData(): any[] {
    return this.normalizeChartData(this.data);
  }
  @Input() scheme: any = SLICE_SCHEME;
  @Input() legend: boolean = true;
  @Input() legendTitle: string = '';
  @Input() doughnut: boolean = false;
  @Input() labels: boolean = true;

  private normalizeChartData(data: any[] | null | undefined): any[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => {
      if (!item || typeof item !== 'object') {
        return { name: 'Unknown', value: 0 };
      }

      const name = typeof item.name === 'string' && item.name.trim() ? item.name : 'Unknown';
      const value = this.toSafeNumber(item.value);

      return { ...item, name, value };
    });
  }

  private toSafeNumber(value: unknown): number {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    const parsed = typeof value === 'string' ? Number(value) : Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  onSelect(event: any): void {
    console.log('Chart selected:', event);
  }
}
