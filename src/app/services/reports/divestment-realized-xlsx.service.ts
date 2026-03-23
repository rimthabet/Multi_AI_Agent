import { Injectable } from '@angular/core';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { formatDate as angularFormatDate } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DivestmentRealizedXlsxService {

  constructor() { }

  exportToExcel(data: any, fonds: any): void {
    let workbook = new ExcelJS.Workbook();
    let worksheet = workbook.addWorksheet('Data');

    // Définir le titre
    let title ='Désinvestissements réalisés par ' + fonds.denomination ;
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
        "Nombre d'actions souscrites",
        'Prix de l’action à l’achat',
        'Date du comité autorisant la sortie',
        'Nombre d’actions cédées',
        'Prix de vente de l’action',
        'Date de la signature du protocole de cession',
        'Montant total de la vente',
        'TRI réalisé',
        'Type de sortie réalisé',
      ],
    ];

    // Ajout de la ligne des en-têtes
    let headerRow = worksheet.addRow(customHeaders[0]);
    headerRow.eachCell((cell) => {
      cell.font = { size: 12, bold: true };
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
        rowData.sa?.financement?.projet?.nom,
        rowData.sa?.actions ?? '',
        rowData.sa?.nominal + (rowData.sa?.primeEmission ?? ''),
        formatDate(rowData.sa?.dateComiteAutorisantSortie),
        rowData.sa?.actionsCedees ?? '',
        rowData.sa?.prixVenteAction ?? '',
        formatDate(rowData.sa?.dateSignatureProtocoleCession),
        rowData.sa?.prixTotalVente ?? '',
        rowData.sa?.triRealise ?? '',
        rowData.sa?.typeSortieRealisee?.libelle ?? '',
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

        if (
          colNumber == 2 ||
          colNumber == 3 ||
          colNumber == 5 ||
          colNumber == 6 ||
          colNumber == 8
        ) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0'; 
        }

        if (colNumber == 9) {
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '0%'; 
        }

        if (colNumber == 1) {
          cell.alignment = { horizontal: 'left', vertical: 'middle' };
        }

        if (colNumber == 4 || colNumber == 7) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
      row.height = 22; 
    });

    // Ajustement des largeurs des colonnes
    worksheet.getColumn(1).width = 45; // Projet
    worksheet.getColumn(2).width = 30; // Nombre d'actions souscrites
    worksheet.getColumn(3).width = 30; // Prix de l’action à l’achat
    worksheet.getColumn(4).width = 35; // Date du comité autorisant la sortie
    worksheet.getColumn(5).width = 30; // Nombre d’actions cédées
    worksheet.getColumn(6).width = 30; // Prix de vente de l’action
    worksheet.getColumn(7).width = 50; // Date de la signature du protocole de cession
    worksheet.getColumn(8).width = 30; // Montant total de la vente
    worksheet.getColumn(9).width = 20; // TRI réalisé
    worksheet.getColumn(10).width = 30; // Type de sortie réalisé

    // Exportation du fichier Excel
    workbook.xlsx.writeBuffer().then((buffer: ArrayBuffer) => {
      let blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, 'DesinvestissementsRealises.xlsx');
    });
  }
}

 
