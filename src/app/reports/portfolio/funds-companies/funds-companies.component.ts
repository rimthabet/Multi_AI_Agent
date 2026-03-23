import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, viewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FundDetailsComponent } from './fund-details/fund-details.component';
import { ProjectDetailsComponent } from './project-details/project-details.component';

@Component({
  selector: 'funds-companies',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    FundDetailsComponent,
    ProjectDetailsComponent
  ],
  templateUrl: './funds-companies.component.html',
  styleUrl: './funds-companies.component.scss'
})
export class FundsCompaniesComponent implements OnInit {

  //ViewChild
  fundDetails = viewChild<FundDetailsComponent>("fundDetails");
  projectDetails = viewChild<ProjectDetailsComponent>("projectDetails");

  //Dependency injection
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  //Properties
  fonds: any[] | undefined;
  selectedFonds: any | undefined;
  fondsSocietes: any | undefined;
  selectedProjet: any | undefined;

  projets: any[] | undefined;
  allProjets: any[] | undefined;
  ratioAction = 0.75;

  totalLiberationAction: number = 0;
  totalActif: number = 0;
  totalInvesti: number = 0;
  ratioInvesti: number = 0.0;
  loading: boolean = true;
  loadingDetails: boolean = false;
  loadingSocietes: boolean = true;
  selectedSociete: any | undefined;

  //Initialization
  ngOnInit(): void {
    this.loadFondsList();
  }

  //Select projet
  selectProjet(projet: any) {
    this.selectedProjet = projet;
    this.projectDetails()?.setData(projet, this.selectedFonds);
  }
  //Select fonds
  selectFonds(value: any) {
    this.selectedFonds = value;
    this.selectedProjet = undefined;
    sessionStorage.setItem('LastVisitedFunds', value?.fonds?.id);
    this.loadFondsSocietes(value?.fonds?.id);
    this.fundDetails()?.setData(value);
  }

  //Load fonds list
  loadFondsList() {
    this.loading = true;
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
        this.loading = false;
      }
    })
  }

  //Load fonds societes
  loadFondsSocietes(id: any) {
    this.loadingSocietes = true;
    this.managementService.findFondsSocietes(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        data.sort(
          (p1: any, p2: any) =>
            (p1.nom as string).toUpperCase() >=
            (p2.nom as string).toUpperCase()
        );
        this.fondsSocietes = data;
      },
      error: (data: any) => console.log(data),
      complete: () => {
        this.loadingSocietes = false;
      },
    })
  }

  //Go to fonds fiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.fonds?.id);
  }

}
