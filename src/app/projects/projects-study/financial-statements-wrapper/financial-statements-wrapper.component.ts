import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  effect,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  CdsButtonModule,
  CdsIconModule,
  CdsDividerModule,
  CdsInputModule,
} from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinancialStatementV2Component } from './financial-statement-v2/financial-statement-v2.component';
import { FinStatementService } from '../../../services/fin-statement.service';
import { FinancialDataExcelService } from '../../../services/reports/financial-data--xlsx.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'financial-statements-wrapper',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    FinancialStatementV2Component,
  ],
  templateUrl: './financial-statements-wrapper.component.html',
  styleUrl: './financial-statements-wrapper.component.scss',
})
export class FinancialStatementsWrapperComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly finStatementService = inject(FinStatementService);
  private readonly financialDataXlsxService = inject(FinancialDataExcelService);
  private readonly toastr = inject(ToastrService);

  prospection = input<any>();

  public yearForm!: FormGroup;
  fin_statements: any[] | undefined;
  items: any[] | undefined;
  itemsIndex: Map<string, any> | undefined;

  selectedTab: number = 0;
  isExporting: boolean = false;

  constructor() {
    //prospection change => load data
    effect(() => {
      const currentProspection = this.prospection();
      if (currentProspection) {
        this.loadData();
      }
    });
  }

  ngOnInit(): void {
    this.yearForm = this.fb.group({
      year: [new Date().getFullYear(), [Validators.required]],
    });

    this.yearForm.controls['year'].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value: any) => {
        this.loadData();
      });

    //load data if prospection is not null
    if (this.prospection()) {
      this.loadData();
    }
  }

  // Load the financial statements
  loadData() {
    //load data if prospection is not null
    if (!this.prospection()) {
      return;
    }

    this.finStatementService
      .fetchEntities()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.fin_statements = data
            .filter(
              (entity: any) =>
                entity.code.indexOf('.') < 0 &&
                (entity.code == 'BA' ||
                  entity.code == 'BC' ||
                  entity.code == 'ER' ||
                  entity.code == 'EF' ||
                  entity.code == 'DP')
            )
            .sort((a: any, b: any) => {
              if (a.code == 'DP') return 1;
              if (b.code == 'DP') return -1;
              if (a.libelle > b.libelle) return 1;
              if (a.libelle < b.libelle) return -1;
              return 0;
            });

          // Indexing the items
          this.itemsIndex = new Map(data.map((i: any) => [i.code, i]));

          // Setting valued Items
          data.forEach((i: any) => {
            if (this.itemsIndex?.get(i.code + '.1') == undefined) i.leaf = true;
            else i.leaf = false;
          });

          // We need to have the ordering of the items
          this.finStatementService.sortItems(data);
          this.items = data;
        },
      });
  }

  async exportFinancialDataToExcel() {
    if (this.isExporting) {
      console.log('Export déjà en cours...');
      return;
    }

    if (
      !this.prospection() ||
      !this.fin_statements ||
      !this.items ||
      !this.itemsIndex
    ) {
      console.error("Données manquantes pour l'export");
      return;
    }

    this.isExporting = true;

    try {
      await this.financialDataXlsxService.exportToExcel({
        prospection: this.prospection()!.nom,
        prospectionId: this.prospection()!.id,
        ref2: -1,
        year: this.yearForm.controls['year'].value,
        statements: this.fin_statements!,
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
