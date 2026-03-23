import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class SectorActivityXlsxService {
  constructor() {}

  exportToExcel(data: any): void {
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Data');
    let title ='Ratios de conformité par secteur d’activité et société pour le ' + data?.fondsName;

    worksheet.mergeCells('A1:E1');
    let titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 25;

    let headers = [
      'Secteur / Société',
      'Activité',
      "Montant total de l'actif",
      "Part de l'actif",
      "Part max de l'actif",
    ];

    let headerRow = worksheet.addRow(headers);
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { size: 12 };
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'f5f5f5' },
      };

      if (colNumber == headers.length) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      } else {
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }
    });
    headerRow.height = 20;

    data.secteurs = data.secteurs.filter(
      (secteur: any) => secteur.projets.length > 0
    );


    let totalActif = 0;
    let totalParticipation = 0;

    data.secteurs.forEach((secteur: any) => {
      totalActif += secteur.actif || 0;
      totalParticipation += secteur.totalParticipation || 0;
      let secteurRow = worksheet.addRow([
        secteur.libelle,
        '',
        secteur.actif,
        secteur.part,
        secteur.ratioSecteurActivite,
      ]);

      secteurRow.eachCell((cell, colNumber) => {
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber == 1 ? 'left' : 'right',
        };
        if (colNumber == 1 || colNumber == 2) {
          cell.alignment = { vertical: 'middle', wrapText: true };
        }
        cell.border = {
          top: { style: 'thin', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thin', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } },
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'edf7fe' },
        };
        cell.font = { bold: true, size: 12 };
        if (colNumber == 4) {
          cell.numFmt = '0.00%';
        } else if (colNumber == 5) {
          cell.numFmt = '0%';
        } else if (colNumber == 3) {
          cell.numFmt = '#,##0';
        }
      });
      this.calculateRowHeight(secteurRow);
      secteurRow.height = Math.max(secteurRow.height, 25);

      secteur.projets.forEach((projet: any) => {
        let projetRow = worksheet.addRow([
          projet.p.nom,
          projet.p.activite,
          projet.actif,
          projet.part,
          secteur.ratioSociete,
        ]);
        projetRow.eachCell((cell, colNumber) => {
          cell.alignment = { vertical: 'middle' };
          if (colNumber == 1 || colNumber == 2) {
            cell.alignment = { vertical: 'middle', wrapText: true };
          }
          if (colNumber == 4) {
            cell.numFmt = '0.00%';
          } else if (colNumber == 5) {
            cell.numFmt = '0%';
          } else if (colNumber == 3) {
            cell.numFmt = '#,##0';
          }
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } },
          };
        });

        this.calculateRowHeight(projetRow);
        projetRow.height = Math.max(projetRow.height, 25);
      });
    });

    let totalsRow = worksheet.addRow([
      `Montant total de l'actif du fonds : ${data.totalActif.toLocaleString()} tnd`,
      '',
      '',
      '',
      `Montant total des participations : ${data.totalParticipation.toLocaleString(
        'fr-FR'
      )} tnd`,
    ]);

    totalsRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, size: 13 };
      cell.border = {
        top: { style: 'thin', color: { argb: '000000' } },
        left: { style: 'thin', color: { argb: '000000' } },
        bottom: { style: 'thin', color: { argb: '000000' } },
        right: { style: 'thin', color: { argb: '000000' } },
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '78B2DF' },
      };

      if (colNumber == 1 || colNumber == 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        cell.alignment = { vertical: 'middle' };
      }

      this.calculateRowHeight(totalsRow);
      totalsRow.height = Math.max(totalsRow.height, 25);
    });

    worksheet.columns.forEach((column: any, index: number) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        let cellValue = cell.value ? cell.value.toString() : '';
        let cellLength = cellValue.length;
        if (cellLength > maxLength) {
          maxLength = cellLength;
        }
      });

      if (index == 0) {
        column.width = 52;
      } else if (index == 1) {
        column.width = 40;
      } else if (index == 2) {
        column.width = 25;
      } else if (index == 3) {
        column.width = 20;
      } else if (index == 4) {
        column.width = 52;
      } else {
        column.width = maxLength + 2;
      }
    });

    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      let blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'Secteurs-activite.xlsx');
    });
  }

  calculateRowHeight(row: any): void {
    row.eachCell({ includeEmpty: true }, (cell:any) => {
      let cellTextLength = cell.value ? cell.value.toString().length : 0;
      let lineCount = Math.ceil(cellTextLength / 30); 
      if (lineCount > 1) {
        const additionalHeight = (lineCount - 1) * 16; 
        const currentHeight = row.height;
        row.height = Math.max(currentHeight, 20 + additionalHeight); 
      }
    });
  }
}
