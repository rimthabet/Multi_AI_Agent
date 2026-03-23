import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinStatementService } from '../../../services/fin-statement.service';

@Component({
  selector: 'comparison-achievements-bp',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule
  ],
  templateUrl: './comparison-achievements-bp.component.html',
  styleUrl: './comparison-achievements-bp.component.scss'
})
export class ComparisonAchievementsBpComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly finStatementService = inject(FinStatementService);
  private readonly router = inject(Router);

  projets: any[] | undefined;
  bps: any[] = [];
  years: number[] = [];
  itemsData: any[] = [];
  items: any[] = [];

  selectedProjet: any | undefined;
  selectedTab: number = 0;

  bgColor1 = 'var(--cds-alias-status-neutral-tint)';
  bgColor2 = 'inherit';

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
    this.loadBPs();
  }

  // Load BPs
  loadBPs() {
    this.finStatementService
      .fetchBPs(this.selectedProjet?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.bps = data;
          this.changeYears();
          this.loadDataCBR();
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Business Plans non chargés!');
        }
      })
  }

  // Load CBR
  loadCBR() {
    this.finStatementService.fetchEntities('CBR').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        this.items = data.filter((it: any) => it.code.split('.').length > 1);
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'CBR non chargés!');
      }
    })
  }

  // Load data CBR
  loadDataCBR() {
    this.loading = true;
    this.items = [];
    this.itemsData = [];
    this.finStatementService
      .fetchEntitiesByCBR(
        this.selectedProjet?.id,
        this.bps[this.selectedTab]?.id,
        'CBR'
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.itemsData = data;
          this.loadCBR();
        },
        complete: () => (this.loading = false),
        error: (e: any) => {
          console.error('Erreur lors du chargement des données', e);
        },
      })
  }

  // Select BP
  selectedBP(index: number) {
    this.selectedTab = index;
    this.changeYears();
    this.loadDataCBR();
  }

  // Change years
  changeYears() {
    let selectedBP = this.bps[this.selectedTab];
    this.years = Array.from(
      { length: 5 },
      (_, i) => selectedBP.year - i
    ).reverse();
  }

  // Get value of EF
  valueOfEf(code: any, year: any) {
    let ef = this.itemsData.find(
      (i: any) => i.fe.code == code && i.year == year
    ).ef;
    if (ef && !isNaN(ef.value)) return ef.value;
    return -1;
  }

  // Get value of BP
  valueOfBp(code: any, year: any) {
    let bp = this.itemsData.find(
      (i: any) => i.fe.code == code && i.year == year
    ).bp;
    if (bp && !isNaN(bp.value)) return bp.value;
    return -1;
  }

  // Get value of ecart
  valueOfEcart(code: any, year: any) {
    let ecart = this.itemsData.find(
      (i: any) => i.fe.code == code && i.year == year
    ).ecart;
    if (ecart && !isNaN(ecart) && (ecart + '').indexOf('Infinity') < 0)
      return ecart;
    return -1;
  }

  // Get percentage of ecart
  valueOfPecart(code: any, year: any) {
    let pEcart = this.itemsData.find(
      (i: any) => i.fe.code == code && i.year == year
    ).pEcart;
    if (pEcart && !isNaN(pEcart) && (pEcart + '').indexOf('Infinity') < 0)
      return pEcart;
    return -1;
  }

  // Get value of item
  valueOf(code: any, year: any) {
    return this.itemsData.find((i: any) => i.fe.code == code && i.year == year);
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
