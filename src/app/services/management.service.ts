import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environment/environment';

const httpOptions = {
  headers: new HttpHeaders({
    'Content-Type': 'application/json; charset=UTF-8',
  }),
};

@Injectable({
  providedIn: 'root',
})
export class ManagementService {

  private readonly _httpClient = inject(HttpClient);

  /// Categories management

  findCategories() {
    let url = environment.apiUrl + '/document-categories';
    return this._httpClient.get(url);
  }

  saveCategorie(categorie: any) {
    let url = environment.apiUrl + '/document-categories';
    return this._httpClient.post(url, categorie, httpOptions);
  }

  updateCategorie(type: any) {
    let url = environment.apiUrl + '/document-categories';
    return this._httpClient.put(url, type, httpOptions);
  }

  findCategorie(id: any) {
    let url = environment.apiUrl + '/document-categories/' + id;
    return this._httpClient.get(url);
  }

  deleteDocumentCategorie(id: any) {
    let url = environment.apiUrl + '/document-categories/' + id;
    return this._httpClient.delete(url);
  }

  //natures management

  findNatures() {
    let url = environment.apiUrl + '/natures';
    return this._httpClient.get(url);
  }

  saveNature(nature: any) {
    let url = environment.apiUrl + '/natures';
    return this._httpClient.post(url, nature, httpOptions);
  }

  updateNature(type: any) {
    let url = environment.apiUrl + '/natures';
    return this._httpClient.put(url, type, httpOptions);
  }

  deleteNature(id: any) {
    let url = environment.apiUrl + '/natures/' + id;
    return this._httpClient.delete(url);
  }

  findTache() {
    let url = environment.apiUrl + '/tache';
    return this._httpClient.get(url);
  }

  saveTache(tache: any) {
    let url = environment.apiUrl + '/tache';
    return this._httpClient.post(url, tache, httpOptions);
  }

  updateTache(tache: any) {
    let url = environment.apiUrl + '/tache';
    return this._httpClient.put(url, tache, httpOptions);
  }

  deleteTache(id: any) {
    let url = environment.apiUrl + '/tache/' + id;
    return this._httpClient.delete(url);
  }

  // Type document management
  findDocumentTypes() {
    let url = environment.apiUrl + '/document-type';
    return this._httpClient.get(url);
  }

  saveDocumentType(type: any) {
    let url = environment.apiUrl + '/document-type';
    return this._httpClient.post(url, type, httpOptions);
  }

  updateDocumentType(type: any) {
    let url = environment.apiUrl + '/document-type';
    return this._httpClient.put(url, type, httpOptions);
  }

  deleteDocumentType(id: any) {
    let url = environment.apiUrl + '/document-type/' + id;
    return this._httpClient.delete(url);
  }

  ///// Cadre d'investissement
  ///// Cadre d'investissement

  saveCadreInvestissement(cadre: any) {
    let url = environment.apiUrl + '/cadre-investissement';
    return this._httpClient.post(url, cadre, httpOptions);
  }
  updateCadreInvestissement(cadre: any) {
    let url = environment.apiUrl + '/cadre-investissement';
    return this._httpClient.put(url, cadre, httpOptions);
  }
  findCadreInvestissement() {
    let url = environment.apiUrl + '/cadre-investissement';
    return this._httpClient.get(url);
  }
  deleteCadreInvestissement(id: any) {
    let url = environment.apiUrl + '/cadre-investissement/' + id;
    return this._httpClient.delete(url);
  }

  //phase management

  findPhases() {
    let url = environment.apiUrl + '/phases';
    return this._httpClient.get(url);
  }

  savePhase(phase: any) {
    let url = environment.apiUrl + '/phases';
    return this._httpClient.post(url, phase, httpOptions);
  }

  updatePhase(type: any) {
    let url = environment.apiUrl + '/phases';
    return this._httpClient.put(url, type, httpOptions);
  }

  deletePhase(id: any) {
    let url = environment.apiUrl + '/phases/' + id;
    return this._httpClient.delete(url);
  }

  // phase class management
  findPhaseClass() {
    let url = environment.apiUrl + '/phase-classe';
    return this._httpClient.get(url);
  }

  //secteur management

  findSecteurs() {
    let url = environment.apiUrl + '/secteurs';
    return this._httpClient.get(url);
  }

  saveSecteur(secteur: any) {
    let url = environment.apiUrl + '/secteurs';
    return this._httpClient.post(url, secteur, httpOptions);
  }

  updateSecteur(type: any) {
    let url = environment.apiUrl + '/secteurs';
    return this._httpClient.put(url, type, httpOptions);
  }

  deleteSecteur(id: any) {
    let url = environment.apiUrl + '/secteurs/' + id;
    return this._httpClient.delete(url);
  }

  //status
  findStatus() {
    let url = environment.apiUrl + '/status';
    return this._httpClient.get(url);
  }

  saveStatus(status: any) {
    let url = environment.apiUrl + '/status';
    return this._httpClient.post(url, status, httpOptions);
  }

  updateStatus(type: any) {
    let url = environment.apiUrl + '/status';
    return this._httpClient.put(url, type, httpOptions);
  }

  getStatus(id: any) {
    let url = environment.apiUrl + '/status/' + id;
    return this._httpClient.delete(url);
  }

  //forme légale
  findForme() {
    let url = environment.apiUrl + '/forme-legales';
    return this._httpClient.get(url);
  }

  saveForme(forme: any) {
    let url = environment.apiUrl + '/forme-legales';
    return this._httpClient.post(url, forme, httpOptions);
  }

  updateForme(type: any) {
    let url = environment.apiUrl + '/forme-legales';
    return this._httpClient.put(url, type, httpOptions);
  }

  deleteForme(id: any) {
    let url = environment.apiUrl + '/forme-legales/' + id;
    return this._httpClient.delete(url);
  }

  //  fonds
  findFondsAll() {
    let url = environment.apiUrl + '/fonds/conformite-documentaire';
    return this._httpClient.get(url);
  }

  findFonds() {
    let url = environment.apiUrl + '/fonds';
    return this._httpClient.get(url);
  }
  listFonds() {
    let url = environment.apiUrl + '/fonds/listing';
    return this._httpClient.post(url, '');
  }
  findFondsAndFinancementsByProjet(id: any) {
    let url = environment.apiUrl + '/projet/fonds/' + id;
    return this._httpClient.get(url);
  }
  findFondsList() {
    let url = environment.apiUrl + '/fonds';
    return this._httpClient.get(url);
  }
  validationFonds(id: any) {
    let url = environment.apiUrl + '/fonds/validation/' + id;
    return this._httpClient.put(url, []);
  }
  subscriptionsBySubscriber(fonds_id: number) {
    let url = environment.apiUrl + '/fonds/souscriptions/' + fonds_id;
    return this._httpClient.get(url);
  }

  // funds souscriptions (coming from subscribers)
  findAllSubscriptions() {
    let url = environment.apiUrl + '/souscription';
    return this._httpClient.get(url);
  }

  findFondsSouscriptionsList(id?: any) {

    let url = id ? environment.apiUrl + '/fonds/souscriptions/' + id : environment.apiUrl + '/fonds/souscriptions';
    return this._httpClient.get(url);
  }

  // subscription by id
  fetchSubscription(id: number) {
    let url = environment.apiUrl + '/souscription/' + id;
    return this._httpClient.get(url);
  }

  // delete subscription
  deleteSubscription(id: number) {
    let url = environment.apiUrl + '/souscription/' + id;
    return this._httpClient.delete(url);
  }

  findFondsById(id: number) {
    let url = environment.apiUrl + '/fonds/' + id;
    return this._httpClient.get(url);
  }

  findPeriodeSouscriptionByFonds(fonds: any) {
    const url = environment.apiUrl + '/periodes-souscription/fonds/' + fonds['id'];
    return this._httpClient.get(url);
  }


  saveFonds(fonds: any) {
    let url = environment.apiUrl + '/fonds';
    return this._httpClient.post(url, fonds);
  }

  updateFonds(fonds: any) {
    let url = environment.apiUrl + '/fonds';
    return this._httpClient.put(url, fonds, httpOptions);
  }

  deleteFonds(id: any) {
    let url = environment.apiUrl + '/fonds/' + id;
    return this._httpClient.delete(url);
  }

  //Conformite documentaire
  findConformites() {
    let url = environment.apiUrl + '/conformite-documentaire';
    return this._httpClient.get(url);
  }
  findConformitesByType(type: any, phase: any) {
    let url =
      environment.apiUrl + '/conformite-documentaire/type/' + type + '/' + phase;
    return this._httpClient.get(url);
  }

  findConformitesByTypeByFonds(fonds: any, phase: any) {
    let url =
      environment.apiUrl + '/conformite-documentaire/type/' + fonds + '/' + phase;
    return this._httpClient.get(url);
  }
  findConformitesByTache(phase: any, tache: any) {
    let url =
      environment.apiUrl + '/conformite-documentaire/phase/tache/' +
      phase +
      '/' +
      tache;
    return this._httpClient.get(url);
  }

  findConformiteDocumentsByFund(id: any) {
    let url = environment.apiUrl + '/conformite-documentaire/fonds/' + id;
    return this._httpClient.get(url);
  }

  saveConformite(forme: any) {
    let url = environment.apiUrl + '/conformite-documentaire';
    return this._httpClient.post(url, forme, httpOptions);
  }

  updateConformites(type: any) {
    let url = environment.apiUrl + '/conformite-documentaire';
    return this._httpClient.put(url, type, httpOptions);
  }

  deleteConformite(id: any) {
    let url = environment.apiUrl + '/conformite-documentaire/' + id;
    return this._httpClient.delete(url);
  }

  //Etablissement

  findEtablisements() {
    let url = environment.apiUrl + '/etablissements';
    return this._httpClient.get(url);
  }

  saveEtablissement(etablissement: any) {
    let url = environment.apiUrl + '/etablissements';
    return this._httpClient.post(url, etablissement, httpOptions);
  }

  updateEtablissement(etablissement: any) {
    let url = environment.apiUrl + '/etablissements';
    return this._httpClient.put(url, etablissement, httpOptions);
  }

  deleteEtablissement(id: any) {
    let url = environment.apiUrl + '/etablissements/' + id;
    return this._httpClient.delete(url);
  }
  ///// Type d'un investissement

  findTypeInvestissement() {
    let url = environment.apiUrl + '/type-investissement';
    return this._httpClient.get(url);
  }

  saveTypeInvestissement(typeInvestissement: any) {
    let url = environment.apiUrl + '/type-investissement';
    return this._httpClient.post(url, typeInvestissement, httpOptions);
  }

  updateTypeInvestissement(typeInvestissement: any) {
    let url = environment.apiUrl + '/type-investissement';
    return this._httpClient.put(url, typeInvestissement, httpOptions);
  }

  deleteTypeInvestissement(id: any) {
    let url = environment.apiUrl + '/type-investissement/' + id;
    return this._httpClient.delete(url);
  }

  ///// Nature d'un investissement
  findNatureInvestissement() {
    let url = environment.apiUrl + '/nature-investissement';
    return this._httpClient.get(url);
  }

  saveNatureInvestissement(natureInvestissement: any) {
    let url = environment.apiUrl + '/nature-investissement';
    return this._httpClient.post(url, natureInvestissement, httpOptions);
  }

  updateNatureInvestissement(natureInvestissement: any) {
    let url = environment.apiUrl + '/nature-investissement';
    return this._httpClient.put(url, natureInvestissement, httpOptions);
  }

  deleteNatureInvestissement(id: any) {
    let url = environment.apiUrl + '/nature-investissement/' + id;
    return this._httpClient.delete(url);
  }


  //// Banque
  findBanque() {
    let url = environment.apiUrl + '/banques';
    return this._httpClient.get(url);
  }

  saveBanque(banque: any) {
    let url = environment.apiUrl + '/banques';
    return this._httpClient.post(url, banque, httpOptions);
  }

  updateBanque(banque: any) {
    let url = environment.apiUrl + '/banques';
    return this._httpClient.put(url, banque, httpOptions);
  }

  deleteBanque(id: any) {
    let url = environment.apiUrl + '/banques/' + id;
    return this._httpClient.delete(url);
  }


  //// Type de reunion
  findTypesReunion() {
    let url = environment.apiUrl + '/type-reunion';
    return this._httpClient.get(url);
  }

  saveTypesReunion(type: any) {
    let url = environment.apiUrl + '/type-reunion';
    return this._httpClient.post(url, type, httpOptions);
  }

  updateTypesReunion(type: any) {
    let url = environment.apiUrl + '/type-reunion';
    return this._httpClient.put(url, type, httpOptions);
  }

  deleteTypesReunion(id: any) {
    let url = environment.apiUrl + '/type-reunion/' + id;
    return this._httpClient.delete(url);
  }

  //// Reunions
  findReunions(projetId: any) {
    let url = environment.apiUrl + '/reunion/projet/' + projetId;
    return this._httpClient.get(url);
  }

  saveReunion(r: any) {
    let url = environment.apiUrl + '/reunion';
    return this._httpClient.post(url, r, httpOptions);
  }

  updateReunion(r: any) {
    let url = environment.apiUrl + '/reunion';
    return this._httpClient.put(url, r, httpOptions);
  }

  deleteReunion(id: any) {
    let url = environment.apiUrl + '/reunion/' + id;
    return this._httpClient.delete(url);
  }

  //// Membres reunion
  findMembres(reunionId: any) {
    let url = environment.apiUrl + '/reunion-membre/reunion/' + reunionId;
    return this._httpClient.get(url);
  }

  saveMembre(m: any) {
    let url = environment.apiUrl + '/reunion-membre';
    return this._httpClient.post(url, m, httpOptions);
  }

  updateMembre(r: any) {
    let url = environment.apiUrl + '/reunion-membre';
    return this._httpClient.put(url, r, httpOptions);
  }

  deleteMembre(id: any) {
    let url = environment.apiUrl + '/reunion-membre/' + id;
    return this._httpClient.delete(url);
  }

  //// Décision/résolution
  findDecisions(reunionId: any) {
    let url = environment.apiUrl + '/decision-resolution/reunion/' + reunionId;
    return this._httpClient.get(url);
  }

  saveDecision(d: any) {
    let url = environment.apiUrl + '/decision-resolution';
    return this._httpClient.post(url, d, httpOptions);
  }

  updateDecision(d: any) {
    let url = environment.apiUrl + '/decision-resolution';
    return this._httpClient.put(url, d, httpOptions);
  }

  deleteDecision(id: any) {
    let url = environment.apiUrl + '/decision-resolution/' + id;
    return this._httpClient.delete(url);
  }


  //// Type de sortie

  findTypesSortie() {
    let url = environment.apiUrl + '/type-sortie';
    return this._httpClient.get(url);
  }

  saveTypeSortie(type: any) {
    let url = environment.apiUrl + '/type-sortie';
    return this._httpClient.post(url, type, httpOptions);
  }

  updateTypeSortie(type: any) {
    let url = environment.apiUrl + '/type-sortie';
    return this._httpClient.put(url, type, httpOptions);
  }

  deleteTypeSortie(id: any) {
    let url = environment.apiUrl + '/type-sortie/' + id;
    return this._httpClient.delete(url);
  }


  //Commissaires aux comptes

  findCommissaires() {
    let url = environment.apiUrl + '/cac';
    return this._httpClient.get(url);
  }

  saveCommissaire(commissaire: any) {
    let url = environment.apiUrl + '/cac';
    return this._httpClient.post(url, commissaire, httpOptions);
  }

  updateCommissaire(banque: any) {
    let url = environment.apiUrl + '/cac';
    return this._httpClient.put(url, banque, httpOptions);
  }

  deleteCommissaire(id: any) {
    let url = environment.apiUrl + '/cac/' + id;
    return this._httpClient.delete(url);
  }


  //Commissaires aux comptes projet

  findCommissairesProjet() {
    let url = environment.apiUrl + '/cacp';
    return this._httpClient.get(url);
  }

  saveCommissaireProjet(commissaire: any) {
    let url = environment.apiUrl + '/cacp';
    return this._httpClient.post(url, commissaire, httpOptions);
  }

  updateCommissaireProjet(commissaire: any) {
    let url = environment.apiUrl + '/cacp';
    return this._httpClient.put(url, commissaire, httpOptions);
  }

  deleteCommissaireProjet(id: any) {
    let url = environment.apiUrl + '/cacp/' + id;
    return this._httpClient.delete(url);
  }

  /// Mandats management
  findMandats(fundId: any) {
    let url = environment.apiUrl + '/mandat/fonds/' + fundId;
    return this._httpClient.get(url);
  }

  addMandat(mandat: any) {
    let url = environment.apiUrl + '/mandat';
    return this._httpClient.post(url, mandat);
  }

  deleteMandat(mandatId: any) {
    let url = environment.apiUrl + '/mandat/' + mandatId;
    return this._httpClient.delete(url);
  }


  //Charge d'un investissement

  findChargeInvestissement() {
    let url = environment.apiUrl + '/charge-investissement';
    return this._httpClient.get(url);
  }
  saveChargeInvestissement(criterePreselection: any) {
    let url = environment.apiUrl + '/charge-investissement';
    return this._httpClient.post(url, criterePreselection, httpOptions);
  }
  updateChargeInvestissement(chargeInvestissement: any) {
    let url = environment.apiUrl + '/charge-investissement';
    return this._httpClient.put(url, chargeInvestissement, httpOptions);
  }

  deleteChargeInvestissement(id: any) {
    let url = environment.apiUrl + '/charge-investissement/' + id;
    return this._httpClient.delete(url);
  }

  // critères de preselection

  findCriteresPreselection() {
    let url = environment.apiUrl + '/critere-preselection';
    return this._httpClient.get(url);
  }
  saveCriteresPreselection(chargeInvestissement: any) {
    let url = environment.apiUrl + '/critere-preselection';
    return this._httpClient.post(url, chargeInvestissement, httpOptions);
  }
  updateCriteresPreselection(criterePreselection: any) {
    let url = environment.apiUrl + '/critere-preselection';
    return this._httpClient.put(url, criterePreselection, httpOptions);
  }

  deleteCriterePreselection(id: any) {
    let url = environment.apiUrl + '/critere-preselection/' + id;
    return this._httpClient.delete(url);
  }

  //Souscripteur
  findSouscripteur() {
    let url = environment.apiUrl + '/souscripteur';
    return this._httpClient.get(url);
  }
  saveSouscripteur(souscripteur: any) {
    let url = environment.apiUrl + '/souscripteur';
    return this._httpClient.post(url, souscripteur, httpOptions);
  }
  updateSouscripteur(souscripteur: any) {
    let url = environment.apiUrl + '/souscripteur';
    return this._httpClient.put(url, souscripteur, httpOptions);
  }
  deleteSouscripteur(id: any) {
    let url = environment.apiUrl + '/souscripteur/' + id;
    return this._httpClient.delete(url);
  }
  //Souscription
  findSouscription() {
    let url = environment.apiUrl + '/souscription';
    return this._httpClient.get(url);
  }

  // Find souscriptions by fonds
  findSouscriptionsByFonds(id: any) {
    let url = environment.apiUrl + '/souscription/fonds/' + id;
    return this._httpClient.get(url);
  }

  // Save or update souscription
  saveSouscription(souscription: any) {

    let url = environment.apiUrl + '/souscription';

    // In case of update we call put
    if (souscription?.id != null)
      return this._httpClient.put(url, souscription, httpOptions);

    // In case of create we call post
    return this._httpClient.post(url, souscription, httpOptions);
  }

  // Delete souscription
  deleteSouscription(souscriptionId: any) {
    let url = environment.apiUrl + '/souscription';
    return this._httpClient.delete(
      url + '/' + souscriptionId,
      httpOptions
    );
  }

  // periode de souscription
  savePeriodes(periode: any) {
    let url = environment.apiUrl + '/periodeSouscription/addList';
    return this._httpClient.post(url, periode);
  }

  // upload files
  uploadAttachement(
    //  doc_id: number,
    entity_id: number,
    phase_rang: number,
    documentType_id: number,
    titre: string,
    tache_rang: string,
    data_file: any,
    file_description: string
  ) {
    let url = environment.apiUrl + '/documents';
    let formData: FormData = new FormData();

    formData.set('tache_rang', tache_rang.toString());
    formData.set('entity_id', entity_id.toString());
    formData.set('document_type_id', documentType_id.toString());
    formData.set('phase_rang', phase_rang.toString());
    formData.set('description', file_description);
    formData.set('titre', titre);
    formData.set('file', data_file);
    return this._httpClient.post(url, formData);
  }

  findListDocumentsBySouscription(souscription_id: number) {
    let url =
      environment.apiUrl + '/conformite/souscription/' + souscription_id;
    return this._httpClient.get(url);
  }

  /////////////// LIberations des fonds

  findAllLiberationsByFonds(fondsId: any) {
    let url = environment.apiUrl + '/liberations/fonds/' + fondsId;
    return this._httpClient.get(url);
  }

  // Create and Update
  saveLiberation(libration: any) {

    let url = environment.apiUrl + '/liberations';

    if (libration.id) {
      return this._httpClient.put(url, libration);
    }
    return this._httpClient.post(url, libration);
  }

  deleteLiberation(librationId: any) {
    let url = environment.apiUrl + '/liberations';
    return this._httpClient.delete(url + '/' + librationId);
  }

  //Contact
  findContact() {
    let url = environment.apiUrl + '/contact';
    return this._httpClient.get(url);
  }

  saveContact(Contact: any) {
    let url = environment.apiUrl + '/contact';
    return this._httpClient.post(url, Contact, httpOptions);
  }

  updateContact(Contact: any) {
    let url = environment.apiUrl + '/contact';
    return this._httpClient.put(url, Contact, httpOptions);
  }

  deleteContact(id: any) {
    let url = environment.apiUrl + '/contact/' + id;
    return this._httpClient.delete(url);
  }

  //Promoteur
  findPromoteur() {
    let url = environment.apiUrl + '/promoteur';
    return this._httpClient.get(url);
  }

  savePromoteur(promoteur: any) {
    let url = environment.apiUrl + '/promoteur';
    return this._httpClient.post(url, promoteur, httpOptions);
  }

  updatePromoteur(promoteur: any) {
    let url = environment.apiUrl + '/promoteur';
    return this._httpClient.put(url, promoteur, httpOptions);
  }

  deletePromoteur(id: any) {
    let url = environment.apiUrl + '/promoteur/' + id;
    return this._httpClient.delete(url);
  }

  //Projet
  findProjets(statut?: any) {
    let url = environment.apiUrl + '/projet';
    if (statut) url += '/statut/' + statut;
    return this._httpClient.get(url);
  }

  findProjetsASuivre() {
    let url = environment.apiUrl + '/participation-fonds-approuvee/suivi/projets';
    return this._httpClient.get(url);
  }

  findProjetDetails(status: any) {
    let url = environment.apiUrl + '/projet/listing/' + status;
    return this._httpClient.get(url);
  }

  findProjetWithFinancement() {
    let url = environment.apiUrl + '/projet/projets-fins';
    return this._httpClient.get(url);
  }

  findProjetById(id: number) {
    let url = environment.apiUrl + '/projet/' + id;
    return this._httpClient.get(url);
  }

  findCapitalProjet(projetId: any) {
    let url = environment.apiUrl + '/projet/capital/' + projetId;
    return this._httpClient.get(url);
  }

  saveProjet(projet: any) {
    let url = environment.apiUrl + '/projet';
    return this._httpClient.post(url, projet, httpOptions);
  }

  updateProjet(projet: any) {
    let url = environment.apiUrl + '/projet';
    return this._httpClient.put(url, projet, httpOptions);
  }

  updateProjetPreselection(projet: any) {
    let url = environment.apiUrl + '/projet/preselections';
    return this._httpClient.put(url, projet, httpOptions);
  }

  updateProjetProspection(projet: any) {
    let url = environment.apiUrl + '/projet/prospections';
    return this._httpClient.put(url, projet, httpOptions);
  }

  UpdatedStatutPreselection(projetId: any, approval: 0 | 2 | 3) {
    let url = environment.apiUrl + '/projet/statut/' + projetId + "/" + approval;
    return this._httpClient.patch(url, httpOptions);
  }

  deleteProjet(id: any) {
    let url = environment.apiUrl + '/projet/' + id;
    return this._httpClient.delete(url);
  }

  // Periodes management

  findSubscriptionPeriodes(fondsId: any) {
    let url = environment.apiUrl + '/periodes-souscription/fonds/' + fondsId;
    return this._httpClient.get(url);
  }

  addSubscriptionPeriode(fonds: any, p1: any, p2: any) {
    let url = environment.apiUrl + '/periodes-souscription/addList';
    let periode = { fonds: fonds, dateDebut: p1, dateFin: p2 };
    return this._httpClient.post(url, periode);
  }

  deleteSubscriptionPeriode(id: any) {
    let url = environment.apiUrl + '/periodes-souscription/' + id;
    return this._httpClient.delete(url);
  }

  // Checklists
  saveChecklist(checklist: any) {
    let url = environment.apiUrl + '/liste-controle';
    return this._httpClient.post(url, checklist, httpOptions);
  }
  updateChecklist(checklist: any) {
    let url = environment.apiUrl + '/liste-controle';
    return this._httpClient.put(url, checklist, httpOptions);
  }
  findChecklists() {
    let url = environment.apiUrl + '/liste-controle';
    return this._httpClient.get(url);
  }
  findChecklistsByTypeInvestissement(typeInvestissement: any) {
    let url =
      environment.apiUrl + '/liste-controle/type-investissement/' + typeInvestissement;
    return this._httpClient.get(url);
  }
  deleteChecklist(checklist: any) {
    let url = environment.apiUrl + '/liste-controle/' + checklist;
    return this._httpClient.delete(url);
  }

  ////financement
  saveFinancement(financement: any) {
    let url = environment.apiUrl + '/financement';
    return this._httpClient.post(url, financement, httpOptions);
  }
  updateFinancement(financement: any) {
    let url = environment.apiUrl + '/financement';
    return this._httpClient.put(url, financement, httpOptions);
  }
  findFinancementByProjectId(id: number) {
    let url = environment.apiUrl + '/financement/projet/' + id;
    return this._httpClient.get(url);
  }
  deleteFinancement(id: any) {
    let url = environment.apiUrl + '/financement/' + id;
    return this._httpClient.delete(url);
  }

  findFinancementByProjetAndFondsAndAnnee(findId: any, fundId: any, year: any) {
    let url =
      environment.apiUrl +
      '/financement/projet/' +
      findId +
      '/fonds/' +
      fundId +
      '/year/' +
      year;
    return this._httpClient.get(url);
  }

  // Approve financing plan
  approveFinancingPlan(id: any, approval: boolean) {
    const url = environment.apiUrl + "/financement/approval/" + id + "/" + approval;
    return this._httpClient.patch(url, httpOptions);
  }


  /////NatureBailleurFonds

  findNatureBailleurFonds() {
    let url = environment.apiUrl + '/nature-bailleur-fonds';
    return this._httpClient.get(url);
  }
  saveNatureBailleurFonds(nature: any) {
    let url = environment.apiUrl + '/nature-bailleur-fonds';
    return this._httpClient.post(url, nature, httpOptions);
  }
  updateNatureBailleurFonds(nature: any) {
    let url = environment.apiUrl + '/nature-bailleur-fonds';
    return this._httpClient.put(url, nature, httpOptions);
  }
  deleteNatureBailleurFonds(id: any) {
    let url = environment.apiUrl + '/nature-bailleur-fonds/' + id;
    return this._httpClient.delete(url);
  }





  ////// Investissement de projet
  findSchemaInvestissement(schemaId: any) {
    let url = environment.apiUrl + '/schema-investissement/schema-inv-fin/' + schemaId;
    return this._httpClient.get(url);
  }
  saveSchemaInvestissement(investissementProjet: any) {
    let url = environment.apiUrl + '/schema-investissement';
    return this._httpClient.post(url, investissementProjet, httpOptions);
  }
  updateSchemaInvestissement(investissementProjet: any) {
    let url = environment.apiUrl + '/schema-investissement';
    return this._httpClient.put(url, investissementProjet, httpOptions);
  }
  deleteSchemaInvestissement(id: any) {
    let url = environment.apiUrl + '/schema-investissement/' + id;
    return this._httpClient.delete(url);
  }

  ////// Financement de projet
  findSchemaFinancement(scifId: any) {
    let url = environment.apiUrl + '/schema-financement/schema-inv-fin/' + scifId;
    return this._httpClient.get(url);
  }

  saveSchemaFinancement(financementProjet: any) {
    let url = environment.apiUrl + '/schema-financement';
    return this._httpClient.post(url, financementProjet, httpOptions);
  }
  updateSchemaFinancement(financementProjet: any) {
    let url = environment.apiUrl + '/schema-financement';
    return this._httpClient.put(url, financementProjet, httpOptions);
  }
  deleteSchemaFinancement(id: any) {
    let url = environment.apiUrl + '/schema-financement/' + id;
    return this._httpClient.delete(url);
  }

  ////// Expense de projet
  findSchemaExpense(schemaId: any) {
    let url = environment.apiUrl + '/schema-due-deal/schema-inv-fin/' + schemaId;
    return this._httpClient.get(url);
  }
  saveSchemaExpense(expenseProjet: any) {
    let url = environment.apiUrl + '/schema-due-deal';
    return this._httpClient.post(url, expenseProjet, httpOptions);
  }
  updateSchemaExpense(expenseProjet: any) {
    let url = environment.apiUrl + '/schema-due-deal';
    return this._httpClient.put(url, expenseProjet, httpOptions);
  }
  deleteSchemaExpense(id: any) {
    let url = environment.apiUrl + '/' + id;
    return this._httpClient.delete(url);
  }

  //////SchemaInvestissementFinancement

  findSchemaInvFin(scifId: any) {
    let url = environment.apiUrl + '/schema-investissement-financement/scif/' + scifId;
    return this._httpClient.get(url);
  }

  findSchemaInvFinByProjet(projetId: any) {
    let url = environment.apiUrl + '/schema-investissement-financement/projet/' + projetId;
    return this._httpClient.get(url);
  }

  findSchemaInvFinByFin(financementId: any) {
    let url = environment.apiUrl + '/schema-investissement-financement/financement/' + financementId;
    return this._httpClient.get(url);
  }

  saveSchemaInvFin(schemaInvFin: any) {
    let url = environment.apiUrl + '/schema-investissement-financement';
    return this._httpClient.post(url, schemaInvFin, httpOptions);
  }
  updateSchemaInvFin(schemaInvFin: any) {
    let url = environment.apiUrl + '/schema-investissement-financement';
    return this._httpClient.put(url, schemaInvFin, httpOptions);
  }
  deleteSchemaInvFin(id: any) {
    let url = environment.apiUrl + '/schema-investissement-financement/' + id;
    return this._httpClient.delete(url);
  }

  /////Valorisation des actions
  findValorisationProjet(fundId: any, projectId: any, year: any) {
    let url =
      environment.apiUrl +
      '/projet/fonds/' +
      fundId +
      '/projet/' +
      projectId +
      '/annee/' +
      year;
    return this._httpClient.get(url);
  }


  findValorisationAction(finId: any) {
    let url = environment.apiUrl + '/valorisation-action/financement/' + finId;
    return this._httpClient.get(url);
  }

  saveValorisationAction(action: any) {
    let url = environment.apiUrl + '/valorisation-action';
    return this._httpClient.post(url, action, httpOptions);
  }

  updateValorisationAction(action: any) {
    let url = environment.apiUrl + '/valorisation-action';
    return this._httpClient.put(url, action, httpOptions);
  }

  deleteValorisationAction(id: any) {
    let url = environment.apiUrl + '/valorisation-action/' + id;
    return this._httpClient.delete(url);
  }
  // send email
  sendEmail(destinataire: any, sujet: any, corps: any, file: any) {
    let url = environment.apiUrl + '/email';
    let formData: FormData = new FormData();
    let data = { destinataire, sujet, corps };
    formData.set('email', JSON.stringify(data));
    if (file && file.length > 0) {
      for (let i = 0; i < file.length; i++) {
        formData.append('attachements', file[i]);
      }
    }
    return this._httpClient.post(url, formData);
  }

  //// Refus management

  findRefusMotifs(projetId: any) {
    let url = environment.apiUrl + '/refus-preselection/projet/' + projetId;
    console.log(url);
    return this._httpClient.get(url);
  }
  saveRefus(refus: any) {
    let url = environment.apiUrl + '/refus-preselection';
    return this._httpClient.post(url, refus, httpOptions);
  }

  findFinancementById(id: number) {
    let url = environment.apiUrl + '/financement/projet/' + id;
    return this._httpClient.get(url);
  }

  ////participation-fonds
  findParticipationFondsByProjet(id: any) {
    let url = environment.apiUrl + '/participation/projet/' + id;
    return this._httpClient.get(url);
  }
  updateFondsParticipation(data: any) {
    let url = environment.apiUrl + '/fonds/structure-capital';
    return this._httpClient.post(url, data, httpOptions);
  }
  findParticipationFondsByFinancement(id: any) {
    let url = environment.apiUrl + '/participation-fonds/financement/' + id;
    return this._httpClient.get(url);
  }

  findStructureCapitalByFinancementV0(id: any) {
    let url = environment.apiUrl + '/participation-fonds/projet/financement/' + id;
    return this._httpClient.get(url);
  }

  findStructureCapitalByFinancement(fin_id: any, fonds_id: any) {
    let url =
      environment.apiUrl +
      '/structure-capital/financement/' +
      fin_id +
      '/fonds/' +
      fonds_id;
    return this._httpClient.get(url);
  }

  findParticipationFondsByFinancementAndFonds(finId: any, fondsId: any) {
    let url =
      environment.apiUrl +
      '/participation/financement/' +
      finId +
      '/fonds/' +
      fondsId;
    return this._httpClient.get(url);
  }

  findProjetsAndPFA() {
    let url = environment.apiUrl + '/participation-fonds-approuvee/projets';
    return this._httpClient.get(url);
  }

  findParticipationApprouveeByFonds(id: any) {
    let url = environment.apiUrl + '/participation-approuvee/fonds/' + id;
    return this._httpClient.get(url);
  }

  findParticipationApprouveeByFinancementAndFonds(fin_id: any, fonds_id: any) {
    let url =
      environment.apiUrl +
      '/participation-approuvee/financement/' +
      fin_id +
      '/fonds/' +
      fonds_id;
    return this._httpClient.get(url);
  }
  saveParticipationFonds(participation: any) {
    let url = environment.apiUrl + '/participation-fonds';
    return this._httpClient.post(url, participation, httpOptions);
  }
  deleteParticipationFonds(id: any) {
    let url = environment.apiUrl + '/participation-fonds/' + id;
    return this._httpClient.delete(url);
  }

  ////// structure capital transaction
  saveCapitalTransaction(transaction: any) {
    let url = environment.apiUrl + '/transaction-capital';
    return this._httpClient.post(url, transaction, httpOptions);
  }

  findCapitalTransaction(finId: any) {
    let url = environment.apiUrl + '/transaction-capital/' + finId;
    return this._httpClient.get(url);
  }

  deleteCapitalTransaction(id: any) {
    let url = environment.apiUrl + '/transaction-capital/' + id;
    return this._httpClient.delete(url);
  }

  /////  Actionnaire
  findActionnaires() {
    let url = environment.apiUrl + '/actionnaire';
    return this._httpClient.get(url);
  }
  findActionnairesByProjet(id: number) {
    let url = environment.apiUrl + '/actionnaire/projet/' + id;
    return this._httpClient.get(url);
  }

  findActionnairesByProjetAndYear(projetId: number, annee: any) {
    let url =
      environment.apiUrl + '/actionnaire/projet/' + projetId + '/annee/' + annee;
    return this._httpClient.get(url);
  }

  findActionnairesByFinancement(id: number) {
    let url =
      environment.apiUrl + '/actionnaire/structure-capital/financement/' + id;
    return this._httpClient.get(url);
  }
  saveActionnaire(actionnaire: any) {
    let url = environment.apiUrl + '/actionnaire';
    return this._httpClient.post(url, actionnaire, httpOptions);
  }
  updateActionnaire(actionnaire: any) {
    let url = environment.apiUrl + '/actionnaire';
    return this._httpClient.put(url, actionnaire, httpOptions);
  }

  deleteActionnaire(id: any) {
    let url = environment.apiUrl + '/actionnaire/' + id;
    return this._httpClient.delete(url);
  }

  // Create the before participation share holders
  buildActionnairesAvpList(data: any, financement: any): any {
    // we get a copy of the data
    data = data?.map((a: any) => {
      return { ...a };
    });

    console.log("data :", data);

    let acts_index = new Map(
      data?.map((act: any) => {
        return [
          act.actionnaire.libelle,
          {
            id: null,
            isFund: false,
            offFundRaiser: false,
            fundRaisings: 0,
            libelle: act.actionnaire.libelle,
            nbrActionsAvAugmentation: 0,
            nbrActionsApAugmentation: 0,
            montantAvAugmentation: 0,
            montantApAugmentation: 0,
            financement: act.actionnaire.financement,
            nbrActions:
              act.transactions.length >= 0
                ? act.transactions[0]?.nbrActions
                : undefined,
          },
        ];
      })
    );

    let oldShareHolders = data.filter(
      (a: any) => {

        const d1 = a.actionnaire.financement.dateDemandeFinancement;
        const d2 = financement.dateDemandeFinancement
        return d1 < d2;
      }
    );

    oldShareHolders.forEach((a: any) => {
      let refAct: any = acts_index.get(a.actionnaire.libelle);
      if (a.actionnaire.isFund) refAct.fundRaisings++;

      refAct.id = a.actionnaire.id;
      refAct.isFund = a.actionnaire.isFund;
      refAct.financement = a.actionnaire.financement;
      refAct.offFundRaiser = a.actionnaire.offFundRaiser;

      let transactions = a.transactions?.filter(
        (tr: any) =>
          tr.financement.dateDemandeFinancement <
          financement?.dateDemandeFinancement
      );

      if (transactions.length > 0) {
        refAct.nbrActionsAvAugmentation = transactions[0].nbrActions;
      } else {
        refAct.nbrActionsAvAugmentation +=
          a.actionnaire.nbrActionsApAugmentation +
          a.actionnaire.nbrActionsAvAugmentation;
      }
    });

    let currentShareHolders = data.filter(
      (a: any) =>
        a.actionnaire.financement.dateDemandeFinancement ==
        financement?.dateDemandeFinancement &&
        !a.actionnaire.offFundRaiser &&
        (a.actionnaire.nbrActionsApAugmentation == null ||
          a.actionnaire.nbrActionsApAugmentation == 0)
    );


    currentShareHolders.forEach((a: any) => {
      let refAct: any = acts_index.get(a.actionnaire.libelle);
      if (
        a.actionnaire.isFund &&
        a.actionnaire.financement.financementActions > 0
      )
        refAct.fundRaisings++;

      refAct.id = a.actionnaire.id;
      refAct.isFund = a.actionnaire.isFund;
      refAct.financement = a.actionnaire.financement;

      refAct.nbrActionsAvAugmentation += a.actionnaire.nbrActionsAvAugmentation;
    });

    return Array.from(acts_index.values())
      .filter((a: any) => a.nbrActionsAvAugmentation > 0)
      .sort((a: any, b: any) => {
        if (a.offFundRaiser) return 1;
        if (a.isFund) return -1;
        if (b.isFund) return 1;
        if (a.libelle > b.libelle) return 1;
        if (a.libelle < b.libelle) return -1;
        return 0;
      });
  }

  /// Comite Interne
  comiteInterneDesicion(decision: any) {
    let url = environment.apiUrl + '/comite-interne';
    return this._httpClient.post(url, decision, httpOptions);
  }
  fetchComiteInternes(finId: any) {
    let url = environment.apiUrl + '/comite-interne/financement/' + finId;
    return this._httpClient.get(url);
  }
  fetchComiteInternesByFonds(fondsId: any) {
    let url = environment.apiUrl + '/comite-interne/fonds/' + fondsId;
    return this._httpClient.get(url);
  }
  deleteComiteInterne(id: any) {
    let url = environment.apiUrl + '/comite-interne/' + id;
    return this._httpClient.delete(url);
  }

  // Comite Investissement
  comiteInvestissementDesicion(decision: any) {
    let url = environment.apiUrl + '/comite-investissement';
    return this._httpClient.post(url, decision, httpOptions);
  }
  fetchComiteInvestissements(finId: any, fondsId: any) {
    let url =
      environment.apiUrl + '/comite-investissement/financement/' + finId + '/fonds/' + fondsId;
    '/financement/' +
      finId +
      '/fonds/' +
      fondsId;
    return this._httpClient.get(url);
  }

  fetchComiteInvestissementsByFonds(fondsId: any) {
    let url = environment.apiUrl + '/comite-investissement/fonds/' + fondsId;
    return this._httpClient.get(url);
  }
  findComitesInvestissementByProjet(id: any) {
    let url = environment.apiUrl + '/comite-investissement/projet/' + id;
    return this._httpClient.get(url);
  }
  deleteComiteInvestissement(id: any) {
    let url = environment.apiUrl + '/comite-investissement/' + id;
    return this._httpClient.delete(url);
  }

  /// Comite Strategie
  addComiteStrategie(comite: any) {
    let url = environment.apiUrl + '/comite-strategie';
    return this._httpClient.post(url, comite, httpOptions);
  }
  updateComiteStrategie(comite: any) {
    let url = environment.apiUrl + '/comite-strategie';
    return this._httpClient.put(url, comite, httpOptions);
  }

  deleteComiteStrategie(comite: any) {
    let url = environment.apiUrl + '/comite-strategie/' + comite?.id;
    return this._httpClient.delete(url);
  }

  findComitesStrategie(fondsId: any) {
    let url = environment.apiUrl + '/comite-strategie/fonds/' + fondsId;
    return this._httpClient.get(url);
  }

  saveComiteValorisation(comite: any) {
    let url = environment.apiUrl + '/comite-valorisation';

    if (comite.id != undefined && comite.id != -1)
      return this._httpClient.put(url, comite, httpOptions);

    return this._httpClient.post(url, comite, httpOptions);
  }
  deleteComiteValorisation(id: any) {
    let url = environment.apiUrl + '/comite-valorisation/' + id;
    return this._httpClient.delete(url);
  }

  findComitesValorisation(fundId: any, year: any) {
    let url =
      environment.apiUrl + '/comite-valorisation/fonds/' + fundId + '/annee/' + year;
    return this._httpClient.get(url);
  }

  /// Public data

  findProjetPublicDataById(id: any) {
    let url = environment.apiUrl + '/projet-public-data/projet/' + id;
    return this._httpClient.get(url);
  }

  saveProjectPublicData(data: any) {
    let url = environment.apiUrl + '/projet-public-data';
    let formData: FormData = new FormData();

    formData.set('id', data.id);
    formData.set('projet', data.projet);
    formData.set('web', data.web);
    formData.set('email', data.email);
    formData.set('telephone', data.telephone);
    formData.set('activite', data.activite);
    formData.set('description', data.description);
    formData.set('file', data.banner);

    return this._httpClient.post(url, formData);
  }

  /// TRI

  findLastCalculatedTRI(finId: any, type: string) {
    let url = environment.finStatementUrl + '/tri/' + type + '/financement/' + finId;
    console.log(url);
    return this._httpClient.get(url);
  }

  saveTri(tri: any, type: string) {
    let url = environment.finStatementUrl + '/tri/' + type;
    return this._httpClient.post(url, tri, httpOptions);
  }

  /////////////////////  Investissement /////////////////////

  findInvSoucriptionByFinancementAndFonds(
    fin_id: any,
    fonds_id: any,
    type: string
  ) {
    let url =
      environment.apiUrl +
      '/inv-souscription/' +
      type +
      '/financement/' +
      fin_id +
      '/fonds/' +
      fonds_id;
    return this._httpClient.get(url);
  }

  saveInvSouscription(ss: any, type: string) {
    let url = environment.apiUrl + '/inv-souscription/' + type;

    if (ss.id && ss.id !== -1) {
      return this._httpClient.put(url, ss, httpOptions);
    } else {
      return this._httpClient.post(url, ss, httpOptions);
    }
  }
  updateInvSouscription(ss: any, type: string) {
    let url = environment.apiUrl + '/inv-souscription/' + type;
    return this._httpClient.put(url, ss, httpOptions);
  }

  findInvLiberartion(libId: any, type: string) {
    let url = environment.apiUrl + '/inv-liberation/' + type + '/' + libId;
    return this._httpClient.get(url);
  }

  saveInvLiberartion(liberation: any, type: string) {
    let url = environment.apiUrl + '/inv-liberation/' + type;
    return this._httpClient.post(url, liberation, httpOptions);
  }

  updateInvLiberationAction(liberation: any) {
    let url = environment.apiUrl + '/inv-liberation/action';
    return this._httpClient.put(url, liberation, httpOptions);
  }

  deleteInvLiberartion(liberation: any, type: string) {
    let url = environment.apiUrl + '/inv-liberation/' + type + '/' + liberation?.id;
    return this._httpClient.delete(url);
  }

  findInvLiberationsBySouscription(souscriptionId: any, type: string) {
    let url =
      environment.apiUrl +
      '/inv-liberation/' +
      type +
      '/souscription/' +
      souscriptionId;
    return this._httpClient.get(url);
  }

  deleteSouscriptionAction(souscriptionId: any, type: string) {
    let url = environment.apiUrl + '/inv-souscription/' + type + '/' + souscriptionId;
    return this._httpClient.delete(url);
  }

  findInvSoucriptionActionByFonds(fondsId: any) {
    let url = environment.apiUrl + '/inv-souscription/action/fonds/' + fondsId;
    return this._httpClient.get(url);
  }

  findInvSoucriptionAction() {
    let url = environment.apiUrl + '/inv-souscription/action';
    return this._httpClient.get(url);
  }

  findInvSoucriptionOcaByFonds(fondsId: any) {
    let url = environment.apiUrl + '/inv-souscription/oca/fonds/' + fondsId;
    return this._httpClient.get(url);
  }

  findInvSoucriptionCcaByFonds(fondsId: any) {
    let url = environment.apiUrl + '/inv-souscription/cca/fonds/' + fondsId;
    return this._httpClient.get(url);
  }

  findRemboursementByFonds(fondsId: any) {
    let url = environment.apiUrl + '/inv-souscription/cca/fonds/' + fondsId;
    return this._httpClient.get(url);
  }

  findConversionByFonds(fondsId: any) {
    let url = environment.apiUrl + '/inv-souscription/oca/fonds/' + fondsId;
    return this._httpClient.get(url);
  }

  saveConversionRemboursement(rembConv: any) {
    let url = environment.apiUrl + '/remboursement-conversion';
    return this._httpClient.post(url, rembConv, httpOptions);
  }

  deleteRemboursementConversion(Id: any) {
    let url = environment.apiUrl + '/remboursement-conversion/' + Id;
    return this._httpClient.delete(url);
  }

  deleteDocument(id: any) {
    let url = environment.apiUrl + '/documents/' + id;
    return this._httpClient.delete(url);
  }

  findConversionRemboursementOCAByFonds(fondsId: any) {
    let url = environment.apiUrl + '/remboursement-conversion/oca/' + fondsId;
    return this._httpClient.get(url);
  }

  findConversionRemboursementCCAByFonds(fondsId: any) {
    let url = environment.apiUrl + '/remboursement-conversion/cca/' + fondsId;
    return this._httpClient.get(url);
  }

  ////// OCA Conversion

  // findconversionByFinancementAndFonds(fin_id: any, fonds_id: any,) {
  //   let url = environment.conversionUrl + '/financement/' + fin_id + '/fonds/' + fonds_id;
  //   return this._httpClient.get(url);
  // }

  saveConversion(conversion: any, type: string) {
    let url = environment.apiUrl + '/conversion-';
    if (type == 'oca') url += 'oca';
    else url += 'cca';
    return this._httpClient.post(url, conversion, httpOptions);
  }

  findConversionByFinancementAndFonds(
    fin_id: any,
    fonds_id: any,
    type: string
  ) {
    let url =
      type == 'oca'
        ? environment.apiUrl + '/conversion-oca'
        : environment.apiUrl + '/conversion-cca';
    url += '/financement/' + fin_id + '/fonds/' + fonds_id;

    return this._httpClient.get(url);
  }

  deleteConversion(conversionId: any, type: string) {
    let url = environment.apiUrl + '/conversion-';
    if (type == 'oca') url += 'oca';
    else url += 'cca';
    url += '/' + conversionId;
    return this._httpClient.delete(url);
  }

  saveReglementCCA(reglement: any) {
    let url = environment.apiUrl + '/reglement-cca';
    return this._httpClient.post(url, reglement, httpOptions);
  }

  findReglementCCAByFinancementAndFonds(fin_id: any, fonds_id: any) {
    let url = environment.apiUrl + '/reglement-cca/financement/' + fin_id + '/fonds/' + fonds_id;
    return this._httpClient.get(url);
  }

  deleteReglement(id: any) {
    let url = environment.apiUrl + '/reglement-cca/' + id;
    return this._httpClient.delete(url);
  }

  /// List the fund liberations
  findFondsLiberation(id: any) {
    let url = environment.apiUrl + '/fonds/liberations/projets/' + id;
    return this._httpClient.get(url);
  }

  /////// SOTUGAR
  findSotugarById(id: any, type: string) {
    let url = environment.apiUrl + '/sotugar/' + type + '/' + id;
    return this._httpClient.get(url);
  }
  findSotugarByFonds(fondsId: any, type: string) {
    let url = environment.apiUrl + '/sotugar/' + type + '/fonds/' + fondsId;
    return this._httpClient.get(url);
  }
  saveSotugar(sotugar: any, type: string) {
    let url = environment.apiUrl + '/sotugar/' + type;
    return this._httpClient.post(url, sotugar, httpOptions);
  }
  updateSotugar(sotugar: any, type: string) {
    let url = environment.apiUrl + '/sotugar/' + type;
    return this._httpClient.put(url, sotugar, httpOptions);
  }
  patchSotugar(sotugar: any, type: string) {
    let url = environment.apiUrl + '/sotugar/' + type;
    return this._httpClient.patch(url, sotugar, httpOptions);
  }
  deleteSotugar(sotugarId: any, type: string) {
    let url = environment.apiUrl + '/sotugar/' + type + '/' + sotugarId;
    return this._httpClient.delete(url);
  }

  ///////////////////  REPORTING
  findFondsLiberationsInvestissements(id: any, endDate?: string) {
    let url = environment.apiUrl + '/fonds-reports/investissements/' + id;
    if (endDate) url += '/' + endDate;
    return this._httpClient.get(url);
  }

  findFondsSouscriptionsProjets(id: any) {
    let url = environment.apiUrl + '/fonds-reports/secteur-activite/' + id;
    return this._httpClient.get(url);
  }

  findFondsSouscriptionsInvLiberations(id: any) {
    let url = environment.apiUrl + '/fonds-reports/conformite/' + id;
    return this._httpClient.get(url);
  }

  findFondsSocietes(id: any) {
    let url = environment.apiUrl + '/projet/fonds/' + id;
    return this._httpClient.get(url);
  }

  findProjetCIReports(projetId: any, fondsId: any) {
    let url =
      environment.apiUrl +
      '/projet-reports/cisl/fonds/' +
      fondsId +
      '/projet/' +
      projetId;
    return this._httpClient.get(url);
  }

  findFinancementsApprouvesParCI(fondsId: any) {
    let url = environment.apiUrl + '/fonds-reports/fins-approuves-par-ci/' + fondsId;
    return this._httpClient.get(url);
  }

  ///////Etat d'avancement projets

  findEtats() {
    let url = environment.apiUrl + '/etat-avancement';
    return this._httpClient.get(url);
  }
  saveEtat(etat: any) {
    let url = environment.apiUrl + '/etat-avancement';
    return this._httpClient.post(url, etat, httpOptions);
  }
  updateEtat(etat: any) {
    let url = environment.apiUrl + '/etat-avancement';
    return this._httpClient.put(url, etat, httpOptions);
  }
  deleteEtat(id: any) {
    let url = environment.apiUrl + '/etat-avancement/' + id;
    return this._httpClient.delete(url);
  }
  updateProjetEtat(etatRecord: any) {
    let url = environment.apiUrl + '/projet/update-etat';
    return this._httpClient.put(url, etatRecord, httpOptions);
  }


  ///////Etat d'avancement fonds

  findEtatsFonds() {
    let url = environment.apiUrl + '/etat-fonds';
    return this._httpClient.get(url);
  }
  saveEtatFonds(etat: any) {
    let url = environment.apiUrl + '/etat-fonds';
    return this._httpClient.post(url, etat, httpOptions);
  }
  updateEtatFonds(etat: any) {
    let url = environment.apiUrl + '/etat-fonds';
    return this._httpClient.put(url, etat, httpOptions);
  }
  deleteEtatFonds(id: any) {
    let url = environment.apiUrl + '/etat-fonds/' + id;
    return this._httpClient.delete(url);
  }

  updateFundsEtat(fondsId: string, etat: any) {
    let url = environment.apiUrl + '/fonds/etat/' + fondsId;
    return this._httpClient.put(url, etat, httpOptions);
  }


  ///////Etat d'avancement reunion
  findEtatsReunions() {
    let url = environment.apiUrl + '/etat-avancement-decision';
    return this._httpClient.get(url);
  }
  saveEtatReunion(etat: any) {
    let url = environment.apiUrl + '/etat-avancement-decision';
    return this._httpClient.post(url, etat, httpOptions);
  }
  updateEtatReunion(etat: any) {
    let url = environment.apiUrl + '/etat-avancement-decision';
    return this._httpClient.put(url, etat, httpOptions);
  }
  deleteEtatReunion(id: any) {
    let url = environment.apiUrl + '/etat-avancement-decision/' + id;
    return this._httpClient.delete(url);
  }


  //////methode d evaluation

  findMethodeEvaluation() {
    let url = environment.apiUrl + '/methode-evaluation';
    return this._httpClient.get(url);
  }
  saveMethodeEvaluation(methode: any) {
    let url = environment.apiUrl + '/methode-evaluation';
    return this._httpClient.post(url, methode, httpOptions);
  }
  updateMethodeEvaluation(methode: any) {
    let url = environment.apiUrl + '/methode-evaluation';
    return this._httpClient.put(url, methode, httpOptions);
  }
  deleteMethodeEvaluation(id: any) {
    let url = environment.apiUrl + '/methode-evaluation/' + id;
    return this._httpClient.delete(url);
  }



  //////// VOTE


  saveTypeVote(vote: any) {
    let url = environment.apiUrl + '/type-vote';
    return this._httpClient.post(url, vote, httpOptions);
  }

  updateTypeVote(vote: any) {
    let url = environment.apiUrl + '/type-vote';
    return this._httpClient.put(url, vote, httpOptions);
  }

  findTypesVote() {
    let url = environment.apiUrl + '/type-vote';
    return this._httpClient.get(url);
  }

  deleteTypeVote(id: any) {
    let url = environment.apiUrl + '/type-vote/' + id;
    return this._httpClient.delete(url);
  }



  ////////// Nominal Manageemnt
  saveNominal(data: any) {
    let url = environment.apiUrl + '/nominal';
    return this._httpClient.post(url, data, httpOptions);
  }

  deleteNominal(id: any) {
    let url = environment.apiUrl + '/nominal/' + id;
    return this._httpClient.delete(url);
  }

  loadNominal(data: any) {
    let url = environment.apiUrl + '/nominal/financement/' + data;
    return this._httpClient.get(url);
  }
  loadNominals(data: any) {
    let url = environment.apiUrl + '/nominal/historique/financement/' + data;
    return this._httpClient.get(url);
  }

  /////Projet commissaires aux comptes

  addPcac(pcac: any) {
    let url = environment.apiUrl + '/pcac';
    return this._httpClient.post(url, pcac, httpOptions);
  }

  updatePcac(pcac: any) {
    let url = environment.apiUrl + '/pcac';
    return this._httpClient.put(url, pcac, httpOptions);
  }

  deletePcac(id: any) {
    let url = environment.apiUrl + '/pcac/' + id;
    return this._httpClient.delete(url);
  }
  findPcac(projectId: any) {
    let url = environment.apiUrl + '/pcac/projet/' + projectId;
    return this._httpClient.get(url);
  }

  findPcacByProjetAndYear(projectId: any, annee: any) {
    let url =
      environment.apiUrl +
      '/pcac/projet/' +
      projectId +
      '/annee/' +
      annee;
    return this._httpClient.get(url);
  }

  findProjetsByFonds(id: any) {
    let url = environment.apiUrl + '/projet/fonds/' + id;
    return this._httpClient.get(url);
  }

  findFondByProject(id: any) {
    let url = environment.apiUrl + '/fonds/projet/' + id;
    return this._httpClient.get(url);
  }

  findFondByProjectAndYear(projetId: any, annee: any) {
    let url = environment.apiUrl + '/fonds/projet/' + projetId + '/annee/' + annee;
    return this._httpClient.get(url);
  }
  ///// Directeur general

  findDirecteurGeneral(projectId: any) {
    let url = environment.apiUrl + '/directeur-general/projet/' + projectId;
    return this._httpClient.get(url);
  }

  addDirecteurGeneral(directeur: any) {
    let url = environment.apiUrl + '/directeur-general';
    return this._httpClient.post(url, directeur, httpOptions);
  }

  updateDirecteurGeneral(directeur: any) {
    let url = environment.apiUrl + '/directeur-general';
    return this._httpClient.put(url, directeur, httpOptions);
  }

  deleteDirecteurGeneral(id: any) {
    let url = environment.apiUrl + '/directeur-general/' + id;
    return this._httpClient.delete(url);
  }

  ///// Administrateurs du projet

  findAdministrateursByProjet(projectId: any) {
    let url = environment.apiUrl + '/administrateur-projet/projet/' + projectId;
    return this._httpClient.get(url);
  }

  findAdministrateursByProjetAndYear(projectId: any, annee: any) {
    let url = environment.apiUrl + '/administrateur-projet/projet/' + projectId + '/annee/' + annee;
    return this._httpClient.get(url);
  }

  addAdministrateursByProjet(administrateur: any) {
    let url = environment.apiUrl + '/administrateur-projet';
    return this._httpClient.post(url, administrateur, httpOptions);
  }

  updateAdministrateursByProjet(administrateur: any) {
    let url = environment.apiUrl + '/administrateur-projet';
    return this._httpClient.put(url, administrateur, httpOptions);
  }

  deleteAdministrateursByProjet(id: any) {
    let url = environment.apiUrl + '/administrateur-projet/' + id;
    return this._httpClient.delete(url);
  }

  /// Fait marquant
  addFaitMarquant(fm: any) {
    let url = environment.apiUrl + '/fait-marquant';
    return this._httpClient.post(url, fm, httpOptions);
  }
  updateFaitMarquant(fm: any) {
    let url = environment.apiUrl + '/fait-marquant';
    return this._httpClient.put(url, fm, httpOptions);
  }

  deleteFaitMarquant(fm: any) {
    let url = environment.apiUrl + '/fait-marquant/' + fm?.id;
    return this._httpClient.delete(url);
  }

  findFaitMarquant(projetId: any) {
    let url = environment.apiUrl + '/fait-marquant/projet/' + projetId;
    return this._httpClient.get(url);
  }


  ////// TRI

  findParametresTRI() {
    let url = environment.apiUrl + '/tri';
    return this._httpClient.get(url);
  }

  saveParametresTRI(parametres: any) {
    let url = environment.apiUrl + '/tri';
    return this._httpClient.post(url, parametres);
  }

  deleteParametresTRI() {
    let url = environment.apiUrl + '/tri';
    return this._httpClient.delete(url);
  }

  //////// SUIVI
  findSouscriptionsByProjet(projetId: any) {
    let url = environment.apiUrl + '/projet-reports/suivi/' + projetId;
    return this._httpClient.get(url);
  }

  /////// liberations stats

  findInvLiberationStats() {
    let url = environment.apiUrl + '/inv-liberation/stats';
    return this._httpClient.get(url);
  }


  ////////// Fonds Dashboard
  findStatsByFund(id: any) {
    let url = environment.apiUrl + '/inv-liberation/stats/' + id;
    return this._httpClient.get(url);
  }


  findStats(v2?: boolean) {
    let url = v2 ? environment.apiUrl + '/fonds-reports/v2/stats' : environment.apiUrl + '/inv-liberation/stats';
    return this._httpClient.get(url);
  }

  // Feedback
  addFeedback(feedback: any) {
    let url = environment.apiUrl + '/feedback';
    return this._httpClient.post(url, feedback, httpOptions);
  }


  findSouscripteursByInvestissementType() {
    let url = environment.apiUrl + '/fonds-reports/investissements-par-type';
    return this._httpClient.get(url);
  }



  ///// contenuieux

  findContentieuxByProjectId(projectId: any) {
    let url = environment.apiUrl + '/contentieux/project/' + projectId;
    return this._httpClient.get(url);
  }

  saveContentieux(contentieux: any) {
    let url = environment.apiUrl + '/contentieux/project';
    return this._httpClient.post(url, contentieux, httpOptions);
  }

  /// Alertes

  findBusinessAlertes() {
    let url = environment.apiUrl + '/business-alert';
    return this._httpClient.get(url);
  }
}


