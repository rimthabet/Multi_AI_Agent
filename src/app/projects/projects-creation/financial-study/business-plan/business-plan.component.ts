import {
  Component,
  input,
  OnInit,
  OnDestroy,
  DestroyRef,
  effect,
} from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FinStatementService } from '../../../../services/fin-statement.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FinancialStatementComponent } from '../../../projects-study/financial-data/financial-statement/financial-statement.component';
import { FinancialDataExcelService } from '../../../../services/reports/financial-data--xlsx.service';

@Component({
  selector: 'business-plan',
  imports: [
    CdsModule,
    ClarityModule,
    FinancialStatementComponent,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './business-plan.component.html',
  styleUrl: './business-plan.component.scss',
})
export class BusinessPlanComponent implements OnInit, OnDestroy {
  prospection = input<any>();
  private readonly finStatementService = inject(FinStatementService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly financialDataXlsxService = inject(FinancialDataExcelService);

  /// EFFECTS
  private readonly bpEffect = effect(() => {
    if (this.prospection()) this.loadBPs();
  });

  items: any[] | undefined;
  item: any | undefined;
  itemsIndex: Map<string, any> | undefined;
  bps: any[] = [];
  selectedBP: any | undefined;

  bp_name: string | undefined;
  bp_name_edit_mode: boolean = false;
  bp_name_copy_mode: boolean = false;

  firstLoad: boolean = true;
  loading: boolean = false;
  isExporting: boolean = false;

  bpForm: FormGroup = this.formBuilder.group({
    label: [undefined, [Validators.required]],
    elaboration_date: [undefined, [Validators.required]],
    ref: [undefined, [Validators.required]],
    year: [undefined, [Validators.required]],
  });

  /// INITIALIZE
  ngOnInit(): void {
    this.bpForm.patchValue({
      label: undefined,
      elaboration_date: undefined,
      ref: this.prospection()?.id,
      year: new Date().getFullYear() + 5,
    });
  }

  /// bps
  loadBPs() {
    this.loading = true;

    this.finStatementService
      .fetchBPs(this.prospection()?.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.bps = data;
          this.selectBP(data[0]);
          this.loadData();
        },
        error: (e) => {
          this.toastr.error(
            'Erreur de chargement!',
            'Business plans non chargés!'
          );

          console.log("Error", e)
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  /// items
  loadData() {
    this.loading = true;
    this.finStatementService
      .fetchEntities('BP')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          // Indexing the itemsselectedBPs
          this.itemsIndex = new Map(data.map((i: any) => [i.code, i]));

          if (this.selectedBP) {
            this.selectedBP.item = this.itemsIndex?.get('BP');
            this.item = this.itemsIndex?.get('BP');
          }

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
        },
        error: () => {
          this.toastr.error(
            'Erreur de chargement!',
            'Business plans non chargés!'
          );
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  /// save bp
  saveBP(_bp?: any) {
    let bp: any | undefined;

    if (_bp) {
      bp = _bp;
      bp.label = this.bp_name;
    } else {
      bp = {
        label: this.bpForm.controls['label'].value,
        elaboration_date: new Date(
          this.bpForm.controls['elaboration_date'].value
        ),
        ref: this.bpForm.controls['ref'].value,
        year: this.bpForm.controls['year'].value,
      };
    }
    if (bp != undefined)
      this.finStatementService
        .addBP(bp)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (bp: any) => {
            this.toastr.success('', 'Business Plan ajouté avec succès!');
            this.bps.push(bp);
            this.selectBP(bp);
          },
          error: () => {
            this.toastr.error(
              'Erreur de chargement!',
              'Business plans non chargés!'
            );
          },
        });
  }

  /// delete bp
  deleteBP() {
    if (confirm('Veuillez confirmer la suppression de ce BP')) {
      this.finStatementService
        .deleteBP(this.selectedBP)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success('', 'Business plan supprimé avec succès!');
            this.loadBPs();
          },
          error: () => {
            this.toastr.error(
              'Erreur de chargement!',
              'Business plans non chargés!'
            );
          },
        });
    }
  }

  /// edit bp name
  editBPName() {
    this.bp_name_edit_mode = true;
  }

  /// select bp
  selectBP(bp: any) {
    this.selectedBP = bp;
    this.loadData();
  }

  // OnDestroy
  ngOnDestroy(): void {
    this.bpEffect.destroy();
  }

  async exportFinancialDataToExcel() {
    if (this.isExporting) {
      console.log('Export déjà en cours...');
      return;
    }

    if (
      !this.prospection() ||
      !this.selectedBP ||
      !this.selectedBP.item ||
      !this.items ||
      !this.itemsIndex
    ) {
      console.error("Données manquantes pour l'export", {
        prospection: this.prospection(),
        selectedBP: this.selectedBP,
        items: this.items,
        itemsIndex: this.itemsIndex,
      });
      return;
    }

    this.isExporting = true;

    try {
      await this.financialDataXlsxService.exportToExcel({
        prospection: this.prospection()!.nom,
        prospectionId: this.prospection()!.id,
        ref2: this.selectedBP.id,
        year: this.bpForm.controls['year'].value,
        statements: [this.selectedBP.item],
        items: this.items!,
        itemsIndex: this.itemsIndex!,
      });

      this.toastr.success('Export réussi!', 'Fichier Excel généré');
    } catch (error) {
      console.error("Erreur lors de l'export:", error);
      this.toastr.error("Erreur lors de l'export", 'Export échoué!');
    } finally {
      this.isExporting = false;
    }
  }
}
