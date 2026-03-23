import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatDate as angularFormatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DivestmentRefundsConversionsCcaXlsxService {

  constructor() { }

  exportToExcel(data: any, fonds: any): void {
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Data');
    let title = 'Remboursements/conversions en OCA par ' + fonds.denomination;
    let customHeaders = [
      [
        'Date de la souscription',
        'Montant total des CCA',
        'Date de la dernière conversion',
        'Montant total remboursé',
      ],
    ];

    // Titre du premier tableau
    worksheet.mergeCells('A1:E1');
    let titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 40;

    data.forEach((rowData: any) => {
      // Convertir le nom du projet en majuscules
      let projectName = rowData.sc?.financement?.projet.nom?.toUpperCase();

      let projectRow = worksheet.addRow([projectName, '', '', '']);
      projectRow.font = { size: 16, color: { argb: '000000' } };
      projectRow.alignment = { horizontal: 'left', vertical: 'middle' };
      projectRow.height = 25;

      // En-tête du premier tableau
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

      let formatDate = (date: Date | null): string => {
        return date ? angularFormatDate(date, 'dd/MM/yyyy', 'en-US') : '';
      };
      // Ajouter les données du premier tableau
      let row = worksheet.addRow([
        rowData.sc?.dateSignatureContrat
          ? formatDate(new Date(rowData.sc.dateSignatureContrat))
          : '',
        rowData.sc?.montant ?? '',
        rowData.latestDate ? formatDate(new Date(rowData.latestDate)) : '',
        rowData.totalAmount ?? '',
      ]);

      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle' };
        cell.font = { size: 12 };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        if (colNumber == 2 || colNumber == 3 || colNumber == 4) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        }

        if (colNumber == 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
      row.height = 22;

      worksheet.addRow([]);
      worksheet.addRow([]);
      worksheet.addRow([]);

      let startRowIndex = worksheet.lastRow ? worksheet.lastRow.number + 1 : 1;

      // Titre du deuxième tableau
      let secondTableTitle =
        'Historique des remboursements pour ' + projectName;
      worksheet.mergeCells('A' + startRowIndex + ':C' + startRowIndex);
      let secondTitleCell = worksheet.getCell('A' + startRowIndex);
      secondTitleCell.value = secondTableTitle;
      secondTitleCell.font = { size: 14, color: { argb: '005A9C' } };
      secondTitleCell.alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.getRow(startRowIndex).height = 25;

      // En-tête du deuxième tableau
      let newHeaders = [
        ['Date de la conversion', 'Montant converti', 'Ratio %'],
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


      rowData.rc.forEach((rcData: any) => {
        let row = worksheet.addRow([
          formatDate(new Date(rcData.dateRealisation)),
          rcData.montantRealise,
          rcData.ratio ? rcData.ratio / 100 : '',
        ]);

        for (let i = 1; i <= 3; i++) {
          let cell = row.getCell(i);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          cell.font = { size: 12 };

          if (i == 1) {
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
          } else {
            cell.alignment = { vertical: 'middle', horizontal: 'right' };

            if (i == 2) {
              cell.numFmt = '#,##0';
            } else if (i == 3) {
              cell.numFmt = '0%';
            }
          }
        }
        row.height = 22;
      });

      worksheet.addRow([]);
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

    worksheet.getColumn('A').width = 45;
    worksheet.getColumn('B').width = 25;
    worksheet.getColumn('C').width = 38;

    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      let blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'Remboursements/conversions en CCA.xlsx');
    });
  }
}
