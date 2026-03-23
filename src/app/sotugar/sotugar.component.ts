import { Component, DestroyRef, inject, input, OnInit, viewChild } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../services/management.service';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DocumentUploadComponent } from '../tools/document-upload/document-upload.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HorizontalScrollerComponent } from "../widgets/horizontal-scroller/horizontal-scroller.component";
import { NgxGaugeModule } from 'ngx-gauge';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-sotugar',
 
  imports: [ClarityModule, CdsModule, FormsModule, ReactiveFormsModule, HorizontalScrollerComponent, NgxGaugeModule, DecimalPipe, DatePipe, RouterLink, DocumentUploadComponent, CurrencyPipe],
  providers: [DatePipe],
  templateUrl: './sotugar.component.html',
  styleUrl: './sotugar.component.scss'
})
export class SotugarComponent implements OnInit {
  projet = input<any>();

  sotugarActionDocUpload = viewChild.required<DocumentUploadComponent>("sotugar_action_doc_upload");
  sotugarOcaDocUpload = viewChild.required<DocumentUploadComponent>("sotugar_oca_doc_upload");
  uploadSotugarPaiementDocument = viewChild<DocumentUploadComponent>("upload_sotugar_paiement_document");

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);
  private readonly datePipe = inject(DatePipe);

  fonds: any[] | undefined;
  liberations: any[] = [];
  sotugars: any[] = [];

  selectedLiberation: any;
  selectedFonds: any;
  selectedProject: any;
  selectedFinancement: any;

  dateDeDmandeGarantie: any;
  sotugar_conformite_actions_documentaire: any[] = [];
  sotugar_conformite_oca_documentaire: any[] = [];

  reg_sotugar_conformite_actions_documentaire: any[] = [];
  reg_sotugar_conformite_oca_documentaire: any[] = [];

  investissement_conformite_documentaire: any[] = [];
  opened: boolean = false;
  showUploadRegSotugar: boolean = false;
  loading: boolean = true;
  conformite_documentaires: any;

  // Side panel control
  editSidePanelOpened: boolean = false;

  // Forms


  detailsSaveForm: FormGroup = this.fb.group({
    dateDecision: [null, [Validators.required]],
    montantARegler: [undefined, [Validators.required]],
    pourcentageDeGarantie: [undefined, [Validators.required]],
    pourcentageDeContribution: [undefined, [Validators.required]],
    acceptee: [true, [Validators.required]],
  });

  dateSaveForm: FormGroup = this.fb.group({
    dateEnvoiDemande: [null, [Validators.required]],
  });

  decisions: any[] = [
    { label: 'ACCEPTATION', value: true },
    { label: 'REFUS', value: false },
  ];

  colors: string[] = [
    'var(--clr-color-action-600)',
    'var(--clr-color-success-400)',
    'var(--clr-color-warning-400)',
    'var(--cds-alias-status-alt)',
    'var(--cds-alias-status-danger-dark)',
  ];


  // Lifecycle hooks
  ngOnInit(): void {
    this.loadFunds();

    // Load conformites
    this.managementService
      .findConformitesByTache(3, 0)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.investissement_conformite_documentaire = data;
        },
        error: (data: any) => console.log(data),
      })




    // Load conformites
    this.managementService
      .findConformitesByTache(4, 1)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.sotugar_conformite_actions_documentaire = data;
          this.reg_sotugar_conformite_actions_documentaire = data.filter(
            (d: any) => d.documentType?.libelle == 'Ordre de virement / Chèque'
          );
        },
        error: (data: any) => console.log(data),
      })

    // Load conformites
    this.managementService
      .findConformitesByTache(4, 2)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.sotugar_conformite_oca_documentaire = data;
          this.reg_sotugar_conformite_oca_documentaire = data.filter(
            (d: any) => d.documentType?.libelle == 'Ordre de virement / Chèque'
          );
        },
        error: (data: any) => console.log(data),
      })

    // Listen to pourcentageDeContribution changes
    this.detailsSaveForm.controls[
      'pourcentageDeContribution'
    ].valueChanges.subscribe((value: number) => {
      let montantLiberation = this.selectedLiberation?.montantLiberation || 0;
      let nouveauMontantARegler = (value / 100) * montantLiberation;
      this.detailsSaveForm.patchValue({
        montantARegler: nouveauMontantARegler,
      });
    });
  }

  // Load funds
  loadFunds() {
    this.managementService.findFondsList()
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.fonds = data;
          let lastVisitedFunds = sessionStorage.getItem('LastVisitedFunds');

          if (lastVisitedFunds) {
            let selectedFond = this.fonds?.find(
              (fond: any) => fond.id == lastVisitedFunds
            );

            if (selectedFond) {
              this.selectedFonds = selectedFond;
            } else {
              this.selectedFonds = data[0];
              sessionStorage.setItem('LastVisitedFunds', data[0].id);
            }

            this.loadFondsLiberationsAndSotugar(this.selectedFonds.id);

          } else {
            this.selectedFonds = data[0];
            sessionStorage.setItem('LastVisitedFunds', data[0].id);
          }

          this.switchTheFund(this.selectedFonds);
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Fonds non chargés!');
        }
      })
  }

  // Switch the fund
  switchTheFund(fund: any) {
    this.loading = true;
    this.selectedFonds = fund;
    this.loadFondsLiberationsAndSotugar(fund.id);
    sessionStorage.setItem('LastVisitedFunds', fund.id);
  }

  // Load fonds liberations and sotugars
  loadFondsLiberationsAndSotugar(id: any) {

    this.loading = true;

    this.managementService.findFondsLiberation(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        data.forEach((p: any) => {
          p.rows = 1;
          p.pfcp.part = (p.pfcp.part * 100.0).toFixed(2);
          p.totalLibere = 0;

          p.flrl.forEach((f: any) => {
            // Conformite Array
            f.conformite = this.investissement_conformite_documentaire?.map(
              (c: any) => {
                return {
                  conformite: c,
                  docType: c.documentType,
                  exist: false,
                  chemin: '',
                };
              }
            );

            f.rows = 1;
            f.rows += f.libA ? f.libA?.length : 0;
            f.rows += f.libO ? f.libO?.length : 0;
            f.rows += f.libC ? f.libC?.length : 0;
            p.rows += f.rows;

            f.totalLibere = 0;
            f.libA?.forEach((lib: any) => {
              f.totalLibere += lib.montantLiberation;
              lib.type = 'Actions';
            });
            f.libO?.forEach((lib: any) => {
              f.totalLibere += lib.montantLiberation;
              lib.type = 'OCA';
            });
            f.libC?.forEach((lib: any) => {
              f.totalLibere += lib.montantLiberation;
              lib.type = 'CCA';
            });
            p.totalLibere += f.totalLibere;

            f.total = 0;
            try {
              f.total += f.libA[0].souscription?.montant;
            } catch { }
            try {
              f.total += f.libO[0].souscription?.montant;
            } catch { }
            try {
              f.total += f.libC[0].souscription?.montant;
            } catch { }

            // Managing existant and missing docs
            f.fin?.documents?.forEach((d: any) => {
              let c: any = f.conformite.find(
                (cd: any) => cd.docType.id == d.type.id
              );
              if (c) {
                c.exist = true;
                c.chemin = d.chemin;
              }
            });
          });
        });

        this.liberations = data
          .filter((p: any) => p.totalLibere > 0)
          .sort((p1: any, p2: any) => {
            if (p1.projet.nom > p2.projet.nom) return 1;
            if (p1.projet.nom < p2.projet.nom) return -1;
            return 0;
          });

        this.loadFondsSotugar(id);


      },
      complete: () => {
        this.loading = false;
      },
      error: (data: any) => console.log(data),
    })
  }

  // Load fonds sotugar
  loadFondsSotugar(id: any) {
    ////// ACTION
    this.managementService
      .findSotugarByFonds(id, 'action')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.liberations?.forEach((p: any) => {
            p.flrl.forEach((f: any) => {
              f.libA?.forEach((lib: any) => {
                if (data) {
                  lib.sotugar = data.filter(
                    (s: any) => s.liberation.id == lib.id
                  )[0];
                }
              });
            });
          });
        },
        error: (data: any) => console.log(data),
      })

    ////// OCA SOTUGAR
    this.managementService
      .findSotugarByFonds(id, 'oca')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.liberations?.forEach((p: any) => {
            p.flrl.forEach((f: any) => {
              f.libO?.forEach((lib: any) => {
                if (data) {
                  lib.sotugar = data.filter(
                    (s: any) => s.liberation.id == lib.id
                  )[0];
                  lib.sotugarPayee = lib.sotugar?.payee;
                }
              });
            });
          });
        },
        error: (data: any) => console.log(data),
      })
  }

  // Set ineligible
  setIneligible(lib: any, $event: any): void {
    lib.ineligible = $event.target.checked;
    this.managementService
      .updateInvLiberationAction({
        id: lib.id,
        ineligible: $event.target.checked,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success(
            '',
            'Liberation actions mise à jour avec succès'
          );
        },
        error: (data: any) => { },
      })
  }

  // Set payee
  setPayee(lib: any, $event: any): void {
    this.selectedLiberation = lib;
    this.showUploadRegSotugar = true;
  }

  // Set reglee
  setReglee(payee: boolean) {
    let type = this.selectedLiberation.type == 'Actions' ? 'action' : 'oca';
    let sotugar = { id: this.selectedLiberation?.sotugar?.id, payee: payee };

    this.managementService
      .patchSotugar(sotugar, type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.toastr.success('Sotugar mise à jour avec succès!');
          this.selectedLiberation.sotugar = data;
        },
        error: (data: any) => console.log(data),
      })
  }

  // Refresh payee
  refreshPayee($event: any): void {
    if ($event == false) {
      this.loadFondsLiberationsAndSotugar(this.selectedFonds?.fonds?.id);
    }
  }

  // Initiate sotugar
  initiateSotugar(liberation: any): void {
    let sotugar: any = {
      dateEnvoiDemande: this.datePipe.transform(
        this.dateSaveForm?.value['dateEnvoiDemande'],
        'dd/MM/yyyy'
      ),
      liberation: this.selectedLiberation,
    };
    let type = liberation.type == 'Actions' ? 'action' : 'oca';
    this.managementService.saveSotugar(sotugar, type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          liberation.sotugar = data;
          this.toastr.success('Déclaration sotugar sauvegardée avec succès');
        },
        error: (data: any) => console.log(data),
      })
  }

  // Show declaration
  showDeclaration(): void {
    this.opened = true;
  }

  // Save declaration
  saveDeclaration(liberation: any): void {
    if (liberation.sotugar) {
      liberation.sotugar.dateDecision = this.datePipe.transform(
        this.detailsSaveForm.value['dateDecision'],
        'dd/MM/yyyy'
      );
      liberation.sotugar.acceptee = this.detailsSaveForm?.value['acceptee'];
      liberation.sotugar.pourcentageDeGarantie =
        this.detailsSaveForm.value['pourcentageDeGarantie'];
      liberation.sotugar.pourcentageDeContribution =
        this.detailsSaveForm.value['pourcentageDeContribution'];
      liberation.sotugar.montantARegler =
        this.detailsSaveForm.value['montantARegler'];
      liberation.sotugar.montantAGarantir = liberation.montantLiberation;
    }
    let type = liberation.type == 'Actions' ? 'action' : 'oca';
    this.managementService.updateSotugar(liberation.sotugar, type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          liberation.sotugar = data;
          this.toastr.success('Déclaration sotugar sauvegardée avec succès');
        },
        error: (data: any) => { },
      })
  }

  // Delete sotugar
  deleteSotugar(): void {
    if (confirm('Veuillez confirmer cette suppression !')) {
      let type = this.selectedLiberation.type == 'Actions' ? 'action' : 'oca';
      this.managementService
        .deleteSotugar(this.selectedLiberation?.sotugar?.id, type)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Suppression de sotugar avec succès!');
            this.selectedLiberation.sotugar = undefined;
            this.dateSaveForm.reset();
          },
          error: (data: any) => console.log(data),
        })
    }
  }

  // Patch sotugar
  patchSotugar($event: any): void {
    if ($event) {
      // We act only in case of upload, no action in case of file delation
      let type = this.selectedLiberation.type == 'Actions' ? 'action' : 'oca';
      let sotugar = { id: this.selectedLiberation?.sotugar?.id, payee: true };

      this.managementService
        .patchSotugar(sotugar, type)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data: any) => {
            this.toastr.success('Sotugar mise à jour avec succès!');
            this.selectedLiberation.sotugar = data;
          },
          error: (data: any) => console.log(data),
        })
    } else {
      this.setReglee(false);
    }
  }

  showEdit(param: boolean) {

    if (param) {
      try {
        // Patch dateSaveForm
        const dateEnvoiDemande = this.selectedLiberation?.sotugar?.dateEnvoiDemande;
        const dateData = {
          dateEnvoiDemande: dateEnvoiDemande ? this.datePipe.transform(dateEnvoiDemande, 'dd/MM/yyyy') : null
        };
        this.dateSaveForm.patchValue(dateData);
        // Patch detailsSaveForm
        const detailsData = {
          dateDecision: this.selectedLiberation?.sotugar?.dateDecision ? this.datePipe.transform(this.selectedLiberation?.sotugar?.dateDecision, 'dd/MM/yyyy') : null,
          acceptee: this.selectedLiberation?.sotugar?.acceptee ?? true,
          montantARegler: this.selectedLiberation?.sotugar?.montantARegler ?? 0,
          pourcentageDeGarantie: this.selectedLiberation?.sotugar?.pourcentageDeGarantie ?? 0,
          pourcentageDeContribution: this.selectedLiberation?.sotugar?.pourcentageDeContribution ?? 0
        };
        this.detailsSaveForm.patchValue(detailsData);
        this.editSidePanelOpened = true;
      } catch (error) {
        console.error("Erreur lors du patch:", error);
      }
    } else {
      this.editSidePanelOpened = false;
    }
  }


  // Method to close the side panel
  closeSidePanel() {
    this.editSidePanelOpened = false;
    this.selectedFinancement = undefined;
    this.selectedProject = undefined;
    this.selectedLiberation = undefined;
    this.dateSaveForm.reset();
    this.detailsSaveForm.reset();
  }

  // Refresh sotugar
  refreshLiberationSotugar(liberation: any, type: string) {
    this.managementService
      .findSotugarById(liberation.sotugar.id, type)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => (liberation.sotugar = data),
        error: (data: any) =>
          this.toastr.error(
            '',
            'Erreur de rafraîchissement de la libération!'
          ),
      })
  }

  // Parse doc path
  parseDocPath(documents: any) {
    if (documents && documents.length > 0) {
      let doc = documents[documents.length - 1];
      return (doc?.chemin as string);
    }
    return '';
  }

  // Parse doc path from conformite
  parseDocPathFromConformite(conformite: any) {
    if (conformite) {
      return (conformite?.chemin as string);
    }
    return '';
  }

  // Go to fiche
  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/funds/' + this.selectedFonds?.id
    );
  }

  // Get code from color
  getCodeFromColor(color: string): string {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(color)
      .trim();
  }

  // Equals
  equals(a: any, b: any) {
    return a?.fonds?.id == b?.fonds?.id;
  }
}