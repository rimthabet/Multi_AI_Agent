import { Component } from '@angular/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';


@Component({
  selector: 'bar-chart-01',
  imports: [HighchartsChartModule],
  templateUrl: './bar-chart-01.component.html',
  styleUrl: './bar-chart-01.component.scss'
})
export class BarChart01Component {

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    chart: {
      type: 'column',
      backgroundColor: 'var(--clr-card-bg-color)',
      marginRight: 5
    },
    title: {
      text: ''
    },
    xAxis: {
      categories: ["FCPR MAX ESPOIR",
        "FCPR MAXULA CROISSANCE ENTREPRISES",
        "FCPR MAXULA CAPITAL RETOURNEMENT",
        "FCPR MAXULA JASMIN",
        "FCPR CAPITAL RETOURNEMENT",
        "FCPR MAXULA JASMIN PMN",
        "START UP MAXULA SEED FUND"],
      title: { text: null },
      labels: {
        style: {
          color: 'var(--cds-alias-object-interaction-color)',
          fontSize: '10px'
        },
        rotation: -90,
        align: 'right',
        y: 5,
        formatter: function () {
          const maxLength = 5;
          const value = this.value as string;
          return value.length > maxLength ? value.slice(0, maxLength) + '…' : value;
        },
      },
      gridLineWidth: 0
    },
    yAxis: {
      visible: true,
      min: 0,
      title: {
        text: 'Investissement',
        align: 'middle',
        style: {
          color: 'var(--cds-alias-object-interaction-color)'
        }
      },
      labels: {
        overflow: 'justify',
        style: {
          fontSize: '12px',
          color: 'var(--cds-alias-object-interaction-color)'
        }
      },
      gridLineWidth: 0
    },
    tooltip: {
      valueSuffix: ' units'
    },
    plotOptions: {
      column: {
        dataLabels: {
          enabled: false
        }
      }
    },
    legend: {
      enabled: false
    },
    credits: {
      enabled: false
    },
    series: [{
      type: 'column',
      name: 'Investissement',
      data: [20000000, 3000000, 6000000, 12000000, 24000000, 36000000, 48000000]
    }]
  };
}
