import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { SLICE_SCHEME } from './chart-palette';

/**
 * Donut chart with a centred total and a labelled legend.
 *
 * The legend carries the name, value and share for every slice. That is the
 * "relief" the palette's sub-3:1 contrast slots require — identity never rests
 * on the swatch colour alone, and the figures stay readable in greyscale or
 * forced-colours mode.
 */
@Component({
  selector: 'app-donut-chart',
  standalone: true,
  imports: [CommonModule, NgxChartsModule],
  template: `
    <div class="donut-wrap">
      @if (hasData) {
        <div class="donut-plot">
          <ngx-charts-pie-chart
            [scheme]="scheme"
            [results]="slices"
            [doughnut]="true"
            [arcWidth]="arcWidth"
            [labels]="false"
            [legend]="false"
            [animations]="animations">
          </ngx-charts-pie-chart>

          <!-- Centred hero figure: the one number the donut is answering. -->
          <div class="donut-center" aria-hidden="true">
            <span class="donut-total">{{ formattedTotal }}</span>
            @if (centerLabel) {
              <span class="donut-caption">{{ centerLabel }}</span>
            }
          </div>
        </div>

        <ul class="donut-legend">
          @for (slice of slices; track slice.name; let i = $index) {
            <li>
              <span class="swatch" [style.background]="colorAt(i)"></span>
              <span class="legend-name">{{ slice.name }}</span>
              <span class="legend-value">
                {{ formatValue(slice.value) }}
                <span class="legend-share">{{ shareOf(slice.value) }}</span>
              </span>
            </li>
          }
        </ul>
      } @else {
        <p class="donut-empty">No data for this period yet.</p>
      }
    </div>
  `,
  styles: [`
    .donut-wrap { width: 100%; }
    .donut-plot {
      position: relative;
      width: 100%;
      height: 200px;
    }
    .donut-center {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      gap: 2px;
    }
    .donut-total {
      font-size: 1.25rem;
      font-weight: 800;
      color: #0b0b0b;
      line-height: 1;
    }
    .donut-caption {
      font-size: 0.5625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #898781;
    }
    .donut-legend {
      list-style: none;
      margin: 0.75rem 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }
    .donut-legend li {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.6875rem;
    }
    .swatch {
      width: 10px;
      height: 10px;
      border-radius: 3px;
      flex-shrink: 0;
      /* Hairline ring keeps light slices from dissolving into the card. */
      box-shadow: inset 0 0 0 1px rgba(11, 11, 11, 0.1);
    }
    .legend-name {
      color: #52514e;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .legend-value {
      margin-left: auto;
      color: #0b0b0b;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .legend-share {
      color: #898781;
      font-weight: 600;
      margin-left: 0.25rem;
    }
    .donut-empty {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0;
      font-size: 0.6875rem;
      font-weight: 700;
      color: #898781;
    }
  `]
})
export class DonutChartComponent {
  @Input() data: { name: string; value: number }[] = [];
  @Input() scheme: any = SLICE_SCHEME;
  @Input() arcWidth = 0.32;
  @Input() animations = true;
  /** Small caption under the centred total, e.g. "Total". */
  @Input() centerLabel = '';
  /** Set for money donuts so values render as compact KES. */
  @Input() currency = false;

  get slices(): { name: string; value: number }[] {
    if (!Array.isArray(this.data)) return [];
    return this.data
      .filter(d => d && typeof d === 'object')
      .map(d => ({
        name: typeof d.name === 'string' && d.name.trim() ? d.name : 'Unknown',
        value: Number.isFinite(Number(d.value)) ? Number(d.value) : 0
      }))
      .filter(d => d.value > 0);
  }

  get hasData(): boolean {
    return this.slices.length > 0;
  }

  get total(): number {
    return this.slices.reduce((sum, s) => sum + s.value, 0);
  }

  get formattedTotal(): string {
    return this.formatValue(this.total);
  }

  colorAt(index: number): string {
    const domain: string[] = this.scheme?.domain ?? SLICE_SCHEME.domain;
    return domain[index % domain.length];
  }

  shareOf(value: number): string {
    const total = this.total;
    if (!total) return '';
    return `(${Math.round((value / total) * 100)}%)`;
  }

  formatValue(value: number): string {
    if (!this.currency) {
      return value.toLocaleString();
    }
    if (value >= 1_000_000) return `KES ${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `KES ${(value / 1_000).toFixed(1)}K`;
    return `KES ${Math.round(value).toLocaleString()}`;
  }
}
