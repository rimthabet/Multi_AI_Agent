import { Component, DestroyRef, effect, inject, input, OnInit } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DatePipe } from '@angular/common';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'funds-subcription-create-form',
 
  imports: [ClarityModule, CdsModule, DatePipe, FormsModule, ReactiveFormsModule],
  templateUrl: './funds-subcription-create-form.component.html',
  styleUrl: './funds-subcription-create-form.component.scss'
})
export class FundsSubcriptionCreateFormComponent implements OnInit {
  // ===== INPUTS =====
  fonds = input<any>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);

  periodeList: any[] = [];

  subscriptionForm!: FormGroup;

  ngOnInit() {
    this.subscriptionForm = this.formBuilder.group({
      periode1: [null, Validators.required],
      periode2: [null, Validators.required],
    });


  }

  readonly fondsEffect = effect(() => {
    const currentFonds = this.fonds();
    if (currentFonds) {
      this.loadPeriodes(currentFonds);
    }
  },);

  loadPeriodes(data: any) {
    this.managementService
      .findPeriodeSouscriptionByFonds(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.periodeList = data ?? [];
        },
        error: (error) => {
          this.periodeList = [];
        },
      });
  }


  addPeriode() {
    const { periode1, periode2 } = this.subscriptionForm.value;

    if (!periode1 || !periode2) return;

    this.managementService
      .addSubscriptionPeriode(this.fonds(), periode1, periode2)
      .subscribe({
        next: () => {
          this.toastr.success(
            'Ajout de périodes',
            "L'ajout de la période s'est passé avec succès"
          );
          this.loadPeriodes(this.fonds());
          this.subscriptionForm.reset();
        },
        error: (error) => console.error(error),
      });
  }

  deletePeriode(id: any) {
    if (confirm('Veuillez confirmer cette suppression')) {
      this.managementService
        .deleteSubscriptionPeriode(id)
        .subscribe({
          next: () => {
            this.toastr.success(
              'Suppression de périodes',
              "La suppression de la période s'est passée avec succès"
            );
            this.loadPeriodes(this.fonds());
          },
          error: (error) => console.error(error),
        });
    }
  }
}
