import { Component, AfterViewInit, OnChanges, input, viewChild, DestroyRef, inject, SimpleChanges } from '@angular/core';

import Highcharts from 'highcharts';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinStatementService } from '../../services/fin-statement.service';
import { HighchartsChartModule } from 'highcharts-angular';

@Component({
  selector: 'app-bar-chart-08',
  imports: [HighchartsChartModule],
  templateUrl: './bar-chart-08.component.html',
  styleUrl: './bar-chart-08.component.scss'
})
export class BarChart08Component implements AfterViewInit, OnChanges {
  /// inputs  
  prospection = input<any>();
  item = input<any>();
  finItem = input<any>();
  year = input<number>(new Date().getFullYear());

  /// view child 
  chartDiv = viewChild.required<any>("chartDiv");

  ///DEPENDENCIES
  private readonly destroyRef = inject(DestroyRef);
  private readonly finStatementService = inject(FinStatementService);

  // Highcharts configuration
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = this.getEmptyChartOptions();

  years: any[] = [];
  lastFetchedData: any[] = [];
  loading: boolean = false;

  // Lifecycle hooks
  ngAfterViewInit(): void {
    const data = this.item();
    if (data && data.length > 0) {
      this.setData(data);
    }

    /// resize the chart
    fromEvent(window, 'resize')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.resizeTheChart();
        }
      });
  }

  /// changes
  ngOnChanges(changes: SimpleChanges) {
    if (changes['item']) {
      this.fetchDataHistory();
    }
  }

  /// resize the chart 
  resizeTheChart(): void {
    const chartRef = this.chartDiv();
    if (chartRef && chartRef.chart) {
      chartRef.chart.reflow();
    }
  }

  /// set data
  setData(data: any) {
    this.fetchDataHistory();
    this.lastFetchedData = [];
  }

  /// fetch data history
  fetchDataHistory() {
    const prospectionData = this.prospection();
    const finItemData = this.finItem();
    const itemData = this.item();

    if (!prospectionData || !finItemData || !itemData) {
      return;
    }
    this.loading = true;
    this.years = [
      this.year() - 4,
      this.year() - 3,
      this.year() - 2,
      this.year() - 1,
      this.year(),
    ];

    this.finStatementService
      .fetchDatumHistory(
        prospectionData.id,
        -1,
        itemData,
        this.years?.length,
        this.year(),
        -1,
        false
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.lastFetchedData = data;
          this.updateChart();

        },
        error: (error: any) => {
          console.error("Error fetching data history:", error);
        },
        complete: () => {
          this.loading = false;
        }
      });
  }

  /// update the chart
  updateChart(): void {
    const prospectionData = this.prospection();
    const finItemData = this.finItem();
    const itemData = this.item();

    if (!prospectionData || !finItemData || !itemData || !this.year()) {
      return;
    }

    const chartRef = this.chartDiv();
    if (chartRef && chartRef.chart) {
      chartRef.chart.showLoading("Chargement des données...");
    }

    let _min = 0;
    let _max = 0;

    const seriesData = this.years.map((year, index) => {
      let fetchedData = this.lastFetchedData[index];

      if (fetchedData == null) {
        fetchedData = {
          year: year,
          value: 0,
          ref1: prospectionData.id,
          ref2: null,
          ref3: null,
          ref4: null,
          ref5: null,
          entity: itemData,
        };
      }

      if (_min == 0 || fetchedData?.value <= _min) {
        _min = fetchedData?.value;
      }
      if (fetchedData?.value >= _max) {
        _max = fetchedData?.value;
      }

      return {
        year: year,
        y: fetchedData ? fetchedData?.value : null,
        libelle: itemData?.libelle,
      };
    });

    this.chartOptions = {
      chart: {
        type: 'column',
        height: 380,
        backgroundColor: 'transparent',
        marginTop: 50,
      },
      title: {
        text: undefined
      },
      loading: {
        labelStyle: {
          color: 'var(--cds-global-typography-color-400)',
          fontSize: '20px',
          fontWeight: 'normal',
        },
        style: {
          backgroundColor: 'transparent',
          opacity: 0.8,
        },
      },
      tooltip: {
        formatter: function (this: any) {
          const point = this.point;
          return `${this.series.name} (${point.year}): ${point.y?.toLocaleString('fr', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })}`;
        }
      },
      legend: {
        enabled: true,
        itemStyle: { color: 'var(--cds-alias-object-interaction-color)' },
        itemHoverStyle: { color: 'var(--cds-alias-viz-sequential-blue-500)' },
        itemHiddenStyle: { color: 'var(--cds-alias-viz-sequential-blue-500)' },
      },
      xAxis: {
        tickWidth: 0,
        lineColor: 'var(--cds-alias-status-disabled-tint)',
        tickColor: 'var(--cds-alias-status-disabled-tint)',
        gridLineWidth: 0.5,
        gridLineColor: 'var(--cds-alias-status-disabled-tint)',
        labels: {
          style: { fontSize: '14px', color: 'var(--cds-alias-object-interaction-color)' },
        },
        categories: this.years,
        type: 'category',
        title: {
          text: undefined
        }
      },
      yAxis: {
        min: _min * 0.95,
        max: _max * 1.05,
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
          formatter: function () {
            return this.value?.toLocaleString('fr', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            });
          }
        }
      },
      plotOptions: {
        column: {
          dataLabels: {
            enabled: false
          }
        }
      },
      series: [{
        name: itemData?.libelle,
        type: 'column',
        data: seriesData,
        color: 'var(--cds-alias-viz-sequential-blue-600)',
      }] as Highcharts.SeriesOptionsType[],
      credits: {
        enabled: false
      }
    };

    setTimeout(() => {
      if (chartRef && chartRef.chart) {
        chartRef.chart.hideLoading();
      }
    }, 0);
  }

  /// get empty chart options
  getEmptyChartOptions(): Highcharts.Options {
    return {
      chart: {
        type: 'column',
        backgroundColor: 'transparent'
      },
      title: {
        text: undefined
      },
      xAxis: {
        categories: []
      },
      yAxis: {
        title: {
          text: undefined
        }
      },
      series: [],
      credits: {
        enabled: false
      }
    };
  }
}