import { Component, Input } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SERIES_SCHEME } from './chart-palette';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <div class="chart-container">
      <ngx-charts-bar-vertical
        [view]="$any(view)"
        [scheme]="scheme"
        [results]="sanitizedData"
        [gradient]="gradient"
        [xAxis]="xAxis"
        [yAxis]="yAxis"
        [legend]="legend"
        [legendTitle]="legendTitle"
        [showXAxisLabel]="showXAxisLabel"
        [showYAxisLabel]="showYAxisLabel"
        [xAxisLabel]="xAxisLabel"
        [yAxisLabel]="yAxisLabel"
        [barPadding]="barPadding"
        [animations]="animations"
        (select)="onSelect($event)">
      </ngx-charts-bar-vertical>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      height: 300px;
      position: relative;
      overflow: hidden;
    }
    :host ::ng-deep .chart-legend {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 10px;
    }
    :host ::ng-deep .legend-labels {
      font-size: 12px;
      font-weight: 500;
    }
  `]
})
export class BarChartComponent {
  @Input() data: any[] = [];
  @Input() view?: [number, number];

  get sanitizedData(): any[] {
    return this.normalizeChartData(this.data);
  }
  @Input() scheme: any = SERIES_SCHEME;
  @Input() gradient: boolean = false;
  @Input() xAxis: boolean = true;
  @Input() yAxis: boolean = true;
  @Input() legend: boolean = true;
  @Input() legendTitle: string = '';
  @Input() showXAxisLabel: boolean = true;
  @Input() showYAxisLabel: boolean = true;
  @Input() xAxisLabel: string = '';
  @Input() yAxisLabel: string = '';
  @Input() barPadding: number = 8;
  @Input() animations: boolean = true;

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
