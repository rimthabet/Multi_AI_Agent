import { Injectable, inject } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { FinStatementService } from '../fin-statement.service';
import { firstValueFrom } from 'rxjs';

export interface ExportData {
  prospection: string;
  prospectionId: any;
  ref2?: number;
  year: number;
  statements: any[];
  items: any[];
  itemsIndex: Map<string, any>;
}

@Injectable({
  providedIn: 'root',
})
export class FinancialDataExcelService {
  private readonly finStatementService = inject(FinStatementService);

  async exportToExcel(data: ExportData) {
    const workbook = new ExcelJS.Workbook();
    const columns = 5;

    const years = this.generateYears(data.year, columns);

    for (const statement of data.statements) {
      const worksheet = workbook.addWorksheet(statement.libelle);
      this.createHeader(worksheet, statement, years);

      await this.fillData(
        worksheet,
        statement,
        years,
        data.items,
        data.itemsIndex,
        data.prospectionId,
        data.ref2 ?? -1
      );

      this.adjustColumns(worksheet, columns);

      const totalRows = this.countRows(statement, data.items, data.itemsIndex);
      this.addLegend(worksheet, totalRows + 5);
    }

    const prospectionName = data.prospection || 'Export';

    return workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `Export_${prospectionName}_${data.year}.xlsx`);
    });
  }

  // ------------------- YEARS -------------------
  private generateYears(year: number, columns: number): number[] {
    const years: number[] = [];
    const startYear = year - columns;
    for (let i = 0; i < columns; i++) {
      years.push(startYear + i);
    }
    return years;
  }

  // ------------------- HEADER -------------------
  private createHeader(
    worksheet: ExcelJS.Worksheet,
    statement: any,
    years: number[]
  ): void {
    // TITLE
    worksheet.mergeCells(1, 1, 1, 4 + years.length);
    const titleCell = worksheet.getCell(1, 1);
    titleCell.value = statement.libelle;
    titleCell.font = { bold: true, size: 12, color: { argb: '#B0C4DE' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF' },
    };
    this.addBorders(titleCell);
    worksheet.getRow(1).height = 30;

    // SUBTITLE
    worksheet.mergeCells(2, 1, 2, 4 + years.length);
    const subtitleCell = worksheet.getCell(2, 1);
    subtitleCell.value = 'Liste des items financiers pour chaque année';
    subtitleCell.font = { italic: true, size: 12, color: { argb: '#B0C4DE' } };
    subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    subtitleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF' },
    };
    this.addBorders(subtitleCell);
    worksheet.getRow(2).height = 20;

    // HEADER ROW
    const headerRow = worksheet.getRow(3);
    headerRow.height = 25;

    // Empty 4 first columns (styled uniformly)
    for (let i = 1; i <= 4; i++) {
      const cell = headerRow.getCell(i);
      cell.value = '';
      cell.font = { size: 12, bold: true, color: { argb: '000000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DCE6F1' },
      };
      this.addBorders(cell);
    }

    // Year columns
    years.forEach((yr, index) => {
      const cell = headerRow.getCell(5 + index);
      cell.value = yr;
      cell.font = { bold: true, size: 12, color: { argb: '000000' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'DCE6F1' },
      };
      this.addBorders(cell);
    });
  }

  // ------------------- FILL DATA -------------------
  private async fillData(
    worksheet: ExcelJS.Worksheet,
    statement: any,
    years: number[],
    items: any[],
    itemsIndex: Map<string, any>,
    prospectionId: any,
    ref2: number
  ): Promise<void> {
    let currentRow = 4;
    const children = this.getChildren(statement.code, items, itemsIndex);

    for (const item of children) {
      currentRow = await this.addRow(
        worksheet,
        item,
        currentRow,
        years,
        itemsIndex,
        1,
        prospectionId,
        ref2
      );
    }
  }

  private getChildren(
    parentCode: string,
    items: any[],
    itemsIndex: Map<string, any>
  ): any[] {
    return items
      .filter(
        (item) =>
          item.code &&
          item.code.startsWith(parentCode + '.') &&
          item.code.split('.').length === parentCode.split('.').length + 1
      )
      .sort(
        (a, b) =>
          parseInt(a.code.split('.').pop()!) -
          parseInt(b.code.split('.').pop()!)
      );
  }

  private async addRow(
    worksheet: ExcelJS.Worksheet,
    item: any,
    rowIndex: number,
    years: number[],
    itemsIndex: Map<string, any>,
    level: number,
    prospectionId: any,
    ref2: number
  ): Promise<number> {
    const row = worksheet.getRow(rowIndex);
    const hasChildren = !item.leaf;

    // FIRST 3 EMPTY COLUMNS
    for (let i = 1; i <= 3; i++) {
      const cell = row.getCell(i);
      cell.value = '';
      cell.font = { size: 12 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF' },
      };
      this.addBorders(cell);
    }

    // LABEL
    const labelCell = row.getCell(4);
    labelCell.value = item.libelle;
    labelCell.font = { size: 12, bold: hasChildren };
    labelCell.alignment = {
      horizontal: 'left',
      vertical: 'middle',
      indent: hasChildren ? 0 : 1,
    };
    labelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF' },
    };
    this.addBorders(labelCell);

    // YEAR VALUES
    for (let i = 0; i < years.length; i++) {
      const valueCell = row.getCell(5 + i);
      const value = await this.fetchValue(
        item,
        years[i],
        prospectionId,
        i,
        ref2
      );

      valueCell.value = value ?? '-';
      valueCell.font = { size: 12 };
      valueCell.alignment = { horizontal: value ? 'right' : 'center' };
      valueCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFF' },
      };

      if (item.type === 'decimal') valueCell.numFmt = '#,##0.00';
      else if (item.type === 'int') valueCell.numFmt = '#,##0';
      else if (item.type === 'percent') valueCell.numFmt = '#,##0.00"%"';

      this.addBorders(valueCell);
    }

    row.height = 22;
    rowIndex++;

    // CHILDREN
    if (hasChildren) {
      const children = this.getChildren(
        item.code,
        Array.from(itemsIndex.values()),
        itemsIndex
      );
      for (const child of children) {
        rowIndex = await this.addRow(
          worksheet,
          child,
          rowIndex,
          years,
          itemsIndex,
          level + 1,
          prospectionId,
          ref2
        );
      }
    }

    return rowIndex;
  }

  private async fetchValue(
    item: any,
    year: number,
    prospectionId: any,
    yearIndex: number,
    ref2: number
  ): Promise<number | null> {
    try {
      const datum: any = await firstValueFrom(
        this.finStatementService.fetchDatum2(
          prospectionId,
          ref2,
          item,
          year,
          -1,
          yearIndex + 1,
          true
        )
      );

      const value = datum?.value;

      if (value !== null && value !== undefined && !isNaN(value)) return value;
    } catch (error) {
      console.warn(`Erreur chargement ${item.code} pour ${year}:`, error);
    }
    return null;
  }

  // ------------------- UTILS -------------------
  private addBorders(cell: ExcelJS.Cell): void {
    cell.border = {
      top: { style: 'thin', color: { argb: '000000' } },
      left: { style: 'thin', color: { argb: '000000' } },
      bottom: { style: 'thin', color: { argb: '000000' } },
      right: { style: 'thin', color: { argb: '000000' } },
    };
  }

  private adjustColumns(
    worksheet: ExcelJS.Worksheet,
    yearColumns: number
  ): void {
    worksheet.getColumn(1).width = 2;
    worksheet.getColumn(2).width = 2;
    worksheet.getColumn(3).width = 2;
    worksheet.getColumn(4).width = 50;

    for (let i = 5; i <= 4 + yearColumns; i++)
      worksheet.getColumn(i).width = 18;
  }

  private addLegend(worksheet: ExcelJS.Worksheet, startRow: number): void {
    worksheet.mergeCells(startRow, 1, startRow, 9);
    const legend1Cell = worksheet.getCell(startRow, 1);
    legend1Cell.value = "■ : L'item financier est à saisir";
    legend1Cell.font = { size: 12 };
    legend1Cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFFF' },
    };

    worksheet.mergeCells(startRow + 1, 1, startRow + 1, 9);
    const legend2Cell = worksheet.getCell(startRow + 1, 1);
    legend2Cell.value =
      "■ : L'item financier est calculé à base de la formule définie au niveau du paramétrage";
    legend2Cell.font = { size: 12 };
    legend2Cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'B4C7E7' },
    };
  }

  private countRows(
    statement: any,
    items: any[],
    itemsIndex: Map<string, any>
  ): number {
    const children = this.getChildren(statement.code, items, itemsIndex);
    let count = 0;

    for (const child of children) {
      const depth = child.code.split('.').length - 1;
      const shouldSkip = child.input && !child.leaf && depth > 2;

      if (shouldSkip) count += this.countRows(child, items, itemsIndex);
      else {
        count++;
        if (!child.leaf) count += this.countRows(child, items, itemsIndex);
      }
    }
    return count;
  }
}
