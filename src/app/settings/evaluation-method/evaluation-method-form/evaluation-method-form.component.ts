import { Component, DestroyRef, inject, input, OnInit, output, effect } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ManagementService } from '../../../services/management.service';

@Component({
  selector: 'evaluation-method-form',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule
  ],
  templateUrl: './evaluation-method-form.component.html',
  styleUrl: './evaluation-method-form.component.scss'
})
export class EvaluationMethodFormComponent implements OnInit {
  // inputs
  selectedItem = input<any>();
  isOpen = input<boolean>(false);
  modal = input<boolean>(false);

  // outputs
  refreshEvent = output<void>();
  closeModalEvent = output<void>();

  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  // forms
  methodeForm!: FormGroup;


  // life cycle
  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.methodeForm = this.fb.group({
      libelle: ['', [Validators.required]],
    });
  }


  // effects
  readonly selectedItemEffect = effect(() => {
    const item = this.selectedItem();
    if (item && this.methodeForm) {
      this.methodeForm.patchValue({ libelle: item.libelle });
    } else if (!item && this.methodeForm) {
      this.methodeForm.reset();
    }
  });

  // methods
  saveMethod(): void {
    if (this.methodeForm.invalid) return;
    const selectedItem = this.selectedItem();
    if (!selectedItem?.id) {
      this.createMethod();
    } else {
      this.updateMethod();
    }
  }

  // Save
  createMethod(): void {
    const methode = {
      libelle: this.methodeForm.value.libelle,
    };

    this.managementService.saveMethodeEvaluation(methode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', "Méthode d'évaluation ajoutée avec succès!");
          this.handleSuccess();

        },
        error: () => {
          this.toastr.error('Erreur lors de l\'ajout de la méthode d\'évaluation !', 'Erreur');
        }
      });
  }

  // Update
  updateMethod(): void {
    const selectedItem = this.selectedItem();
    const methode = {
      id: selectedItem.id,
      libelle: this.methodeForm.value.libelle,
    };

    this.managementService.updateMethodeEvaluation(methode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.toastr.success('', "Méthode d'évaluation mise à jour avec succès!");
          this.handleSuccess();
        },
        error: () => {
          this.toastr.error('Erreur lors de la mise à jour de la méthode d\'évaluation !', 'Erreur');
        }
      });
  }



  // Close modal
  closeModal(): void {
    this.methodeForm.reset();
    this.closeModalEvent.emit()
  }

  // Handle success
  handleSuccess(): void {
    this.methodeForm.reset();
    this.refreshEvent.emit();
    this.closeModal();
  }

  handleModalChange(open: boolean): void {
    if (!open) {
      this.closeModal();
    }
  }

}