import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule } from '@cds/angular';
import { ClarityModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinStatementService } from '../../services/fin-statement.service';
import { ManagementService } from '../../services/management.service';


@Component({
  selector: 'calcul-tri',
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
  templateUrl: './tri-calculion.component.html',
  styleUrl: './tri-calculion.component.scss'
})
export class TriCalculionComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  private readonly finStatementService = inject(FinStatementService);
  private readonly managementService = inject(ManagementService);
  private readonly toastr = inject(ToastrService);

  public selectedItems: any[] = [];
  items: any[] = [];
  loading: boolean = false;

  ngOnInit(): void {
    this.loadData();
  }

  // Remove selected item
  removeSelected(item: any) {
    this.selectedItems = this.selectedItems.filter(
      (selectedItem) => selectedItem != item
    );
  }

  // Load data
  loadData(): void {
    this.loading = true;
    this.finStatementService.fetchEntities('BP').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(
      {
        next: (data: any) => {
          this.items = data.filter((item: any) => {
            let code = item.code;
            return code != 'BP';
          });
          this.finStatementService.sortItems(this.items);
        },
        error: () => {
          this.toastr.error('Erreur de chargement!', 'Phases non chargées!');
        },
        complete: () => {
          this.loading = false;
          this.loadParametresTri();
        }
      }
    )
  }


  // Load parametres TRI
  loadParametresTri() {
    this.managementService.findParametresTRI().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) => {
        let persistedItems = JSON.parse(data.items);
        this.selectedItems = this.items.filter((item: any) => {
          let count = 0;
          persistedItems.forEach((i: any) => {
            if (i.id == item.id) {
              count++;
              item.defautTriCapital = i.defautTriCapital;
            }
          });
          return count > 0;
        });
      },
      error: () => {
        this.toastr.error('Erreur de chargement!', 'Paramètres non chargés!');
      }
    })
  }

  // Save parametres TRI
  saveParametresTri() {
    let parametresTri = JSON.stringify(this.selectedItems);

    this.managementService.saveParametresTRI(parametresTri).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data: any) =>
        this.toastr.success(
          'Paramètres de calcul TRI sauvegardés avec succès!',
          ''
        ),
      error: (data: any) =>
        this.toastr.error(
          "Erreur de sauvegarde des paramètres de calcul TRI. \n Veuillez contacter l'administrateur de l'application.",
          ''
        ),
    })
  }

  // Set default
  setDefault(item: any) {
    this.selectedItems.forEach(
      (selectedItem: any) => (selectedItem.defautTriCapital = false)
    );
    item.defautTriCapital = true;

    this.saveParametresTri();
  }

  toString(bp: any) {
    return JSON.stringify(bp);
  }


}
