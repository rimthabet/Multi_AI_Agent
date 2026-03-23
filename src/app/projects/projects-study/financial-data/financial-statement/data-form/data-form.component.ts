import { Component, DestroyRef, inject, input, OnInit, ViewChild, ElementRef, effect } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { FinStatementService } from '../../../../../services/fin-statement.service';

@Component({
  selector: 'data-form',
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
  templateUrl: './data-form.component.html',
  styleUrl: './data-form.component.scss'
})
export class DataFormComponent implements OnInit {

  @ViewChild('editInput') editInput!: ElementRef<HTMLInputElement>;

  ref2 = input<number>(-1);
  ref3 = input<number>(-1);
  ref4 = input<number>(-1);
  ref5 = input<number>(-1);
  prospection = input<any>()
  data = input<any>();
  item = input<any>();
  year = input<any>();
  years = input<number>(-1);
  row = input<number>(-1);
  readonly = input<boolean>(false);

  private readonly finStatementService = inject(FinStatementService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);

  value: any = 0;
  control = new FormControl(this.value);
  firstCall: boolean = true;
  persistent: boolean = true;
  isEditing: boolean = false;

  private currentProspectionId: any = null;

  constructor() {
    // Effet combiné: Changement de prospection ou d'année
    effect(() => {
      const currentProspection = this.prospection();
      const currentYear = this.year();

      const prospectionChanged = currentProspection && this.currentProspectionId !== currentProspection?.id;

      const yearChanged = !this.firstCall && currentYear;

      if (prospectionChanged) {
        this.currentProspectionId = currentProspection?.id;
        if (!this.firstCall) {
          this.loadData(false);
        }
      } else if (yearChanged) {
        this.loadData(false);
      }
    });
  }


  ngOnInit(): void {
    this.currentProspectionId = this.prospection()?.id;
    this.loadData(false);

    if (!this.item().input) {
      this.finStatementService.updatedEntity.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (e: any) => {

          // To avoid the first rendering of the cell
          if (!this.firstCall) {
            let flat_formula = this.item().flatFormula;
            if ((flat_formula as string).indexOf('[' + e.code + ']') >= 0)
              this.loadData(true);
          }
        },
      })

      this.finStatementService.saveEvent.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((year: any) => {
        if (this.year() == year && !this.firstCall) {
          this.update();
        }
      });

      this.finStatementService.refreshEvent.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((year: any) => {
        if (this.year() == year && !this.firstCall) {
          this.persistent = false;
          this.loadData(false);
        }
      });
    }

    this.firstCall = false;
  }

  // Utilitaire pour valider la valeur numérique
  isValidNumber(val: any): boolean {
    return val !== null && val !== undefined && !isNaN(val) && isFinite(val);
  }

  // Load data
  loadData(highlight: boolean) {
    if (!this.prospection()?.id) {
      this.value = 0;
      this.control.setValue(this.value);
      return;
    }

    this.finStatementService
      .fetchDatum2(
        this.prospection()?.id,
        this.ref2(),
        this.item(),
        this.year(),
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
              this.item()?.code +
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
      entity: this.item(),
      value: this.value,
      year: this.year(),
      ref1: this.prospection()?.id,
      ref2: this.ref2(),
    };

    let datumBuffer = {
      finDatum: finDatum,
      ref1: this.prospection()?.id,
      ref2: this.ref2(),
      ref3: this.ref3(),
      ref4: this.ref4(),
      ref5: this.ref5(),
    };

    this.finStatementService.saveDatum(datumBuffer).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.toastr.success(this.item()?.code + ' : Donnée enregistrée !', '', {
          timeOut: 500,
        });

        this.finStatementService.setUpdatedEntity(this.item());
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
