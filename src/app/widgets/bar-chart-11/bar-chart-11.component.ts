import {
  Component,
  input,
  viewChild,
  OnChanges,
  SimpleChanges,
  DestroyRef,
  inject,
  AfterViewInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-bar-chart-11',

  imports: [HighchartsChartModule],
  templateUrl: './bar-chart-11.component.html',
  styleUrl: './bar-chart-11.component.scss'
})
export class BarChart11Component implements OnChanges, AfterViewInit {

  /// inputs
  fonds = input<any>();

  /// view child
  chartDiv = viewChild.required<any>("chartDiv");

  /// destroy ref
  private readonly destroyRef = inject(DestroyRef);

  /// highcharts
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = this.getEmptyChartOptions();

  /// after view init
  ngAfterViewInit(): void {
    fromEvent(window, 'resize')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.resizeTheChart();
      });
  }

  /// changes
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fonds']) {
      this.updateChart();
    }
  }

  /// resize the chart
  resizeTheChart(): void {
    const chartRef = this.chartDiv();
    if (chartRef && chartRef.chart) {
      chartRef.chart.reflow();
    }
  }

  /// update chart
  updateChart() {
    const fondsData = this.fonds();
    if (!fondsData || fondsData.length === 0) {
      this.chartOptions = this.getEmptyChartOptions();
      return;
    }

    const groupedFonds = new Map<string, { count: number, libelle: string, couleur: string }>();
    fondsData.forEach((fonds: any) => {
      const key = fonds?.etat?.libelle + '|' + fonds?.etat?.couleur;
      if (!groupedFonds.has(key)) {
        groupedFonds.set(key, {
          count: 1,
          libelle: fonds?.etat?.libelle,
          couleur: fonds?.etat?.couleur
        });
      } else {
        groupedFonds.get(key)!.count++;
      }
    });

    const colors = Array.from(groupedFonds.values()).map(e => this.getCodeFromColor(e.couleur));
    const data = Array.from(groupedFonds.values()).map((e, index) => ({
      name: e.libelle,
      y: e.count,
      color: colors[index]
    }));

    this.setChartOptions(data);
  }

  /// set chart options
  setChartOptions(data: any[]) {
    this.chartOptions = {
      chart: {
        type: 'column',
        height: 212,
        backgroundColor: 'transparent',
      },
      title: { text: "" },
      loading: {
        labelStyle: {
          color: 'var(--cds-global-typography-color-400)',
          fontSize: '20px',
          fontWeight: 'normal',
        },
        style: {
          backgroundColor: 'transparent',
          opacity: 0.8,
        },
      },
      tooltip: {
        formatter: function (this: any) {
          return `<b>${this.point.name}</b>: ${this.point.y} fonds`;
        }
      },
      legend: { enabled: false },
      xAxis: {
        crosshair: true,
        gridLineWidth: 0.5,
        lineColor: 'var(--cds-alias-status-disabled)',
        tickColor: 'var(--cds-alias-status-disabled)',
        gridLineColor: 'var(--cds-alias-status-disabled-tint)',
        labels: {
          style: { fontSize: '14px', color: 'var(--cds-alias-object-interaction-color)' },
        },
        categories: data.map(e => e.name),
        type: 'category',
        title: { text: undefined }
      },
      yAxis: {
        visible: false,
        gridLineWidth: 1,
        gridLineColor: 'var(--cds-alias-status-disabled-tint)',
        min: 0,
        tickInterval: 1,
        allowDecimals: false,
        labels: {
          style: {
            fontSize: '13px',
            color: 'var(--cds-alias-object-interaction-color)',
          },
          formatter: function () {
            return this.value.toString();
          }
        }
      },
      plotOptions: {

        column: {
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            formatter: function (this: any) {
              return this.y;
            },
            style: {
              fontSize: '12px',
              color: 'var(--cds-alias-object-interaction-color)',
              textOutline: 'none'
            }
          }
        }
      },
      series: [{
        name: 'Fonds',
        type: 'column',
        data: data,
        colorByPoint: true,
      }] as Highcharts.SeriesOptionsType[],
      credits: { enabled: false }
    };
  }

  /// get code from color
  getCodeFromColor(color: string): string {
    if (!color || color === 'undefined') return '#ccc';
    if (color.startsWith('var(')) {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(color.replace('var(', '').replace(')', ''))
        .trim();
    }
    return color;
  }

  /// get empty chart options
  getEmptyChartOptions(): Highcharts.Options {
    return {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        reflow: true,
      },
      title: { text: undefined },
      series: [],
      credits: { enabled: false }
    };
  }
}
