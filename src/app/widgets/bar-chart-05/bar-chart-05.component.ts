import { AfterViewInit, Component, ElementRef, input, model, effect, viewChild } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-bar-chart-05',

  imports: [HighchartsChartModule, ClarityModule, CdsModule],
  templateUrl: './bar-chart-05.component.html',
  styleUrl: './bar-chart-05.component.scss'
})
export class BarChart05Component implements AfterViewInit {

  // Inputs
  souscriptions = input<any[]>();

  readonly subscriptionEffect = effect(() => {
    if (this.souscriptions()) {
      this.updateChart(this.souscriptions());
    }
  });

  /// view child 
  chartDiv = viewChild.required<ElementRef>("chartDiv");

  // properties
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions = model<Highcharts.Options>({});


  /// INITIALIZE 
  ngAfterViewInit(): void {
    const data = this.souscriptions();
    if (data) {
      this.updateChart(data);
    }
    /// resize the chart
    // fromEvent(window, 'resize').subscribe({
    //   next: () => {
    //     this.resizeTheChart();
    //   }
    // });
  }

  /// resize the chart 
  // resizeTheChart(): void {
  //   const chartInstance = Highcharts.charts.find(
  //     (c): c is Highcharts.Chart => !!c && c.container === this.chartDiv()?.nativeElement
  //   );
  //   chartInstance?.reflow();
  // }

  /// chart options 
  getEmptyChartOptions(): Highcharts.Options {
    return {
      title: { text: '' },
      series: [],
    };
  }

  /// update chart options 
  private updateChart(data: any) {
    if (!Array.isArray(data)) return;

    const colors: any = {
      ACTIONS: 'var(--ACTIONS)',
      OCA: 'var(--OCA)',
      CCA: 'var(--CCA)',
      TOTAL: 'var(--TOTAL)',
    };

    const fondsMap = new Map();

    /// fonds map 
    data.forEach((entry: any) => {
      entry.p.forEach((investment: any) => {
        const fondsName = investment.fonds.denomination;
        if (!fondsMap.has(fondsName)) fondsMap.set(fondsName, {});
        const fondsEntry = fondsMap.get(fondsName);
        if (!fondsEntry[investment.type]) fondsEntry[investment.type] = 0;
        fondsEntry[investment.type] += investment.montant;
      });
    });

    /// x axis data 
    const xAxisData = Array.from(fondsMap.keys());
    const allTypes = new Set<string>();
    fondsMap.forEach((types) =>
      Object.keys(types).forEach((type) => allTypes.add(type))
    );

    const orderedTypes = ['Actions', 'OCA', 'CCA'];

    /// total 
    xAxisData.forEach((fondsName) => {
      let total = 0;
      orderedTypes.forEach((type) => {
        total += fondsMap.get(fondsName)[type] || 0;
      });
      fondsMap.get(fondsName)['TOTAL'] = total;
    });

    /// series data 
    const seriesData: Highcharts.SeriesColumnOptions[] = [];

    /// series 
    orderedTypes.forEach((type) => {
      if (allTypes.has(type)) {
        seriesData.push({
          name: type,
          type: 'column',
          data: xAxisData.map((f) => fondsMap.get(f)[type] || 0),
          color: colors[type.toUpperCase()],
          stack: 'invest',
          dataLabels: {
            enabled: true,
            formatter: function () {
              return this.y ? this.y.toLocaleString('fr-FR') : '';
            },
            style: { fontSize: '10px' },
          },
        });
      }
    });

    /// total 
    seriesData.push({
      name: 'TOTAL',
      type: 'column',
      data: xAxisData.map((f) => fondsMap.get(f)['TOTAL'] || 0),
      color: colors['TOTAL'],
      stack: 'total',
      dataLabels: {
        enabled: true,
        inside: true,
        formatter: function () {
          return this.y ? this.y.toLocaleString('fr-FR') : '';
        },
        style: { fontWeight: 'bold', fontSize: '11px' },
      },
    });

    /// chart options 
    this.chartOptions.set({
      chart: {
        type: 'column',
        inverted: true,
        height: '400px',
        backgroundColor: 'transparent',
        margin: [65, 75, 45, 140], // Tight margins [top, right, bottom, left]
      },
      title: { text: '' },

      xAxis: {
        categories: xAxisData,
        crosshair: true,
        gridLineWidth: 0.5,
        lineColor: 'var(--cds-alias-status-disabled)',
        tickColor: 'var(--cds-alias-status-disabled)',
        gridLineColor: 'var(--cds-alias-status-disabled-tint)',
        labels: {
          style: {
            fontSize: '13px',
            color: 'var(--cds-alias-object-interaction-color)',
          },
        },
      },

      yAxis: {
        visible: true,
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
          formatter: function () {
            return this.total ? this.total.toLocaleString('fr-FR') : '';
          },
          style: { fontWeight: 'normal', color: 'var(--cds-alias-object-interaction-color)' },
        },
      },

      /// legend 
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

      /// tooltip 
      tooltip: {
        style: {
          fontSize: '14px',
        },
        formatter: function () {
          return `<b>${this.key}</b><br/>${this.series.name}: <b>${this.y?.toLocaleString(
            'fr-FR'
          )}</b>`;
        },
      },

      /// plot options 
      plotOptions: {
        column: {
          stacking: 'normal',
          borderWidth: 0.5,
        },
      },
      series: seriesData,
      credits: { enabled: false },

    });
  }
}