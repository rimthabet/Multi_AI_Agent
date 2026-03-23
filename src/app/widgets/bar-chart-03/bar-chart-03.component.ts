import { Component, input, model, effect, OnInit } from '@angular/core';
import Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';


/// INTERFACES ///
interface Secteur {
  categories: string[];
  montantData: number[];
  projetsData: number[];
  partData: number[];
}

@Component({
  selector: 'app-bar-chart-03',

  imports: [HighchartsChartModule],
  templateUrl: './bar-chart-03.component.html',
  styleUrls: ['./bar-chart-03.component.scss']
})
export class BarChart03Component implements OnInit {

  //// INPUTS ////
  secteurs = input<Secteur | undefined>();
  height = input<number>(450);

  //// DEPENDENCIES ////
  Highcharts: typeof Highcharts = Highcharts;

  //// STATE ////
  chartOptions = model<Highcharts.Options>({});


  //// INITIALIZE ////
  ngOnInit() {
    this.updateChartOptions();
  }


  //// EFFECTS ////
  readonly secteursEffect = effect(() => {
    if (this.secteurs()) {
      this.updateChartOptions();
    }
  });


  //// UPDATE CHART OPTIONS ////
  private updateChartOptions() {
    const data = this.secteurs();
    if (!data) {
      this.chartOptions.set({});
      return;
    }
    const categories = data.categories;
    const actifs = data.montantData;
    const nbProjets = data.projetsData;
    const parts = data.partData;

    this.chartOptions.set({
      chart: {
        type: 'column',
        height: this.height(),
        backgroundColor: 'transparent',
      },

      responsive: {
        rules: [{
          condition: {
            minWidth: 600
          },
          chartOptions: {
            plotOptions: {
              column: {
                maxPointWidth: 80,
              }
            }
          }
        }]
      },

      title: { text: '' },
      colors: ['var(--cds-alias-viz-sequential-blue-200)', 'var(--cds-alias-viz-sequential-green-200)'],

      xAxis: {
        categories,
        tickWidth: 0,
        gridLineWidth: 0.5,
        lineColor: 'var(--cds-alias-status-disabled)',
        tickColor: 'var(--cds-alias-status-disabled)',
        gridLineColor: 'var(--cds-alias-status-disabled-tint)',
        crosshair: true,
        labels: {
          style: { fontSize: '14px', color: 'var(--cds-alias-object-interaction-color)' },
        },

      },
      yAxis: [
        {
          title: { text: '' },
          gridLineWidth: 0.5,
          lineColor: 'var(--cds-alias-status-disabled)',
          tickColor: 'var(--cds-alias-status-disabled)',
          gridLineColor: 'var(--cds-alias-status-disabled-tint)',

          labels: {
            style: { color: 'var(--cds-alias-viz-sequential-blue-500)' },
            formatter: function () {
              return this.value.toLocaleString('fr');
            }
          },
          opposite: false,
        },

        {
          title: { text: '  ' },
          gridLineWidth: 0.5,
          lineColor: 'var(--cds-alias-status-disabled)',
          tickColor: 'var(--cds-alias-status-disabled)',
          gridLineColor: 'var(--cds-alias-status-disabled-tint)',

          labels: {
            formatter: function () {
              return `${this.value}P`;
            },
            style: { color: 'var(--cds-alias-viz-sequential-green-500)' }
          },
          min: 0,
          allowDecimals: false,
          opposite: true,
        },
        {
          title: { text: '' },
          gridLineWidth: 0.5,
          lineColor: 'var(--cds-alias-status-disabled)',
          tickColor: 'var(--cds-alias-status-disabled)',
          gridLineColor: 'var(--cds-alias-status-disabled-tint)',

          labels: {
            format: '{value}%',
            style: { color: 'var(--cds-alias-status-disabled-shade)' }
          },
          max: 100,
          min: 0,
          opposite: true,
        },
      ],
      legend: {
        enabled: true,
        verticalAlign: 'top',
        y: 0,
        itemStyle: { color: 'var(--cds-alias-object-interaction-color)' },
        itemHoverStyle: { color: 'var(--cds-alias-viz-sequential-blue-500)' },
        itemHiddenStyle: { color: 'var(--cds-alias-viz-sequential-blue-500)' },
      },
      plotOptions: {

        column: {
          maxPointWidth: 50,
          borderWidth: 0,
          dataLabels: {
            enabled: true,
            formatter: function () {
              if (typeof this.y === 'number') {
                return this.y.toLocaleString('fr');
              }
              return this.y;
            },
            style: {
              fontSize: '10px',
              fontWeight: 'normal', color: 'var(--cds-alias-object-interaction-color)', // Text color
              cursor: 'pointer',
            }
          }
        }
      },
      tooltip: { shared: true },
      series: [
        {
          name: 'Montant',
          type: 'column',
          data: actifs,
          color: 'var(--cds-alias-viz-sequential-blue-600)',
          yAxis: 0
        },

        {
          name: 'Projets',
          type: 'column',
          data: nbProjets,
          color: 'var(--cds-alias-viz-sequential-green-600)',
          yAxis: 1
        },
        {
          name: 'P. Engagée %',
          type: 'column',
          data: parts,
          color: 'var(--cds-alias-status-disabled-shade)',
          yAxis: 2
        },

      ],
      credits: { enabled: false },
    });
  }


}
