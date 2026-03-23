import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DivestmentRefundsConversionsOcasXlsxService {

  constructor() { }

  exportToExcel(data: any, fonds: any): void {
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Data');
    let title = 'Remboursements/conversions en OCA par ' + fonds.denomination;
    let customHeaders = [
      [
        'Date de la souscription',
        "Nombre d'actions souscrites",
        'Montant total des OCA',
        'Date de la dernière conversion',
        'Montant total converti',
      ],
    ];

    // Titre principal du document
    worksheet.mergeCells('A1:E1');
    let titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 30;

    // Ajouter les données du premier tableau avec les tableaux historiques
    data.forEach((rowData: any) => {
      // Ajouter le nom du projet comme une ligne séparée
      let projectRow = worksheet.addRow([
        rowData.so?.financement?.projet.nom.toUpperCase(),
      ]);
      projectRow.font = { bold: false, size: 18 };
      projectRow.alignment = { horizontal: 'left', vertical: 'middle' };
      worksheet.mergeCells(`A${projectRow.number}:E${projectRow.number}`);
      worksheet.getRow(projectRow.number).height = 30;

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

      // Ajouter les données du premier tableau
      let row = worksheet.addRow([
        rowData.so?.dateBulletin
          ? formatDate(new Date(rowData.so.dateBulletin), 'dd/MM/yyyy', 'en-US')
          : '',
        rowData.so?.nombreOCA ?? '',
        rowData.so?.montant ?? '',
        rowData.latestDate
          ? formatDate(new Date(rowData.latestDate), 'dd/MM/yyyy', 'en-US')
          : '',
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

        if (colNumber == 2 || colNumber == 3 || colNumber == 5) {
          cell.alignment = { horizontal: 'right' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { horizontal: 'center' };
        }
      });
      row.height = 22;

      worksheet.addRow([]);
      worksheet.addRow([]);
      worksheet.addRow([]);

      // Titre du deuxième tableau
      let secondTableTitle =
        'Historique des conversions pour ' +
        rowData.so?.financement?.projet.nom.toUpperCase();
      let secondTableTitleRow = worksheet.addRow([secondTableTitle]);
      secondTableTitleRow.font = { bold: false, size: 14 };
      secondTableTitleRow.alignment = { horizontal: 'left', vertical: 'middle' };
      secondTableTitleRow.font = { size: 14, color: { argb: '005A9C' } };
      worksheet.mergeCells(`A${secondTableTitleRow.number}:C${secondTableTitleRow.number}`);
      worksheet.getRow(secondTableTitleRow.number).height = 25;

      // En-tête du deuxième tableau
      let newHeaders = ['Date de la conversion', 'Montant converti', 'Ratio %'];
      let newHeaderRow = worksheet.addRow(newHeaders);
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

      // Ajouter les données du deuxième tableau
      rowData.rc.forEach((rcData: any) => {
        let row = worksheet.addRow([
          formatDate(new Date(rcData.dateRealisation), 'dd/MM/yyyy', 'en-US'),
          rcData.montantRealise,
          rcData.ratio ? rcData.ratio / 100 : '',
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

          if (colNumber == 2) {
            cell.alignment = { horizontal: 'right' };
            cell.numFmt = '#,##0';
          } else if (colNumber == 3) {
            cell.numFmt = '0%';
            cell.alignment = { horizontal: 'right' };
          } else {
            cell.alignment = { horizontal: 'center' };
          }
        });
        row.height = 22;
      });

      worksheet.addRow([]);

    });

    // Ajuster la largeur des colonnes
    worksheet.columns.forEach((column: any) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        let length = cell.value ? cell.value.toString().length : 0;
        if (length > maxLength) {
          maxLength = length;
        }
      });
      column.width = Math.min(Math.max(maxLength + 2, 10), 45);
    });

    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      let blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'Remboursements_conversions_OCA.xlsx');
    });
  }
}


