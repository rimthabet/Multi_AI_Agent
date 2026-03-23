import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { NgxGaugeModule } from 'ngx-gauge';
import { ManagementService } from '../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'qfp-ratio-widget',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    NgxGaugeModule
  ],
  templateUrl: './qfp-ratio-widget.component.html',
  styleUrl: './qfp-ratio-widget.component.scss'
})
export class QfpRatioWidgetComponent implements OnInit {

  //Inputs
  liberations = input<any>();
  projet = input<any>();
  selectedFonds = input<any>();

  //Dependencies
  private readonly managementService = inject(ManagementService);
  private readonly destroyRef = inject(DestroyRef);

  ///properties
  capital = 0;
  montant = 0;

  ratio: any;
  loading = true;

  //Initialization
  ngOnInit(): void {
    try {
      let montantProjet = 0;

      let liberationsLo = this.liberations().lo.filter(
        (l: any) => l.souscription.financement.projet.id === this.projet().id
      );

      let liberationsLc = this.liberations().lc.filter(
        (l: any) => l.souscription.financement.projet.id === this.projet().id
      );

      montantProjet += liberationsLo.reduce(
        (sum: number, lo: any) => sum + lo.montantLiberation,
        0
      );

      montantProjet += liberationsLc.reduce(
        (sum: number, lc: any) => sum + lc.montantLiberation,
        0
      );

      this.montant += montantProjet;
    } catch (error) {
      console.error(
        'Une erreur est survenue lors du traitement des libérations :',
        error
      );
    }
    this.loadData();
  }


  //Load data
  loadData() {
    this.loading = true;

    this.managementService
      .findFondsLiberation(this.selectedFonds().fonds.id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.capital = 0;
          this.ratio = 0;

          data.forEach((p: any) => {
            if (p.projet.id == this.projet().id) {
              this.capital = p.pfcp.capital;
              this.ratio = (p.pfcp.part * 100.0).toFixed(2);
            }
          });
        },
        error: (error: any) => {
          console.error('An error occurred while loading data:', error);
        },
        complete: () => {
          this.loading = false;
        },
      })

  }

  //Parse foreground color
  parseForeColor() {
    if (this.ratio && +this.ratio >= 5) return '#33cc33';
    else return '#ff1a1a';
  }

}
