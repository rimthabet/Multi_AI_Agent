import { Component, DestroyRef, inject, OnInit, viewChildren } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { DocumentUploadComponent } from "../../tools/document-upload/document-upload.component";
import { ManagementService } from '../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FundsStatutoryAuditorsFormComponent } from "./funds-statutory-auditors-form/funds-statutory-auditors-form.component";
import { FundsSubcriptionCreateFormComponent } from "./funds-subcription-create-form/funds-subcription-create-form.component";
import { FundsReviewFormComponent } from "./funds-review-form/funds-review-form.component";
import { FundsCreateFormV2Component } from "./funds-create-form-v2/funds-create-form-v2.component";
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-funds-creation',

  imports: [ClarityModule, CdsModule, DocumentUploadComponent, FundsStatutoryAuditorsFormComponent, FundsSubcriptionCreateFormComponent, FundsReviewFormComponent, FundsCreateFormV2Component],
  templateUrl: './funds-creation.component.html',
  styleUrl: './funds-creation.component.scss'
})
export class FundsCreationComponent implements OnInit {

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);

  // ===== PROPERTIES =====
  fund: any | undefined;
  conformite_documentaires: any[] = [];

  loading: boolean = false;

  // ===== INITIALIZE =====
  ngOnInit(): void {
    this.loadConformiteDocumentaires();
  }

  /// LOAD CONFORMITE DOCUMENTAIRES
  loadConformiteDocumentaires() {

    this.loading = true;
    this.managementService.findConformitesByTache(1, 1).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.conformite_documentaires = data;
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Conformités non chargées!');
      },
      complete: () => {
        this.loading = false;
      },
    })
  }

}
