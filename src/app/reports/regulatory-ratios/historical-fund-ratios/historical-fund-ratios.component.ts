import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RatiosWidgetComponent } from '../ratios-widget/ratios-widget.component';

@Component({
  selector: 'historical-fund-ratios',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    RatiosWidgetComponent
  ],
  templateUrl: './historical-fund-ratios.component.html',
  styleUrl: './historical-fund-ratios.component.scss'
})
export class HistoricalFundRatiosComponent implements OnInit {

  //DEPENDENCY INJECTION
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  //PROPERTIES
  fonds: any[] | undefined;
  selectedFonds: any | undefined;
  years: Set<number> | undefined;

  thisYear: number = new Date().getFullYear();

  loadingFunds: boolean = true;
  loadingLiberations: boolean = true;

  //INITIALIZE
  ngOnInit(): void {
    this.loadFondsList();
  }

  // select fonds
  selectFonds(value: any) {
    this.selectedFonds = value;
    sessionStorage.setItem('LastVisitedFunds', value?.fonds?.id);
    this.loadFondsLiberations();
  }

  // load fonds list
  loadFondsList() {
    this.loadingFunds = true;
    this.managementService.findFondsAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.fonds = data.filter(
          (fonds: any) =>
            fonds.fonds?.etat?.libelle !== 'En cours de levée' ||
            (fonds.sousLib?.length > 0 &&
              fonds.sousLib?.filter(
                (sl: any) =>
                  sl.souscription != null && sl.liberations?.length > 0
              ).length > 0)
        );
        try {
          let lastVisitedFunds = sessionStorage.getItem('LastVisitedFunds');

          if (lastVisitedFunds) {
            lastVisitedFunds = this.fonds?.filter(
              (f: any) => lastVisitedFunds == f.fonds.id
            )[0];
            this.selectFonds(lastVisitedFunds);
          } else this.selectFonds(data[0]);
        } catch { }

      },
      error: (data: any) => console.log(data),
      complete: () => {
        this.loadingFunds = false;
      }
    })
  }


  // load fonds liberations
  loadFondsLiberations() {
    this.years = new Set();

    this.loadingLiberations = true;

    this.managementService
      .findAllLiberationsByFonds(this.selectedFonds?.fonds?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data && data.length > 0) {
            let y = 0;
            data.forEach((l: any) => {
              y = new Date(l.dateLiberation).getFullYear();
              this.years?.add(y);
            });

            for (
              let i = 1;
              i <= this.selectedFonds?.fonds?.nombreAnnees;
              i++
            ) {
              this.years?.add(y + i);
            }
          }
        },
        error: (error: any) => {
          console.error('Error loading data', error);
        },
        complete: () => (this.loadingLiberations = false),
      })


    // I need to add the potential extended years due to investments sold out
    // Actions resell
    this.managementService
      .findInvSoucriptionActionByFonds(this.selectedFonds?.fonds?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          let y = 0;
          data.forEach((d: any) => {
            if (d.sa?.dateSignatureProtocoleCession != null) {
              y = new Date(d.sa?.dateSignatureProtocoleCession).getFullYear();
              this.years?.add(y);
            }
          });
          if (y != 0)
            for (
              let i = 1;
              i <= this.selectedFonds?.fonds?.nombreAnnees;
              i++
            ) {
              this.years?.add(y + i);
            }
        },
        error: (error: any) => {
          console.error('Error loading data', error);
        },
      })


    //  Conversion OCA
    this.managementService
      .findConversionRemboursementOCAByFonds(this.selectedFonds?.fonds?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          let y = 0;
          data.forEach((d: any) => {
            if (d.sa?.dateSignatureProtocoleCession != null) {
              y = new Date(d.sa?.dateSignatureProtocoleCession).getFullYear();
              this.years?.add(y);
            }
          });
          if (y != 0)
            for (
              let i = 1;
              i <= this.selectedFonds?.fonds?.nombreAnnees;
              i++
            ) {
              this.years?.add(y + i);
            }
        },
        error: (error: any) => {
          console.error('Error loading data', error);
        },
      })


    //  Rembourcement CCA
    this.managementService
      .findConversionRemboursementCCAByFonds(this.selectedFonds?.fonds?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          data.forEach((d: any) => {
            if (d.sa?.dateSignatureProtocoleCession != null)
              this.years?.add(new Date(d?.dateRealisation).getFullYear());
          });
        },
        error: (error: any) => {
          console.error('Error loading data', error);
        },
      })

  }

  // sorted years
  sortedYears(): number[] {
    return Array.from(this.years ?? []).sort((a, b) => b - a);
  }

  // go to the fonds fiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.fonds?.id);
  }

  equals(a: any, b: any) {
    return a?.fonds?.id == b?.fonds?.id;
  }



}
