import { AfterViewInit, Component, effect, ElementRef, input, model, viewChild } from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-bar-chart-04',
  imports: [HighchartsChartModule, ClarityModule, CdsModule],
  templateUrl: './bar-chart-04.component.html',
  styleUrl: './bar-chart-04.component.scss'
})
export class BarChart04Component implements AfterViewInit {

  // inputs
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
    // /// resize the chart
    // fromEvent(window, 'resize').subscribe({
    //   next: () => {
    //     this.resizeTheChart();
    //   }
    // });
  }

  // /// resize the chart 
  // resizeTheChart(): void {
  //   if (this.chartDiv()) {
  //     this.chartDiv()?.nativeElement?.reflow();
  //   }
  // }

  // /// set data 
  // setData(data: any) {
  //   this.souscriptions.set(data);
  //   this.updateChart(data);
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

    // colors 
    const colors: any = {
      ACTIONS: ['#154360', '#2471A3', '#7FB3D5', '#D4E6F1'],
      OCA: ['#33DDFF', '#80E7FC', '#B3F1FE', '#D8F6FC'],
      CCA: ['#76448A', '#AF7AC5', '#D7BDE2', '#E8DAEF'],
    };

    // total invest 
    const totalInvest = new Map<string, number>();
    // date set 
    const dateSet = new Set<string>();
    const fondsMap = new Map<string, Map<string, number>>();

    // fonds map 
    data.forEach((entry: any) => {
      const date = new Date(entry.d);
      const formattedDate = date.toLocaleDateString('fr-FR');
      dateSet.add(formattedDate);

      entry.p.forEach((inv: any) => {
        const key = `${inv.fonds.denomination}-${inv.type}`;
        if (!fondsMap.has(key)) fondsMap.set(key, new Map());
        const valueMap = fondsMap.get(key)!;
        valueMap.set(formattedDate, (valueMap.get(formattedDate) || 0) + inv.montant);

        totalInvest.set(formattedDate, (totalInvest.get(formattedDate) || 0) + inv.montant);
      });
    });


    // categories 
    const categories = Array.from(dateSet).sort((a, b) => {
      const d1 = new Date(a.split('/').reverse().join('/'));
      const d2 = new Date(b.split('/').reverse().join('/'));
      return d2.getTime() - d1.getTime();
    });

    // color indexes 
    const colorIndexes = new Map<string, number>();
    const series: Highcharts.SeriesColumnOptions[] = [];

    // series 
    fondsMap.forEach((dateMap, key) => {
      const type = key.split('-').pop()?.toUpperCase() || '';
      const colorList = colors[type] || ['#999'];
      if (!colorIndexes.has(type)) colorIndexes.set(type, 0);

      const color = colorList[colorIndexes.get(type)! % colorList.length];
      colorIndexes.set(type, colorIndexes.get(type)! + 1);

      const dataValues = categories.map(cat => dateMap.get(cat) || 0);
      series.push({
        name: key,
        type: 'column',
        stack: type,
        color,
        data: dataValues,
      });
    });

    // Total invest
    const totalData = categories.map(cat => totalInvest.get(cat) || 0);
    series.unshift({
      name: 'Total Investi',
      type: 'column',
      data: totalData,
      color: 'var(--cds-alias-viz-sequential-blue-500)',
      maxPointWidth: 100,
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
          return '';
        },
        style: {
          fontSize: '15px',
          fontWeight: 'normal',
          color: 'var(--cds-alias-object-interaction-color)',
          textOutline: 'none'
        }
      }

    });

    // chart options 
    this.chartOptions.set({
      chart: {
        type: 'column',
        height: '400px',
        backgroundColor: 'transparent',
        // margin: [65, 5, 35, 5], // Tight margins [top, right, bottom, left]
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
      yAxis: {
        title: { text: '' },
        lineWidth: 1,
        tickLength: 1,
        // tickWidth: 0,
        lineColor: 'var(--cds-alias-status-disabled-tint)',
        tickColor: 'var(--cds-alias-status-disabled-tint)',
        gridLineWidth: 1,
        gridLineColor: 'var(--cds-alias-status-disabled-tint)',

        labels: {
          formatter: function () {
            return this.value.toLocaleString('fr');
          },
          style: { fontSize: '14px', color: 'var(--cds-alias-object-interaction-color)' },
        },

      },
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'top',
        y: 0,
        layout: 'horizontal',
        itemStyle: {
          color: 'var(--cds-alias-object-interaction-color)',
        },
        itemHoverStyle: {
          color: 'var(--cds-alias-viz-sequential-blue-500)'
        }
      },

      plotOptions: {
        column: {
          stacking: 'normal',
          maxPointWidth: 30,
          borderWidth: 0.5,

          dataLabels: {
            enabled: false,
            inside: false,
            verticalAlign: 'top',
            align: 'center',
            y: -25,
            crop: false,
            // overflow: 'allow',
            // formatter: function () {
            //   if (typeof this.y === 'number' && this.y !== 0) {
            //     return new Intl.NumberFormat('fr-FR').format(this.y);
            //   }
            //   return '';
            // },
            // style: {
            //   fontSize: '15px',
            //   fontWeight: 'normal'
            // }
          }
        }
      },

      tooltip: {
        shared: false,
        useHTML: true,
        formatter: function () {
          return `
            <b>${this.key}</b><br/>
            <span style="color:${this.color}">●</span> ${this.series.name}: 
            <b>${this.y?.toLocaleString('fr')}</b>
          `;
        }
      },

      series,
      credits: { enabled: false },
    });
  }

}
