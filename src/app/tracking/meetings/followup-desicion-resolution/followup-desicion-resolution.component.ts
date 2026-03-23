import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { DecisionResolutionComponent } from '../decision-resolution/decision-resolution.component';
import { marked } from 'marked';
import { EditableFieldComponent } from '../../../widgets/editable-field/editable-field.component';


@Component({
  selector: 'followup-desicion-resolution',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    DecisionResolutionComponent,
  ],
  templateUrl: './followup-desicion-resolution.component.html',
  styleUrl: './followup-desicion-resolution.component.scss'
})
export class FollowupDesicionResolutionComponent {

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  projets: any[] | undefined;
  reunions: any | undefined;
  decisions: { [key: string]: any[] } = {};
  etats: any[] = [];
  etats_rejets: any[] = [];
  votes: any[] = [];

  selectedProjet: any | undefined;
  selectedDecision: any | undefined;
  loading = false;
  etatChangeModalOpened: boolean = false;
  opened: boolean = false;
  actionsModalOpened: boolean = false;

  public etatForm!: FormGroup;
  public actionForm!: FormGroup;
  public decisionSaveForm!: FormGroup;

  ngOnInit(): void {

    this.etatForm = this.fb.group({
      etat: ['', [Validators.required]],
    });

    this.actionForm = this.fb.group({
      action: [''],
    });

    this.decisionSaveForm = this.fb.group({
      libelle: ['', [Validators.required]],
      typeVote: ['', [Validators.required]],
      reserve: ['', [Validators.required]],
    });

    this.loadProjets();
  }


  // Load the projects
  loadProjets() {
    this.loading = true;
    this.managementService.findProjets(5).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.projets = data;
        let lastSelectedProject = sessionStorage.getItem('LastVisitedProject');
        if (lastSelectedProject) {
          lastSelectedProject = this.projets?.filter(
            (p: any) => lastSelectedProject == p.id
          )[0];
          this.setProjet(lastSelectedProject);
        } else this.setProjet(data[0]);

        this.projets?.sort((a: any, b: any) => {
          if (a.nom > b.nom) return 1;
          if (a.nom < b.nom) return -1;
          return 0;
        });
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Projets non chargés!');
      },
      complete: () => {
        this.loading = false;
      }
    });
  }


  // Set the projet switch form value
  setProjet(p: any) {
    this.selectedProjet = p;
    sessionStorage.setItem('LastVisitedProject', p.id);
    this.loadMeetings();
  }

  // Load meetings
  loadMeetings() {
    this.managementService.findReunions(this.selectedProjet?.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.reunions = data;
        this.reunions.forEach((reunion: any) => {
          this.loadDecisionsResolutions(reunion.id);
          this.loadEtat();
          this.findTypesVote();
        });
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Réunions non chargées!');
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  // Load types vote
  findTypesVote() {
    this.managementService.findTypesVote().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.votes = data;
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Types de vote non chargés!');
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  // Load etats
  loadEtat() {
    this.managementService.findEtatsReunions().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        data.sort((e1: any, e2: any) =>
          e1.libelle > e2.libelle ? 1 : e1.libelle < e2.libelle ? -1 : 0
        );
        this.etats = data.filter(
          (e: any) =>
            !(e.libelle as string).toLowerCase().startsWith('rejeté')
        );
        this.etats_rejets = data.filter((e: any) =>
          (e.libelle as string).toLowerCase().startsWith('rejeté')
        );
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'États non chargés!');
      },
      complete: () => {
        this.loading = false;
      }
    })

  }

  // Load decisions
  loadDecisionsResolutions(id: any) {
    this.managementService.findDecisions(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.decisions[id] = data;
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Décisions non chargées!');
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  // Update decision
  updateDecision(data: any) {
    this.loading = true;
    data.action = this.actionForm.controls['action'].value;
    this.managementService.updateDecision(data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.toastr.success('Décision/résoluion mise à jour avec succès!');
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Décisions non chargées!');
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  // Update etat avancement decision
  updateEtatAvancementDecision(data: any) {
    data.etatAvancement = this.etatForm.controls['etat'].value;
    this.updateDecision(data);
  }

  // Display etat change modal
  displayEtatChangeModal(decision: any) {
    this.selectedDecision = decision;
    this.etatForm.setValue({
      etat: decision?.etatAvancement ? decision?.etatAvancement : '',
    });
    this.etatChangeModalOpened = true;
  }

  // Display actions modal
  displayActionsModal(decision: any) {
    this.selectedDecision = decision;
    this.actionForm.setValue({
      action: decision?.action ? decision?.action : '',
    });
    this.actionsModalOpened = true;
  }

  // Edit decision
  edit(decision: any) {
    this.selectedDecision = decision;
    this.opened = true;
  }

  // Delete decision
  deleteDecision(decision: any) {
    if (confirm('Veuillez confirmer cette suppression')) {
      this.managementService.deleteDecision(decision.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.toastr.success('Décision/résoluion supprimée avec succès!');
          this.decisions[decision.reunion.id] = this.decisions[
            decision.reunion.id
          ].filter((d) => d.id != decision.id);
        },
        complete: () => { },
      })
    }
  }

  // Handle decision saved
  handleDecisionSaved({ reunionId, decision }: any) {

    console.log({ reunionId, decision });


    if (!this.decisions[reunionId]) {
      this.decisions[reunionId] = [];
    }
    let index = this.decisions[reunionId].findIndex((d) => d.id == decision.id);
    if (index != -1) {
      this.decisions[reunionId][index] = decision; // Update existing decision
    } else {
      this.decisions[reunionId].push(decision); // Add new decision
    }

    this.opened = false;
  }

  // Go to fiche
  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/projects/' + this.selectedProjet?.id
    );
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

  formatMD2HTML(libelle: string) {

    return marked.parse(libelle ?? '');
  }
}


