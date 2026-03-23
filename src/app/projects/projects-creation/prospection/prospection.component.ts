import {
  Component,
  DestroyRef,
  inject,
  input,
  output,
  ViewChildren,
  QueryList,
  OnInit,
  signal,
  model,
} from '@angular/core';
import { CdsModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ProspectionCreateFormComponent } from './prospection-create-form/prospection-create-form.component';
import { DocumentUploadComponent } from "../../../tools/document-upload/document-upload.component";
import { ProjectPublicDataComponent } from "./project-public-data/project-public-data.component";
import { ProspectionCreateFormV2Component } from "./prospection-create-form-v2/prospection-create-form-v2.component";

@Component({
  selector: 'prospection',

  imports: [
    ClarityModule,
    CdsModule,
    DocumentUploadComponent,
    // ProspectionCreateFormComponent,
    ProjectPublicDataComponent,
    ProspectionCreateFormV2Component
  ],
  templateUrl: './prospection.component.html',
  styleUrl: './prospection.component.scss'
})
export class ProspectionComponent implements OnInit {

  // Signal input
  prospection = model<any>();

  // loading
  loading = model<boolean>(false);

  // View children for document upload refresh
  @ViewChildren('docUpload') docUploads!: QueryList<DocumentUploadComponent>;

  // Injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  conformite_documentaires: any[] = [];

  ngOnInit(): void {
    this.loadConformiteDocumentaires();
  }

  //////// Loading data functions
  loadConformiteDocumentaires() {
    this.managementService
      .findConformitesByTache(2, 4)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.conformite_documentaires = data;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des conformités :', error);
        }
      });
  }

  // Navigate to fiche
  goToFiche() {
    const p = this.prospection();
    if (p?.id) {
      this.router.navigateByUrl('/dashboard/project/' + p.id);
    }
  }
}
