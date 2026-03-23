import { Component, DestroyRef, inject, input, OnInit, model, viewChild } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { ManagementService } from '../../../services/management.service';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinancingSwitchComponent } from "../../../tools/financing-switch/financing-switch.component";
import { DocumentUploadComponent } from "../../../tools/document-upload/document-upload.component";
import { ComiteInterneFormComponent } from './comite-interne-form/comite-interne-form.component';
import { ComiteInterneDocumentGenerationComponent } from "./comite-interne-document-generation/comite-interne-document-generation.component";

@Component({
  selector: 'comite-interne',
  imports: [ClarityModule, CdsModule, FinancingSwitchComponent, DocumentUploadComponent, ComiteInterneFormComponent, ComiteInterneDocumentGenerationComponent],
  templateUrl: './comite-interne.component.html',
  styleUrls: ['./comite-interne.component.scss']
})
export class ComiteInterneComponent implements OnInit {
  // Inputs
  prospection = input<any>();

  // loading
  loading = model<boolean>(false);

  // ViewChild 
  comiteForm = viewChild<ComiteInterneFormComponent>("comiteForm");


  // Injects
  private readonly destroyRef = inject(DestroyRef);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  // Properties
  conformite_documentaires: any[] = [];
  selectedFinancement: any | undefined;
  participations: any[] | undefined;

  // Lifecycle hooks
  ngOnInit(): void {
    this.loadConformiteDocumentaires();
  }

  // loadConformiteDocumentaires
  loadConformiteDocumentaires() {
    this.managementService
      .findConformitesByTache(2, 9)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.conformite_documentaires = data;
        },
        error: (error: any) => {
          console.error(error);
        }
      });
  }

  // loadParticipations
  loadParticipations() {
    if (!this.selectedFinancement?.id) {
      this.participations = [];
      return;
    }
    this.loading.set(true);
    this.managementService
      .findParticipationFondsByFinancement(this.selectedFinancement.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.participations = data;
        },
        error: (error: any) => {
          console.error(error);
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
        }
      });
  }

  // financementChanged
  financementChanged($event: any) {
    if (!$event) {
      this.selectedFinancement = undefined;
      return;
    }
    this.selectedFinancement = $event;
    this.loadParticipations();
  }


  // goToFiche
  goToFiche() {
    this.router.navigateByUrl('/dashboard/project/' + this.prospection()?.id);
  }

}
