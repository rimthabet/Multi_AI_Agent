import { Component, DestroyRef, inject, input, OnInit, output, effect, model } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../services/management.service';
import { environment } from '../../../../environment/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ToastrService } from 'ngx-toastr';
import { ReportsRatiosXlsxService } from '../../../services/reports/reports-ratios-xlsx.service';
import { CurrencyPipe, PercentPipe } from '@angular/common';

@Component({
  selector: 'ratios-widget',
  imports: [
    CurrencyPipe,
    PercentPipe,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
  ],
  templateUrl: './ratios-widget.component.html',
  styleUrl: './ratios-widget.component.scss'
})
export class RatiosWidgetComponent implements OnInit {

  //INPUTS
  fonds = input<any>();
  endDate = input<any>();
  type = input<string>('fonds');
  title = input<string>();

  loading = model<boolean>(true);
  investissements = model<any[]>([]);

  dataEvent = output<any>();

  ///DEPENDENCIES
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly reportsRatiosXlsxService = inject(ReportsRatiosXlsxService);

  ///PROPERTIES


  total_libere: number = 0;
  total_engage: number = 0;
  total_investi: number = 0;
  ratio: number = 0;
  yearOfReference: number = 0;

  progressColors = ['#ff1a1a', '#ff9933', ' #ffff00', '#33cc33'];

  nomType = environment.nomType;


  ngOnInit(): void {
    this.loadFondsLiberationsInvestissements();
  }

  // Effects  
  readonly fundEffect = effect(() => {
    if (this.fonds()) {
      this.resetTheGUI();
      this.setFonds(this.fonds());
    }
  });

  // Effect for endDate
  readonly endDateEffect = effect(() => {
    if (this.endDate()) {
      this.loadFondsLiberationsInvestissements();
    }
  });

  // public method to be called from parent
  setFonds(data: any) {
    this.ratio = this.type() === 'fonds'
      ? data?.fonds?.ratioReglementaire
      : data?.fonds?.ratioReglementaire2;
    this.loadFondsLiberationsInvestissements();
  }

  // load fonds liberations and investissements
  loadFondsLiberationsInvestissements() {
    if (!this.fonds()?.fonds?.id) {
      return;
    }
    this.loading.set(true);

    this.managementService.findFondsLiberationsInvestissements(
      this.fonds()?.fonds?.id,
      this.endDate()
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (!data) {
            return;
          }

          this.investissements.set([]);
          this.total_engage = 0;
          this.total_investi = 0;
          this.total_libere = 0;

          let relicat: number = 0;

          data?.forEach((row: any) => {
            row.date = '31/12/' + (row.annee + this.fonds()?.fonds?.nombreAnnees);
            row.engage = row?.liberations * this.ratio;
            row.restantALiberer = Math.max(
              row.engage - row?.investissements - relicat,
              0
            );
            row.progress = Math.min(
              100,
              (100.0 * (row?.investissements + relicat)) / row?.engage
            ).toFixed(2);

            relicat += row?.investissements - row?.engage;
            row.depassement = Math.max(relicat, 0);

            this.total_engage += row?.engage;
            this.total_investi += row?.investissements;
            this.total_libere += row?.liberations;

          });

          this.investissements.set(data);
          this.yearOfReference = +data[0]?.annee + this.fonds()?.fonds?.nombreAnnees;

          // emit data to parent
          // this.dataEvent.emit(data);
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Ratios non chargés!');
        },
        complete: () => (this.loading.set(false)),
      });
  }

  // parse the foreground color
  parseForeColor(value: number) {
    if (value < 40) return this.progressColors[0];
    if (value < 60) return this.progressColors[1];
    if (value < 80) return this.progressColors[2];
    return this.progressColors[3];
  }

  // Clean every component
  resetTheGUI() {
    this.investissements.set([]);
    this.total_engage = 0;
    this.total_investi = 0;
    this.total_libere = 0;
    this.yearOfReference = 0;
  }

  // export ratios to excel
  exportRatioFondsToExcel() {
    let totals = {
      total_libere: this.total_libere,
      total_engage: this.total_engage,
      total_investi: this.total_investi,
      fondsNombreAnnees: this.fonds()?.fonds?.nombreAnnees,
    };
    this.reportsRatiosXlsxService.exportToExcel(
      this.investissements(),
      this.ratio,
      totals,
      this.title()
    );
  }
}