import { AfterViewInit, Component, DestroyRef, effect, inject, input, viewChild } from '@angular/core';
import { HighchartsChartModule } from 'highcharts-angular';
import Highcharts from 'highcharts';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-pie-chart-03',
 
  imports: [HighchartsChartModule],
  templateUrl: './pie-chart-03.component.html',
  styleUrl: './pie-chart-03.component.scss'
})
export class PieChart03Component implements AfterViewInit {

  //Inputs
  fundsAssets = input<any[]>();

  /// view child
  chartDiv = viewChild.required<any>("chartDiv");

  /// destroy ref
  private readonly destroyRef = inject(DestroyRef);

  //Variables 
  chartOptions: Highcharts.Options = this.getEmptyChartOptions();

  //Highcharts
  Highcharts: typeof Highcharts = Highcharts;

  /// after view init
  ngAfterViewInit(): void {
    fromEvent(window, 'resize')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.resizeTheChart();
      });
  }

  /// resize the chart
  resizeTheChart(): void {
    const chartRef = this.chartDiv();
    if (chartRef && chartRef.chart) {
      chartRef.chart.width = this.chartDiv()?.nativeElement?.offsetWidth;
      chartRef.chart.height = this.chartDiv()?.nativeElement?.offsetHeight;
      chartRef.chart.reflow();
    }
  }

  //Effects
  readonly invLiberationStatsEffect = effect(() => {
    this.initChart();
  });

  initChart() {

    this.chartOptions = {
      chart: {
        type: 'pie',
        height: 200,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'Arial, sans-serif'
        }
      },

      title: {
        text: "",
        align: 'center',
        verticalAlign: 'middle',
        useHTML: true,
        style: {
          fontSize: '10px',
          fontWeight: 'bold',
          color: 'var(--cds-alias-object-interaction-color)',
        }
      },

      credits: {
        enabled: false
      },

      tooltip: {
        style: {
          zIndex: 1000,
          backgroundColor: 'var(--cds-alias-object-app-background)',
        },
        pointFormatter: function () {
          return `${this.y?.toLocaleString('fr-FR')} TND (${this.percentage?.toFixed(1)}%)`;
        },
      },

      legend: {
        enabled: true,
        align: 'right',
        verticalAlign: 'middle',
        layout: 'vertical',
        x: 0,
        y: 0,
        itemMarginTop: 3,
        itemMarginBottom: 4,
        symbolWidth: 10,
        symbolHeight: 10,
        itemStyle: {
          fontSize: '12px',
          fontWeight: 'bold',
          color: 'var(--cds-alias-object-interaction-color)'
        },
        labelFormatter: function (this: any) {
          return `${this.name}`;
        },
        useHTML: true
      },

      plotOptions: {
        pie: {
          cursor: 'pointer',
          size: '110%',
          center: ['50%', '50%'],
          innerSize: '0%',
          dataLabels: {
            enabled: false
          },
          showInLegend: true,
          allowPointSelect: true,
          borderWidth: 0,
          borderRadius: 0
        }
      },

      series: [{
        type: 'pie',
        name: 'Actifs',
        data: this.fundsAssets(),
      }],
    };
  }

  getCodeFromColor(cssVar: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() || cssVar;
  }

  getEmptyChartOptions(): Highcharts.Options {
    return {
      chart: {
        type: 'pie',
        height: 260,
        backgroundColor: 'transparent',
        margin: [0, 0, 0, 0],
      },
      title: {
        text: '',
      },
      series: [],
      credits: { enabled: false },
    };
  }
}