import { CommonModule, DatePipe, formatDate } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  SimpleChanges,
  OnChanges,
  model,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CdsButtonModule,
  CdsIconModule,
  CdsDividerModule,
  CdsInputModule,
} from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'meeting-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
  ],
  providers: [DatePipe],
  templateUrl: './meeting-form.component.html',
  styleUrl: './meeting-form.component.scss',
})
export class MeetingFormComponent implements OnInit, OnChanges {
  projet = model<any>();
  meeting = input<any>();
  refresh = output<any>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly datePipe = inject(DatePipe);

  public reunionSaveForm!: FormGroup;

  types: any[] = [];
  decisions: any[] = [];
  reunions: any[] = [];

  libelle: string = '';

  ngOnInit(): void {
    this.reunionSaveForm = this.fb.group({
      dateReunion: ['', [Validators.required]],
      lieu: ['', [Validators.required]],
      typeReunion: ['', [Validators.required]],
      ordreJour: ['', [Validators.required]],
      remarques: [''],
    });

    this.findTypesReunion();
    if (this.meeting()) {
      this.initForm(this.meeting());
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['meeting'] && this.meeting() && this.reunionSaveForm) {
      this.initForm(this.meeting());
    }
  }

  // Set projet
  setProjet(p: any) {
    this.projet.set(p);
  }

  // Find types reunion
  findTypesReunion() {
    this.managementService
      .findTypesReunion()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: any) => {
        this.types = data;
      });
  }

  // Save reunion
  saveReunion() {
    if (!this.meeting()?.id) {
      const [d1, m1, y1] =
        this.reunionSaveForm?.value['dateReunion'].split('/');
      let reunion = {
        projet: { id: this.projet().id },
        dateReunion: new Date(y1, m1 - 1, d1),
        lieu: this.reunionSaveForm.controls['lieu'].value,
        typeReunion: this.reunionSaveForm.controls['typeReunion'].value,
        ordreJour: this.reunionSaveForm.controls['ordreJour'].value,
        remarques: this.reunionSaveForm.controls['remarques'].value,
      };

      this.managementService.saveReunion(reunion).subscribe({
        next: (data: any) => {
          this.toastr.success('Réunion sauvegardée avec succès !');
          this.refresh.emit(data);
        },
        complete: () => this.reunionSaveForm.reset(),
      });
    } else {
      this.updateReunion();
    }
  }

  // Update reunion
  updateReunion() {
    let reunion: any = {
      id: this.meeting().id,
      projet: { id: this.projet().id },
      dateReunion: this.reunionSaveForm?.value['dateReunion']
        ? new Date(this.reunionSaveForm.value['dateReunion'])
        : new Date(),
      lieu: this.reunionSaveForm.controls['lieu'].value,
      typeReunion: this.reunionSaveForm.controls['typeReunion'].value,
      ordreJour: this.reunionSaveForm.controls['ordreJour'].value,
      remarques: this.reunionSaveForm.controls['remarques'].value,
    };

    this.managementService
      .updateReunion(reunion)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('', 'Réunion mise à jour avec succès!');
          this.refresh.emit(reunion);
        },
        complete: () => {
          this.reunionSaveForm.reset();
        },
      });
  }

  // Init form
  initForm(data: any) {
    console.log('Initializing form with data:', data);

    if (data && this.reunionSaveForm) {
      this.reunionSaveForm.patchValue({
        dateReunion: data?.dateReunion
          ? this.datePipe.transform(new Date(data.dateReunion), 'dd/MM/yyyy')
          : '',
        lieu: data.lieu || '',
        typeReunion: data.typeReunion || '',
        ordreJour: data.ordreJour || '',
        remarques: data.remarques || '',
      });
    } else {
      this.reunionSaveForm.reset();
    }
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }
}
