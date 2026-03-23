import { ElementRef, Injectable, ViewChild } from '@angular/core';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { environment } from '../../../environment/environment';
import { formatDate } from '@angular/common';

@Injectable({
    providedIn: 'root',
})
export class FundSheetPdfService {

    //chartContainer = viewChild<ElementRef>("chartContainer");

    async genererPDF(
        data: any,
        totalActif: any,
        mandat: any,
        souscriptions: any,
        secteurs: any
    ) {
        try {
            let pdfDoc = await PDFDocument.create();
            let page = pdfDoc.addPage();

            let { width, height } = page.getSize();
            let margin = 50;
            let logoMargin = 20;

            let currentY = height - margin;
            let remainingSpace = currentY - margin;

            let addNewPage = () => {
                page = pdfDoc.addPage();
                currentY = height - margin;
                remainingSpace = currentY - margin;
            };

            const checkRemainingSpace = (spaceNeeded: number) => {
                if (remainingSpace - spaceNeeded < 0) {
                    addNewPage();
                }
            };

            // Fetch and embed the logo
            let logoUrl = environment.logoUrl;
            let logoImageBytes = await this.fetchImageAsBytes(logoUrl);
            let logoImage = await pdfDoc.embedPng(logoImageBytes);
            let logoWidth = width * 0.08;
            let logoHeight = (logoWidth * logoImage.height) / logoImage.width;

            // Position the logo
            let logoX = margin;
            let logoY = height - logoHeight - logoMargin;

            // Draw the logo
            page.drawImage(logoImage, {
                x: logoX,
                y: logoY,
                width: logoWidth,
                height: logoHeight,
            });

            // Company names
            let companyShortName = environment.company_short_name;
            let companyLongName = environment.company_long_name;

            let logoCenterY = logoY + logoHeight / 2;

            let shortNameSize = 20;
            let longNameSize = 11;

            let companyX = logoX + logoWidth + 25;

            let shortNameY = logoCenterY + 3;

            page.drawText(companyShortName, {
                x: companyX,
                y: shortNameY,
                size: shortNameSize,
                color: rgb(0, 0, 0),
            });

            page.drawText(companyLongName, {
                x: companyX + 0.5,
                y: shortNameY - shortNameSize,
                size: longNameSize,
                color: rgb(0.5, 0.5, 0.5),
            });

            // Contact information
            let contactLines: string[] = [
                'Rue du Lac Léman, Centre Nawress',
                '1053 Les Berges du Lac',
                'Tél: (+216 71) 960 026 / 963 116',
                'Fax: (+216 71) 963 302',
            ];

            let contactStartX = width - margin - 190;
            let contactY = logoCenterY + 12;

            // Draw contact information
            contactLines.forEach((line, index) => {
                page.drawText(line, {
                    x: contactStartX,
                    y: contactY - index * 14,
                    size: 11,
                    color: rgb(0, 0, 0),
                });
            });

            let contactInfoY = logoY - 10;

            // Horizontal line
            let hrY = contactInfoY - 2;
            page.drawLine({
                start: { x: margin, y: hrY },
                end: { x: width - margin, y: hrY },
                thickness: 0.1,
                color: rgb(0.5, 0.5, 0.5),
            });

            let additionalText = `
    ${data?.fonds.formeLegale?.libelle
                } ${data?.fonds.nature?.libelle?.toLowerCase()} créé le ${new Date(
                    data?.fonds?.dateLancement
                ).toLocaleDateString('fr-FR')} avec un montant projeté de ${Number(
                    data?.fonds.montant
                )
                    .toLocaleString('fr-FR')
                    .replace(/\u202f/g, ' ')} tnd sur ${data?.fonds.duree
                } ans et ayant le visa CMF numéro : ${data?.fonds.numVisaCMF}.
`;

            let helveticaBoldFont = await pdfDoc.embedFont(
                StandardFonts.HelveticaBold
            );
            let helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
            let title = data?.fonds?.denomination;

            let titleFontSize = 20;
            let additionalTextFontSize = 12;

            let titleX =
                (width - helveticaBoldFont.widthOfTextAtSize(title, titleFontSize)) / 2;
            let titleY = height - margin - 85;
            let additionalTextX = margin;
            let additionalTextY = titleY - 40;

            // Draw the title
            page.drawText(title, {
                x: titleX,
                y: titleY,
                size: titleFontSize,
                color: rgb(0, 0, 0),
            });
            let lines = additionalText.trim().split('\n');

            currentY = additionalTextY;
            lines.forEach((line) => {
                let lineWidth = helveticaFont.widthOfTextAtSize(
                    line.trim(),
                    additionalTextFontSize
                );
                if (lineWidth > width - 2 * margin) {
                    let words = line.trim().split(' ');
                    let currentLine = '';
                    words.forEach((word) => {
                        let tempLine = currentLine + ' ' + word;
                        let tempWidth = helveticaFont.widthOfTextAtSize(
                            tempLine.trim(),
                            additionalTextFontSize
                        );
                        if (tempWidth <= width - 2 * margin) {
                            currentLine = tempLine.trim();
                        } else {
                            page.drawText(currentLine, {
                                x: additionalTextX,
                                y: currentY,
                                size: additionalTextFontSize,
                                font: helveticaFont,
                                color: rgb(0, 0, 0),
                            });
                            currentY -= additionalTextFontSize * 1.3;
                            currentLine = word;
                        }
                    });
                    page.drawText(currentLine, {
                        x: additionalTextX,
                        y: currentY,
                        size: additionalTextFontSize,
                        font: helveticaFont,
                        color: rgb(0, 0, 0),
                    });
                    currentY -= additionalTextFontSize * 1.3;
                } else {
                    page.drawText(line.trim(), {
                        x: additionalTextX,
                        y: currentY,
                        size: additionalTextFontSize,
                        font: helveticaFont,
                        color: rgb(0, 0, 0),
                    });
                    currentY -= additionalTextFontSize * 1.2;
                }
            });

            currentY -= additionalTextFontSize * 2;

            page.drawText(title, {
                x: titleX,
                y: titleY,
                size: titleFontSize,
                color: rgb(0, 0, 0),
            });

            let romanNumFontSize = 14;
            let romanNumX = margin;
            let romanNumY = height - margin - 180;
            page.drawText('I. FICHE SIGNALÉTIQUE', {
                x: romanNumX,
                y: romanNumY,
                size: romanNumFontSize,
                color: rgb(0, 0, 0),
            });

            let verticalSpace = 175;
            let romanNumIIY = romanNumY - 20 - verticalSpace;
            page.drawText('II. DOCUMENTS JURIDIQUES', {
                x: romanNumX,
                y: romanNumIIY,
                size: romanNumFontSize,
                color: rgb(0, 0, 0),
            });

            let spaceAfterII = 220;

            let romanNumIIIY = romanNumIIY - 20 - spaceAfterII;
            page.drawText('III. Montants souscrits et libérés', {
                x: romanNumX,
                y: romanNumIIIY,
                size: romanNumFontSize,
                color: rgb(0, 0, 0),
            });

            let spaceAfterText = 140;
            let romanNumText = romanNumIIY - 20 - spaceAfterText;
            romanNumX = 50;
            // Initialisation du texte des périodes
            let periodesText = '';

            // Parcourir toutes les périodes de souscription
            souscriptions.periodes.forEach((periode: any, index: number) => {
                let debut = new Date(periode.dateDebut);
                let fin = new Date(periode.dateFin);

                // Calculer le total des montants de souscription pour la période courante
                let totalMontantSouscription = souscriptions.souscriptions.reduce(
                    (total: number, souscription: any) => {
                        let dateSouscription = new Date(
                            souscription.souscription.dateSouscription
                        );
                        if (dateSouscription >= debut && dateSouscription <= fin) {
                            let montant = souscription.souscription.montantSouscription;
                            return total + montant;
                        }
                        return total;
                    },
                    0
                );

                // Calculer le total des montants de libération pour la période courante
                let totalMontantLiberation = souscriptions.souscriptions.reduce(
                    (total: number, souscription: any) => {
                        let dateSouscription = new Date(
                            souscription.souscription.dateSouscription
                        );
                        if (dateSouscription >= debut && dateSouscription <= fin) {
                            let montantLiberation = souscription.liberations.reduce(
                                (libTotal: number, liberation: any) =>
                                    libTotal + liberation.montantLiberation,
                                0
                            );
                            return total + montantLiberation;
                        }
                        return total;
                    },
                    0
                );

                let formattedSouscription = totalMontantSouscription
                    .toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'tnd',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                    })
                    .replace(/\u202F/g, ' ');

                let formattedLiberation = totalMontantLiberation
                    .toLocaleString('fr-FR', {
                        style: 'currency',
                        currency: 'tnd',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 2,
                    })
                    .replace(/\u202F/g, ' ');

                periodesText += `Période ${index + 1
                    }: du ${debut.toLocaleDateString()} au ${fin.toLocaleDateString()}  `;
                periodesText += ` Souscrit: ${formattedSouscription}  Libéré: ${formattedLiberation}\n\n`;
            });

            let text = `Les souscriptions au fonds ${data.fonds.denomination} se sont déroulées pendant ${souscriptions?.periodes?.length} périodes de souscriptions.\n\n${periodesText}`;

            page.drawText(text, {
                x: romanNumX,
                y: romanNumText,
                size: 10,
                color: rgb(0, 0, 0),
                maxWidth: 540,
                lineHeight: 14,
            });

            let infoX = margin;
            let infoY = height - margin - 200;

            let labels = [
                'Actif du fonds',
                'Forme légale',
                'Montant projeté',
                'Durée',
                'Banque dépositaire',
                'Nature',
                'Commissaire(s) aux comptes',
            ];

            let values = [
                `${totalActif !== undefined
                    ? totalActif
                        .toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'tnd',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                        })
                        .replace(/\u202F/g, ' ')
                    : '0 tnd'
                }`,
                `${data?.fonds.formeLegale?.libelle || '-'}`,
                `${data?.fonds.montant !== undefined
                    ? data?.fonds.montant
                        .toLocaleString('fr-FR', {
                            style: 'currency',
                            currency: 'tnd',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 2,
                        })
                        .replace(/\u202F/g, ' ')
                    : '0 tnd'
                }`,
                `${data?.fonds.duree || '-'}`,
                `${data?.fonds.banque?.libelle || '-'}`,
                `${data?.fonds.nature?.libelle || '-'}`,
                `${mandat.cac?.libelle || '-'} ${mandat.anneeD || '-'} - ${mandat.anneeF || '-'
                }`,
            ];

            let tableWidth = width - 2 * margin;
            let cellHeight = 20;
            let cellPadding = 5;
            checkRemainingSpace(labels.length * cellHeight + 60);

            page.drawRectangle({
                x: infoX,
                y: infoY - labels.length * cellHeight,
                width: tableWidth,
                height: labels.length * cellHeight,
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });

            for (let i = 0; i <= labels.length; i++) {
                page.drawLine({
                    start: { x: infoX, y: infoY - i * cellHeight },
                    end: { x: infoX + tableWidth, y: infoY - i * cellHeight },
                    color: rgb(0, 0, 0),
                    thickness: 1,
                });
            }

            let labelColumnWidth = tableWidth * 0.5;
            page.drawLine({
                start: { x: infoX + labelColumnWidth, y: infoY },
                end: {
                    x: infoX + labelColumnWidth,
                    y: infoY - labels.length * cellHeight,
                },
                color: rgb(0, 0, 0),
                thickness: 1,
            });

            for (let i = 0; i < labels.length; i++) {
                let labelX = infoX + cellPadding;
                let labelY = infoY - (i + 0.7) * cellHeight;
                let valueX = infoX + labelColumnWidth + cellPadding;
                let valueY = infoY - (i + 0.7) * cellHeight;

                page.drawText(labels[i], {
                    x: labelX,
                    y: labelY,
                    size: 10,
                    color: rgb(0, 0, 0),
                });

                page.drawText(values[i], {
                    x: valueX,
                    y: valueY,
                    size: 10,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            }

            let documents = data.conformites.map(
                (item: any) => item.conformite.documentType.libelle
            );

            let documentX = margin;
            let documentY = infoY - documents.length - 190;

            let frameWidth = 494;
            let frameHeight = documents.length * 20 + 20;
            let frameX = documentX;
            let frameY = documentY - frameHeight;

            page.drawRectangle({
                x: frameX,
                y: frameY,
                width: frameWidth,
                height: frameHeight,
                borderColor: rgb(0, 0, 0),
                borderWidth: 1,
            });

            documents.forEach((documentType: string, index: number) => {
                let textY = frameY + frameHeight - 20 - index * 20;

                page.drawCircle({
                    x: documentX + 8,
                    y: textY + 3,
                    size: 2,
                    color: rgb(0, 0, 0),
                });

                page.drawText(documentType, {
                    x: documentX + 15,
                    y: textY,
                    size: 10,
                    font: helveticaFont,
                    color: rgb(0, 0, 0),
                });
            });

            // Ajuster la position Y après avoir ajouté le texte

            currentY -= 550;

            // Créer le conteneur pour la charte avec cadre
            let chartContainer = document.createElement('div');
            chartContainer.style.width = '500px';
            chartContainer.style.height = '120px';
            chartContainer.style.border = '1px solid black';
            chartContainer.style.marginBottom = '12px';
            document.body.appendChild(chartContainer);

            // Initialiser la charte ECharts
            // let chart = echarts.init(chartContainer);
            let xAxisData = this.extractPeriods(souscriptions);
            let totalSouscription = this.extractTotalSouscription(souscriptions);
            let totalLiberation = this.extractTotalLiberation(souscriptions);

            let chartOptions = {
                color: ['#7bb0de', '#91cc75'],
                legend: {
                    data: ['Montant souscrit', 'Montant libéré'],
                    textStyle: {
                        fontSize: 10,
                    },
                    top: '1%',
                    left: '15%',
                    right: '15%',
                    itemWidth: 12,
                    itemHeight: 12,
                },

                grid: {
                    left: '0%',
                    right: '15%',
                    bottom: '8%',
                    containLabel: true,
                },

                xAxis: [
                    {
                        type: 'category',
                        axisTick: { show: false },
                        data: xAxisData,
                        axisLabel: {
                            formatter: (value: string) =>
                                formatDate(value, 'DD-MM-YYYY', 'EN'),
                            fontSize: 8,
                        },
                    },
                ],
                yAxis: [
                    {
                        type: 'value',
                        axisLabel: { show: false },
                        axisLine: { show: false },
                        axisTick: { show: false },
                        splitLine: { show: false },
                    },
                ],
                series: [
                    {
                        name: 'Montant souscrit',
                        type: 'bar',
                        barWidth: '20%',
                        data: totalSouscription,
                        emphasis: { focus: 'series' },
                        label: {
                            show: true,
                            position: 'insideBottom',
                            verticalAlign: 'middle',
                            align: 'left',
                            rotate: 90,
                            formatter: (params: any) => {
                                return params.value != 0 ? params.value.toLocaleString() : 0;
                            },
                            textStyle: {
                                fontSize: 10,
                            },
                        },
                    },
                    {
                        name: 'Montant libéré',
                        type: 'bar',
                        barWidth: '20%',
                        data: totalLiberation,
                        emphasis: { focus: 'series' },
                        label: {
                            show: true,
                            position: 'insideBottom',
                            verticalAlign: 'middle',
                            align: 'left',
                            rotate: 90,
                            formatter: (params: any) => {
                                return params.value != 0 ? params.value.toLocaleString() : 0;
                            },
                            textStyle: {
                                fontSize: 10,
                            },
                        },
                    },
                ],
            };
            //   chart.setOption(chartOptions);

            //   await new Promise<void>((resolve) => {
            //     chart.on('finished', () => {
            //       resolve();
            //     });
            //   });
            //   checkRemainingSpace(300);

            //   let chartImage = chart.getDataURL({ pixelRatio: 1 });

            // Incorporer l'image dans le PDF
            //   let imageBytes = await fetch(chartImage).then((res) => res.arrayBuffer());
            //   let chartImageEmbed = await pdfDoc.embedPng(imageBytes);

            //   page.drawImage(chartImageEmbed, {
            //     x: margin,
            //     y: currentY - 20,
            //   });

            document.body.removeChild(chartContainer);

            remainingSpace = currentY - margin;
            remainingSpace -= labels.length * cellHeight + 50;

            if (remainingSpace < 0) {
                romanNumIIY = height - margin;
                infoY = romanNumIIY - 830;

                function drawTitle() {
                    page.drawText('IV. Capitaux levés des souscripteurs', {
                        x: romanNumX,
                        y: romanNumIIY,
                        size: 18,
                        color: rgb(0, 0, 0),
                    });
                }
                function drawTable() {
                    let headers = ['Libellé', 'Nationalité', "Montant de l'actif", '%'];

                    let totalMontantSouscription = souscriptions.souscriptions.reduce(
                        (sum: number, item: any) => {
                            return sum + item.souscription.montantSouscription;
                        },
                        0
                    );

                    let aggregatedSouscriptions: { [key: string]: any } = {};

                    souscriptions.souscriptions.forEach((item: any) => {
                        let libelle = item.souscription.souscripteur.libelle;
                        if (!aggregatedSouscriptions[libelle]) {
                            aggregatedSouscriptions[libelle] = {
                                libelle: libelle,
                                nationalite: item.souscription.souscripteur.nationalite,
                                montantSouscription: item.souscription.montantSouscription,
                                count: 1,
                            };
                        } else {
                            aggregatedSouscriptions[libelle].montantSouscription +=
                                item.souscription.montantSouscription;
                            aggregatedSouscriptions[libelle].count += 1;
                        }
                    });

                    let sortedSouscriptions = Object.values(aggregatedSouscriptions).sort(
                        (a: any, b: any) => {
                            let libelleA = a.libelle.toUpperCase();
                            let libelleB = b.libelle.toUpperCase();
                            if (libelleA < libelleB) {
                                return -1;
                            }
                            if (libelleA > libelleB) {
                                return 1;
                            }
                            return 0;
                        }
                    );

                    let firstColumnWidth = 200;
                    let lastColumnWidth = 0;

                    let values = sortedSouscriptions.map((item: any) => {
                        let libelleLines = splitText(item.libelle || '-', firstColumnWidth);

                        return [
                            libelleLines.join('\n'),
                            item.nationalite || '-',
                            `${item.montantSouscription
                                .toLocaleString('fr-FR', {
                                    style: 'currency',
                                    currency: 'tnd',
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                })
                                .replace(/\u202F/g, ' ') || '-'
                            } `,
                            `${(
                                (item.montantSouscription / totalMontantSouscription) *
                                100
                            ).toFixed(0)} %`,
                        ];
                    });

                    let tableWidth = width - 2 * margin;
                    let cellHeight = 25;
                    let cellPadding = 5;
                    let totalNonFirstColumnWidths = tableWidth - firstColumnWidth;
                    let totalRemainingWidth = totalNonFirstColumnWidths - lastColumnWidth;
                    let remainingColumnWidth = totalRemainingWidth / (headers.length - 1);

                    function splitText(text: string, maxLength: number): string[] {
                        let lines: string[] = [];
                        let line = '';
                        let words = text.split(' ');

                        for (let i = 0; i < words.length; i++) {
                            let word = words[i];
                            let potentialLine = line.length === 0 ? word : line + ' ' + word;

                            if (potentialLine.length <= maxLength) {
                                line = potentialLine;
                            } else {
                                lines.push(line);
                                line = word;
                            }
                        }

                        if (line.length > 0) {
                            lines.push(line);
                        }

                        return lines;
                    }

                    function drawTableHeaders() {
                        infoY -= 10;

                        for (let i = 0; i < headers.length; i++) {
                            let columnWidth =
                                i == 0 ? firstColumnWidth : remainingColumnWidth;

                            page.drawRectangle({
                                x:
                                    infoX +
                                    (i == 0
                                        ? 0
                                        : firstColumnWidth + (i - 1) * remainingColumnWidth),
                                y: infoY - cellHeight,
                                width: columnWidth,
                                height: cellHeight,
                                borderColor: rgb(0, 0, 0),
                                borderWidth: 1,
                            });

                            page.drawText(headers[i], {
                                x:
                                    infoX +
                                    (i == 0
                                        ? 0
                                        : firstColumnWidth + (i - 1) * remainingColumnWidth) +
                                    cellPadding,
                                y: infoY - cellHeight + (cellHeight - 10) / 2,
                                size: 10,
                                font: helveticaBoldFont,
                                color: rgb(0, 0, 0),
                            });
                        }

                        infoY -= cellHeight;
                    }
                    drawTableHeaders();
                    let titleDisplayed = false;
                    let headerDisplayed = false;

                    for (let rowIndex = 0; rowIndex < values.length; rowIndex++) {
                        let rowY = infoY - cellHeight;

                        if (rowY < margin) {
                            addNewPage();
                            romanNumIIY = height - margin;
                            infoY = romanNumIIY - 5;

                            if (!titleDisplayed) {
                                drawTitle();
                                titleDisplayed = true;
                                infoY -= 10;
                            }

                            if (!headerDisplayed) {
                                drawTableHeaders();
                                headerDisplayed = true;
                            }

                            rowY = infoY - cellHeight;
                        }

                        for (let colIndex = 0; colIndex < headers.length; colIndex++) {
                            let columnWidth =
                                colIndex == 0 ? firstColumnWidth : remainingColumnWidth;

                            page.drawRectangle({
                                x:
                                    infoX +
                                    (colIndex === 0
                                        ? 0
                                        : firstColumnWidth + (colIndex - 1) * remainingColumnWidth),
                                y: rowY,
                                width: columnWidth,
                                height: cellHeight,
                                borderColor: rgb(0, 0, 0),
                                borderWidth: 1,
                            });

                            page.drawText(values[rowIndex][colIndex], {
                                x:
                                    infoX +
                                    (colIndex == 0
                                        ? 0
                                        : firstColumnWidth +
                                        (colIndex - 1) * remainingColumnWidth) +
                                    cellPadding,
                                y: rowY + (cellHeight - 12) / 2,
                                size: 9,
                                font: helveticaFont,
                                color: rgb(0, 0, 0),
                            });
                        }

                        infoY -= cellHeight;
                    }

                    let totalSouscriptions = souscriptions.souscriptions.length;
                    let totalSouscripteurs = Object.keys(aggregatedSouscriptions).length;

                    let footerY = infoY - cellHeight;

                    if (footerY < margin) {
                        addNewPage();
                        romanNumIIY = height - margin;
                        infoY = romanNumIIY - 5;
                        footerY = infoY - cellHeight;
                    }

                    page.drawRectangle({
                        x: infoX,
                        y: footerY,
                        width: tableWidth,
                        height: cellHeight,
                        borderColor: rgb(0, 0, 0),
                        borderWidth: 1,
                    });

                    page.drawText(
                        `Nombre total de souscriptions: ${totalSouscriptions}`,
                        {
                            x: infoX + cellPadding,
                            y: footerY + (cellHeight - 10) / 2,
                            size: 12,
                            font: helveticaFont,
                            color: rgb(0, 0, 0),
                        }
                    );

                    page.drawText(
                        `Nombre total de souscripteurs: ${totalSouscripteurs}`,
                        {
                            x: infoX + tableWidth / 2 + cellPadding,
                            y: footerY + (cellHeight - 10) / 2,
                            size: 12,
                            font: helveticaFont,
                            color: rgb(0, 0, 0),
                        }
                    );
                    infoY -= 70;
                }

                drawTable();
            }
            drawTitleV();
            function drawTitleV() {
                page.drawText('V. Participations du fonds', {
                    x: romanNumX,
                    y: infoY,
                    size: 18,
                    color: rgb(0, 0, 0),
                });
                infoY -= 20;
            }

            function drawSecteursTable() {
                let headers = ['Projet', 'Participation engagée', '% <= 15%'];
                let cellHeight = 32;
                let cellPadding = 10;
                let firstColumnWidth = 200;
                let remainingColumnWidth = 145;
                let tableWidth = firstColumnWidth + 2 * remainingColumnWidth;
                let rowY = infoY;
                let headerDisplayed = false;

                function drawTableHeaders() {
                    rowY -= cellHeight;

                    page.drawRectangle({
                        x: infoX,
                        y: rowY,
                        width: tableWidth,
                        height: cellHeight,
                        color: rgb(1, 1, 1),
                    });

                    headers.forEach((header, index) => {
                        let columnWidth =
                            index === 0 ? firstColumnWidth : remainingColumnWidth;
                        let xOffset =
                            index === 0
                                ? 0
                                : firstColumnWidth + (index - 1) * remainingColumnWidth;

                        // Dessiner chaque cellule d'en-tête
                        page.drawRectangle({
                            x: infoX + xOffset,
                            y: rowY,
                            width: columnWidth,
                            height: cellHeight,
                            borderColor: rgb(0, 0, 0),
                            borderWidth: 1,
                        });

                        // Dessiner le texte des en-têtes
                        page.drawText(header, {
                            x: infoX + xOffset + cellPadding,
                            y: rowY + (cellHeight - 12) / 2,
                            size: 10,
                            font: helveticaBoldFont,
                            color: rgb(0, 0, 0),
                        });
                    });

                    return rowY - cellHeight;
                }

                function drawTableRows() {
                    secteurs.forEach((secteur: any) => {
                        let filteredProjects = secteur.projets.filter(
                            (project: any) => project.part
                        );

                        filteredProjects.forEach((project: any) => {
                            if (rowY < margin + cellHeight) {
                                addNewPage();
                                rowY = height - margin;
                                if (!headerDisplayed) {
                                    rowY = drawTableHeaders();
                                    headerDisplayed = true;
                                }
                            }

                            page.drawRectangle({
                                x: infoX,
                                y: rowY,
                                width: tableWidth,
                                height: cellHeight,
                                borderColor: rgb(0, 0, 0),
                                borderWidth: 1,
                            });

                            page.drawText(project.p.nom, {
                                x: infoX + cellPadding,
                                y: rowY + (cellHeight - 10) / 2,
                                size: 10,
                                font: helveticaFont,
                                color: rgb(0, 0, 0),
                                maxWidth: firstColumnWidth - 2 * cellPadding,
                            });

                            page.drawText(`${project.actif}`, {
                                x: infoX + firstColumnWidth + cellPadding,
                                y: rowY + (cellHeight - 10) / 2,
                                size: 10,
                                font: helveticaFont,
                                color: rgb(0, 0, 0),
                                maxWidth: remainingColumnWidth - 2 * cellPadding,
                            });

                            page.drawText(`${(project.part * 100).toFixed(2)}%`, {
                                x:
                                    infoX + firstColumnWidth + remainingColumnWidth + cellPadding,
                                y: rowY + (cellHeight - 10) / 2,
                                size: 10,
                                font: helveticaFont,
                                color: rgb(0, 0, 0),
                                maxWidth: remainingColumnWidth - 2 * cellPadding,
                            });

                            rowY -= cellHeight;
                        });
                    });
                }

                if (!headerDisplayed) {
                    rowY = drawTableHeaders();
                    headerDisplayed = true;
                }

                drawTableRows();
            }

            drawSecteursTable();

            this.addPageNumbers(pdfDoc);

            let pdfBytes = await pdfDoc.save();
            let blob = new Blob([pdfBytes], { type: 'application/pdf' });
            let url = URL.createObjectURL(blob);
            let a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'Fiche-Fonds.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Erreur lors de la génération du PDF :', error);
        }
    }
    addPageNumbers(pdfDoc: PDFDocument) {
        const pages = pdfDoc.getPages();
        pages.forEach((page: any, index: any) => {
            let { width } = page.getSize();
            page.drawText(`Page ${index + 1}`, {
                x: width / 2 - 20,
                y: 30,
                size: 10,
                color: rgb(0, 0, 0),
            });
        });
    }
    extractPeriods(souscriptions: any): string[] {
        if (!souscriptions || !souscriptions.periodes) {
            return [];
        }

        return souscriptions.periodes.map((periode: any) => {
            let startDate = formatDate(periode.dateDebut, 'DD-MM-YYYY', 'EN');
            let endDate = formatDate(periode.dateFin, 'DD-MM-YYYY', 'EN');
            return `${startDate}  -  ${endDate}`;
        });
    }

    extractTotalSouscription(souscriptions: any): number[] {
        if (!souscriptions || !souscriptions.periodes) {
            return [];
        }
        let totalSouscription: number[] = [];

        souscriptions.periodes.forEach((periode: any) => {
            let debut = new Date(periode.dateDebut);
            let fin = new Date(periode.dateFin);
            let total = souscriptions.souscriptions.reduce(
                (total: number, souscription: any) => {
                    let dateSouscription = new Date(
                        souscription.souscription.dateSouscription
                    );
                    if (dateSouscription >= debut && dateSouscription <= fin) {
                        let montant = souscription.souscription.montantSouscription;
                        return total + montant;
                    }
                    return total;
                },
                0
            );

            totalSouscription.push(total);
        });
        return totalSouscription;
    }

    extractTotalLiberation(souscriptions: any): number[] {
        if (!souscriptions || !souscriptions.periodes) {
            return [];
        }

        let totalLiberation: number[] = [];

        souscriptions.periodes.forEach((periode: any) => {
            let debut = new Date(periode.dateDebut);
            let fin = new Date(periode.dateFin);

            let total = souscriptions.souscriptions.reduce(
                (total: number, souscription: any) => {
                    let dateSouscription = new Date(
                        souscription.souscription.dateSouscription
                    );
                    if (dateSouscription >= debut && dateSouscription <= fin) {
                        let montantLiberation = souscription.liberations.reduce(
                            (libTotal: number, liberation: any) =>
                                libTotal + liberation.montantLiberation,
                            0
                        );
                        return total + montantLiberation;
                    }
                    return total;
                },
                0
            );

            totalLiberation.push(total);
        });
        return totalLiberation;
    }

    async fetchImageAsBytes(url: string): Promise<Uint8Array> {
        let response = await fetch(url);
        let blob = await response.blob();
        return new Uint8Array(await this.readBlob(blob));
    }

    readBlob(blob: Blob): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
        });
    }
}
