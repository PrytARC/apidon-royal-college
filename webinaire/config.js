/*
  CONFIGURATION UNIQUE DU WEBINAIRE
  Pour réutiliser la page pour un prochain webinaire, change uniquement les valeurs ci-dessous.
  (Pense aussi à remplacer assets/og-image.jpg, l'image qui s'affiche dans l'aperçu WhatsApp.)
*/
window.WEBINAIRE = {
  // Titre : le deuxième mot s'affiche en bleu
  titre: "Excel",
  titreAccent: "avancé",

  // Date et horaires (format AAAA-MM-JJ et HH:MM, heure locale du webinaire)
  date: "2026-11-25",
  debut: "16:00",
  fin: "18:00",
  // Décalage horaire par rapport à l'heure UTC. Burkina Faso (GMT) : +00:00
  decalageUTC: "+00:00",

  // Liens
  teamsUrl: "https://teams.live.com/meet/9388574112819?p=r2UEUXmdKqzCMwiv4V",
  whatsappUrl: "https://whatsapp.com/channel/0029VbDacg54NVied630qa0c",

  // Adresse du Google Apps Script publié en application web (voir DEPLOIEMENT.md, étape 1)
  scriptUrl: "https://script.google.com/macros/s/AKfycbwbn9NF-8anjJ01e7PeH1BE0wZTDtzITIcBjAv9GylV3lVpIY_49-aHpxWjizM9vvn8TQ/exec",

  // Clé publique Cloudflare Turnstile (facultatif, voir DEPLOIEMENT.md, étape 4). Laisse vide pour ne pas l'utiliser.
  turnstileSiteKey: "",

  // Pied de page
  adresseSite: "webinaire.apidonroyalcollege.com",
  telephone: "+226 45 01 34 34",
  // Lien de la page LinkedIn de 2AS. Laisse vide tant que tu n'as pas l'adresse exacte : l'icône reste alors cachée.
  linkedinUrl: "",

  // Délai minimum (en secondes) entre l'ouverture de la page et l'envoi du formulaire (anti-robot)
  delaiMinSecondes: 3
};
