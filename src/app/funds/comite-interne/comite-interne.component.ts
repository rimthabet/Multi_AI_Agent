import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-comite-interne',
  imports: [ClarityModule, CdsModule, DatePipe, RouterLink,FormsModule],
  templateUrl: './comite-interne.component.html',
  styleUrl: './comite-interne.component.scss'
})
export class ComiteInterneComponent implements OnInit {

  // Dependencies
  private destroyRef = inject(DestroyRef);
  private managementService = inject(ManagementService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  fonds: any[] = [];
  selectedFonds: any | undefined;

  comites: any[] = [];
  loading: boolean = true;


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

            this.loadComitieInternes();

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
    this.loadComitieInternes();
    sessionStorage.setItem('LastVisitedFunds', fund.id);
  }

  // LOAD COMITES
  loadComitieInternes() {
    this.loading = true;

    this.managementService
      .fetchComiteInternesByFonds(this.selectedFonds.id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.comites = data;
          this.comites.sort((a, b) => {
            if (a.dateComite < b.dateComite) return 1;
            if (a.dateComite > b.dateComite) return -1;
            if (a.dateComite == b.dateComite) {
              return a.financement.projet.nom < b.financement.projet.nom
                ? -1
                : 1;
            }
            return 0;
          });
        },
        complete: () => {
          this.loading = false;
        },
      })

  }

  // DECISION TEXT
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
