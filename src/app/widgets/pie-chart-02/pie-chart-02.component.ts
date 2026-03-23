import { AfterViewInit, Component, DestroyRef, effect, inject, input, viewChild } from '@angular/core';
import { HighchartsChartModule } from 'highcharts-angular';
import Highcharts from 'highcharts';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'pie-chart-02',
 
  imports: [HighchartsChartModule],
  templateUrl: './pie-chart-02.component.html',
  styleUrl: './pie-chart-02.component.scss'
})
export class PieChart02Component implements AfterViewInit {

  //Inputs
  liquiditeActifsFunds = input<any[]>();

  /// view child
  chartDiv = viewChild.required<any>("chartDiv");

  /// destroy ref
  private readonly destroyRef = inject(DestroyRef);

  //Variables 
  chartOptions: Highcharts.Options = this.getEmptyChartOptions();

  //Highcharts
  Highcharts: typeof Highcharts = Highcharts;

  totalInvA: number = 0;
  totalInvO: number = 0;
  totalInvC: number = 0;

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
    this.totalInvA = 0;
    this.totalInvO = 0;
    this.totalInvC = 0;

    // Calculer les totaux à partir des données avec les bonnes propriétés
    this.liquiditeActifsFunds()?.forEach(item => {
      this.totalInvA += item.invA;
      this.totalInvO += item.invO;
      this.totalInvC += item.invC;
    });

    const data = [
      { y: this.totalInvA, name: 'Inv. en Actions' },
      { y: this.totalInvO, name: 'Inv. en OCA' },
      { y: this.totalInvC, name: 'Inv. en CCA' }
    ];

    const colors = [
      'var(--clr-badge-blue-bg-color)',
      'var(--cds-alias-utility-light-blue-shade)',
      'var(--clr-badge-purple-bg-color)'
    ];

    this.chartOptions = {
      chart: {
        type: 'pie',
        height: 200,
        backgroundColor: 'transparent',
        style: {
          fontFamily: 'Arial, sans-serif'
        }
      },

      colors: colors.map(c => this.getCodeFromColor(c)),

      title: {
        text: "",
        align: 'center',
        verticalAlign: 'middle',
        useHTML: true,
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'var(--cds-alias-object-interaction-color)',
        }
      },

      credits: {
        enabled: false
      },

      tooltip: {
        pointFormatter: function () {
          return `${this.name}: ${this.y?.toLocaleString('fr-FR')} TND (${this.percentage?.toFixed(1)}%)`;
        },
      },

      legend: {
        enabled: true,
        align: 'right',
        verticalAlign: 'middle',
        layout: 'vertical',
        x: 0,
        y: 0,
        itemMarginTop: 8,
        itemMarginBottom: 8,
        symbolWidth: 15,
        symbolHeight: 15,
        itemStyle: {
          fontSize: '14px',
          fontWeight: 'bold',
          color: 'var(--cds-alias-object-interaction-color)'
        },
        labelFormatter: function (this: any) {
          return `${this.name}: ${this.y?.toLocaleString('fr-FR')} TND`;
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
        name: 'Investissements',
        data: data,
        colors: colors.map(c => this.getCodeFromColor(c))
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