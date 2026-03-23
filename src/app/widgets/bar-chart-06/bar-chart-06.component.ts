import { formatDate } from '@angular/common';
import { AfterViewInit, Component, effect, ElementRef, input, viewChild } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-bar-chart-06',

  imports: [HighchartsChartModule, ClarityModule, CdsModule],
  templateUrl: './bar-chart-06.component.html',
  styleUrl: './bar-chart-06.component.scss'
})
export class BarChart06Component implements AfterViewInit {

  /// inputs 
  financements = input<any[]>();

  /// view child 
  chartDiv = viewChild.required<ElementRef>("chartDiv");

  /// highcharts 
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = this.getEmptyChartOptions();


  /// effect 
  readonly financementEffect = effect(() => {
    const data = this.financements();
    if (data && data.length > 0) {
      this.updateChart(data);
    }
  });

  /// INITIALIZE 
  ngAfterViewInit(): void {
    const data = this.financements();
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

  /// resize the chart 
  resizeTheChart(): void {
    if (this.chartDiv()) {
      this.chartDiv()?.nativeElement?.reflow();
    }
  }

  /// chart options 
  getEmptyChartOptions(): Highcharts.Options {
    return {
      title: { text: '' },
      series: [],
    };
  }

  /// update chart options 
  private updateChart(data: any) {
    /// montant sollicité  and categories 
    const montantSollicite = data.map((f: any) => parseFloat(f.montant) || 0);
    const categories = data.map((f: any) =>
      formatDate(new Date(f.dateDemandeFinancement), 'dd-MM-yyyy', 'fr-FR')
    );

    ///chart options 
    this.chartOptions = {
      chart: {
        type: 'column',
        height: 300,
        backgroundColor: 'transparent',
        spacingTop: 0,
        margin: [55, 5, 35, 5], // Tight margins [top, right, bottom, left]
      },

      title: { text: '' },
      xAxis: {
        categories,
        crosshair: true,
        gridLineWidth: 0.5,
        lineColor: 'var(--cds-alias-status-disabled)',
        tickColor: 'var(--cds-alias-status-disabled)',
        gridLineColor: 'var(--cds-alias-status-disabled-tint)',
        labels: {
          style: { fontSize: '14px', color: 'var(--cds-alias-object-interaction-color)' },
        },
      },

      yAxis: [{
        title: { text: '' },
        lineWidth: 1,
        tickLength: 1,
        tickWidth: 0,
        lineColor: 'var(--cds-alias-status-disabled-tint)',
        tickColor: 'var(--cds-alias-status-disabled-tint)',
        gridLineWidth: 0.5,
        gridLineColor: 'var(--cds-alias-status-disabled-tint)',
        labels: {
          style: { color: 'var(--cds-alias-object-interaction-color)', fontSize: '14px', },
          formatter: function () {
            return this.value.toLocaleString('fr');
          }
        },
        opposite: false,
      }],

      legend: {
        enabled: true,
        verticalAlign: 'top',
        y: 0, // Position from top
        itemStyle: { color: 'var(--cds-alias-object-interaction-color)' },
        itemHoverStyle: { color: 'var(--cds-alias-viz-sequential-blue-500)' },
        itemHiddenStyle: { color: 'var(--cds-alias-viz-sequential-blue-500)' },
      },

      plotOptions: {
        column: {
          maxPointWidth: 80,
          dataLabels: {
            enabled: true,
            inside: false,
            verticalAlign: 'top',
            align: 'center',
            y: -25,
            crop: false,
            overflow: 'allow',
            formatter: function () {
              if (typeof this.y === 'number') {
                return this.y.toLocaleString('fr');
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

      tooltip: { shared: true },
      series: [{
        name: 'Montant sollicité',
        type: 'column',
        data: montantSollicite,
        color: 'var(--cds-alias-viz-sequential-blue-600)',
      }],
      credits: { enabled: false },
    };
  }
}
