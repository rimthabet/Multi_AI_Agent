import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-comite-investment',
  imports: [ClarityModule, CdsModule, DecimalPipe, DatePipe,RouterLink,FormsModule],
  templateUrl: './comite-investment.component.html',
  styleUrl: './comite-investment.component.scss'
})
export class ComiteInvestmentComponent implements OnInit {

  // Dependencies
  private destroyRef = inject(DestroyRef);
  private managementService = inject(ManagementService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  // PROPERTIES
  fonds: any[] = [];
  comites: any[] = [];

  selectedFonds: any | undefined;
  loading: boolean = false;

  // INITIALIZE
  ngOnInit(): void {
    this.loadFunds();
  }


  // Load funds 
  loadFunds() {
    this.managementService.findFondsList()
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.fonds = data;
          let lastVisitedFunds = sessionStorage.getItem('LastVisitedFunds');

          if (lastVisitedFunds) {
            let selectedFond = this.fonds.find(
              (fond: any) => fond.id == lastVisitedFunds
            );

            if (selectedFond) {
              this.selectedFonds = selectedFond;
            } else {
              this.selectedFonds = data[0];
              sessionStorage.setItem('LastVisitedFunds', data[0].id);
            }

            this.loadComitieInvestissements();

          } else {
            this.selectedFonds = data[0];
            sessionStorage.setItem('LastVisitedFunds', data[0].id);
          }

          this.switchTheFund(this.selectedFonds);
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Fonds non chargés!');
        }
      })
  }


  // Switch the fund
  switchTheFund(fund: any) {
    this.selectedFonds = fund;
    this.loadComitieInvestissements();
    sessionStorage.setItem('LastVisitedFunds', fund.id);
  }


  // Load comites
  loadComitieInvestissements() {
    this.loading = true;

    this.managementService
      .fetchComiteInvestissementsByFonds(this.selectedFonds?.id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.comites = data;
          this.comites.sort((a, b) => {
            if (a.dateComite < b.dateComite) return 1;
            if (a.dateComite > b.dateComite) return -1;
            return 0;
          });
        },
        complete: () => {
          this.loading = false;
        },
      })

  }

  // Calculate total amount
  calculateMontantTotal(comite: any): number {
    return (
      comite.pfa.montantCCA + comite.pfa.montantOCA + comite.pfa.montantActions
    );
  }

  // Decision text
  decisionText(decision: number): string {
    switch (decision) {
      case 0:
        return 'ACCEPTÉE';
      case 1:
        return 'REFUSÉE';
      case 2:
        return 'APPROFONDIE';
      default:
        return 'ACCEPTÉE AVEC RÉSERVE';
    }
  }

  // Opens the fiche page
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.id);
  }
}
