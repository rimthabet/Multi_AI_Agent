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
  selector: 'app-bar-chart-12',

  imports: [HighchartsChartModule],
  templateUrl: './bar-chart-12.component.html',
  styleUrls: ['./bar-chart-12.component.scss']
})
export class BarChart12Component implements AfterViewInit {

  // Inputs
  subscriptions = input<any[]>();

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
    if (this.subscriptions()) {
      this.updateChart();
    }
  });

  updateChart(): void {
    const data = this.subscriptions();
    const groupedData = data?.reduce((acc: any, item: any) => {
      const etablissement = item.souscripteur.etablissement.libelle;

      if (!acc[etablissement]) {
        acc[etablissement] = {
          etablissement: etablissement,
          totalMontant: 0,
          nombreSouscripteurs: 0
        };
      }

      acc[etablissement].totalMontant += item.montantSouscription;
      acc[etablissement].nombreSouscripteurs += 1;

      return acc;
    }, {});

    const categories = Object.keys(groupedData);
    const volumes = categories.map(cat => groupedData[cat].totalMontant);
    const souscripteurs = categories.map(cat => groupedData[cat].nombreSouscripteurs);

    const height = 320;

    this.chartOptions.set({
      chart: {
        type: 'column',
        height: height,
        backgroundColor: 'transparent',
      },
      title: { text: '' },
      colors: [
        'var(--cds-alias-viz-sequential-blue-600)',
        'var(--cds-alias-viz-sequential-green-600)'
      ],
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
      yAxis: [
        {
          title: { text: '' },
          gridLineColor: 'var(--cds-alias-status-disabled-tint)',
          gridLineWidth: 1,
          labels: {
            formatter: function () {
              return this.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });
            },
            style: { color: 'var(--cds-alias-viz-sequential-green-500)' }
          },
          allowDecimals: false,
          opposite: false,

        },
        {
          title: { text: '' },
          gridLineColor: 'var(--cds-alias-status-disabled-tint)',
          gridLineWidth: 1,
          labels: {
            formatter: function (this: any) {
              return this.value;
            },
            style: { color: 'var(--cds-alias-viz-sequential-blue-600)' },
          },
          allowDecimals: false,
          opposite: true,
        }
      ],
      legend: {
        enabled: true,
        verticalAlign: 'top',
        itemStyle: { color: 'var(--cds-alias-object-interaction-color)' },
      },
      plotOptions: {
        column: {
          maxPointWidth: 45,
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            formatter: function () {
              if (typeof this.y === 'number') {
                if (this.series.name === 'Montant Souscription') {
                  return this.y.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' TND';
                } else {
                  return this.y.toString();
                }
              }
              return this.y;
            },
            y: -1,
            style: {
              fontSize: '12px',
              fontWeight: 'normal',
              color: 'var(--cds-alias-object-interaction-color)',
              cursor: 'pointer',
            }
          }
        }
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
              ? (point.series.name === 'Montant Souscription'
                ? `${point.y.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} TND`
                : point.y)
              : point.y;

            tooltip += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${value}</b><br/>`;
          });
          return tooltip;
        }
      },
      series: [
        {
          name: 'Montant souscrit',
          type: 'column',
          data: volumes,
          color: 'var(--cds-alias-viz-sequential-green-600)',
          yAxis: 0
        },
        {
          name: 'Nombre de Souscripteurs',
          type: 'column',
          data: souscripteurs,
          color: 'var(--cds-alias-viz-sequential-blue-600)',
          yAxis: 1
        }
      ],
      credits: { enabled: false },
    });
  }

  resizeTheChart(): void {
    const chartRef = this.chartDiv();
    if (chartRef && chartRef.chart) {
      chartRef.chart.reflow();
    }
  }
}