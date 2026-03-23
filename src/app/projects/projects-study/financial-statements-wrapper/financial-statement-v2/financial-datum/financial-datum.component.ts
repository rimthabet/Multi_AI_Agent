import { Component, DestroyRef, inject, input, OnInit, ViewChild, ElementRef, effect } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { FinStatementService } from '../../../../../services/fin-statement.service';

@Component({
  selector: 'financial-datum',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule
  ],
  templateUrl: './financial-datum.component.html',
  styleUrl: './financial-datum.component.scss'
})
export class FinancialDatumComponent {

  @ViewChild('editInput') editInput!: ElementRef<HTMLInputElement>;

  finEntity = input<any>();
  finDatum = input<any>();

  years = input<number>(-1);
  row = input<number>(-1);

  autonomous = input<boolean>(true);
  readonly = input<boolean>(false);

  private readonly finStatementService = inject(FinStatementService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);

  value: any = 0;
  control = new FormControl(this.value);
  firstCall: boolean = true;
  persistent: boolean = true;
  isEditing: boolean = false;

  // Utilitaire pour valider la valeur numérique
  isValidNumber(val: any): boolean {
    return val !== null && val !== undefined && !isNaN(val) && isFinite(val);
  }

  // Load data
  loadData(highlight: boolean) {

    // Only autonomous mode loads data from back end
    if (!this.autonomous) return;

    if (!this.finDatum()?.ref1) {
      this.value = 0;
      this.control.setValue(this.value);
      return;
    }

    this.finStatementService
      .fetchDatum2(
        this.finDatum()?.ref1,
        this.finDatum()?.ref2,
        this.finEntity(),
        this.finDatum()?.year,
        this.years(),
        this.row(),
        this.persistent
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (datum: any) => {
          let val = datum?.value;
          if (!this.isValidNumber(val)) {
            val = 0; // valeur par défaut si invalide
          }
          this.value = val;
          this.control.setValue(this.value);

          if (highlight)
            this.toastr.info(
              this.finEntity()?.code +
              ' : Donnée mise à jour avec la dernière formule !',
              '',
              { timeOut: 500 }
            );
        },
        error: () => {
          this.value = 0;
          this.control.setValue(this.value);
        }
      })
  }

  //Update 
  update() {
    if (isNaN(this.value) || this.value === this.control.value) return;

    if (this.control.value == null || isNaN(this.control.value)) {
      this.control.setValue(this.value);
      this.toastr.error('Valeur erronée !');
      return;
    }

    this.value = this.control.value;

    let finDatum = {
      entity: this.finEntity(),
      value: this.finDatum()?.value,
      year: this.finDatum().year,
      ref1: this.finDatum().ref1,
      ref2: this.finDatum().ref2,
    };

    let datumBuffer = {
      finDatum: finDatum,
      ref1: this.finDatum()?.ref1,
      ref2: this.finDatum()?.ref2,
      ref3: this.finDatum()?.ref3,
      ref4: this.finDatum()?.ref4,
      ref5: this.finDatum()?.ref5,
    };

    this.finStatementService.saveDatum(datumBuffer).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.toastr.success(this.finEntity()?.code + ' : Donnée enregistrée !', '', {
          timeOut: 500,
        });

        this.finStatementService.setUpdatedEntity(this.finEntity());
      },
      error: () => {
      }
    })
  }

  //Cancel
  cancel() {
    this.control.setValue(this.value);
  }

  //new methods for inline editing
  startEdit() {
    this.isEditing = true;
    this.control.setValue(this.value);

    setTimeout(() => {
      if (this.editInput) {
        this.editInput.nativeElement.focus();
        this.editInput.nativeElement.select();
      }
    }, 0);
  }

  saveEdit() {
    this.update();
    this.isEditing = false;
  }

  cancelEdit() {
    this.cancel();
    this.isEditing = false;
  }
}
