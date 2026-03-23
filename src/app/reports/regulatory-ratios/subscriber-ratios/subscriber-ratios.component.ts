import { Component, DestroyRef, inject, OnInit, viewChild } from '@angular/core';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { NgxGaugeModule } from 'ngx-gauge';
import { HorizontalScrollerComponent } from '../../../widgets/horizontal-scroller/horizontal-scroller.component';
import { RatiosWidgetComponent } from '../ratios-widget/ratios-widget.component';
import { Router } from '@angular/router';
import { ManagementService } from '../../../services/management.service';
import { environment } from '../../../../environment/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'subscriber-ratios',
  imports: [
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    NgxGaugeModule,
    HorizontalScrollerComponent,
    RatiosWidgetComponent
  ],
  templateUrl: './subscriber-ratios.component.html',
  styleUrl: './subscriber-ratios.component.scss'
})
export class SubscriberRatiosComponent implements OnInit {

  ///DEPENDENCIES
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  ///PROPERTIES
  fonds: any[] | undefined;
  selectedFonds: any | undefined;
  investissements: any[] = [];
  loadingFunds: boolean = true;
  loadingRatios: boolean = true;
  ratioType = environment.second_regulatory_funds_ratio_name;

  progressColors = ['#ff1a1a', '#ff9933', ' #ffff00', '#cccc00', '#33cc33'];

  ///INITIALIZE
  ngOnInit(): void {
    this.loadFondsList();
  }

  // select fonds
  selectFonds(value: any) {
    this.selectedFonds = value;
    sessionStorage.setItem('LastVisitedFunds', value?.fonds?.id);
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

  // parse the foreground color
  parseForeColor(value: number) {
    console.log('value', value);
    if (value < 40) return this.progressColors[0];
    if (value < 60) return this.progressColors[1];
    if (value < 75) return this.progressColors[2];
    if (value < 80) return this.progressColors[3];
    return this.progressColors[4];
  }

  // go to fiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds.fonds?.id);
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

  // get widget title
  getWidgetTitle(): string {
    const denomination = this.selectedFonds?.fonds?.denomination ?? '';
    switch (this.ratioType) {
      case 'ratio_reglementaire_souscripteur':
        return `Ratios réglementaires des souscripteurs dans les projets pour le ${denomination}`;
      case 'ratio_emploi_fiscale':
        return `Ratios d'emploi fiscale des souscripteurs dans les projets pour le ${denomination}`;
      default:
        return `Ratios des souscripteurs dans les projets pour le ${denomination}`;
    }
  }



}
