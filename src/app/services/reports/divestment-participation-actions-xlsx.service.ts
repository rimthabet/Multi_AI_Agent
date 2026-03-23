import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatDate as angularFormatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DivestmentParticipationActionsXlsxService {

  constructor() { }
  
  exportToExcel(data: any, fonds: any): void {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Data');
    const title = 'Participations en actions par ' + fonds.denomination;
    worksheet.mergeCells('A1:G1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 25;

    // En-têtes personnalisés
    const customHeaders = [
      [
        'Projet',
        'Date du comité d’investissement',
        'Date de la souscription',
        "Nombre d'actions souscrites",
        'TRI espéré',
        'Type de sortie espérée',
        'Date de sortie espérée',
      ],
    ];

    // Ajout de la ligne des en-têtes
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

    data.forEach((rowData: any) => {
      let triEspere = rowData.sa?.triEspere;
      if (triEspere == null || triEspere == undefined) {
        triEspere = '';
      } else if (typeof triEspere == 'number') {
        triEspere = triEspere.toFixed(2) + ' %';
      }

      let row = worksheet.addRow([
        rowData.sa?.financement?.projet?.nom,
        rowData.ci?.dateComite
          ? formatDate(new Date(rowData.ci.dateComite))
          : '',
        rowData.sa?.dateBulletin
          ? formatDate(new Date(rowData.sa.dateBulletin))
          : '',
        rowData.sa?.actions ?? '',
        triEspere,
        rowData.sa?.typeSortieEsperee?.libelle ?? '',
        rowData.sa?.dateSortieEsperee
          ? formatDate(new Date(rowData.sa.dateSortieEsperee))
          : '',
      ]);

      // Application des styles pour chaque cellule
      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle' };
        cell.font = { size: 12 };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };

        if (colNumber == 4) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        }

        if (colNumber == 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
        if (colNumber == 2 || colNumber == 3 || colNumber == 7) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
        if (colNumber == 5) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0%';
        }
      });
      row.height = 22;
    });

    // Ajustement des largeurs des colonnes
    worksheet.getColumn(1).width = 45; // Projet
    worksheet.getColumn(2).width = 35; // Date du comité d’investissement
    worksheet.getColumn(3).width = 30; // Date de la souscription
    worksheet.getColumn(4).width = 30; // Nombre d'actions souscrites
    worksheet.getColumn(5).width = 30; // TRI espéré
    worksheet.getColumn(6).width = 30; // Type de sortie espérée
    worksheet.getColumn(7).width = 30; // Date de sortie espérée

    // Exportation du fichier Excel
    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      let blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'ParticipationsActions.xlsx');
    });
  }
}

