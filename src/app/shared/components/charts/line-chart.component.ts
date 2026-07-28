import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SERIES_SCHEME } from './chart-palette';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <div class="chart-container">
      <ngx-charts-line-chart
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
        [autoScale]="autoScale"
        [animations]="animations"
        [timeline]="timeline"
        (select)="onSelect($event)">
      </ngx-charts-line-chart>
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
export class LineChartComponent implements OnChanges {
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
  @Input() autoScale: boolean = true;
  @Input() animations: boolean = true;
  @Input() timeline: boolean = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.transformData();
    }
  }

  transformData(): void {
    // Transform data if needed for ngx-charts format
  }

  private normalizeChartData(data: any[] | null | undefined): any[] {
    if (!Array.isArray(data)) {
      return [];
    }

    return data.map((item) => {
      if (!item || typeof item !== 'object') {
        return { name: 'Series', series: [] };
      }

      const series = Array.isArray(item.series)
        ? item.series.map((point: any) => ({
            name: typeof point?.name === 'string' && point.name.trim() ? point.name : 'Unknown',
            value: this.toSafeNumber(point?.value)
          }))
        : [];

      return {
        ...item,
        name: typeof item.name === 'string' && item.name.trim() ? item.name : 'Series',
        series
      };
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
