import { CommonModule, formatDate } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, viewChildren } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ManagementService } from '../../../services/management.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinStatementService } from '../../../services/fin-statement.service';
import { FinancialStatementComponent } from '../../../projects/projects-study/financial-data/financial-statement/financial-statement.component';

@Component({
  selector: 'business-plan-tracking',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    FinancialStatementComponent,
  ],
  templateUrl: './business-plan-tracking.component.html',
  styleUrl: './business-plan-tracking.component.scss'
})
export class BusinessPlanTrackingComponent implements OnInit {

  businessPlans = viewChildren<FinancialStatementComponent>("businessPlan");


  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly managementService = inject(ManagementService);
  private readonly finStatementService = inject(FinStatementService);
  private readonly router = inject(Router);

  projets: any[] | undefined;
  bps: any[] = [];
  items: any[] | undefined;
  item: any | undefined;
  itemsIndex: Map<string, any> | undefined;
  selectedProjet: any | undefined;
  selectedTab: number = 0;
  opened: boolean = false;
  bp_name_edit_mode: boolean = false;
  loading: boolean = false;
  editingBP: any;
  bp_name: string | undefined;

  public bpForm!: FormGroup;

  ngOnInit(): void {

    this.bpForm = this.fb.group({
      label: ['', [Validators.required]],
      elaboration_date: ['', [Validators.required]],
      year: ['', [Validators.required]],
    });


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


  // Load business plans
  loadBPs() {
    this.finStatementService
      .fetchBPs(this.selectedProjet?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.bps = data;
          this.loadData();
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Business Plans non chargés!');
        }
      })
  }

  // Load data
  loadData() {
    this.finStatementService.fetchEntities('BP').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data: any) => {
      // Indexing the items
      this.itemsIndex = new Map(data.map((i: any) => [i.code, i]));

      // Set the item for the component
      this.item = this.itemsIndex?.get('BP');

      // Remove the root item
      data = data.filter((it: any) => it.code.split('.').length > 1);

      // Setting valued Items
      data.forEach((i: any) => {
        if (this.itemsIndex?.get(i.code + '.1') == undefined) {
          i.leaf = true;
        } else i.leaf = false;
      });

      // We sort the items correctly
      this.finStatementService.sortItems(data);
      this.items = data;

      if (this.businessPlans()) {
        this.businessPlans()?.forEach((b: any) => b.setData(this.items));
      }
      if (this.selectedTab !== undefined) {
        this.selectedTab = this.selectedTab;
      }
    })
  }

  // Select tab
  selectTab(bp: any) {
    this.selectedTab = bp;
    this.loadData();
  }

  // Modal rename bp
  modalRenameBP(bp: any) {
    this.bp_name_edit_mode = true;
    this.editingBP = bp;
  }

  // Save bp
  saveBP(_bp?: any) {
    let bp: any | undefined;

    if (_bp) {
      bp = _bp;
      bp.label = this.bp_name;
    } else {
      bp = {
        label: this.bpForm.controls['label'].value,

        elaboration_date: this.bpForm.controls['elaboration_date'].value
          ? formatDate(new Date(this.bpForm.controls['elaboration_date'].value), 'MM-dd-yyyy', 'en-US')
          : '',

        ref: this.selectedProjet.id,
        year: this.bpForm.controls['year'].value,
      };
    }

    if (bp != undefined) {
      this.finStatementService.addBP(bp).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data: any) => {
          this.toastr.success('', 'Business Plan ajouté avec succès!');
          this.loadBPs();
          this.loadData();
          this.opened = false;
          this.bpForm.reset();
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Business Plans non chargés!');
        },
        complete: () => {
          console.log('Business Plan save operation completed.');
        },
      });
    }
  }

  // Delete bp
  deleteBP(bp: any) {
    if (confirm('Veuillez confirmer la suppression de ce BP')) {
      this.finStatementService.deleteBP(bp).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toastr.success('', 'Business plan supprimé avec succès!');
          this.loadBPs();
          this.selectedTab = 0;
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Business Plans non chargés!');
        },
        complete: () => {
          console.log('Business Plan delete operation completed.');
        },
      })

    }
  }

  // Go to fiche
  goToFiche() {
    this.router.navigateByUrl(
      '/dashboard/projects/' + this.selectedProjet?.id
    );
  }

  // Modal add bp
  modalAddBp() {
    this.bpForm.reset();
    this.opened = true;
  }

  equals(a: any, b: any) {
    return a?.id == b?.id;
  }

}
