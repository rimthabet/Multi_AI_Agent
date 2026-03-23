import { Component, effect, input, model, output } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

@Component({
  selector: 'investment-create-form',

  imports: [ClarityModule, CdsModule, DecimalPipe, FormsModule, ReactiveFormsModule],
  templateUrl: './investment-create-form.component.html',
  styleUrl: './investment-create-form.component.scss'
})
export class InvestmentCreateFormComponent {

  // ===== INPUTS as signals =====
  prospection = input<any>();
  investissement = model<any>();
  schema = input<any>();
  opened = input<boolean>(false);

  // ===== OUTPUT =====
  refresh = output<any>();
  closed = output<boolean>();

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly formBuilder = inject(FormBuilder);

  // ===== FORM =====
  investissementSaveForm: FormGroup = this.formBuilder.group({
    id: null,
    libelle: [undefined, [Validators.required]],
    montant: [undefined, [Validators.required]],
  });


  // ===== EFFECTS =====
  readonly investissementEffect = effect(() => {
    if (this.investissement() != null) {
      this.investissementSaveForm.patchValue({
        id: this.investissement().id,
        libelle: this.investissement().libelle,
        montant: this.investissement().montant,
      });
    }
  });


  // ===== METHODS =====
  saveInvestissement() {
    let investissement: any = {
      id: this.investissement() ? this.investissement()?.id : null,
      libelle: this.investissementSaveForm?.value['libelle'],
      montant: this.investissementSaveForm?.value['montant'],
      schemaInvestissementFinancement: this.schema(),
    };

    this.managementService
      .saveSchemaInvestissement(investissement)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data != null) {
            this.investissement.set(data);

            this.toastr.success('', 'Investissement ajouté avec succès!');
            this.refresh.emit({ fromDelete: false, investissement: data });
            this.investissementSaveForm.reset();
            this.hideModal();
          }
        },
        error: (error) => console.error(error),
      });
  }

  // ===== METHODS =====
  hideModal() {
    this.investissementSaveForm.reset();
    this.closed.emit(false);
  }
}
