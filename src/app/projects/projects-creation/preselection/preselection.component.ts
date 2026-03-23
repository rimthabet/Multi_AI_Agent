import { Component, DestroyRef, effect, inject, model, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../services/management.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PreselectionCreateFormComponent } from "./preselection-create-form/preselection-create-form.component";
import { DocumentUploadComponent } from "../../../tools/document-upload/document-upload.component";
import { FinancingPlansComponent } from "./financing-plans/financing-plans.component";
import { DecisionFormComponent } from "./decision-form/decision-form.component";

@Component({
  selector: 'preselection',
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, PreselectionCreateFormComponent, DocumentUploadComponent, FinancingPlansComponent, DecisionFormComponent],
  templateUrl: './preselection.component.html',
  styleUrl: './preselection.component.scss'
})
export class PreselectionComponent implements OnInit {

  // inputs
  prospection = model<any>();
  loading = model<boolean>(false);

  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private router = inject(Router);

  // declarations
  conformite_documentaires: any[] = [];
  financements: any[] = [];


  ngOnInit(): void {
    // this.refusalSaveForm = this.formBuilder.group({
    //   motif: [undefined, [Validators.required]],
    //   date: [undefined, Validators.required],
    // });

    // load data
    this.loadConformiteDocumentaires();
    this.loadFinancements();

    // // Case of refusal
    // if (this.prospection()?.statut == 3) this.loadRefusMotifs();
  }

  loadConformiteDocumentaires() {
    this.managementService
      .findConformitesByTache(2, 5)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.conformite_documentaires = data;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des conformités :', error);
        },
        complete: () => {
          console.log('Chargement des conformités terminé');
        },
      })
  }


  // load financements
  loadFinancements() {
    // recuperation de la liste des financements
    this.managementService
      .findFinancementByProjectId(this.prospection()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.financements = data;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des financements :', error);
        },
        complete: () => {
          console.log('Chargement des financements terminé');
        },
      })
  }


  // project saved
  projectSaved($event: any) {
    this.prospection.set($event);
  }


  // generer pdf
  genererPDF() { }


  // go to fiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/project/' + this.prospection()?.id);
  }

}
