import { Component, DestroyRef, inject, OnInit, viewChild } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FundsSubscriptionComponent } from "./funds-subscription/funds-subscription.component";
import { FinancingSwitchComponent } from '../../tools/financing-switch/financing-switch.component';

@Component({
  selector: 'app-investments-subscription',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, FundsSubscriptionComponent, FinancingSwitchComponent],
  templateUrl: './investments-subscription.component.html',
  styleUrl: './investments-subscription.component.scss',

})
export class InvestmentsSubscriptionComponent implements OnInit {
  fonds() {
    throw new Error('Method not implemented.');
  }
  // ===== VIEWCHILD =====
  switcher = viewChild.required<FinancingSwitchComponent>("financing_switcher");

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  // ===== TABLE DATA =====
  projets: any[] | undefined;

  // ===== FINANCEMENT DATA =====
  financement: any | undefined;
  selectedProjet: any | undefined;
  selectedFonds: any | undefined;

  // ===== PROPERTIES =====
  loading: boolean = false;
  isPanelOpen: any;

  ngOnInit(): void {

    // ===== LOAD PROJECTS =====
    this.loadProjects();
  }

  // ===== SELECTED PROJET =====
  selectProjet(p: any) {
    this.selectedProjet = p;
    sessionStorage.setItem('LastVisitedProject', p.id);
  }

  // ===== LOAD PROJECTS =====
  loadProjects() {
    this.loading = true;

    this.managementService.findProjets(5).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.projets = data.sort((c1: any, c2: any) =>
          c1.nom.localeCompare(c2.nom)
        );

        // ===== LAST SELECTED PROJECT =====
        let lastSelectedProject = sessionStorage.getItem('LastVisitedProject');
        if (lastSelectedProject) {
          lastSelectedProject = this.projets?.filter(
            (p: any) => lastSelectedProject == p.id
          )[0];
          this.selectProjet(lastSelectedProject);
        } else this.selectProjet(data[0]);
      },
      error: (error: any) => console.log(error),
      complete: () => {
        this.loading = false;
      }
    });
  }


  // ===== FINANCEMENT CHANGED =====
  financingChanged($event: any) {
    this.financement = { ...$event };
    this.selectedFonds = this.financement.fonds[0];
  }

  // ===== SELECT FONDS =====
  selectFonds(fonds: any) {
    this.selectedFonds = fonds;

  }

  // ===== GO TO PROJET FICHE =====
  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/projects/' + this.selectedProjet?.id
    );
  }

  // ===== EQUALS =====
  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

}
