import { Component, DestroyRef, inject, viewChild } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { DocumentUploadComponent } from "../../tools/document-upload/document-upload.component";
import { FinancingSwitchComponent } from "../../tools/financing-switch/financing-switch.component";

@Component({
  selector: 'app-investments-documents-collecting',

  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, DocumentUploadComponent, FinancingSwitchComponent],
  templateUrl: './investments-documents-collecting.component.html',
  styleUrl: './investments-documents-collecting.component.scss'
})
export class InvestmentsDocumentsCollectingComponent {


  // view child
  documentUpload = viewChild.required<DocumentUploadComponent>("documentUpload");

  // injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);


  projets: any[] | undefined;
  conformite_documentaires: any[] | undefined;

  financement: any | undefined;
  selectedProjet: any | undefined;
  selectedFonds: any | undefined;

  // methods
  ngOnInit(): void {

    this.loadProjects();
    this.loadConformiteDocuments();
  }

  // Select project
  selectProject(p: any): void {
    this.selectedProjet = p;
    sessionStorage.setItem('LastVisitedProject', p.id);
  }

  loadProjects() {
    this.managementService.findProjets(5).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.projets = data;
        let lastSelectedProject = sessionStorage.getItem('LastVisitedProject');
        if (lastSelectedProject) {
          lastSelectedProject = this.projets?.filter(
            (p: any) => lastSelectedProject == p.id
          )[0];
          this.selectProject(lastSelectedProject);
        } else this.selectProject(data[0]);
      },
      error: (data: any) => console.log(data),
    })
  }

  // Load the documents, executed once
  loadConformiteDocuments() {
    this.managementService
      .findConformitesByTache(3, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.conformite_documentaires = data;
        },
        error: (data: any) => console.log(data),
      })

  }

  // Financement changed
  financementChanged($event: any) {
    if ($event !== '') {
      this.financement = $event;
      this.selectedFonds = this.financement.fonds[0];
    }
  }

  selectFonds(fonds: any) {
    this.selectedFonds = fonds;
  }

  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/projects/' + this.selectedProjet?.id
    );
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

}
