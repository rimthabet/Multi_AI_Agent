import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard/dashboard.component';
import { FundsRepositoryComponent } from './funds/funds-repository/funds-repository.component';
import { FundsSubscribersComponent } from './funds/funds-subscribers/funds-subscribers.component';
import { FundsSubscriberSubscriptionsComponent } from './funds/funds-subscriber-subscriptions/funds-subscriber-subscriptions.component';
import { DocumentCategoryComponent } from './settings/document-category/document-category.component';
import { DocumentTypeComponent } from './settings/document-type/document-type.component';
import { DocumentComplianceComponent } from './settings/document-compliance/document-compliance.component';
import { DocumentChecklistComponent } from './settings/document-checklist/document-checklist.component';
import { FundsSubscriptionsComponent } from './funds/funds-subscriptions/funds-subscriptions.component';
import { ProjectsInventoryComponent } from './projects/projects-inventory/projects-inventory.component';
import { ProjectsPromotorsComponent } from './projects/projects-promotors/projects-promotors.component';
import { ProjectsContactsComponent } from './projects/projects-contacts/projects-contacts.component';
import { ProjectsCreationComponent } from './projects/projects-creation/projects-creation.component';
import { ProjectsUnderStudyComponent } from './projects/projects-under-study/projects-under-study.component';
import { InvestmentsSubscriptionComponent } from './investments/investments-subscription/investments-subscription.component';
import { InvestmentsDocumentsCollectingComponent } from './investments/investments-documents-collecting/investments-documents-collecting.component';
import { InvestmentsVestingsComponent } from './investments/investments-vestings/investments-vestings.component';
import { InvestmentsProjectsComponent } from './investments/investments-projects/investments-projects.component';
import { BankComponent } from './settings/bank/bank.component';
import { TriCalculionComponent } from './settings/tri-calculation/tri-calculion.component';
import { ContributionTypesComponent } from './settings/contribution-types/contribution-types.component';
import { EvaluationMethodComponent } from './settings/evaluation-method/evaluation-method.component';
import { FundsAuditorComponent } from './settings/funds-auditor/funds-auditor.component';
import { FundsNatureComponent } from './settings/funds-nature/funds-nature.component';
import { FundsStatusComponent } from './settings/funds-status/funds-status.component';
import { InstitutionComponent } from './settings/institution/institution.component';
import { InvestmentChargeComponent } from './settings/investment-charge/investment-charge.component';
import { InvestmentIndustryComponent } from './settings/investment-industry/investment-industry.component';
import { InvestmentNatureComponent } from './settings/investment-nature/investment-nature.component';
import { InvestmentTypeComponent } from './settings/investment-type/investment-type.component';
import { LegalFormComponent } from './settings/legal-form/legal-form.component';
import { MeetingTypeComponent } from './settings/meeting-type/meeting-type.component';
import { PreselectionCriteriaComponent } from './settings/preselection-criteria/preselection-criteria.component';
import { ProgressStatusMeetingComponent } from './settings/progress-meeting/progress-status-meeting.component';
import { ProjectAuditorComponent } from './settings/project-auditor/project-auditor.component';
import { ProjectProgressStatusComponent } from './settings/project-progress-status/project-progress-status.component';
import { SectorComponent } from './settings/sector/sector.component';
import { TreatmentPhaseComponent } from './settings/treatment-phase/treatment-phase.component';
import { TreatmentTaskComponent } from './settings/treatment-task/treatment-task.component';
import { ElectionTypeComponent } from './settings/election-type/election-type.component';
import { FinancialItemsComponent } from './settings/financial-items/financial-items.component';
import { IndexComponent } from './documentation/index/index.component';
import { CCAParticipationsComponent } from './divestment/cca-participations/cca-participations.component';
import { RealizedDivestmentsComponent } from './divestment/realized-divestments/realized-divestments.component';
import { RefundsConversionsOCAsComponent } from './divestment/refunds-conversions-ocas/refunds-conversions-ocas.component';
import { RefundsConversionsCCAsComponent } from './divestment/refunds-conversions-ccas/refunds-conversions-ccas.component';
import { OCAParticipationsComponent } from './divestment/oca-participations/oca-participations.component';
import { SharesParticipationsComponent } from './divestment/shares-participations/shares-participations.component';
import { ExitTypeComponent } from './settings/exit-type/exit-type.component';
import { ProjectsComponent } from './tracking/projects/projects.component';
import { AdministrationManagementControlComponent } from './tracking/administration-management-control/administration-management-control.component';
import { CapitalStructureComponent } from './tracking/capital-structure/capital-structure.component';
import { MeetingsComponent } from './tracking/meetings/meetings.component';
import { FollowupDesicionResolutionComponent } from './tracking/meetings/followup-desicion-resolution/followup-desicion-resolution.component';
import { MeetingTrackingComponent } from './tracking/meetings/meeting-tracking/meeting-tracking.component';
import { FinancialStatementsComponent } from './tracking/analyses/financial-statements/financial-statements.component';
import { BusinessPlanTrackingComponent } from './tracking/analyses/business-plan-tracking/business-plan-tracking.component';
import { ComparisonAchievementsBpComponent } from './tracking/analyses/comparison-achievements-bp/comparison-achievements-bp.component';
import { ComparisonInvestmentAchievementSchemeComponent } from './tracking/analyses/comparison-investment-achievement-scheme/comparison-investment-achievement-scheme.component';
import { FundsCreationComponent } from './funds/funds-creation/funds-creation.component';
import { ComiteInterneComponent } from './funds/comite-interne/comite-interne.component';
import { ComiteInvestmentComponent } from './funds/comite-investment/comite-investment.component';
import { ComiteStrategicComponent } from './funds/comite-strategic/comite-strategic.component';
import { FundRatiosComponent } from './reports/regulatory-ratios/fund-ratios/fund-ratios.component';
import { HistoricalFundRatiosComponent } from './reports/regulatory-ratios/historical-fund-ratios/historical-fund-ratios.component';
import { HistoricalSubscriberRatiosComponent } from './reports/regulatory-ratios/historical-subscriber-ratios/historical-subscriber-ratios.component';
import { SubscriberRatiosComponent } from './reports/regulatory-ratios/subscriber-ratios/subscriber-ratios.component';
import { AlternativeMarketComponent } from './reports/compliance-ratios/alternative-market/alternative-market.component';
import { OcaComplianceRatiosComponent } from './reports/compliance-ratios/oca-compliance-ratios/oca-compliance-ratios.component';
import { RatiosConformityQfpComponent } from './reports/compliance-ratios/ratios-conformity-qfp/ratios-conformity-qfp.component';
import { SectorActivityComponent } from './reports/compliance-ratios/sector-activity/sector-activity.component';
import { FundsCompaniesComponent } from './reports/portfolio/funds-companies/funds-companies.component';
import { ComiteValuationComponent } from './funds/comite-valuation/comite-valuation.component';
import { InvApprovesCiComponent } from './reports/portfolio/inv-approves-ci/inv-approves-ci.component';
import { FundComponent, FundComponent as FundDashboardComponent } from './dashboard/fund/fund.component';
import { FundsEditionComponent } from './funds/funds-edition/funds-edition.component';
import { InvApprovedReleasedComponent } from './reports/portfolio/inv-approved-released/inv-approved-released.component';
import { ProjectComponent } from './dashboard/project/project.component';
import { LandmarkEventComponent } from './tracking/others/landmark-event/landmark-event.component';
import { ProjectsEditionComponent } from './projects/projects-edition/projects-edition.component';
import { SotugarComponent } from './sotugar/sotugar.component';

export const routes: Routes = [

    // Dashboard
    // { path: 'dashboard', component: DashboardComponent },
    { path: 'dashboard', component: DashboardComponent },
    { path: 'dashboard/funds/:id', component: FundComponent },
    { path: 'dashboard/projects/:id', component: ProjectComponent },

    // Funds
    { path: 'repository', component: FundsRepositoryComponent },
    { path: 'funds/subscribers', component: FundsSubscribersComponent },
    { path: 'funds/subscriptions', component: FundsSubscriptionsComponent },
    { path: 'funds/subscriber-subscriptions', component: FundsSubscriberSubscriptionsComponent },
    { path: 'funds/creation-funds', component: FundsCreationComponent },
    { path: 'funds/edition-funds/:id', component: FundsEditionComponent },
    { path: 'funds/comite-interne', component: ComiteInterneComponent },
    { path: 'funds/comite-investment', component: ComiteInvestmentComponent },
    { path: 'funds/comite-strategic', component: ComiteStrategicComponent },
    { path: 'funds/comite-valuation', component: ComiteValuationComponent },

    // Documentation
    { path: 'documentation', component: IndexComponent },


    // Projects
    { path: 'projects/inventory', component: ProjectsInventoryComponent },
    { path: 'projects/promotors', component: ProjectsPromotorsComponent },
    { path: 'projects/contacts', component: ProjectsContactsComponent },
    { path: 'projects/creation', component: ProjectsCreationComponent },
    { path: 'projects/under-study', component: ProjectsUnderStudyComponent },
    { path: 'projects/edition/:id', component: ProjectsEditionComponent },

    // investments
    { path: 'investments/collecte-documents', component: InvestmentsDocumentsCollectingComponent },
    { path: 'investments/subscription', component: InvestmentsSubscriptionComponent },
    { path: 'investments/vesting', component: InvestmentsVestingsComponent },
    { path: 'investments/projects', component: InvestmentsProjectsComponent },


    // Tracking
    { path: 'tracking/projects', component: ProjectsComponent },
    { path: 'tracking/administration', component: AdministrationManagementControlComponent },
    { path: 'tracking/capital-structure', component: CapitalStructureComponent },
    { path: 'tracking/meetings', component: MeetingsComponent },
    { path: 'tracking/followup-decisions-resolutions', component: FollowupDesicionResolutionComponent },
    { path: 'tracking/meeting-tracking', component: MeetingTrackingComponent },
    { path: 'tracking/financial-statements', component: FinancialStatementsComponent },
    { path: 'tracking/bp', component: BusinessPlanTrackingComponent },
    { path: 'tracking/comparaison-realisations-bp', component: ComparisonAchievementsBpComponent },
    { path: 'tracking/comparaison-schema-investissement-realisations', component: ComparisonInvestmentAchievementSchemeComponent },
    { path: 'tracking/faits-marquants', component: LandmarkEventComponent },



    // divestment
    { path: 'divestment/shares_participations', component: SharesParticipationsComponent },
    { path: 'divestment/oca_participations', component: OCAParticipationsComponent },
    { path: 'divestment/cca_participations', component: CCAParticipationsComponent },
    { path: 'divestment/realized-divestments', component: RealizedDivestmentsComponent },
    { path: 'divestment/refunds-conversions-ocas', component: RefundsConversionsOCAsComponent },
    { path: 'divestment/refunds-conversions-ccas', component: RefundsConversionsCCAsComponent },


    //reports
    { path: 'reports/fund-ratios', component: FundRatiosComponent },
    { path: 'reports/historical-fund-ratios', component: HistoricalFundRatiosComponent },
    { path: 'reports/subscriber-ratios', component: SubscriberRatiosComponent },
    { path: 'reports/historical-subscriber-ratios', component: HistoricalSubscriberRatiosComponent },
    { path: 'reports/sector-activity', component: SectorActivityComponent },
    { path: 'reports/ratios-conformity-qfp', component: RatiosConformityQfpComponent },
    { path: 'reports/oca-compliance-ratios', component: OcaComplianceRatiosComponent },
    { path: 'reports/alternative-market', component: AlternativeMarketComponent },
    { path: 'reports/funds-companies', component: FundsCompaniesComponent },
    { path: 'reports/funds-companies', component: FundsCompaniesComponent },
    { path: 'reports/inv-approves-ci', component: InvApprovesCiComponent },
    { path: 'reports/inv-approved-released', component: InvApprovedReleasedComponent },


    // SOTUGAR
    { path: 'sotugar', component: SotugarComponent },


    // Settings
    { path: 'settings/document-category', component: DocumentCategoryComponent },
    { path: 'settings/document-type', component: DocumentTypeComponent },
    { path: 'settings/document-compliance', component: DocumentComplianceComponent },
    { path: 'settings/document-checklist', component: DocumentChecklistComponent },
    { path: 'settings/treatment-phase', component: TreatmentPhaseComponent },
    { path: 'settings/treatment-task', component: TreatmentTaskComponent },
    { path: 'settings/funds-status', component: FundsStatusComponent },
    { path: 'settings/project-progress-status', component: ProjectProgressStatusComponent },
    { path: 'settings/progress-status-meeting', component: ProgressStatusMeetingComponent },
    { path: 'settings/evaluation-method', component: EvaluationMethodComponent },
    { path: 'settings/sector', component: SectorComponent },
    { path: 'settings/investment-framework', component: InvestmentIndustryComponent },
    { path: 'settings/funds-nature', component: FundsNatureComponent },
    { path: 'settings/legal-form', component: LegalFormComponent },
    { path: 'settings/bank', component: BankComponent },
    { path: 'settings/funds-auditor', component: FundsAuditorComponent },
    { path: 'settings/project-auditor', component: ProjectAuditorComponent },
    { path: 'settings/institution', component: InstitutionComponent },
    { path: 'settings/investment-nature', component: InvestmentNatureComponent },
    { path: 'settings/investment-type', component: InvestmentTypeComponent },
    { path: 'settings/investment-charge', component: InvestmentChargeComponent },
    { path: 'settings/preselection-criteria', component: PreselectionCriteriaComponent },
    { path: 'settings/contribution-types', component: ContributionTypesComponent },
    { path: 'settings/meeting-type', component: MeetingTypeComponent },
    { path: 'settings/output-type', component: ExitTypeComponent },
    { path: 'settings/election-type', component: ElectionTypeComponent },
    { path: 'settings/financial-items', component: FinancialItemsComponent },
    { path: 'settings/tri', component: TriCalculionComponent },

    // Default
    { path: '**', component: DashboardComponent },

];
