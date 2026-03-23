import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { distinct, of } from 'rxjs';
import { HorizontalScrollerComponent } from '../../../widgets/horizontal-scroller/horizontal-scroller.component';
import { RatioWidgetOcaComponent } from './ratio-widget-oca/ratio-widget-oca.component';

@Component({
  selector: 'oca-compliance-ratios',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    HorizontalScrollerComponent,
    RatioWidgetOcaComponent
  ],
  templateUrl: './oca-compliance-ratios.component.html',
  styleUrl: './oca-compliance-ratios.component.scss'
})
export class OcaComplianceRatiosComponent implements OnInit {

  //Dependency injection
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  //Properties
  fonds: any[] | undefined;
  selectedFonds: any | undefined;
  projets: any[] | undefined;
  liberationsOCA: any[] | undefined;
  ratioOCA = 0.75;

  totalLiberationOCA: number = 0;
  totalSouscriptionOCA: number = 0;
  totalActif: number = 0;
  totalInvesti: number = 0;
  ratioInvesti: number = 0.0;
  loadingFonds: boolean = true;
  loadingLiberations: boolean = true;

  //Initialization
  ngOnInit(): void {
    this.loadFondsList();
  }

  //Select fonds
  selectFonds(value: any) {
    this.selectedFonds = value;
    sessionStorage.setItem('LastVisitedFunds', value?.fonds?.id);
    this.loadFondsSouscriptionsInvLiberations();
  }

  //Load fonds list
  loadFondsList() {
    this.loadingFonds = true;
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
        this.loadingFonds = false;
      }
    })
  }

  //Load fonds souscriptions inv liberations
  loadFondsSouscriptionsInvLiberations() {
    this.projets = [];
    this.totalLiberationOCA = 0;
    this.loadingLiberations = true;
    this.managementService
      .findFondsSouscriptionsInvLiberations(this.selectedFonds?.fonds?.id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          let projets: any[] = [];
          this.liberationsOCA = data?.lo;
          data.ls?.forEach(
            (s: any) => (this.totalActif += s.montantSouscription)
          );
          data.lo.forEach((l: any) => {
            this.totalLiberationOCA += l.montantLiberation;
            projets.push(l.souscription.financement.projet);
          });
          const excluded_projects: number[] = [];
          data.lca?.forEach((s: any) => {
            excluded_projects.push(s.financement?.projet?.id);
          });
          of(...projets)
            .pipe(distinct((p: any) => p.id))
            .subscribe((p: any) => {
              if (excluded_projects.indexOf(p.id) < 0) this.projets?.push(p);
            });
        },
        error: () =>
          this.toastr.error(
            '',
            'Erreur de téléchargement des données du fonds !'
          ),
        complete: () => {
          this.loadingLiberations = false;
        },
      })
  }

  //Go to fonds fiche
  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/funds/' + this.selectedFonds.fonds?.id
    );
  }


}
