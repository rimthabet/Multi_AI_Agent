import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EditableFieldComponent } from '../../../widgets/editable-field/editable-field.component';

@Component({
  selector: 'comparison-investment-achievement-scheme',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    EditableFieldComponent
  ],
  templateUrl: './comparison-investment-achievement-scheme.component.html',
  styleUrl: './comparison-investment-achievement-scheme.component.scss'
})
export class ComparisonInvestmentAchievementSchemeComponent {

  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly router = inject(Router);

  projets: any[] | undefined;
  schemaInvestissements: any[] = [];
  investissements: any[] = [];

  selectedProjet: any | undefined;
  selectedTab: number = 0;

  loading: boolean = false;

  ngOnInit(): void {
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
    this.loadScifs();

  }

  // Load SCIFs
  loadScifs() {
    this.managementService
      .findSchemaInvFinByProjet(this.selectedProjet.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.schemaInvestissements = this.filterLastSchemas(data);
          this.loadInvestissement();
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'SCIFs non chargés!');
        },
        complete: () => { },
      })

  }

  // Filter last schemas
  filterLastSchemas(data: any) {
    let lastSchemas: any[] = [];

    data?.forEach((schema: any) => {
      const existingSchemaIndex = lastSchemas.findIndex(
        (s: any) => s.financement?.id === schema.financement?.id
      );

      const currentDate = new Date(schema.dateDemandeFinancement);
      const existingDate = existingSchemaIndex !== -1
        ? new Date(lastSchemas[existingSchemaIndex].dateDemandeFinancement)
        : null;

      if (existingSchemaIndex === -1) {
        lastSchemas.push(schema);
      } else if (currentDate > existingDate!) {
        lastSchemas[existingSchemaIndex] = schema;
      }
    });

    lastSchemas.sort((a: any, b: any) =>
      new Date(b.dateSchema).getTime() - new Date(a.dateSchema).getTime()
    );

    return lastSchemas;
  }



  // Select schema investissement
  selectedShematInvest(index: number) {
    this.selectedTab = index;
    this.loadInvestissement();
  }

  // Load investissement
  loadInvestissement() {
    this.loading = true;
    this.managementService
      .findSchemaInvestissement(
        this.schemaInvestissements[this.selectedTab]?.id
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.investissements = data;
        },
        complete: () => (this.loading = false),
      })
  }

  // Update investissement
  updateInvestissement(data: any) {
    this.managementService.updateSchemaInvestissement(data).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => { },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Investissements non chargés!');
      },
      complete: () => { },
    })
  }

  // Total montant
  totalMontant() {
    let totalMontant = 0;
    this.investissements.forEach((i: any) => (totalMontant += i.montant));
    return totalMontant;
  }

  // Total montant realise
  totalMontantRealise() {
    let totalMontant = 0;
    this.investissements.forEach(
      (i: any) => (totalMontant += i.montantRealise)
    );
    return totalMontant;
  }

  // Total ecart
  totalEcart() {
    let totalEcart = 0;
    this.investissements.forEach(
      (i: any) =>
        (totalEcart += i.montant - (i.montantRealise ?? 0))
    );
    return totalEcart;
  }

  // Total pecart
  totalPecart() {
    let totalPecart = 0;
    this.investissements.forEach(
      (i: any) =>
        (totalPecart += i.montantRealise ? i.montantRealise / i.montant : 0)
    );
    return totalPecart;
  }

  // Go to project fiche
  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/projects/' + this.selectedProjet?.id
    );
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }



}
