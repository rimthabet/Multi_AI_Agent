import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'alternative-market',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    RouterLink
  ],
  templateUrl: './alternative-market.component.html',
  styleUrl: './alternative-market.component.scss'
})
export class AlternativeMarketComponent implements OnInit {

  //Dependency injection
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  //Properties
  fonds: any[] | undefined;
  selectedFonds: any | undefined;

  projets: any[] = [];
  ratioAction = 0.8;

  totalLiberationAction: number = 0;
  totalActif: number = 0;
  totalInvesti: number = 0;
  totalPercentage: number = 0;
  ratioInvesti: number = 0.0;

  loading1: boolean = true;
  loading2: boolean = true;

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
    this.loading1 = true;
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
        this.loading1 = false;
      }
    })
  }


  //Load fonds souscriptions inv liberations
  loadFondsSouscriptionsInvLiberations(): void {
    let projets: any = [];
    this.totalLiberationAction = 0;
    this.totalInvesti = 0;
    this.totalPercentage = 0;
    this.totalActif = 0;
    this.loading2 = true;

    this.managementService
      .findFondsSouscriptionsInvLiberations(this.selectedFonds?.fonds?.id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          data.la = data.la.filter((l: any) => {
            let natInvs = l.souscription.financement.naturesInvestissement;
            return (
              natInvs.filter(
                (n: any) => n.libelle.toLowerCase() == 'marche alternatif'
              ).length > 0
            );
          });

          data.ls?.forEach((s: any) => {
            this.totalActif += s.montantSouscription;
          });

          data.la.forEach((r: any) => {
            let montantLiberation = r.montantLiberation;
            this.totalLiberationAction += montantLiberation;
            this.totalInvesti += montantLiberation;
            this.totalPercentage +=
              montantLiberation / (this.totalActif * this.ratioAction);

            let savedProject = projets[r.souscription.financement.projet.id];

            if (savedProject != undefined)
              savedProject.montantLiberation += montantLiberation;
            else
              projets[r.souscription.financement.projet.id] = {
                nom: r.souscription.financement.projet.nom,
                montantLiberation: montantLiberation,
                id: r.souscription.financement.projet.id,
              };
          });

          this.projets = Object.values(projets);
        },
        error: () =>
          this.toastr.error(
            '',
            'Erreur de téléchargement des données du fonds !'
          ),
        complete: () => {
          this.loading2 = false;
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
