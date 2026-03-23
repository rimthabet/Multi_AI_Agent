import { AfterViewInit, Component, DestroyRef, effect, inject, input, model, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-bar-chart-14',
  imports: [HighchartsChartModule],
  templateUrl: './bar-chart-14.component.html',
  styleUrl: './bar-chart-14.component.scss'
})
export class BarChart14Component implements AfterViewInit {

  statsByBadgeRange = input<any[]>([]);

  // ViewChild
  chartDiv = viewChild.required<any>('chartDiv');

  // Destroy ref
  private readonly destroyRef = inject(DestroyRef);

  // Highcharts
  Highcharts: typeof Highcharts = Highcharts;

  // Options
  chartOptions = model<Highcharts.Options>({});

  ngAfterViewInit(): void {
    if (this.statsByBadgeRange())
      this.updateChart();

    fromEvent(window, 'resize')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.resizeTheChart();
      });
  }

  readonly chartEffect = effect(() => {
    if (this.statsByBadgeRange())
      this.updateChart();
  });


  updateChart(): void {
    const palierArray = this.statsByBadgeRange();

    console.log("Data chart 14", palierArray)

    const categories = palierArray.map(p => `${p.range}`);
    const height = 320;

    this.chartOptions.set({
      chart: {
        type: 'column',
        height,
        backgroundColor: 'transparent',
      },
      title: { text: '' },
      colors: [
        'var(--cds-alias-viz-sequential-green-600)',
        'var(--cds-alias-viz-sequential-blue-600)',
        'var(--cds-alias-status-danger)',
      ],
      legend: {
        enabled: true,
        verticalAlign: 'top',
        itemStyle: { color: 'var(--cds-alias-object-interaction-color)' },
      },
      xAxis: {
        categories,
        crosshair: true,
        gridLineWidth: 0.5,
        lineColor: 'var(--cds-alias-status-disabled)',
        tickColor: 'var(--cds-alias-status-disabled)',
        gridLineColor: 'var(--cds-alias-status-disabled-tint)',
        labels: {
          style: {
            fontSize: '13px',
            color: 'var(--cds-alias-object-interaction-color)'
          }
        },
      },
      yAxis: [
        {
          title: { text: '', style: { color: 'var(--cds-alias-viz-sequential-green-600)' } },
          labels: {
            style: { color: 'var(--cds-alias-viz-sequential-green-600)' },
            formatter: function () {
              return this.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
            }
          },
          gridLineColor: 'var(--cds-alias-status-disabled-tint)',
          gridLineWidth: 1,
        },
        {
          title: { text: '', style: { color: 'var(--cds-alias-viz-sequential-blue-600)' } },
          labels: {
            style: { color: 'var(--cds-alias-viz-sequential-blue-600)' },
            formatter: function () {
              return this.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
            }
          },
          gridLineColor: 'var(--cds-alias-status-disabled-tint)',
          gridLineWidth: 1,
          opposite: true,
        }
      ],
      tooltip: {
        shared: true,
        formatter: function (this: any) {
          const categoryLabel = this.series?.xAxis?.categories?.[this.points?.[0]?.point?.x ?? 0];
          let tooltip = '';
          if (categoryLabel) {
            tooltip += `<b>${categoryLabel}</b><br/>`;
          }
          this.points?.forEach((point: any) => {

            const value = typeof point.y === 'number'
              ? (point.series.name === 'Montant investi'
                ? `${point.y.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} TND`
                : point.y)
              : point.y;

            tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${value}</b><br/>`;
          });
          return tooltip;
        }
      },
      plotOptions: {
        column: {
          maxPointWidth: 80,
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            formatter: function () {
              if (typeof this.y === 'number') {
                return this.series.name === 'Montant investi'
                  ? this.y.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' TND'
                  : this.y.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
              }
              return this.y;
            },
            style: {
              fontSize: '12px',
              fontWeight: 'normal',
              color: 'var(--cds-alias-object-interaction-color)',
              cursor: 'pointer',
            }
          }
        }
      },
      series: [
        {
          name: 'Montant investi',
          type: 'column',
          data: palierArray.map(p => p.amount),
          color: 'var(--cds-alias-viz-sequential-green-600)',
          yAxis: 0,
        },
        {
          name: 'Nombre de projets',
          type: 'column',
          data: palierArray.map(p => p.projects.size),
          color: 'var(--cds-alias-viz-sequential-blue-600)',
          yAxis: 1,
        }
      ],
      credits: { enabled: false }
    });
  }

  resizeTheChart(): void {
    const chartRef = this.chartDiv();
    if (chartRef && chartRef.chart) {
      chartRef.chart.reflow();
    }
  }
}
