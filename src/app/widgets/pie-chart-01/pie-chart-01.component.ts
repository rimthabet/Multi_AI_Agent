import { Component } from '@angular/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';


@Component({
  selector: 'pie-chart-01',
  imports: [HighchartsChartModule],
  templateUrl: './pie-chart-01.component.html',
  styleUrl: './pie-chart-01.component.scss'
})
export class PieChart01Component {

  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'var(--clr-card-bg-color)',
      spacing: [0, 0, 0, 0], // top, right, bottom, left
      margin: [0, 0, 0, 0],

      // Add total label
      events: {
        load() {
          const chart = this as Highcharts.Chart;
          const total = chart.series[0].data.reduce((sum, point) => sum + point.y!, 0);

          if (chart.renderer) {
            chart.renderer
              .text(`${total}`, chart.plotWidth * .24 + chart.plotLeft, chart.plotHeight * .6 + chart.plotTop)
              .attr({
                align: 'center',
              })
              .css({
                fontSize: '50px',
                fontWeight: 'bold',
                color: 'var(--cds-alias-object-interaction-color)'
              })
              .add();
          }
        }
      }
    },
    title: {
      text: ''
    },
    series: [{
      type: 'pie',
      size: '85%',
      innerSize: '68%',
      data: [
        { name: 'En approbation', y: 0 },
        { name: 'En cours de levée', y: 1 },
        { name: 'En investissement', y: 4 },
        { name: 'En liquidation', y: 0 },
        { name: 'En pré-liquidation', y: 2 }
      ]
    }],
    credits: { enabled: false }, // 👈 Hides highcharts.com
    legend: {
      align: 'right',
      verticalAlign: 'middle',
      layout: 'vertical',
      itemStyle: {
        color: 'var(--cds-alias-object-interaction-color)',
        fontWeight: 'normal',
        fontSize: '14px'
      },
      labelFormatter() {
        const point = this as Highcharts.Point;
        return `
      <div style="display: flex; justify-content: space-between; width: 120px;">
        <span style="font-weight: bold;">${point.y}</span> - 
        <span> ${point.name}</span>
      </div>
    `;
      },

    },
    plotOptions: {
      pie: {
        borderWidth: 0,  // Removes the slice border/stroke
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: false,
        },
        showInLegend: true,
        center: ['20%', '50%'], // Move pie to left
        borderRadius: 0
      },
    },
  };
}