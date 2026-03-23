import { AfterViewInit, Component, effect, ElementRef, input, model, viewChild } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-bar-chart-15',
 
  imports: [HighchartsChartModule, ClarityModule, CdsModule],
  templateUrl: './bar-chart-15.component.html',
  styleUrl: './bar-chart-15.component.scss'
})
export class BarChart15Component implements AfterViewInit {
  // Inputs
  projectsByYearAndStatus = input<any[]>();

  /// view child 
  chartDiv = viewChild.required<ElementRef>("chartDiv");

  // properties
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions = model<Highcharts.Options>({});

  /// INITIALIZE 
  ngAfterViewInit(): void {
    const data = this.projectsByYearAndStatus();
    if (data) {
      this.updateChart(data);
    }
    /// resize the chart
    fromEvent(window, 'resize').subscribe({
      next: () => {
        this.resizeTheChart();
      }
    });
  }

  // effect
  readonly projectsByYearAndStatusEffect = effect(() => {
    const data = this.projectsByYearAndStatus();
    if (data) {
      this.updateChart(data);
    }
  });

  /// resize the chart 
  resizeTheChart(): void {
    const chartInstance = Highcharts.charts.find(
      (c): c is Highcharts.Chart => !!c && c.container === this.chartDiv()?.nativeElement
    );
    chartInstance?.reflow();
  }

  /// chart options 
  getEmptyChartOptions(): Highcharts.Options {
    return {
      title: { text: '' },
      series: [],
    };
  }

  /// update chart options 
  updateChart(data: any) {
    if (!Array.isArray(data)) return;
  
    const annees = [...new Set(data.map(d => d.annee))];
  
    const etatColorMap = new Map<string, string>();
    data.forEach(d => {
      d.etats.forEach((e: any) => {
        if (!etatColorMap.has(e.etat)) {
          etatColorMap.set(e.etat, e.couleur);
        }
      });
    });
  
    const series = Array.from(etatColorMap.entries()).map(([etat, couleur]) => ({
      name: etat,
      color: couleur,
      type: 'column' as const,
      data: annees.map(annee => {
        const etatData = data.find(d => d.annee === annee)?.etats.find((e: any) => e.etat === etat);
        return etatData ? etatData.count : 0;
      }),
    }));
  
    this.chartOptions.set({
      chart: {
        type: 'column',
        height: 300,
        backgroundColor: 'transparent',
      },
      title: { text: '' },
      legend: {
        align: 'center',
        verticalAlign: 'top',
        layout: 'horizontal',
        itemStyle: {
          color: 'var(--cds-alias-object-interaction-color)',
        },
        itemHoverStyle: {
          color: 'var(--cds-alias-viz-sequential-blue-500)',
        },
      },
      xAxis: {
        categories: annees.map(a => a.toString()),
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
        headerFormat: '<b>Année: {category}</b><br/>',
        pointFormat: 'projet(s): {point.y}<br/>Total: {point.stackTotal}',
        shared: false
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          pointWidth: 40,
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            formatter: function (this: any) {
              return this.y > 0 ? `${this.y}` : '';
            },
            style: {
              fontSize: '11px',
              fontWeight: 'bold',
              color: 'var(--cds-alias-object-interaction-color)',
              cursor: 'pointer',
            },
          }
        }
      },
      series: series,
      credits: { enabled: false }
    });
  }
}