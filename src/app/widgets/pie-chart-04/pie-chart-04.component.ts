import { Component, input, viewChild, effect } from '@angular/core';
import { HighchartsChartModule } from 'highcharts-angular';
import Highcharts from 'highcharts';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'app-pie-chart-04',
  imports: [HighchartsChartModule],
  templateUrl: './pie-chart-04.component.html',
  styleUrl: './pie-chart-04.component.scss',
})
export class PieChart04Component {
  /// inputs
  data = input<any>();
  title = input<string>(''); // Nouveau input pour le titre

  /// view child
  chartDiv = viewChild.required<any>('chartDiv');

  // Highcharts configuration
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = this.getEmptyChartOptions();

  // EFFECTS
  readonly dataEffect = effect(() => {
    const inputData = this.data();
    if (inputData && Array.isArray(inputData) && inputData.length > 0) {
      this.updateChart();
      /// resize the chart
      fromEvent(window, 'resize').subscribe({
        next: () => {
          this.resizeTheChart();
        },
      });
    }
  });

  // Effect pour surveiller les changements de titre
  readonly titleEffect = effect(() => {
    const titleValue = this.title();
    if (titleValue !== undefined) {
      this.updateChart();
    }
  });

  /// resize the chart
  resizeTheChart(): void {
    const chartRef = this.chartDiv();
    if (chartRef && chartRef.chart) {
      chartRef.chart.reflow();
    }
  }

  // GET EMPTY CHART OPTIONS
  getEmptyChartOptions(): Highcharts.Options {
    return {
      chart: {
        type: 'pie',
        height: 400,
        animation: false,
        backgroundColor: 'transparent',
        margin: [50, 0, 0, 0],
      },
      title: {
        text: this.title() || '',
      },
      series: [],
      credits: { enabled: false },
    };
  }

  // UPDATE CHART
  private updateChart(): void {
    const currentData = this.data();
    const currentTitle = this.title();

    // Vérification que les données sont un tableau avec des éléments
    if (
      !currentData ||
      !Array.isArray(currentData) ||
      currentData.length === 0
    ) {
      this.chartOptions = this.getEmptyChartOptions();
      return;
    }

    // Transformation des données pour Highcharts
    const seriesData = currentData
      .map((item: any) => ({
        name: item.libelle,
        y: item.montant,
      }))
      .filter((item) => item.y > 0); // Filtrer les montants négatifs ou nuls

    // Si aucune donnée valide après filtrage
    if (seriesData.length === 0) {
      this.chartOptions = this.getEmptyChartOptions();
      return;
    }

    this.chartOptions = {
      chart: {
        type: 'pie',
        height: 400,
        animation: false,
        backgroundColor: 'transparent',
        margin: [30, 0, 0, 10],
        style: {
          fontFamily: 'Arial, sans-serif',
        },
      },
      title: {
        text: currentTitle,
        align: 'center',
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          color: 'var(--cds-alias-object-interaction-color)',
        },
      },
      credits: {
        enabled: false,
      },
      tooltip: {
        pointFormatter: function () {
          return `${this.name}: ${this.y?.toLocaleString(
            'fr-FR'
          )} TND (${this.percentage?.toFixed(1)}%)`;
        },
      },
      plotOptions: {
        pie: {
          cursor: 'pointer',
          size: '65%',
          dataLabels: {
            enabled: true,
            distance: 15,
            connectorWidth: 1,
            style: {
              fontWeight: 'normal',
              fontSize: '10px',
              color: 'var(--cds-alias-object-interaction-color)',
            },
            connectorPadding: 5,
            connectorColor: 'var(--cds-alias-object-interaction-color)',
            formatter: function (this: Highcharts.Point) {
              const maxLength = 15;
              const truncatedName =
                this.name && this.name.length > maxLength
                  ? this.name.substring(0, maxLength - 3) + '...'
                  : this.name;
              return `${truncatedName}<br/>${this.percentage?.toFixed(1)}%`;
            },
          },
          showInLegend: false,
        },
      },
      series: [
        {
          type: 'pie',
          name: currentTitle || 'Données',
          data: seriesData,
          colors: [
            '#99B7D8',
            '#99D5E3',
            '#9BC8E9',
            '#9BD4ED',
            '#7FB6F3',
            '#99B9B9',
            '#A0A0A0',
            '#BBBBBB',
            '#889AA8',
            '#85909C',
          ],
        },
      ],
    };
  }
}
