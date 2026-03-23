import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { RatiosWidgetComponent } from '../ratios-widget/ratios-widget.component';
import { Router } from '@angular/router';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../environment/environment';

@Component({
  selector: 'historical-subscriber-ratios',
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
  templateUrl: './historical-subscriber-ratios.component.html',
  styleUrl: './historical-subscriber-ratios.component.scss'
})
export class HistoricalSubscriberRatiosComponent implements OnInit {


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

  ratioType = environment.second_regulatory_funds_ratio_name;

  //INITIALIZATION
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
    this.years = undefined;
    this.managementService
      .findAllLiberationsByFonds(this.selectedFonds?.fonds?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data && data.length > 0) {
            let y = 0;
            this.years = new Set(
              data.map((l: any) => {
                y = new Date(l.dateLiberation).getFullYear();
                return y;
              })
            );

            this.years.add(y + 1);
            this.years.add(y + 2);
          }
        },
        error: (error: any) => {
          console.error('Error loading data', error);
        },
        complete: () => (this.loadingLiberations = false),
      })

  }

  // sorted years
  sortedYears(): number[] {
    return Array.from(this.years ?? []).sort((a, b) => b - a);
  }


  // get label for ratio type
  getLabelForRatioType(ratioType: string): string {
    switch (ratioType) {
      case 'ratio_reglementaire_souscripteur':
        return 'Ratios règlementaires des souscripteurs dans les projets';
      case 'ratio_emploi_fiscale':
        return "Ratios d'emploi fiscal dans les projets";
      default:
        return '';
    }
  }

  // go to the fonds fiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.fonds?.id);
  }

}
