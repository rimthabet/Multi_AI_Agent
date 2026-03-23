import { Component, DestroyRef, inject, model, OnInit, viewChild, viewChildren } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FundsSubcriptionCreateFormComponent } from "../funds-creation/funds-subcription-create-form/funds-subcription-create-form.component";
import { FundsStatutoryAuditorsFormComponent } from "../funds-creation/funds-statutory-auditors-form/funds-statutory-auditors-form.component";
import { DocumentUploadComponent } from "../../tools/document-upload/document-upload.component";
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../services/management.service';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FundsCreateFormV2Component } from "../funds-creation/funds-create-form-v2/funds-create-form-v2.component";

@Component({
  selector: 'app-funds-edition',
  imports: [ClarityModule, CdsModule, FundsSubcriptionCreateFormComponent, FundsStatutoryAuditorsFormComponent, DocumentUploadComponent, FundsCreateFormV2Component],
  templateUrl: './funds-edition.component.html',
  styleUrl: './funds-edition.component.scss'
})
export class FundsEditionComponent implements OnInit {

  // ===== DEPENDENCIES =====
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly router = inject(Router);


  // ===== PROPERTIES =====
  funds: any[] = [];
  documents: any[] = [];
  selectedFonds: any | undefined;

  fund_id: number = -1;
  conformite_documentaires: any[] = [];

  loading: boolean = false

  ngOnInit(): void {
    this.loadFund();
  }


  loadFund() {

    this.loading = true;

    const id = this.activatedRoute.snapshot.paramMap.get('id');
    this.managementService
      .findFondsById(Number(id))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (fondsData: any) => {
          this.selectedFonds = fondsData.fonds;
          this.documents = fondsData.documents;
          this.conformite_documentaires = fondsData.conformites;
        },
        error: (error) => {
          this.toastr.error('Erreur de chargement!', 'Fonds non chargé!');
          console.error(error);
        },
        complete: () => {
          this.loading = false;
        }
      });
  }



  validerFonds() {
    this.managementService
      .validationFonds(this.selectedFonds.id)
      .subscribe((data: any) => {
        if (data != null)
          this.toastr.success(
            'Fonds appouvé avec Succès!',
            'Fonds appouvé avec Succès!'
          );
        else this.toastr.error('', 'Error!');
      });
  }

  // Go to fund fiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/funds/' + this.selectedFonds.id);
  }

}
