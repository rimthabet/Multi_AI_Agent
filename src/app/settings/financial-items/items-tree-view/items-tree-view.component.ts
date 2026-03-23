import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdsButtonModule, CdsIconModule, CdsDividerModule, CdsInputModule, CdsButtonActionModule, CdsSearchModule, CdsSelectModule, CdsFormsModule } from '@cds/angular';
import { ClarityModule, ClrTooltipModule } from '@clr/angular';
import { ToastrService } from 'ngx-toastr';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FinStatementService } from '../../../services/fin-statement.service';

@Component({
  selector: 'items-tree-view',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ClarityModule,
    CdsButtonModule,
    CdsIconModule,
    CdsDividerModule,
    CdsInputModule,
    CdsButtonActionModule,
    CdsSearchModule,
    CdsSelectModule,
    CdsFormsModule,
    ClrTooltipModule
  ],
  templateUrl: './items-tree-view.component.html',
  styleUrl: './items-tree-view.component.scss',
})
export class ItemsTreeViewComponent {

  // Output signals
  itemDeletedEvent = output<any>();
  itemSelectedEvent = output<any>();

  // Input signals
  item = input<any>();
  data = input<any>();
  pattern = model<string>();
  criteria = model<'code' | 'libelle'>('code');

  private readonly destroyRef = inject(DestroyRef);
  private readonly finStatementService = inject(FinStatementService);
  private readonly toastr = inject(ToastrService);

  tree_data: any[] = [];

  // Search effect
  searchEffect = effect(() => {

    if (this.criteria() != undefined && this.criteria() === 'code'
      && this.pattern() != undefined && this.pattern()?.trim() != '') {

      let _pattern = this.pattern()!.trim();
      _pattern = _pattern.endsWith('.') ? _pattern.substring(0, _pattern.lastIndexOf('.')) : _pattern;

      const filtered_tree_data = this.data().filter((item: any) => {

        // Pattern tokens are less then the item code tokens
        if (_pattern.split('.').length < item.code.split('.').length) {

          const patternTokens = this.parseSubCodes(_pattern);
          const itemCodeTokens = this.parseSubCodes(item.code);

          // We need to check that the patterns token set is part of the item.code tolen  use some
          return !patternTokens.some((token: string) => !itemCodeTokens.includes(token));

        }

        // Pattern tokens are more then the item code tokens
        if (_pattern.split('.').length > item.code.split('.').length) {

          const patternTokens = this.parseSubCodes(_pattern);
          const itemCodeTokens = this.parseSubCodes(item.code);

          // We need to check that the patterns token set is part of the item.code tolen  use some
          return !itemCodeTokens.some((token: string) => !patternTokens.includes(token));

        }

        // Pattern tokens are equal to the item code tokens
        return _pattern.toLowerCase() === item.code.toLowerCase();

      });

      this.setData(filtered_tree_data);
      return;
    }

    // SEARCH WITH LABELS AND NOT CODES
    if (this.criteria() != undefined && this.criteria() === 'libelle'
      && this.pattern() != undefined && this.pattern()?.trim() != '') {

      const exact_match = this.data().filter((item: any) => {
        return item.libelle.toLowerCase().includes(this.pattern()?.toLowerCase()) &&
          item.code.startsWith(this.item()?.code);
      });

      // Get all sub-codes for all matching items and flatten the array
      const allSubCodes = exact_match.flatMap((item: any) =>
        this.parseSubCodes(item.code)
      );

      // Remove duplicates by converting to Set and back to array
      const uniqueSubCodes = [...new Set(allSubCodes)];

      // Filter the original data to include items that match any of the sub-codes
      const filtered_tree_data = this.data().filter((item: any) =>
        uniqueSubCodes.includes(item.code.toLowerCase())
      );

      this.setData(filtered_tree_data);
      return;

    };

    this.setData();
  });

  // Parse sub codes
  private parseSubCodes(code: string): string[] {
    const parts = code.toLowerCase().split('.');
    const result = parts.map((_, i) =>
      parts.slice(0, i + 1).join('.')
    );
    return result;
  }

  //set data
  setData(data?: any) {

    const currentData = data || this.data();

    if (currentData) {
      // Build a tree structure
      this.tree_data = currentData.filter(
        (item: any) =>
          item.code.split('.').length == 2 &&
          item.code.split('.')[0] == this.item()?.code
      );

      // Sort the root level items
      this.tree_data.sort(
        (a: any, b: any) => this.compareCodeNaturally(a?.code, b?.code)
      );

      this.tree_data.forEach((item: any) => {
        item.items = currentData.filter(
          (it: any) =>
            it.code.startsWith(item.code) && it.code.split('.').length == 3
        );
        item.items.sort(
          (a: any, b: any) => this.compareCodeNaturally(a?.code, b?.code)
        );

        item.items.forEach((it: any) => {
          it.items = currentData.filter(
            (i: any) =>
              i.code.startsWith(it.code) && i.code.split('.').length == 4
          );
          it.items.sort(
            (a: any, b: any) => this.compareCodeNaturally(a?.code, b?.code)
          );

          it.items.forEach((i: any) => {
            i.items = currentData.filter(
              (j: any) =>
                j.code.startsWith(i.code) && j.code.split('.').length == 5
            );
            i.items.sort(
              (a: any, b: any) => this.compareCodeNaturally(a?.code, b?.code)
            );
          });
        });
      });
    }
  }

  //extract number from code
  extractNumber(code: string) {
    const parts = code.split('.');
    return parseFloat(parts[parts.length - 1]);
  }

  //natural sort comparison for codes
  compareCodeNaturally(codeA: string, codeB: string): number {
    const partsA = codeA.split('.');
    const partsB = codeB.split('.');

    const maxLength = Math.max(partsA.length, partsB.length);

    for (let i = 0; i < maxLength; i++) {
      const partA = partsA[i];
      const partB = partsB[i];

      // If one code has fewer parts, it comes first
      if (partA === undefined) return -1;
      if (partB === undefined) return 1;

      // Try to parse as numbers
      const numA = parseFloat(partA);
      const numB = parseFloat(partB);

      // If both are numbers, compare numerically
      if (!isNaN(numA) && !isNaN(numB)) {
        if (numA !== numB) {
          return numA - numB;
        }
      } else {
        // If not numbers, compare as strings
        if (partA !== partB) {
          return partA.localeCompare(partB);
        }
      }
    }

    return 0;
  }

  //select item
  selectItem(item: any) {
    this.itemSelectedEvent.emit(item);
  }

  //delete item
  deleteItem(item: any) {
    if (
      confirm(
        'La suppression de cet Item Financier entraine la suppression de toutes les données fiancières saisies ou calculées lui faisant référence. \n\nVeuillez confirmer cette suppresion ?'
      )
    ) {
      this.finStatementService
        .deleteEntity(item)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => {
            this.toastr.success(
              'Itème financier supprimé avec succès!',
              'Succès'
            );
            this.itemDeletedEvent.emit(item);
          },
          error: (error) => {
            this.toastr.error(error.error, 'Erreur de suppression');
          },
        });
    }
  }
}
