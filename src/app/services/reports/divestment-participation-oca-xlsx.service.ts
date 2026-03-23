import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatDate as angularFormatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DivestmentParticipationOcaXlsxService {

  constructor() { }

  exportToExcel(data: any, fonds: any): void {
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Data');
    let title = 'Participations en OCA par ' + fonds.denomination;
    worksheet.mergeCells('A1:H1');
    let titleCell = worksheet.getCell('A1');
    titleCell.value = title;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 25;

    // En-têtes personnalisés
    let customHeaders = [
      [
        'Projet',
        'Date du comité d’investissement',
        'Date de la souscription',
        "Nombre d'actions souscrites",
        'Montant total des OCA',
        "Taux d'intérêt",
        'Indexation',
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
      let row = worksheet.addRow([
        rowData.so?.financement?.projet?.nom || '',
        rowData.ci?.dateComite
          ? formatDate(new Date(rowData.ci.dateComite))
          : '',
        rowData.so?.dateBulletin
          ? formatDate(new Date(rowData.so.dateBulletin))
          : '',
        rowData.so?.nombreOCA ?? '',
        rowData.so?.montant ?? '',
        rowData.so?.taux ?? '',
        rowData.so?.index ?? '',
        rowData.so?.dateSortie
          ? formatDate(new Date(rowData.so.dateSortie))
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

        if (colNumber == 4 || colNumber == 5) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0'; 
        }

        if (colNumber == 6) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0%';
        }

        if (colNumber == 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }
        if (colNumber == 2 || colNumber == 3 || colNumber == 7) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }

        
      });
      row.height = 22; // Hauteur de la ligne
    });

    // Ajustement des largeurs des colonnes
    worksheet.getColumn(1).width = 45; // Projet
    worksheet.getColumn(2).width = 35; // Date du comité d’investissement
    worksheet.getColumn(3).width = 30; // Date de la souscription
    worksheet.getColumn(4).width = 30; // Nombre d'actions souscrites
    worksheet.getColumn(5).width = 30; // Montant total des OCA
    worksheet.getColumn(6).width = 30; // Taux d'intérêt
    worksheet.getColumn(7).width = 30; // Indexation
    worksheet.getColumn(8).width = 30; // Date de sortie espérée

    // Exportation du fichier Excel
    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      let blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'ParticipationsOCA.xlsx');
    });
  }
}


