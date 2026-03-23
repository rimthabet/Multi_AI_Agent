import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, input, OnInit, output, effect } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'decision-resolution',
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
  templateUrl: './decision-resolution.component.html',
  styleUrl: './decision-resolution.component.scss'
})
export class DecisionResolutionComponent implements OnInit {

  reunion = input<any>();
  decision = input<any>();
  refresh = output<any>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  public decisionSaveForm!: FormGroup;
  votes: any[] = [];

  constructor() {
    //signals
    effect(() => {
      const decision = this.decision();
      if (decision && this.votes.length > 0) {
        this.editForm(decision);
      }
    });
  }

  ngOnInit(): void {
    this.decisionSaveForm = this.fb.group({
      libelle: ['', [Validators.required]],
      typeVote: ['', [Validators.required]],
      reserve: [''],
    });

    this.findTypesVote();

    //change type vote
    this.decisionSaveForm.get('typeVote')?.valueChanges.subscribe((value) => {
      if (value && value.libelle.toLowerCase() === 'avec réserve') {
        this.decisionSaveForm
          .get('reserve')
          ?.setValidators([Validators.required]);
      } else {
        this.decisionSaveForm.get('reserve')?.clearValidators();
      }
      this.decisionSaveForm.get('reserve')?.updateValueAndValidity();
    });
  }

  //find types vote
  findTypesVote() {
    this.managementService.findTypesVote().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.votes = data;
        //If we have a decision to edit and the votes are now loaded
        const decision = this.decision();
        if (decision) {
          this.editForm(decision);
        }
      },
    })
  }

  //save decision
  saveDecision() {
    if (!this.decision()?.id) {
      //Create a new decision
      let decision = {
        libelle: this.decisionSaveForm.value['libelle'],
        typeVote: this.decisionSaveForm.value['typeVote'],
        reserve: this.decisionSaveForm.value['reserve'],
        reunion: { id: this.reunion()?.id },
      };

      this.managementService.saveDecision(decision).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.toastr.success('Décision sauvegardée avec succès');
          this.refresh.emit({ reunionId: this.reunion()?.id, decision: data });
        },
        error: (err) => {
          console.error('Erreur lors de la sauvegarde de la décision:', err);
        },
        complete: () => this.decisionSaveForm.reset(),
      });
    } else {
      //Update an existing decision
      this.updateDecisionResolution();
    }
  }

  //edit form
  editForm(decision: any) {
    if (decision && this.votes.length > 0) {
      const selectedVote = this.votes.find((vote) => vote.id == decision.typeVote?.id);
      this.decisionSaveForm.patchValue({
        libelle: decision?.libelle || '',
        typeVote: selectedVote || null,
        reserve: decision?.reserve || '',
      });
    }
  }

  //update decision resolution
  updateDecisionResolution() {
    const currentDecision = this.decision();
    let decision = {
      id: currentDecision?.id,
      libelle: this.decisionSaveForm.controls['libelle'].value,
      typeVote: this.decisionSaveForm.controls['typeVote'].value,
      reserve: this.decisionSaveForm.controls['reserve'].value,
      reunion: { id: this.reunion()?.id },
    };

    this.managementService.updateDecision(decision).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.toastr.success('Décision modifiée avec succès');
        this.refresh.emit({ reunionId: this.reunion()?.id, decision: data });
      },
      error: (err) => {
        console.error('Erreur lors de la modification de la décision:', err);
        this.toastr.error('Erreur lors de la modification');
      },
      complete: () => {
        this.decisionSaveForm.reset();
      },
    });
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }
}
