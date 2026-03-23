import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  viewChildren,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  CdsButtonModule,
  CdsIconModule,
  CdsDividerModule,
  CdsInputModule,
} from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinStatementService } from '../../services/fin-statement.service';
import { ItemsTreeViewComponent } from './items-tree-view/items-tree-view.component';

@Component({
  selector: 'financial-items',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    ItemsTreeViewComponent,
  ],
  templateUrl: './financial-items.component.html',
  styleUrl: './financial-items.component.scss',
})
export class FinancialItemsComponent implements OnInit {
  //  Injects and ViewChild
  statements = viewChildren(ItemsTreeViewComponent);

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly finStatementService = inject(FinStatementService);
  private readonly toastr = inject(ToastrService);

  public itemForm!: FormGroup;

  items: any[] = [];
  selectedItem: any = null;
  showWarningMessage: boolean = false;
  fin_statements: any[] | undefined;
  selectedTab: number = 0;
  i: any;

  // INITIALIZE
  ngOnInit(): void {
    this.itemForm = this.fb.group({
      code: [undefined, [Validators.required]],
      libelle: [undefined, [Validators.required]],
      parent: [undefined],
      data_source: ['input', [Validators.required]],
      formula: [undefined],
      type: ['decimal', [Validators.required]],
    });

    this.itemForm.get('data_source')?.valueChanges.subscribe((value) => {
      if (value == 'formula') {
        this.itemForm.controls['formula']?.setValidators([Validators.required]);
      } else {
        this.itemForm.controls['formula']?.setValidators([]);
      }
      this.itemForm.controls['formula'].updateValueAndValidity();
    });

    this.loadData();
  }

  // LOAD DATA
  loadData() {
    this.finStatementService
      .fetchEntities()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          this.items = data;

          // Mise à jour des composants enfants
          this.statements().forEach((component: ItemsTreeViewComponent) => {
            component.setData(data);
          });

          this.fin_statements = data
            .filter((entity: any) => entity.code.indexOf('.') < 0)
            .sort((a: any, b: any) => {
              if (a.libelle > b.libelle) return 1;
              if (a.libelle < b.libelle) return -1;
              return 0;
            });
        },
        error: () => {
          this.toastr.error(
            'Erreur lors du chargement des états financiers !',
            'Erreur'
          );
        },
      });
  }

  // SET CODE
  setCode() {
    this.itemForm.patchValue({
      code: this.itemForm.value['parent'].code + '.',
    });
  }

  // SELECT ITEM
  selectItem($event: any) {
    this.selectedItem = $event;
    this.showWarningMessage = true;

    this.itemForm.patchValue({
      code: $event.code,
      libelle: $event.libelle,
      data_source: $event.input ? 'input' : 'formula',
      formula: $event.formula,
      type: $event.type,
    });
  }

  // SAVE ITEM
  saveItem() {
    if (this.itemForm.value['data_source'] !== 'input') {
      this.itemForm.patchValue({
        formula: this.itemForm.value['formula']
          .replaceAll(' ', '')
          .replaceAll('[', ' [')
          .replaceAll(']', '] '),
      });
    } else {
      this.itemForm.patchValue({
        formula: undefined,
      });
    }
    const item: any = {
      code: this.itemForm.value['code'].toUpperCase().trim(),
      libelle: this.itemForm.value['libelle'].toUpperCase().trim(),
      input: this.itemForm.value['data_source'] === 'input',
      formula: this.itemForm.value['formula'],
      type: this.itemForm.value['type'],
    };

    if (this.selectedItem) {
      item.id = this.selectedItem.id;
    }

    this.finStatementService
      .saveEntity(item)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: any) => {
          if (data != null) {
            this.toastr.success(
              "L'ajout de l'Itème Financier s'est passé avec succès !",
              "Ajout d'Itèmes Financiers"
            );

            // RESET FORM AND SELECTED ITEM
            this.itemForm.reset({
              data_source: 'input',
              type: 'decimal',
            });
            this.selectedItem = null;
            this.showWarningMessage = false;

            // RELOAD DATA
            this.loadData();
          } else {
            this.toastr.error(
              "L'ajout de l'Itème Financier a échoué !",
              "Ajout d'Itèmes Financiers"
            );
          }
        },
        error: () => {
          this.toastr.error(
            "L'ajout de l'Itème Financier a échoué. Veuillez vérifier la formule s'il s'agit d'un champ à calculer !",
            'Erreur'
          );
        },
      });
  }
}
