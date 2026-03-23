import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class ReportsRatiosXlsxService {
  constructor() {}

  exportToExcel(data: any[], ratio: any, totals: any, titre: any): void {
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Data');
    let title = titre;
    let customHeaders = [
      [
        'Année de libération',
        'Montant libéré du fonds',
        'Ratio règlementaire (fonds)',
        'Engagement du FCPR',
        'Date Limite',
        'Cumul des investissements libérés avant date limite',
      ],
    ];

    worksheet.mergeCells('A1:F1');
    let titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 25;

    let headerRow = worksheet.addRow(customHeaders[0]);
    headerRow.eachCell((cell) => {
      cell.font = { size: 12 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f5f5f5' },
      };
    });
    headerRow.height = 20;
    data.forEach((rowData) => {
      let row = worksheet.addRow([
        rowData.annee,
        rowData.liberations,
        ratio,
        rowData.engage,
        rowData.date,
        rowData.investissements,
      ]);

      for (let i = 1; i <= 6; i++) {
        row.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        row.getCell(i).font = { size: 12 };

        if (i == 5 || i == 1) {
          row.getCell(i).alignment = {
            vertical: 'middle',
            horizontal: 'center',
          };
        } else {
          row.getCell(i).alignment = { vertical: 'middle' };
        }

        if (i == 4 || i == 2 || i == 6) {
          row.getCell(i).numFmt = '#,##0';
        }
      }

      row.height = 22;
    });
    let totalsRow = worksheet.addRow([
      'Total',
      totals.total_libere,
      '',
      totals.total_engage,
      '',
      totals.total_investi,
    ]);

    totalsRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 13 };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '78B2DF' },
      };

      if (colNumber == 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle' };
      }
      cell.numFmt = '#,##0';

      totalsRow.height = 22;
    });

    for (let i = 0; i < 3; i++) {
      let emptyRow = worksheet.addRow(['', '', '', '', '', '']);
      emptyRow.height = 20;
    }
    let newHeaders = [
      [
        'Date limite',
        'Engagement du FCPR',
        'Restant à libérer avant la date limite',
        "Dépassement à considérer pour l'année de la date limite",
      ],
    ];

    let newHeaderRow = worksheet.addRow(newHeaders[0]);
    newHeaderRow.eachCell((cell) => {
      cell.font = { size: 12 };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f5f5f5' },
      };
    });
    newHeaderRow.height = 20;

    data.forEach((rowData) => {
      let row = worksheet.addRow([
        '31/12/' + (rowData.annee + totals.fondsNombreAnnees),
        rowData.engage,
        rowData.restantALiberer,
        rowData.depassement,
      ]);

      for (let i = 1; i <= 4; i++) {
        row.getCell(i).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        row.getCell(i).font = { size: 12 };
        if (i == 1) {
          row.getCell(i).alignment = {
            vertical: 'middle',
            horizontal: 'center',
          };
        } else {
          row.getCell(i).alignment = { vertical: 'middle' };
        }

        if (i == 4 || i == 2) {
          row.getCell(i).numFmt = '#,##0';
        }
      }
      row.height = 22;
    });

    worksheet.columns.forEach((column: any) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        let length = cell.value ? cell.value.toString().length : 0;
        if (length > maxLength) {
          maxLength = length;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 58);
    });

    worksheet.getColumn('A').width = 20;
    worksheet.getColumn('B').width = 25; 
    worksheet.getColumn('C').width = 38; 
    worksheet.getColumn('D').width = 57; 
    worksheet.getColumn('E').width = 15; 

    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      let blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'Ratios.xlsx');
    });
  }
}
