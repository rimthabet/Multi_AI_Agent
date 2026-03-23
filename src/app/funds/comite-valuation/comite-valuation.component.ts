import { Component, DestroyRef, inject, OnInit, viewChildren } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { FormGroup, FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ComiteCreateFormAndGridComponent } from "./comite-create-form-and-grid/comite-create-form-and-grid.component";

@Component({
  selector: 'app-comite-valuation',
  imports: [ClarityModule, CdsModule, ReactiveFormsModule, FormsModule, ComiteCreateFormAndGridComponent],
  templateUrl: './comite-valuation.component.html',
  styleUrl: './comite-valuation.component.scss'
})
export class ComiteValuationComponent implements OnInit {

  grids = viewChildren<ComiteCreateFormAndGridComponent>("grid");

  // Dependencies
  private destroyRef = inject(DestroyRef);
  private managementService = inject(ManagementService);
  private toastr = inject(ToastrService);
  private router = inject(Router);

  // PROPERTIES
  fonds: any[] = [];
  projets: any[] = [];
  methodesEvaluation: any[] = [];

  selectedFonds: any;
  loading: boolean = false;
  opened: boolean = false;

  years: number[] | undefined;
  thisYear: number = new Date().getFullYear();
  currentYear: any;
  fundsIndexForm!: FormGroup


  ngOnInit() {
    this.loadFunds();
    this.loadMethodesEvaluation();
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
            this.findProjetsByFonds();

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
    sessionStorage.setItem('LastVisitedFunds', fund.id);

    if (this.selectedFonds?.dateLancement) {
      const launchYear = new Date(this.selectedFonds.dateLancement).getFullYear();
      this.currentYear = new Date().getFullYear();

      this.years = Array.from(
        { length: this.currentYear - launchYear + 1 },
        (_, i) => launchYear + i
      );
    } else {
      this.years = [];
      this.currentYear = null;
    }

    this.findProjetsByFonds();
  }



  // Find projets by fonds
  findProjetsByFonds() {
    this.managementService
      .findProjetsByFonds(this.selectedFonds?.id)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.projets = data;
          this.projets.sort((a: any, b: any) => {
            if (a.nom > b.nom) return 1;
            if (a.nom < b.nom) return -1;
            return 0;
          });
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Projets non chargés!');
        },
        complete: () => {
          this.grids()?.forEach((g: ComiteCreateFormAndGridComponent) =>
            g.loadComitesValorisation()
           );
        },
      })
  }

  // Load methodes evaluation
  loadMethodesEvaluation() {
    this.managementService.findMethodeEvaluation().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.methodesEvaluation = data;
      },
      error: (error: any) => {
        console.error(
          "Une erreur s'est produite lors du chargement des méthodes d'évaluation :",
          error
        );
      },
      complete: () => { },
    })
  }

  // Equals
  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

  // Collapse all
  collapseAll() {
    this.grids()?.forEach((g: ComiteCreateFormAndGridComponent) =>
      g.collapse()
   );
  }

  // Go to fonds fiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds?.id);
  }
}
