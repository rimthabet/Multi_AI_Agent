import { Component, effect, inject, OnInit, Renderer2, signal, viewChild } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { CdsModule } from '@cds/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { Subscription, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import {
  announcementIcon,
  asteriskIcon,
  bankIcon,
  barChartIcon,
  blocksGroupIcon,
  boltIcon,
  boxPlotIcon,
  capacitorIcon,
  childArrowIcon,
  circleArrowIcon,
  ClarityIcons,
  connectIcon,
  curveChartIcon,
  dashboardIcon,
  disconnectIcon,
  dotCircleIcon,
  envelopeIcon,
  filterIcon,
  halfStarIcon,
  installIcon,
  layersIcon,
  lineChartIcon,
  minusCircleIcon,
  moonIcon,
  networkGlobeIcon,
  nvmeIcon,
  pencilIcon,
  phoneHandsetIcon,
  plusIcon,
  popOutIcon,
  recycleIcon,
  repeatIcon,
  rewindIcon,
  sadFaceIcon,
  starIcon,
  stopIcon,
  sunIcon,
  switchIcon,
  tableIcon,
  talkBubblesIcon,
  treeViewIcon,
  twoWayArrowsIcon,
  userIcon,
  viewListIcon,
  walletIcon,
  dollarBillIcon,
  cogIcon,
  heatMapIcon,
  crownIcon,
  downloadIcon,
  shareIcon,
  infoStandardIcon,
  errorStandardIcon,
  warningStandardIcon,
  successStandardIcon,
  alarmClockIcon,
  filter2Icon,
  floppyIcon,
  alarmOffIcon,
  organizationIcon,
  networkSettingsIcon,
  trashIcon,
  banIcon,
  filterOffIcon,
  applicationsIcon,
  helpIcon,
  keyIcon,
  resizeIcon,
  historyIcon,
  lockIcon,
  bellIcon,
  bullseyeIcon,
  calendarIcon,
  coinBagIcon,
  dollarIcon,
  hashtagIcon,
  shoppingCartIcon,
  atomIcon,
  replayAllIcon,
  computerIcon,
  nodeIcon,
  nodesIcon,
  namespaceIcon,
  helpInfoIcon,
  administratorIcon,
  xlsFileIcon,
  languageIcon,
  angleIcon,
  viewColumnsIcon,
  cursorHandClickIcon,
  cloudNetworkIcon,
  checkIcon,
  happyFaceIcon,
  neutralFaceIcon,
  bookmarkIcon,
  fileGroupIcon,
  loginIcon,
  alignBottomIcon,
  crosshairsIcon,
  cursorHandIcon,
  eventIcon,
  eyeIcon,
  factoryIcon,
  gavelIcon,
  logoutIcon,
  sliderIcon,
  lightbulbIcon,
  employeeGroupIcon,
  noteIcon,
  usersIcon,
  employeeIcon,
  syncIcon,
  certificateIcon,
  cloudChartIcon,
  gridViewIcon,
  barsIcon,
  fileIcon,
  ellipsisVerticalIcon,
  libraryIcon,
  exclamationTriangleIcon,
  checkboxListIcon,
  pluginIcon,
  worldIcon,
  formIcon,
  noAccessIcon,
  assignUserIcon,
  detailsIcon,
  linkIcon,
  mapIcon,
  uploadIcon,
  scrollIcon,
  buildingIcon,
  stepForwardIcon,
  playIcon,
  updateIcon,
  targetIcon,
  pinboardIcon,
  idBadgeIcon,
  timelineIcon,
  tagsIcon,
  calculatorIcon,
  containerVolumeIcon,
  contractIcon,
  pdfFileIcon,
  plusCircleIcon,
  launchpadIcon,
  wandIcon,
  refreshIcon,
  addTextIcon,
  digitalSignatureIcon,
  shieldCheckIcon,
  bookIcon,
  flameIcon,
  listIcon,
  shrinkIcon,
  imageIcon,
  creditCardIcon,
  resourcePoolIcon,
  objectsIcon,
  paperclipIcon,
  hourglassIcon,
  mapMarkerIcon,
  tagIcon,
  flagIcon,
  thumbsUpIcon,
  thumbsDownIcon,
  briefcaseIcon,
  copyIcon,
  searchIcon
} from '@cds/core/icon';

import { castleIcon } from '@cds/core/icon/shapes/castle.js';
ClarityIcons.addIcons(
  userIcon,
  boltIcon,
  bankIcon,
  dashboardIcon,
  moonIcon,
  sunIcon,
  pencilIcon,
  stopIcon,
  connectIcon,
  sadFaceIcon,
  asteriskIcon,
  starIcon,
  halfStarIcon,
  capacitorIcon,
  plusIcon,
  filterIcon,
  blocksGroupIcon,
  announcementIcon,
  talkBubblesIcon,
  lightbulbIcon,
  repeatIcon,
  recycleIcon,
  twoWayArrowsIcon,
  circleArrowIcon,
  minusCircleIcon,
  viewListIcon,
  tableIcon,
  popOutIcon,
  disconnectIcon,
  networkGlobeIcon,
  networkSettingsIcon,
  dotCircleIcon,
  alarmClockIcon,
  filter2Icon,
  floppyIcon,
  alarmOffIcon,
  phoneHandsetIcon,
  infoStandardIcon,
  errorStandardIcon,
  warningStandardIcon,
  successStandardIcon,
  envelopeIcon,
  cogIcon,
  crownIcon,
  downloadIcon,
  shareIcon,
  networkGlobeIcon,
  rewindIcon,
  recycleIcon,
  heatMapIcon,
  organizationIcon,
  childArrowIcon,
  lineChartIcon,
  barChartIcon,
  switchIcon,
  treeViewIcon,
  nvmeIcon,
  curveChartIcon,
  walletIcon,
  boxPlotIcon,
  layersIcon,
  installIcon,
  dollarBillIcon,
  trashIcon,
  banIcon,
  filterOffIcon,
  applicationsIcon,
  helpIcon,
  keyIcon,
  resizeIcon,
  historyIcon,
  lockIcon,
  bellIcon,
  dollarIcon,
  bullseyeIcon,
  coinBagIcon,
  hashtagIcon,
  shoppingCartIcon,
  atomIcon,
  replayAllIcon,
  computerIcon,
  nodeIcon,
  nodesIcon,
  namespaceIcon,
  helpInfoIcon,
  administratorIcon,
  xlsFileIcon,
  alarmClockIcon,
  languageIcon,
  angleIcon,
  viewColumnsIcon,
  cursorHandClickIcon,
  cloudNetworkIcon,
  checkIcon,
  happyFaceIcon,
  neutralFaceIcon,
  bookmarkIcon,
  fileGroupIcon,
  loginIcon,
  alignBottomIcon,
  crosshairsIcon,
  cursorHandIcon,
  eventIcon,
  eyeIcon,
  factoryIcon,
  gavelIcon,
  logoutIcon,
  addTextIcon,
  shieldCheckIcon, mapMarkerIcon,
  sliderIcon, launchpadIcon,
  castleIcon, calculatorIcon, digitalSignatureIcon, imageIcon, creditCardIcon,
  employeeGroupIcon, containerVolumeIcon, thumbsUpIcon, thumbsDownIcon,
  calendarIcon, pinboardIcon, wandIcon, flameIcon, listIcon, objectsIcon, paperclipIcon,
  noteIcon, playIcon, updateIcon, targetIcon, bookIcon, lockIcon, shrinkIcon, resizeIcon,
  usersIcon, eyeIcon, buildingIcon, stepForwardIcon, tagsIcon, tagIcon,
  employeeIcon, linkIcon, asteriskIcon, mapIcon, uploadIcon, scrollIcon, resourcePoolIcon, hourglassIcon,
  syncIcon, worldIcon, noAccessIcon, detailsIcon, circleArrowIcon, circleArrowIcon, tagsIcon,
  certificateIcon, pluginIcon, formIcon, assignUserIcon, syncIcon, idBadgeIcon, timelineIcon, announcementIcon,
  cloudChartIcon, gridViewIcon, barsIcon, fileIcon, ellipsisVerticalIcon, libraryIcon,
  exclamationTriangleIcon, checkboxListIcon, linkIcon, contractIcon, pdfFileIcon, plusCircleIcon, refreshIcon, flagIcon,
  briefcaseIcon, copyIcon, searchIcon
);

import '@cds/core/icon/register.js';
import '@cds/core/button/register.js';
import { DivBackToTopComponent } from "./widgets/div-back-to-top/div-back-to-top.component";
import { AboutComponent } from "./widgets/about/about.component";
import { UiService } from './services/ui.service';
import { FeedbackComponent } from './widgets/feedback/feedback.component';
import { ShortcutsComponent } from "./tools/shortcuts/shortcuts.component";
import { KeycloakService } from './services/keycloak.service';
import { ScreenfitComponent } from "./tools/screenfit/screenfit.component";
import { AlertsListenerComponent } from "./alerts/alerts-listener/alerts-listener.component";
import { ChatAgentService } from './services/chat-agent.service';
import { MarkdownModule } from 'ngx-markdown';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  title?: string;
  meta?: string;
  timestamp?: string;
}

interface ChatDocument {
  id: number;
  title: string;
  path?: string;
  date?: string | null;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    ClarityModule,
    CdsModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    DivBackToTopComponent,
    AboutComponent,
    FeedbackComponent,
    ShortcutsComponent,
    ScreenfitComponent,
    AlertsListenerComponent,
    MarkdownModule
  ],
  providers: [KeycloakService],

  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {


  title = 'Private Assets Management System';

  // VIEWS
  aboutModal = viewChild.required<AboutComponent>("aboutModal");
  shortcutsModal = viewChild.required<ShortcutsComponent>("shortcutsModal");


  // DEPENDENCIES
  private readonly renderer2 = inject(Renderer2);
  private readonly uiService = inject(UiService);
  private readonly router = inject(Router);
  private readonly keycloak = inject(KeycloakService);
  private readonly chatAgentService = inject(ChatAgentService);
  private readonly sanitizer = inject(DomSanitizer);

  isNavCollapsed = signal<boolean>(true);
  computedNavCollapsed = effect(() => {
    this.uiService.setMenuCollapsed(this.isNavCollapsed());
  });

  selectedMenu: string = '';
  selectedSubMenu: string = '';
  ratioType: string = '';

  dark: boolean = false;
  themeIconSolid: boolean = false;
  feedbackIconSolid: boolean = false;
  openScreenFit: boolean = false;
  passwordManagerOpened: boolean = false;
  alertsPanelOpened: boolean = false;
  openfeedbackModal: boolean = false;

  ///////// CHAT
  chatPanelOpened: boolean = false;
  chatIconSolid: boolean = false;
  chatInput: string = '';
  chatDocSearchQuery: string = '';
  chatBusy: boolean = false;
  chatError: string = '';
  private chatMessageId = 1;
  private chatSubscription?: Subscription;
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  chatMessages: ChatMessage[] = [
    {
      id: 1,
      role: 'assistant',
      title: 'Bonjour, je suis votre agent IA.',
      text: 'Posez une question ou demandez une action.',
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }
  ];
  chatDocuments: ChatDocument[] = [];
  chatDocumentsLoading: boolean = false;
  chatDocumentsError: string = '';
  chatSelectedDocId?: number;
  chatSelectedDocTitle: string = '';

  // PDF inline viewer
  pdfPanelOpen: boolean = false;
  pdfSafeUrl: SafeResourceUrl | null = null;

  togglePdfPanel() {
    if (!this.chatSelectedDocId) return;
    if (this.pdfPanelOpen) {
      this.closePdfPanel();
      return;
    }
    const url = `/chatAgent/documents/view/${this.chatSelectedDocId}`;
    this.pdfSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
    this.pdfPanelOpen = true;
  }

  closePdfPanel(): void {
    this.pdfPanelOpen = false;
    this.pdfSafeUrl = null;
  }
  ///////// CHAT
  
  // Lifecycle hooks
  ngOnInit(): void {

    // Navigation shortcuts management
    this.renderer2.listen('document', 'keydown', (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          // About shortcuts
          case 'd':
            this.router.navigateByUrl('/dashboard');
            event.preventDefault();
            break;

          case 'f':
            this.openFicheFonds();
            event.preventDefault();
            break;

          case 'p':
            this.openFicheProjets();
            event.preventDefault();
            break;

          case 'a':
            this.openAboutModal();
            event.preventDefault();
            break;

          // Light Theme shortcut
          case 'l':
            this.changeTheme(!this.dark);
            event.preventDefault();
            break;

          // Feedback shortcuts
          case 'e':
            this.openFeedbackModal();
            event.preventDefault();
            break;

          // Documentation shortcuts
          case 'h':
            event.preventDefault();
            this.router.navigateByUrl('/documentation');
            break;

          // Documentation shortcuts
          case 'z':
            event.preventDefault();
            this.openScreenFit = true;
            break;
        }
      }
    });

    this.applyDesiredTheme();

    // Recherche en temps réel avec debounce 300ms
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      this.loadChatDocuments(query);
    });
  }
 
  ngOnDestroy() {
    this.chatSubscription?.unsubscribe();
    this.searchSubscription?.unsubscribe();
  }

  // Appelé à chaque frappe dans la barre de recherche
  onSearchInput(query: string): void {
    this.searchSubject.next(query);
  }

  // Réinitialiser la sélection du document
  clearDocumentSelection(): void {
    this.chatSelectedDocId = undefined;
    this.chatSelectedDocTitle = '';
    this.pdfPanelOpen = false;
    this.pdfSafeUrl = null;
  }

  //  GET LABEL FOR RATIO TYPE
  getLabelForRatioType(type: string, isHistorique: boolean = false): string {
    return `Ratios des souscripteurs ${isHistorique ? '(Historique)' : ''}`;
  }

  // CHANGE THEME
  changeTheme(dark: boolean) {
    this.dark = dark;
    localStorage.setItem('cds-theme', dark ? 'dark' : 'light');
    this.uiService.setTheme(dark ? 'dark' : 'light');
    document.body.setAttribute('cds-theme', dark ? 'dark' : 'light');
  }


  // APPLY DESIRED THEME
  applyDesiredTheme() {
    let theme = localStorage.getItem('cds-theme');
    this.dark = theme === 'dark';
    if (theme) document.body.setAttribute('cds-theme', theme);

    this.changeTheme(this.dark);
  }


  // MODAL ABOUT
  openAboutModal() {
    this.aboutModal().openAboutModal();
  }

  // MODAL FEEDBACK
  openFeedbackModal() {
    this.openfeedbackModal = true;
  }

  // MODAL SHORTCUTS
  openShortcutsModal() {
    this.shortcutsModal().openShortcutsModal();
  }

  // MODAL PASSWORD
  openPasswordModal() {
    //  this.passwordModal().openPasswordModal();
  }

  // DASHBOARD
  openDashboardModal() {
    this.router.navigate(['/dashboard']);
  }

  //  FONDS
  openFicheFonds() {
    this.router.navigate(['/repository']);
  }

  //  PROJETS
  openFicheProjets() {
    this.router.navigate(['/projects/inventory']);
  }

  applyQuickPrompt(prompt: string) {
    this.chatInput = prompt;
  }

  openChatPanel(): void {
    this.chatPanelOpened = true;
    if (!this.chatDocuments.length) {
      this.loadChatDocuments();
    }
  }

  loadChatDocuments(query: string = ''): void {
    this.chatDocumentsLoading = true;
    this.chatDocumentsError = '';
    this.chatAgentService.listDocuments(query).subscribe({
      next: (docs) => {
        this.chatDocuments = docs || [];
        this.chatDocumentsLoading = false;
      },
      error: () => {
        this.chatDocumentsLoading = false;
        this.chatDocumentsError = 'Impossible de charger les documents.';
      }
    });
  }

  onChatDocumentChange(docId: string): void {
    const id = Number(docId);
    const doc = this.chatDocuments.find(item => item.id === id);
    if (doc) {
      this.chatSelectedDocId = doc.id;
      this.chatSelectedDocTitle = doc.title;
    } else {
      this.chatSelectedDocId = undefined;
      this.chatSelectedDocTitle = '';
    }
  }

  onChatKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!this.chatBusy && this.chatInput.trim()) {
        this.sendChatMessage();
      }
    }
  }

//////////////////////////AGENT
  sendChatMessage() {
  const question = this.chatInput.trim();
  if (!question || this.chatBusy) return;

  let payloadQuestion = question;
  let docTitle = this.chatSelectedDocTitle;
  let docSha256 = undefined;
  if (this.chatSelectedDocId) {
    const doc = this.chatDocuments.find(item => item.id === this.chatSelectedDocId);
    if (doc && (doc as any).sha256) {
      docSha256 = (doc as any).sha256;
    }
  }
  if (docTitle && !docTitle.toLowerCase().endsWith('.pdf')) {
    docTitle = docTitle + '.pdf';
  }
  if (docSha256 && !question.toLowerCase().includes('sha256')) {
    payloadQuestion = `[SHA256:${docSha256}] Dans le document "${docTitle}" : ${question}`;
  } else if (docTitle) {
    payloadQuestion = `Dans le document "${docTitle}" : ${question}`;
  }

  this.chatBusy = true;
  this.chatError = '';
  this.chatSubscription?.unsubscribe();
  const sendTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  this.addChatMessage({
    id: this.nextChatMessageId(),
    role: 'user',
    text: question,
    timestamp: sendTime
  });
  this.chatInput = '';

  this.chatSubscription = this.chatAgentService.ask(payloadQuestion).subscribe({
    next: (response) => {
      // ── Agent Navigation ──────────────────────────────────────────
      if (response?.agent === 'navigation') {
        try {
          const action = JSON.parse(response.answer);

          if (action.action === 'navigate' && action.route) {
            // Exécute la navigation Angular
            const segments = action.route.split('/');
            this.router.navigate(segments, { queryParams: action.params || {} });

            // Affiche un message de confirmation dans le chat
            const navTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            this.addChatMessage({
              id: this.nextChatMessageId(),
              role: 'assistant',
              text: `✓ ${action.label || 'Navigation effectuée'}`,
              meta: 'Agent: navigation',
              timestamp: navTime
            });

          } else if (action.action === 'error' || action.action === 'unknown') {
            // Affiche le message d'erreur
            const errNavTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            this.addChatMessage({
              id: this.nextChatMessageId(),
              role: 'assistant',
              text: action.message || 'Action non reconnue.',
              meta: 'Agent: navigation',
              timestamp: errNavTime
            });
          }

        } catch (e) {
          // JSON invalide → affiche comme texte normal
          const catchTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          this.addChatMessage({
            id: this.nextChatMessageId(),
            role: 'assistant',
            text: response.answer,
            meta: 'Agent: navigation',
            timestamp: catchTime
          });
        }

      // ── Agents Données / Documents ────────────────────────────────
      } else {
        const answer = response?.answer?.trim() || 'Je n\'ai pas de réponse pour le moment.';
        const meta = response?.agent ? `Agent: ${response.agent}` : undefined;
        const respTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        this.addChatMessage({
          id: this.nextChatMessageId(),
          role: 'assistant',
          text: answer,
          meta: meta,
          timestamp: respTime
        });
      }

      this.chatBusy = false;
      this.chatSubscription = undefined;
    },
    error: (error) => {
      this.chatBusy = false;
      this.chatSubscription = undefined;
      this.chatError = 'Impossible de joindre l\'agent IA pour le moment.';
    }
  });
}

  cancelChatRequest(): void {
    if (!this.chatBusy) {
      return;
    }
    this.chatSubscription?.unsubscribe();
    this.chatSubscription = undefined;
    this.chatBusy = false;
    this.chatError = '';
    const cancelTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    this.addChatMessage({
      id: this.nextChatMessageId(),
      role: 'assistant',
      text: 'Réponse annulée.',
      meta: 'Agent: system',
      timestamp: cancelTime
    });
  }
///////////////////////////
  private addChatMessage(message: ChatMessage) {
    this.chatMessages = [...this.chatMessages, message];
  }

  private nextChatMessageId(): number {
    this.chatMessageId += 1;
    return this.chatMessageId;
  }

  // SCROLL
  handleScroll($event: any) {
    // throw new Error('Method not implemented.');
  }

  // BACK TO TOP
  handleBackToTop() {
    // throw new Error('Method not implemented.');
  }

  disconnect(): void {
    this.keycloak.logout(window.location.origin);
  }
}
