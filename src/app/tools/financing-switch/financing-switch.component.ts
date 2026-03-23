import { Component, DestroyRef, EventEmitter, inject, input, OnInit, output, viewChild, effect } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DecimalPipe } from '@angular/common';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'financing-switch',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, DecimalPipe, DatePipe],
  templateUrl: './financing-switch.component.html',
  styleUrl: './financing-switch.component.scss'
})
export class FinancingSwitchComponent implements OnInit {

  // inputs
  prospection = input<any>();
  message = input<any>();

  // outputs
  financementChanged = output<EventEmitter<any>>();

  // injects
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly destroyRef = inject(DestroyRef);

  // forms
  financementForm!: FormGroup;

  // data for select
  financements: any[] = [];

  // loading
  loading: boolean = false;

  ngOnInit(): void {

    /// init form
    this.financementForm = this.formBuilder.group({
      financement: [undefined, [Validators.required]],
    });

    /// subscribe to financement changes
    this.financementForm.controls['financement'].valueChanges.subscribe(
      (value: any) => {
        if (value != undefined) {
          this.financementChanged.emit(value);
        }
      }
    )
  }


  // load financements
  loadFinancements() {
    this.loading = true;
    if (!this.prospection) {
      this.toastr.error('Prospection non trouvée', 'Erreur');
      return;
    }


    this.managementService
      .findFinancementByProjectId(this.prospection()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.financements = data?.filter((financement: any) => financement.statut === 'APPROUVE');
          try {
            this.financementForm?.controls['financement']?.patchValue(this.financements[0]);
          } catch { }
        },
        error: (data: any) => console.log(data),
        complete: () => {
          this.loading = false;
        }
      });
  }

  // effect to load financements
  readonly prospectionEffect = effect(() => {
    if (this.prospection()) {
      this.loadFinancements();
    }
  });

}

