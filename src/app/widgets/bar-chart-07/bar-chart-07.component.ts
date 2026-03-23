import { Component, input, viewChild, AfterViewInit, SimpleChanges, OnChanges } from '@angular/core';
import { HighchartsChartModule } from 'highcharts-angular';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import Highcharts from 'highcharts';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-bar-chart-07',
 
  imports: [HighchartsChartModule, ClarityModule, CdsModule],
  templateUrl: './bar-chart-07.component.html',
  styleUrl: './bar-chart-07.component.scss'
})
export class BarChart07Component implements AfterViewInit, OnChanges {
  /// inputs  
  actionnaires = input<any[]>();
  valeurAction = input<number>();

  /// view child 
  chartDiv = viewChild.required<any>("chartDiv");

  // Highcharts configuration
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = this.getEmptyChartOptions();

  // Lifecycle hooks
  ngAfterViewInit(): void {
    const data = this.actionnaires();
    if (data && data.length > 0) {
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
    const chartRef = this.chartDiv();
    if (chartRef && chartRef.chart) {
      chartRef.chart.reflow();
    }
  }

  // SET DATA
  setData(actionnaire: any) {
    this.updateChart(actionnaire);
  }

  // CHANGES
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['actionnaires'] && changes['valeurAction']) {
      const data = this.actionnaires();
      if (data) {
        this.setData(data);
      }
    }
  }

  // GET EMPTY CHART OPTIONS
  getEmptyChartOptions(): Highcharts.Options {
    return {
      chart: {
        type: 'column',
        inverted: true,
        height: 520,
        backgroundColor: 'transparent',
        margin: [0, 55, 0, 110],
      },
      title: {
        text: '',
      },
      series: [],
      credits: { enabled: false },
    };
  }

  // UPDATE CHART
  private updateChart(data: any[]): void {
    if (!data || data.length === 0) {
      this.chartOptions = {
        ...this.getEmptyChartOptions(),
      };
      return;
    }

    const customColors = [
      '#99B7D8', '#99D5E3', '#9BC8E9', '#9BD4ED', '#7FB6F3',
      '#99B9B9', '#A0A0A0', '#BBBBBB', '#889AA8', '#85909C',
      '#6887A0', '#708D9E', '#7C9EBF', '#5F7685', '#819CA6',
      '#6B889A', '#728CA8', '#76899E', '#8299B1', '#6A7D8C',
    ];

    /// create the categories
    const categories = data.map(a => a.libelle);

    /// create the series
    const series: Highcharts.SeriesColumnOptions[] = data.map((actionnaire, idx) => {
      const value = actionnaire.nbrActionsApAugmentation * (this.valeurAction() ?? 0);

      return {
        name: actionnaire.libelle,
        type: 'column',
        data: categories.map(cat => (cat === actionnaire.libelle ? value : 0)),
        stack: 'total',
        color: customColors[idx % customColors.length],
        dataLabels: {
          enabled: true,
          align: 'left',
          inside: false,
          formatter: function () {
            return this.y && this.y > 0 ? this.y.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '';
          },
          style: {
            fontSize: '12px',
            color: 'var(--cds-alias-object-interaction-color)',
            fontWeight: 'normal',
          },
        },
      };
    });

    this.chartOptions = {
      chart: {
        type: 'column',
        inverted: true,
        height: 520,
        backgroundColor: 'transparent',
        margin: [0, 75, 0, 140], // Tight margins [top, right, bottom, left]
      },
      title: { text: '' },
      xAxis: {
        visible: true,
        categories,
        lineColor: 'var(--cds-alias-status-disabled-tint)',
        tickColor: 'var(--cds-alias-status-disabled-tint)',
        gridLineWidth: 1,
        gridLineColor: 'var(--cds-alias-status-disabled-tint)',
        labels: {
          style: {
            fontSize: '13px',
            color: 'var(--cds-alias-object-interaction-color)',
          },
        },
      },
      yAxis: {
        visible: false,
        title: { text: '' },
        lineColor: 'var(--cds-alias-status-disabled-tint)',
        tickColor: 'var(--cds-alias-status-disabled-tint)',
        gridLineWidth: 1,
        gridLineColor: 'var(--cds-alias-status-disabled-tint)',
        labels: {
          style: {
            fontSize: '13px',
            color: 'var(--cds-alias-object-interaction-color)',
          },
        },
        stackLabels: {
          enabled: false,
        },
      },
      legend: {
        enabled: false,

      },
      tooltip: {
        style: { fontSize: '14px' },
        formatter: function () {
          return `<b>${this.key}</b><br/>${this.series.name}: <b>${this.y?.toLocaleString('fr-FR')}</b>`;
        },
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          borderWidth: 0,
          groupPadding: 0.1,
          pointPadding: 0.05,
        },
        series: {
          states: {
            hover: { enabled: true },
          },
        },
      },
      series,
      credits: { enabled: false },
    };
  }
}