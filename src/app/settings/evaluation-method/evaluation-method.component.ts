import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit } from '@angular/core';
import { CdsButtonModule, CdsIconModule, CdsDividerModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../services/management.service';
import { EvaluationMethodFormComponent } from "./evaluation-method-form/evaluation-method-form.component";

@Component({
  selector: 'evaluation-method',
  imports: [
    CommonModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    EvaluationMethodFormComponent
  ],
  templateUrl: './evaluation-method.component.html',
  styleUrl: './evaluation-method.component.scss'
})
export class EvaluationMethodComponent implements OnInit {

  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  loading: boolean = false;
  methodesEvaluation: any[] = [];
  selectedItem: any = null;
  openModal: boolean = false;

  ngOnInit(): void {
    this.loadMethod();
  }

  // Load data 
  loadMethod(): void {
    this.loading = true;
    this.managementService.findMethodeEvaluation()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.methodesEvaluation = data;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
  }

  // Open the add modal
  openAddModal(): void {
    this.selectedItem = null;
    this.openModal = true;
  }

  toggleShowEdit(data: any): void {
    if (data) {
      this.selectedItem = data;
      this.openModal = true;
    }
  }

  // Delete method from the main component
  deleteMethod(): void {
    if (!this.selectedItem?.id) return;

    if (confirm('Veuillez confirmer cette suppression !')) {
      this.managementService
        .deleteMethodeEvaluation(this.selectedItem.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', "Méthode d'évaluation supprimée avec succès!");
            this.loadMethod();
            this.resetSelection();
          },
          error: () => {
            this.toastr.error('Erreur lors de la suppression de la méthode d\'évaluation !', 'Erreur');
          }
        });
    }
  }

  // Handle refresh event from form
  refresh(): void {
    this.loadMethod();
    this.resetSelection();
  }

  // Handle modal close event
  modalClose(): void {
    this.openModal = false;
    this.resetSelection();
  }

  // Reset selection
  resetSelection(): void {
    this.selectedItem = null;
  }
}