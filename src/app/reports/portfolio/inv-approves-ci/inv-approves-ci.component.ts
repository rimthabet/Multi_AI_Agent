import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-inv-approves-ci',
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
  templateUrl: './inv-approves-ci.component.html',
  styleUrl: './inv-approves-ci.component.scss'
})
export class InvApprovesCiComponent implements OnInit {

  //Dependency injection
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  //Properties
  fonds: any[] | undefined;
  selectedFonds: any | undefined;
  finsApprouvesParCI: any[] = [];

  loading: boolean = true;

  //Initialization
  ngOnInit(): void {
    this.loadFondsList();
  }

  //Select fonds
  selectFonds(value: any) {
    this.selectedFonds = value;
    sessionStorage.setItem('LastVisitedFunds', value?.fonds?.id);
    this.loadFinsApprouvesParCI();
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


  //Load financements approuves par CI
  loadFinsApprouvesParCI() {
    this.loading = true;
    this.managementService
      .findFinancementsApprouvesParCI(this.selectedFonds.fonds.id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.finsApprouvesParCI = data;
          this.finsApprouvesParCI.sort((f1: any, f2: any) => {
            if (
              f1.pfa.comiteInvestissement.dateComite >
              f2.pfa.comiteInvestissement.dateComite
            )
              return -1;
            if (
              f1.pfa.comiteInvestissement.dateComite <
              f2.pfa.comiteInvestissement.dateComite
            )
              return 1;

            if (f1.p.nom > f2.p.nom) return 1;
            if (f1.p.nom < f2.p.nom) return -1;

            return 0;
          });
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading = false;
        },
      })
  }

  //Calculate total
  calculateMontantTotal(comite: any): number {
    return comite.montantCCA + comite.montantOCA + comite.montantActions;
  }

  //Go to fonds fiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.fonds?.id);
  }

}
