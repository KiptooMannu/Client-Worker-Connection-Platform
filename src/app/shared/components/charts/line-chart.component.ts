import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-line-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <div class="chart-container">
      <ngx-charts-line-chart
        [view]="view"
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
      </ngx-charts-line-chart>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      height: 400px;
    }
  `]
})
export class LineChartComponent implements OnChanges {
  @Input() data: any[] = [];
  @Input() view: [number, number] = [700, 400];
  @Input() scheme: any = 'cool';
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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.transformData();
    }
  }

  transformData(): void {
    // Transform data if needed for ngx-charts format
  }

  onSelect(event: any): void {
    console.log('Chart selected:', event);
  }
}
