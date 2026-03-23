import { Component, DestroyRef, effect, inject, input, OnInit, output } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators, ReactiveFormsModule } from '@angular/forms';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'financing-create-form',

  imports: [ClarityModule, CdsModule, DecimalPipe, FormsModule, ReactiveFormsModule],
  templateUrl: './financing-create-form.component.html',
  styleUrl: './financing-create-form.component.scss',
})
export class FinancingCreateFormComponent implements OnInit {

  // ===== INPUTS as signals =====
  prospection = input<any>();
  financement = input<any>();
  schema = input<any>();
  opened = input<boolean>();


  // ===== OUTPUT =====
  refresh = output<any>();
  closed = output<boolean>();

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);


  // ===== FORM =====
  finacementSaveForm: FormGroup = this.formBuilder.group({
    id: null,
    libelle: [undefined, [Validators.required]],
    montant: [undefined, [Validators.required]],
    natureBailleurFonds: [undefined, [Validators.required]],
  });

  // ===== PROPERTIES =====
  financements: any[] = [];
  naturesBailleurFonds: any[] = [];
  financementLocal: any;

  // ===== INITIALIZE =====
  ngOnInit() {
    this.managementService
      .findNatureBailleurFonds()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (this.naturesBailleurFonds = data),
      });
  }

  // ===== EFFECTS =====
  readonly financementEffect = effect(() => {
    if (this.financement() != null) {
      this.setFinancement(this.financement());
    }
  });

  // ===== SET financement====
  setFinancement(data: any) {
    this.financementLocal = data;

    if (!data) {
      this.finacementSaveForm.reset();
      return;
    }

    this.finacementSaveForm.patchValue({
      id: data.id,
      libelle: data.libelle,
      montant: data.montant,
      natureBailleurFonds: data.natureBailleurFonds?.id,
    });
  }



  // ===== SAVE =====
  saveFinancement() {
    this.financementLocal = this.financement();
    let financement: any = {
      id: this.financementLocal ? this.financementLocal.id : null,
      libelle: this.finacementSaveForm.value['libelle'],
      montant: this.finacementSaveForm.value['montant'],
      natureBailleurFonds: this.naturesBailleurFonds.find(
        (nature: any) => nature.id === this.finacementSaveForm.value['natureBailleurFonds']
      ),
      schemaInvestissementFinancement: this.schema(),
    };

    this.managementService
      .saveSchemaFinancement(financement)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data != null) {
            this.financementLocal = data;
            this.toastr.success('', 'Financement ajouté avec succès!');
            this.finacementSaveForm.reset();
            this.refresh.emit(data);
          }
        },
        error: (error) => console.error(error),
      });
  }

  // ===== HIDE =====
  hideModal() {
    this.finacementSaveForm.reset();
    this.closed.emit(false);
  }
}
