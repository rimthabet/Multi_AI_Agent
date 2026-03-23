import { Component, effect } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';
import { input } from '@angular/core';
import { output } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'due-diligence-creation-form',

  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './due-diligence-creation-form.component.html',
  styleUrl: './due-diligence-creation-form.component.scss'
})
export class DueDiligenceCreationFormComponent {

  // ===== INPUTS as signals =====
  prospection = input<any>();
  expense = input<any>();
  schema = input<any>();
  opened = input<boolean>();

  // ===== OUTPUT =====
  refresh = output<any>();
  closed = output<boolean>();

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);

  // ===== FORM =====
  expensesSaveForm: FormGroup = this.formBuilder.group({
    id: null,
    libelle: [undefined, [Validators.required]],
    montant: [undefined, [Validators.required]],
  });

  expenseLocal: any;
  // ===== EFFECTS =====
  readonly expenseEffect = effect(() => {
    if (this.expense()) {
      this.setExpense(this.expense());
    }
  });

  setExpense(data: any) {
    this.expenseLocal = data;

    this.expensesSaveForm.patchValue({
      id: data.id,
      libelle: data.libelle,
      montant: data.montant,
    });
  }

  // We call save systimatically and we switch internally
  saveExpense() {
    this.expenseLocal = this.expense();
    let expense: any = {
      id: this.expenseLocal?.id ? this.expenseLocal?.id : null,
      libelle: this.expensesSaveForm?.value['libelle'],
      montant: this.expensesSaveForm?.value['montant'],
      schemaInvestissementFinancement: this.schema(),
    };

    this.managementService
      .saveSchemaExpense(expense)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data != null) {
            this.toastr.success('', 'Dépense ajoutée avec succès!');
            this.refresh.emit({ fromDelete: false, expense: data });
            this.expensesSaveForm.reset();
          }
        },
        error: (error) => console.error(error),
      })
  }

  hideModal() {
    this.expensesSaveForm.reset();
    this.closed.emit(false);
  }

}
