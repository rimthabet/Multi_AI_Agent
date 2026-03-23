import { environment } from "../../../../environment/environment";

export const TextModel: any = {
  modelRefus: `Monsieur/ Madame NOM_PROMOTEUR,
 Nous tenons tout d’abord à vous remerciervivement de l’intérêt que vous avez porté à notre établissement.
 Nous avons bien reçu votre demande de financement pour le NOM_PROJET.
 Après une phase de présélection minutieuse effectuée par notre équipe,
 nous sommes au regret de vous informer que votre projet n'a pas été retenu pour la suite de notre processus d'étude.En conséquence, 
 nous ne sommes pas en mesure de donner une suite favorable à votre demande.
 Nous tenons à préciser que notre décision ne reflète pas la qualité de votre projet, 
 mais plutôt son adéquation avec nos critères de sélection et les objectifs de notre institution.
 Nous vous encourageons à poursuivre vos efforts et à explorer d'autres options de financement pour réaliser votre projet.
 Cependant,nous vous remercions encore une fois pour l'intérêt que vous avez porté à notre établissement 
 et nous espérons avoir l'opportunité de collaborer avec vous dans le futur.
 Nous vous souhaitons bonne continuationdans la poursuite de votre projet.
 Cordialement.`,

  modelAcceptationPreselection: `Monsieur/ Madame NOM_PROMOTEUR,
 Nous tenons tout d’abord à vous remerciervivement de l’intérêt que vous avez porté à notre établissement.
 Votre demande de financement pour le  NOM_PROJET a été reçue avec succès. Afin d'évaluer pleinement cette opportunité d'investissement, nous devons tout d’abord entamer notre processus d'étude.
 À cet effet, une CHECK_LIST des documents nécessaires pour commencer notre étude estjointe à ce mail. Nous vous invitons à nous envoyer les documents au fur et à mesure de leur disponibilité.
 Par ailleurs, veuillez noter que nous avons également inclus un accord de confidentialité NDAdûment signé pour garantir la confidentialité de nos échanges. Nous vous prions de bien vouloir le signer et de nous renvoyer une copie.
 Nous sommes à votre disposition pour toute demande d'information supplémentaire.
 Cordialement.`,

  modelRelance: `Monsieur/ Madame NOM_PROMOTEUR,
 Nous espérons que vous vous portez bien.
 Nous revenons vers vous pour vous informer que nous n’avons pas encore reçu la documentation requise pour pouvoir entamer l’étude de votre projet.
 Nous vous rappelons que nous avons envoyé une lettre englobant les documents nécessaires à notre étude dans le mail du (date du mail).
 Merci de nous faire parvenir les documents au fur et à mesure de leur disponibilité et dans les plus brefs délais.
 Cordialement.`,

  modelAbandon: `Monsieur/Madame NOM_PROMOTEUR,
 Etant donné que nous n’avons pas reçu la documentation nécessaire,
 nous permettons l’étude de votre dossier de financement du projet NOM_PROJET et en dépit de nos multiples demandes envoyées en dates
 :……Nous vous informons que votre dossier est incomplet et que nous ne pouvons donc pas le prendre en considération pour le moment.
 Vous êtes priée de compléter votre dossier dans un délai de 15 jours à compter de la réception de cette notification.
 Dépassé ce délai, votre dossier sera retiré du deal flow de notre société.
 Cordialement.`,

  checkListMessage:
    `Monsieur/Madame NOM_PROMOTEUR,
Nous vous remercions vivement pour l'intérêt que vous portez à notre institution.
Afin de compléter votre demande de financement, nous vous prions de bien vouloir nous fournir les documents suivants :
CHECK_LIST
Nous vous remercions pour votre coopération et restons à votre disposition pour toute information complémentaire.
Cordialement.
` + environment.documents_checklist_email_signature,

  ndaMessaga: `Chèr (e) Mr. /Mme. NOM_PROMOTEUR,
Nous vous remercions de l’intérêt que vous portez à notre institution. 
Veuillez trouver ci-joint le NDA.
Cordialement.`,
};
