import { Component, Input } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-bar-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <div class="chart-container">
      <ngx-charts-bar-vertical
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
        [barPadding]="barPadding"
        (select)="onSelect($event)">
      </ngx-charts-bar-vertical>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      height: 400px;
    }
  `]
})
export class BarChartComponent {
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
  @Input() barPadding: number = 8;

  onSelect(event: any): void {
    console.log('Chart selected:', event);
  }
}
