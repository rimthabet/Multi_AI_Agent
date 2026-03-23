import { formatDate } from '@angular/common';
import {
  Component,
  input,
  OnInit,
  effect,
  model,
} from '@angular/core';
import * as Highcharts from 'highcharts';
import { HighchartsChartModule } from 'highcharts-angular';


@Component({
  selector: 'bar-chart-02',

  imports: [HighchartsChartModule],
  templateUrl: './bar-chart-02.component.html',
  styleUrls: ['./bar-chart-02.component.scss'],
})
export class BarChart02Component implements OnInit {

  // Signal-based input property to receive subscription data from parent component
  souscriptions = input<any | undefined>();

  width = input<number>(500);
  height = input<number>(260);

  // Highcharts reference for the template
  Highcharts: typeof Highcharts = Highcharts;

  chartOptions = model<Highcharts.Options>({});

  constructor() {
    // Effect to watch for changes in souscriptions signal and update chart options
    effect(() => {
      const data = this.souscriptions();
      if (data) {
        this.updateChartOptions();
      }
    });
  }

  /**
   * Angular lifecycle hook - called after component initialization
   * Sets up initial chart options
   */
  ngOnInit(): void {
    this.updateChartOptions();
  }

  /**
   * Updates the chart options signal with current data
   * This will automatically update the highcharts-chart component
   */
  updateChartOptions(): void {

    // Extract data from souscriptions input
    const xAxisData = this.extractPeriods();
    const totalSouscription = this.extractTotalSouscription();
    const totalLiberation = this.extractTotalLiberation();

    // Create new Highcharts configuration options
    const options: Highcharts.Options = {
      // Chart container settings
      chart: {
        type: 'column', // Column chart (vertical bars)
        backgroundColor: 'transparent', // Transparent background
        width: this.width(),
        height: this.height(),
        spacingTop: 0, // Add this - reduces space at top of chart
        spacingBottom: 5, // Add this - reduces space at top of chart
        margin: [45, 5, 35, 5], // Tight margins [top, right, bottom, left]
        animation: false,
      },

      // Hide chart title
      title: {
        text: '',
      },

      responsive: {
        rules: [{
          condition: {
            minWidth: 500
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

      // Custom color palette for the two data series
      colors: ['var(--cds-alias-viz-sequential-blue-200)', 'var(--cds-alias-viz-sequential-green-200)'],

      // Tooltip configuration for hover interactions
      tooltip: {
        shared: true, // Show data for both series in one tooltip
        useHTML: true, // Allow HTML formatting
        formatter: function () {
          // Custom tooltip formatting with colors and formatted numbers
          let tooltipContent = `<b>${this.category}</b><br/>`;
          this.points?.forEach(point => {
            tooltipContent += `<span style="color:${point.color}">●</span> ${point.series.name}: <b>${point.y?.toLocaleString()}</b><br/>`;
          });
          return tooltipContent;
        }
      },

      // Legend configuration
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'top',
        y: 0, // Position from top
        itemStyle: { color: 'var(--cds-alias-object-interaction-color)' },
        itemHoverStyle: { color: 'var(--cds-alias-viz-sequential-blue-500)' },
        itemHiddenStyle: { color: 'var(--cds-alias-viz-sequential-blue-500)' },
      },


      // X-axis configuration (horizontal axis)
      xAxis: {
        categories: xAxisData, // Period labels
        tickWidth: 0, // Hide tick marks
        lineColor: 'var(--cds-alias-viz-sequential-blue-900)',        // Main axis line (red)
        tickColor: 'var(--cds-alias-viz-sequential-blue-900)',
        crosshair: true,
        labels: {
          style: {
            fontSize: '14px', // Small font for axis labels
            color: 'var(--cds-alias-object-interaction-color)'
          }
        }
      },

      // Y-axis configuration (vertical axis)
      yAxis: {
        title: {
          text: '' // No axis title
        },
        labels: {
          enabled: false // Hide y-axis labels
        },
        gridLineWidth: 0, // Hide grid lines
        lineWidth: 0, // Hide axis line
        tickWidth: 0, // Hide tick marks
      },

      // Plot options for column series
      plotOptions: {
        column: {
          borderWidth: 0,
          maxPointWidth: 50, // Maximum width of bars (larger bars)
          dataLabels: {
            enabled: true, // Show data labels on bars
            rotation: 0, // CHANGED: No rotation (horizontal text)
            align: 'center', // Center horizontally
            verticalAlign: 'bottom', // CHANGED: Position at bottom of bars
            inside: false, // Position labels outside bars
            overflow: 'allow', // Allow labels to overflow outside plot area

            crop: false, // Don't crop labels that exceed boundaries
            y: 0, // CHANGED: Positive offset to position below bars, above X-axis

            style: {
              fontSize: '11px', // CHANGED: Slightly smaller for better fit
              fontWeight: 'normal',
              textOutline: 'none', // No text outline
              color: 'var(--cds-alias-object-interaction-color)', // Text color
              cursor: 'pointer',
              textOverflow: 'ellipsis', // Allow labels to overflow outside plot area
            },

            // Custom formatter for number display
            formatter: function () {
              return this.y !== 0 ? this.y?.toLocaleString() : '0';
            }
          },
          groupPadding: 0.15, // Space between groups of bars
          pointPadding: 0.15 // Space between individual bars
        },
      },

      // Data series configuration
      series: [
        {
          name: 'Montant souscrit', // Subscribed amount series
          type: 'column',
          data: totalSouscription,
          color: 'var(--cds-alias-viz-sequential-blue-600)' // Blue color
        },
        {
          name: 'Montant libéré', // Released am  unt series
          type: 'column',
          data: totalLiberation,
          color: 'var(--cds-alias-viz-sequential-green-600)' // Green color
        }
      ],

      // Hide Highcharts credits
      credits: {
        enabled: false
      },

    };

    // Update the chart options signal - this will automatically update the chart
    this.chartOptions.set(options);
  }

  /**
   * Extracts and formats period labels from souscriptions signal data
   * @returns Array of formatted date range strings
   */
  extractPeriods(): string[] {
    // Get current value from souscriptions signal
    const souscriptionsData = this.souscriptions();

    // Guard clause for missing data
    if (!souscriptionsData || !souscriptionsData.periodes) {
      return [];
    }

    // Map periods to formatted date range strings
    return souscriptionsData.periodes.map((periode: any) => {
      const startDate = formatDate(periode.dateDebut, 'dd-MM-yyyy', 'en-US');
      const endDate = formatDate(periode.dateFin, 'dd-MM-yyyy', 'en-US');
      return `${startDate} → ${endDate}`;
    });
  }

  /**
   * Calculates total subscription amounts for each period
   * @returns Array of subscription totals per period
   */
  extractTotalSouscription(): number[] {
    // Get current value from souscriptions signal
    const souscriptionsData = this.souscriptions();

    // Guard clause for missing data
    if (!souscriptionsData || !souscriptionsData.periodes) {
      return [];
    }

    const totalSouscription: number[] = [];

    // Process each period
    souscriptionsData.periodes.forEach((periode: any) => {
      const debut = new Date(periode.dateDebut);
      const fin = new Date(periode.dateFin);

      // Sum subscriptions that fall within the period
      const total = souscriptionsData.souscriptions.reduce(
        (total: number, souscription: any) => {
          const dateSouscription = new Date(
            souscription.souscription.dateSouscription
          );

          // Check if subscription date is within period range
          if (dateSouscription >= debut && dateSouscription <= fin) {
            const montant = souscription.souscription.montantSouscription;
            return total + montant;
          }
          return total;
        },
        0
      );

      totalSouscription.push(total);
    });

    return totalSouscription;
  }

  /**
   * Calculates total liberation amounts for each period
   * @returns Array of liberation totals per period
   */
  extractTotalLiberation(): number[] {
    // Get current value from souscriptions signal
    const souscriptionsData = this.souscriptions();

    // Guard clause for missing data
    if (!souscriptionsData || !souscriptionsData.periodes) {
      return [];
    }

    const totalLiberation: number[] = [];

    // Process each period
    souscriptionsData.periodes.forEach((periode: any) => {
      const debut = new Date(periode.dateDebut);
      const fin = new Date(periode.dateFin);

      // Sum liberations for subscriptions within the period
      const total = souscriptionsData.souscriptions.reduce(
        (total: number, souscription: any) => {
          const dateSouscription = new Date(
            souscription.souscription.dateSouscription
          );

          // Check if subscription date is within period range
          if (dateSouscription >= debut && dateSouscription <= fin) {
            // Sum all liberations for this subscription
            const montantLiberation = souscription.liberations.reduce(
              (libTotal: number, liberation: any) =>
                libTotal + liberation.montantLiberation,
              0
            );
            return total + montantLiberation;
          }
          return total;
        },
        0
      );

      totalLiberation.push(total);
    });

    return totalLiberation;
  }

  /**
   * Public method to update component data (kept for backward compatibility)
   * Note: With signals, parent components should directly update the signal
   * @param data New souscriptions data
   */
  setSouscription(data: any): void {
    // Note: This method is kept for backward compatibility
    // With signals, the parent should update the signal directly
    // The effect() will automatically trigger chart updates
    console.warn('setSouscription is deprecated when using signals. Update the signal directly from parent component.');
  }

}
