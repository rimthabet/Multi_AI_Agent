import {
  Component,
  model,
  effect,
  viewChild,
  DestroyRef,
  inject,
  AfterViewInit,
  input,
  computed,
  signal
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-bar-chart-13',

  imports: [HighchartsChartModule],
  templateUrl: './bar-chart-13.component.html',
  styleUrls: ['./bar-chart-13.component.scss']
})
export class BarChart13Component implements AfterViewInit {

  liquiditeActifs = input<any[]>();

  // ViewChild
  chartDiv = viewChild.required<any>('chartDiv');

  // Destroy ref
  private readonly destroyRef = inject(DestroyRef);

  // Highcharts
  Highcharts: typeof Highcharts = Highcharts;

  // Options
  chartOptions = model<Highcharts.Options>({});

  totalActif: number = 0;
  totalInvesti: number = 0;

  ngAfterViewInit(): void {
    this.updateChart();
    fromEvent(window, 'resize')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.resizeTheChart();
      });
  }

  readonly chartEffect = effect(() => {
    if (this.liquiditeActifs())
      this.updateChart();
  });

  updateChart(): void {
    let liquidites = [...(this.liquiditeActifs() ?? [])];

    liquidites = [...liquidites].sort((a: any, b: any) => {
      const dateA = new Date(a.fonds?.dateLancement ?? '').getTime();
      const dateB = new Date(b.fonds?.dateLancement ?? '').getTime();
      return dateA - dateB;
    });

    const categories = liquidites.map(item => item.fonds?.denomination);
    const investis = liquidites.map(item => item.actifInvesti ?? 0);
    const actifs = liquidites.map(item => item.totalActif ?? 0);
    const resteAInvestir = liquidites.map(item => item.resteAInvestir ?? 0);

    const height = 450;

    this.chartOptions.set({
      chart: {
        type: 'column',
        height: height,
        backgroundColor: 'transparent',
      },
      title: { text: '' },
      colors: [
        'var(--cds-alias-viz-sequential-green-600)', 'var(--cds-alias-viz-sequential-blue-600)',
        'var(--cds-alias-status-danger)',
      ],

      legend: {
        enabled: true,
        verticalAlign: 'top',
        itemStyle: { color: 'var(--cds-alias-object-interaction-color)' },
        // itemHoverStyle: { color: 'var(--cds-alias-viz-sequential-blue-600)' },
        // itemHiddenStyle: { color: 'var(--cds-alias-viz-sequential-ochre-500)' },
      },
      xAxis: {
        categories: categories,
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
      yAxis: {
        title: {
          text: '',
        },
        gridLineColor: 'var(--cds-alias-status-disabled-tint)',
        gridLineWidth: 1,
        labels: {
          style: { color: 'var(--cds-alias-object-interaction-color)' },
          formatter: function () {
            return this.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
          }
        },
        allowDecimals: false,
      },
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
              ? `${point.y.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} TND`
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
                return this.y.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' TND';
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
          name: 'Actifs sous gestion',
          type: 'column',
          data: actifs,
          color: 'var(--cds-alias-viz-sequential-blue-600)',
        },
        {
          name: 'Actifs investis',
          type: 'column',
          data: investis,
          color: 'var(--cds-alias-viz-sequential-green-600)',
        },
        {
          name: 'Reste à investir',
          type: 'column',
          data: resteAInvestir,
          color: 'var(--cds-alias-viz-sequential-ochre-400)',
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
