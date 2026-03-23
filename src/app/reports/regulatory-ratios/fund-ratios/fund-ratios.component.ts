import { Component, DestroyRef, inject, OnInit, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgxGaugeModule } from 'ngx-gauge';
import { HorizontalScrollerComponent } from '../../../widgets/horizontal-scroller/horizontal-scroller.component';
import { RatiosWidgetComponent } from '../ratios-widget/ratios-widget.component';

@Component({
  selector: 'fund-ratios',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    NgxGaugeModule,
    HorizontalScrollerComponent,
    RatiosWidgetComponent
  ],
  templateUrl: './fund-ratios.component.html',
  styleUrl: './fund-ratios.component.scss'
})
export class FundRatiosComponent implements OnInit {

  //DEPENDENCY INJECTION
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);


  //PROPERTIES
  fonds: any[] | undefined;

  // This attribute is processed by the child component RatiosWidgetComponent
  investissements: any[] = [];

  selectedFonds: any | undefined;

  loadingFunds: boolean = true;
  loadingRatios: boolean = true;
  progressColors = ['#ff1a1a', '#ff9933', ' #ffff00', '#cccc00', '#33cc33'];

  //INITIALIZATION
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
    if (value < 40) return this.progressColors[0];
    if (value < 60) return this.progressColors[1];
    if (value < 80) return this.progressColors[2];
    if (value < 100) return this.progressColors[3];
    return this.progressColors[4];
  }

  // go to the fonds fiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.fonds?.id);

  }

}