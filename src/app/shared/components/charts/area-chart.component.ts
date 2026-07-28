import { Component, Input } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SERIES_SCHEME } from './chart-palette';

@Component({
  selector: 'app-area-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <div class="chart-container">
      <ngx-charts-area-chart
        [view]="$any(view)"
        [scheme]="scheme"
        [results]="data"
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
        (select)="onSelect($event)">
      </ngx-charts-area-chart>
    </div>
  `,
  styles: [`
    /* See line-chart: height steps down so axis ticks stay legible at 320px. */
    .chart-container {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      height: 220px;
      position: relative;
      overflow: hidden;
    }
    @media (min-width: 640px) { .chart-container { height: 260px; } }
    @media (min-width: 1024px) { .chart-container { height: 300px; } }
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
export class AreaChartComponent {
  @Input() data: any[] = [];
  /** Left undefined so ngx-charts measures the container — a fixed view overflows on mobile. */
  @Input() view?: [number, number];
  @Input() scheme: any = SERIES_SCHEME;
  @Input() gradient: boolean = true;
  @Input() xAxis: boolean = true;
  @Input() yAxis: boolean = true;
  @Input() legend: boolean = true;
  @Input() legendTitle: string = '';
  @Input() showXAxisLabel: boolean = true;
  @Input() showYAxisLabel: boolean = true;
  @Input() xAxisLabel: string = '';
  @Input() yAxisLabel: string = '';
  @Input() autoScale: boolean = true;

  onSelect(event: any): void {
    console.log('Chart selected:', event);
  }
}
