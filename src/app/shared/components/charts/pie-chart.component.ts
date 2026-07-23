import { Component, Input } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  selector: 'app-pie-chart',
  standalone: true,
  imports: [NgxChartsModule],
  template: `
    <div class="chart-container">
      <ngx-charts-pie-chart
        [view]="view"
        [scheme]="scheme"
        [results]="data"
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
      height: 400px;
    }
  `]
})
export class PieChartComponent {
  @Input() data: any[] = [];
  @Input() view: [number, number] = [700, 400];
  @Input() scheme: any = 'cool';
  @Input() legend: boolean = true;
  @Input() legendTitle: string = '';
  @Input() doughnut: boolean = false;
  @Input() labels: boolean = true;

  onSelect(event: any): void {
    console.log('Chart selected:', event);
  }
}
