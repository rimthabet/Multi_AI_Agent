import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';


@Injectable({
  providedIn: 'root'
})
export class TrackingProjectsXlsService {

  exportToExcel(data: any[]): void {
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Projets à suivre');

    let title = 'Projets à suivre';
    let customHeaders = [
      'Nom du projet',
      'Promoteur',
      'Activité',
      'Secteur',
      'Capital social (tnd)',
    ];

    // Fusionner la cellule du titre
    worksheet.mergeCells('A1:E1');
    let titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 25;

    // Ajouter les en-têtes
    let headerRow = worksheet.addRow(customHeaders);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, size: 12 };
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

    // Ajouter les données
    data.forEach((rowData) => {
      let secteurs = rowData.secteurs.map((s: any) => s.libelle).join(', ');

      let row = worksheet.addRow([
        rowData.nom,
        rowData.promoteur?.nom || '',
        rowData.activite || '',
        secteurs || '',
        rowData.actualCapital ? rowData.actualCapital : rowData.capitalSocial,
      ]);

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.font = { size: 12 };
        cell.alignment = {
          vertical: 'middle',
          horizontal: colNumber === 5 ? 'right' : 'left',
        };

        if (colNumber === 5) {
          cell.numFmt = '#,##0';
        }
      });

      row.height = 22;
    });

    // Ajustement des largeurs des colonnes
    worksheet.getColumn(1).width = 50; // Nom du projet
    worksheet.getColumn(2).width = 40; // Promoteur
    worksheet.getColumn(3).width = 115; // Activité
    worksheet.getColumn(4).width = 55; // Secteur
    worksheet.getColumn(5).width = 25; // Capital social

    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      let blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'Projets_Suivi.xlsx');
    });
  }
}
