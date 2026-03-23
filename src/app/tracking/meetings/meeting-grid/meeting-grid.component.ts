import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
} from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
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
import { DocumentUploadComponent } from '../../../tools/document-upload/document-upload.component';
import { MeetingFormComponent } from '../meeting-form/meeting-form.component';
import { DecisionResolutionComponent } from '../decision-resolution/decision-resolution.component';
import { MemberMeetingComponent } from '../member-meeting/member-meeting.component';
import { marked } from 'marked';

@Component({
  selector: 'meeting-grid',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    DocumentUploadComponent,
    MeetingFormComponent,
    DecisionResolutionComponent,
    MemberMeetingComponent,
  ],
  templateUrl: './meeting-grid.component.html',
  styleUrl: './meeting-grid.component.scss',
})
export class MeetingGridComponent implements OnInit {
  projet = input<any>();
  reunions = input<any>();
  membres = input<{ [key: string]: any[] }>();
  decisions = input<any>();
  year = input<number>();
  delete = output<void>();
  refreshMeeting = output<any>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);

  actionnaires: any[] = [];
  administrateurs: any[] = [];
  commisaires_aux_comptes: any[] = [];
  fonds: any[] = [];
  conformite_documentaires: any[] = [];

  meeting: any | undefined;
  decision: any | undefined;
  selectedMeeting: any | undefined;

  sidePanelOpened: boolean = false;

  loading = false;

  isEditMode = false;
  opened: boolean = false;
  membreModalOpened: boolean = false;
  decisionModalOpened: boolean = false;

  ngOnInit(): void {
    this.loadActionnaire();
    this.loadAdministrateursByProject();
    this.loadPcacByProjectAndYear();
    this.loadFondsByProjectAndYear();
    this.loadConformite();
  }

  // Set the projet switch form value
  setProjet(p: any) {
    this.projet = p;
  }

  // Load conformite
  loadConformite() {
    this.managementService
      .findConformitesByTache(5, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: any) => {
        this.conformite_documentaires = data;
      });
  }

  // Display membre modal
  displayMembreModal(membre: any) {
    this.meeting = membre;
    this.membreModalOpened = true;
  }

  loadActionnaire() {
    this.managementService
      .findActionnairesByProjetAndYear(this.projet()?.id, this.year())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.actionnaires = data;
        },
      });
  }

  // Load administrateurs
  loadAdministrateursByProject() {
    this.loading = true;
    this.managementService
      .findAdministrateursByProjet(this.projet()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.administrateurs = data;
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  // On upload success
  onUploadSuccess() {
    this.meeting = null;
  }

  // Load commisaires aux comptes
  loadPcacByProjectAndYear() {
    this.managementService
      .findPcacByProjetAndYear(this.projet()?.id, this.year())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.commisaires_aux_comptes = data;
        },
        complete: () => {},
      });
  }

  // Load fonds
  loadFondsByProjectAndYear() {
    this.managementService
      .findFondByProjectAndYear(this.projet()?.id, this.year())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.fonds = data;
        },
        complete: () => {},
      });
  }

  // Display decision modal
  displayDecisionModal(decision: any) {
    this.meeting = decision;
    this.decisionModalOpened = true;
  }

  // Delete decision
  deleteDecision(decision: any) {
    if (confirm('Veuillez confirmer cette suppression')) {
      this.managementService
        .deleteDecision(decision.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Décision/résoluion supprimée avec succès!');
            const currentDecisions = this.decisions();
            if (currentDecisions && currentDecisions[decision.reunion.id]) {
              currentDecisions[decision.reunion.id] = currentDecisions[
                decision.reunion.id
              ].filter((d: any) => d.id != decision.id);
            }
          },
          complete: () => {},
        });
    }
  }

  // Delete membre
  deleteMembre(membre: any) {
    if (confirm('Veuillez confirmer cette suppression')) {
      this.managementService
        .deleteMembre(membre.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Membre supprimé avec succès!');
            const currentMembres = this.membres();
            if (currentMembres && currentMembres[membre.reunion.id]) {
              currentMembres[membre.reunion.id] = currentMembres[
                membre.reunion.id
              ].filter((m: any) => m.id !== membre.id);
            }
          },
          complete: () => {},
        });
    }
  }

  // Edit decision
  edit(decision: any) {
    this.decision = decision;
    this.opened = true;
  }

  // Delete reunion
  deleteReunion(reunion: any) {
    if (confirm('Veuillez confirmer cette suppression')) {
      this.managementService
        .deleteReunion(reunion.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Réunion supprimé avec succès!');
            this.delete.emit();
          },
          error: (err: any) => {
            this.toastr.error(
              "Erreur lors de la suppression : Veuillez supprimer d'abord les membres et les décisions associées avant de supprimer la réunion."
            );
            console.error('Delete reunion error:', err);
          },
          complete: () => {},
        });
    }
  }

  // Open side panel
  openedSidePanel(reunion: any) {
    this.selectedMeeting = reunion;
    this.sidePanelOpened = true;
  }
  // Show reunion edit modal
  showReunionEditModal(reunion: any) {
    this.isEditMode = true;
    this.meeting = reunion;
  }

  // Handle member saved
  handleMemberSaved({ reunionId, membre }: any) {
    this.membres()?.[reunionId].push(membre);
    this.membreModalOpened = false;
  }

  // Handle decision saved
  handleDecisionSaved({ reunionId, decision }: any) {
    const currentDecisions = this.decisions();
    if (currentDecisions) {
      if (!currentDecisions[reunionId]) {
        currentDecisions[reunionId] = [];
      }
      let index = currentDecisions[reunionId].findIndex(
        (d: any) => d.id == decision.id
      );
      if (index != -1) {
        currentDecisions[reunionId][index] = decision; // Update existing decision
      } else {
        currentDecisions[reunionId].push(decision); // Add new decision
      }
    }

    this.decisionModalOpened = false;
    this.opened = false;
  }

  // Handle reunion updated
  handleReunionUpdated(r: any) {
    let index = this.reunions().findIndex((reunion: any) => reunion.id == r.id);
    if (index != -1) {
      this.reunions()[index] = r;
    } else {
      this.reunions().push(r);
    }
    this.isEditMode = false;
    this.refreshMeeting.emit(r);
  }

  // Format text
  format(text: string): string {
    return text ? text.replace(/\./g, '.<br/>') : '';
  }

  // Equals
  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

  // Format markdown to html
  formatMD2HTML(libelle: string) {
    if (libelle) {
      return marked.parse(libelle);
    }
    return '';
  }
}
