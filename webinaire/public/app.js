/* Page d'inscription : webinaire Excel avancé (2AS).
   Tout ce qui change d'un webinaire à l'autre se règle dans config.js. */
(function () {
  "use strict";

  var C = window.WEBINAIRE || {};
  var chargeA = Date.now();

  /* ---------- Outils ---------- */
  function $(id) { return document.getElementById(id); }
  function $$(sel, racine) { return Array.prototype.slice.call((racine || document).querySelectorAll(sel)); }
  function capitale(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function deux(n) { return n < 10 ? "0" + n : "" + n; }

  function debutDate() { return new Date(C.date + "T" + C.debut + ":00" + (C.decalageUTC || "+00:00")); }
  function finDate() { return new Date(C.date + "T" + C.fin + ":00" + (C.decalageUTC || "+00:00")); }

  function dateLongueTexte(avecAnnee) {
    try {
      var o = { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" };
      if (avecAnnee) { o.year = "numeric"; }
      return new Intl.DateTimeFormat("fr-FR", o).format(new Date(C.date + "T12:00:00Z"));
    } catch (e) { return ""; }
  }

  function heureCourte(h) {
    var p = String(h).split(":");
    var hh = parseInt(p[0], 10);
    return p[1] && p[1] !== "00" ? hh + "h" + p[1] : hh + "h";
  }
  function heures() { return heureCourte(C.debut) + " à " + heureCourte(C.fin); }
  function telHref() { return "tel:" + String(C.telephone || "").replace(/[^\d+]/g, ""); }
  function fuseauTexte() {
    var d = C.decalageUTC || "+00:00";
    return d === "+00:00" || d === "-00:00" ? "GMT" : "UTC" + d;
  }

  /* ---------- Remplissage depuis config.js ---------- */
  var valeurs = {
    titre: C.titre,
    titreAccent: C.titreAccent,
    dateLongue: C.date ? capitale(dateLongueTexte(true)) : "",
    dateCourte: C.date ? capitale(dateLongueTexte(false)) : "",
    dateMin: C.date ? dateLongueTexte(true) : "",
    heures: C.debut && C.fin ? heures() : "",
    fuseau: fuseauTexte(),
    telephone: C.telephone,
    email: C.email,
    emailHref: C.email ? "mailto:" + C.email : "",
    adresseSite: C.adresseSite,
    whatsappUrl: C.whatsappUrl,
    teamsUrl: C.teamsUrl,
    linkedinUrl: C.linkedinUrl,
    telHref: C.telephone ? telHref() : "",
    siteHref: C.adresseSite ? "https://" + C.adresseSite : ""
  };

  $$("[data-cfg]").forEach(function (el) {
    var v = valeurs[el.getAttribute("data-cfg")];
    if (v) { el.textContent = v; }
  });
  $$("[data-href]").forEach(function (el) {
    var v = valeurs[el.getAttribute("data-href")];
    if (v) { el.setAttribute("href", v); }
  });
  $$("[data-cache-si-vide]").forEach(function (el) {
    var v = valeurs[el.getAttribute("data-cache-si-vide")];
    if (v) { el.hidden = false; }
  });

  /* Objet 3D facultatif : mets son chemin dans config.js (objet3d) pour l'afficher dans le bandeau */
  if (C.objet3d) {
    var objet = $("objet3d");
    objet.src = C.objet3d;
    objet.hidden = false;
  }

  /* ---------- Effet Excel : la barre de formule suit la cellule choisie ---------- */
  var d0 = C.date ? C.date.split("-") : ["2026", "11", "25"];
  var formuleDate = "=DATE(" + parseInt(d0[0], 10) + ";" + parseInt(d0[1], 10) + ";" + parseInt(d0[2], 10) + ")";
  var h0 = String(C.debut || "16:00").split(":");
  var formuleDebut = formuleDate + "+TEMPS(" + parseInt(h0[0], 10) + ";" + parseInt(h0[1] || "0", 10) + ";0)";
  function posee(id, f) { if ($(id)) { $(id).setAttribute("data-f", f); } }
  posee("c-date", formuleDate);
  posee("c-heure", "=TEXTE(" + heureCourte(C.debut) + ")&\" à \"&TEXTE(" + heureCourte(C.fin) + ")");
  posee("c-j", "=ENT(" + formuleDebut + "-MAINTENANT())");
  posee("c-h", "=HEURE(" + formuleDebut + "-MAINTENANT())");
  posee("c-m", "=MINUTE(" + formuleDebut + "-MAINTENANT())");
  posee("c-s", "=SECONDE(" + formuleDebut + "-MAINTENANT())");

  var cellule = null;
  function texteFormule(el) {
    var f = el.getAttribute("data-f");
    if (f) { return f; }
    var inp = el.matches("input") ? el : el.querySelector("input");
    if (inp) { return inp.value; }
    return el.textContent.replace(/\s+/g, " ").trim();
  }
  function selectionner(el) {
    if (cellule && cellule !== el) { cellule.classList.remove("sel"); }
    cellule = el;
    el.classList.add("sel");
    $("nom-cellule").textContent = el.getAttribute("data-ref");
    $("formule").textContent = texteFormule(el);
  }
  $("nom-cellule").textContent = "A1";
  $("formule").textContent = ((C.titre || "") + " " + (C.titreAccent || "")).trim();

  function celluleDe(cible) { return cible && cible.closest ? cible.closest("[data-ref]") : null; }
  document.addEventListener("click", function (ev) {
    var c = celluleDe(ev.target);
    if (c) { selectionner(c); }
  });
  document.addEventListener("focusin", function (ev) {
    var c = celluleDe(ev.target);
    if (c) { selectionner(c); }
  });
  document.addEventListener("input", function (ev) {
    var c = celluleDe(ev.target);
    if (c && c === cellule) { $("formule").textContent = texteFormule(c); }
  });

  /* ---------- Mini feuille du bandeau : le total et le graphique suivent les chiffres ---------- */
  var entrees = $$(".classeur .val");
  var graphe = $("graphe");
  var colonnes = entrees.map(function () {
    var col = document.createElement("div");
    col.className = "col";
    var barre = document.createElement("div");
    barre.className = "barre";
    col.appendChild(barre);
    graphe.appendChild(col);
    return barre;
  });
  function majFeuille() {
    var vals = entrees.map(function (e) {
      var n = parseFloat(e.value);
      return isFinite(n) && n > 0 ? Math.min(n, 999) : 0;
    });
    var somme = vals.reduce(function (a, b) { return a + b; }, 0);
    $("total").textContent = String(somme);
    var max = Math.max.apply(null, vals.concat([1]));
    colonnes.forEach(function (b, i) { b.style.setProperty("--h", Math.round((vals[i] / max) * 100) + "%"); });
  }
  entrees.forEach(function (e) { e.addEventListener("input", majFeuille); });
  var calme = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // les barres montent à l'ouverture, puis un chiffre se met à jour tout seul une fois
  // (sauf si la personne a déjà touché à la page)
  var interagi = false;
  ["pointerdown", "keydown", "focusin", "touchstart"].forEach(function (nom) {
    document.addEventListener(nom, function () { interagi = true; }, { once: true, passive: true });
  });
  function demonstration() {
    if (interagi) { return; }
    var champ = entrees[entrees.length - 1];
    var cible = 48, courant = parseFloat(champ.value) || 0;
    selectionner(champ.closest("[data-ref]"));
    (function pas() {
      if (interagi) { return; }
      courant += 3;
      if (courant > cible) { courant = cible; }
      champ.value = String(courant);
      majFeuille();
      $("formule").textContent = String(courant);
      if (courant < cible) { setTimeout(pas, 90); }
    })();
  }
  if (calme) {
    majFeuille();
  } else {
    colonnes.forEach(function (b) { b.style.setProperty("--h", "0%"); });
    setTimeout(majFeuille, 350);
    setTimeout(demonstration, 2600);
  }

  /* ---------- Compte à rebours ---------- */
  function tic() {
    var maintenant = Date.now();
    var debut = debutDate().getTime();
    var fin = finDate().getTime();
    var reste = debut - maintenant;
    if (reste > 0) {
      var s = Math.floor(reste / 1000);
      $("cd-j").textContent = deux(Math.floor(s / 86400));
      $("cd-h").textContent = deux(Math.floor((s % 86400) / 3600));
      $("cd-m").textContent = deux(Math.floor((s % 3600) / 60));
      $("cd-s").textContent = deux(s % 60);
      return;
    }
    $("compte").hidden = true;
    var d = $("direct");
    d.hidden = false;
    if (maintenant < fin) {
      d.textContent = "Le webinaire a commencé. ";
      var a = document.createElement("a");
      a.href = C.teamsUrl || "#";
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = "Rejoindre sur Teams";
      d.appendChild(a);
    } else {
      d.textContent = "Ce webinaire est terminé. Merci à toutes celles et ceux qui étaient là.";
    }
  }
  tic();
  setInterval(tic, 1000);

  /* ---------- L'heure chez toi ---------- */
  function heureDans(tz, date) {
    var f = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: tz });
    var h = "", m = "";
    f.formatToParts(date).forEach(function (p) {
      if (p.type === "hour") { h = p.value; }
      if (p.type === "minute") { m = p.value; }
    });
    var jour = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: tz }).format(date);
    var txt = parseInt(h, 10) + "h" + (m !== "00" ? m : "");
    if (jour > C.date) { txt += " (+1 j)"; }
    else if (jour < C.date) { txt += " (veille)"; }
    return txt;
  }
  try {
    var zones = [
      ["Ouagadougou, Abidjan, Dakar", "Africa/Ouagadougou"],
      ["Douala, Libreville", "Africa/Douala"],
      ["Casablanca", "Africa/Casablanca"],
      ["Paris", "Europe/Paris"],
      ["Montréal", "America/Toronto"]
    ];
    var moi = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (moi) {
      zones.unshift(["Chez toi (" + moi.split("/").pop().replace(/_/g, " ") + ")", moi, true]);
    }
    var instant = debutDate();
    var ul = $("zones");
    zones.slice(0, 6).forEach(function (z) {
      var li = document.createElement("li");
      li.className = "zone cell" + (z[2] ? " moi" : "");
      li.setAttribute("data-ref", String.fromCharCode(65 + ul.children.length) + "8");
      var small = document.createElement("small");
      small.textContent = z[0];
      var b = document.createElement("b");
      b.textContent = heureDans(z[1], instant);
      li.appendChild(small);
      li.appendChild(b);
      ul.appendChild(li);
    });
  } catch (e) {
    var bloc = $("zones");
    if (bloc && bloc.parentNode && bloc.parentNode.parentNode) { bloc.parentNode.parentNode.hidden = true; }
  }

  /* ---------- Onglets du bas : l'onglet actif suit la section visible ---------- */
  var onglets = $$(".onglet");
  function activer(nom) {
    onglets.forEach(function (o) { o.classList.toggle("actif", o.getAttribute("data-cible") === nom); });
  }
  if ("IntersectionObserver" in window) {
    var vues = {};
    var obs = new IntersectionObserver(function (entrees2) {
      entrees2.forEach(function (e) { vues[e.target.getAttribute("data-onglet")] = e.isIntersecting; });
      var ordre = ["accueil", "programme", "inscription", "faq"];
      for (var i = ordre.length - 1; i >= 0; i--) {
        if (vues[ordre[i]]) { activer(ordre[i]); return; }
      }
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("[data-onglet]").forEach(function (s) { obs.observe(s); });
  }

  /* ---------- Indicatifs pays ---------- */
  var PAYS = [
    ["Burkina Faso", "226"], ["Côte d'Ivoire", "225"], ["Mali", "223"], ["Niger", "227"],
    ["Togo", "228"], ["Bénin", "229"], ["Sénégal", "221"], ["Guinée", "224"],
    ["Ghana", "233"], ["Nigeria", "234"], ["Cameroun", "237"], ["Gabon", "241"],
    ["Congo", "242"], ["RD Congo", "243"], ["Maroc", "212"], ["Algérie", "213"],
    ["Tunisie", "216"], ["France", "33"], ["Belgique", "32"], ["Suisse", "41"],
    ["Canada, États-Unis", "1"], ["Royaume-Uni", "44"], ["Autre indicatif", ""]
  ];
  var selIndicatif = $("indicatif");
  PAYS.forEach(function (p) {
    var o = document.createElement("option");
    o.value = p[1];
    // l'indicatif en premier : sur un petit écran, c'est le nom du pays qui est coupé, jamais le numéro
    o.textContent = p[1] ? "+" + p[1] + " " + p[0] : p[0];
    if (p[1] === "226") { o.selected = true; }
    selIndicatif.appendChild(o);
  });
  selIndicatif.addEventListener("change", function () {
    var autre = selIndicatif.value === "";
    $("bloc-autre").hidden = !autre;
    if (autre) { $("autre-code").focus(); }
  });

  /* ---------- Agenda (.ics) ---------- */
  function utcCompact(date) {
    return date.getUTCFullYear() + deux(date.getUTCMonth() + 1) + deux(date.getUTCDate()) +
      "T" + deux(date.getUTCHours()) + deux(date.getUTCMinutes()) + deux(date.getUTCSeconds()) + "Z";
  }
  function echapperIcs(s) {
    return String(s).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
  }
  // Une ligne d'un fichier .ics ne dépasse pas 75 octets : on plie en comptant les octets (les accents en pèsent 2).
  function plier(ligne) {
    var enc = new TextEncoder();
    var out = [], courante = "", octets = 0, limite = 75;
    Array.from(ligne).forEach(function (ch) {
      var n = enc.encode(ch).length;
      if (octets + n > limite) {
        out.push(courante);
        courante = " ";
        octets = 1;
        limite = 75;
      }
      courante += ch;
      octets += n;
    });
    out.push(courante);
    return out.join("\r\n");
  }
  function fabriquerIcs() {
    var debut = debutDate();
    var fin = finDate();
    var titre = (C.titre + " " + C.titreAccent).trim();
    var desc = "Webinaire gratuit de 2AS (Apidon Academy of Science).\n\nLien Teams : " + (C.teamsUrl || "") +
      "\nChaîne WhatsApp : " + (C.whatsappUrl || "");
    var lignes = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//2AS//Webinaire//FR",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      "UID:" + C.date + "-" + titre.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "@" + (C.adresseSite || "webinaire"),
      "DTSTAMP:" + utcCompact(new Date()),
      "DTSTART:" + utcCompact(debut),
      "DTEND:" + utcCompact(fin),
      "SUMMARY:" + echapperIcs(titre + " (webinaire gratuit 2AS)"),
      "LOCATION:Microsoft Teams",
      "DESCRIPTION:" + echapperIcs(desc)
    ];
    if (C.teamsUrl) { lignes.push("URL:" + C.teamsUrl); }
    lignes.push(
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Demain : " + echapperIcs(titre), "TRIGGER:-P1D", "END:VALARM",
      "BEGIN:VALARM", "ACTION:DISPLAY", "DESCRIPTION:Dans une heure : " + echapperIcs(titre), "TRIGGER:-PT1H", "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR"
    );
    return lignes.map(plier).join("\r\n") + "\r\n";
  }
  function lienGoogleAgenda() {
    var titre = (C.titre + " " + C.titreAccent).trim() + " (webinaire gratuit 2AS)";
    var detail = "Webinaire gratuit de 2AS (Apidon Academy of Science).\n\nLien Teams : " + (C.teamsUrl || "") +
      "\nChaîne WhatsApp : " + (C.whatsappUrl || "");
    return "https://calendar.google.com/calendar/render?action=TEMPLATE" +
      "&text=" + encodeURIComponent(titre) +
      "&dates=" + utcCompact(debutDate()) + "/" + utcCompact(finDate()) +
      "&details=" + encodeURIComponent(detail) +
      "&location=" + encodeURIComponent(C.teamsUrl || "Microsoft Teams");
  }
  function preparerAgenda() {
    $("lien-google").href = lienGoogleAgenda();
    var lien = $("lien-agenda");
    try {
      var blob = new Blob([fabriquerIcs()], { type: "text/calendar;charset=utf-8" });
      lien.href = URL.createObjectURL(blob);
    } catch (e) { lien.hidden = true; }
  }

  /* ---------- Validation côté navigateur (la même règle côté serveur) ---------- */
  var MAUVAIS = /[<>@=\/\\{}\[\]|]|\d|https?:|www\./i;

  function lire() {
    var f = $("form");
    return {
      prenom: f.prenom.value.replace(/\s+/g, " ").trim(),
      nom: f.nom.value.replace(/\s+/g, " ").trim(),
      email: f.email.value.trim().toLowerCase(),
      indicatif: selIndicatif.value || $("autre-code").value.replace(/\D/g, ""),
      telephone: f.telephone.value.trim(),
      profession: f.profession.value.replace(/\s+/g, " ").trim(),
      site: f.site.value
    };
  }

  function valider(d) {
    var e = {};
    if (!d.prenom) { e.prenom = "Indique ton prénom."; }
    else if (d.prenom.length > 60 || MAUVAIS.test(d.prenom)) { e.prenom = "Vérifie ton prénom."; }

    if (!d.nom) { e.nom = "Indique ton nom."; }
    else if (d.nom.length > 60 || MAUVAIS.test(d.nom)) { e.nom = "Vérifie ton nom."; }

    if (!d.email) { e.email = "Indique ton adresse e-mail."; }
    else if (d.email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email)) {
      e.email = "Cette adresse e-mail n'est pas valide.";
    }

    var cc = String(d.indicatif).replace(/\D/g, "");
    var nat = d.telephone.replace(/\D/g, "");
    if (!d.telephone) { e.telephone = "Indique ton numéro WhatsApp."; }
    else if (!cc || cc.length > 4) { e.telephone = "Choisis l'indicatif de ton pays."; }
    else if (/[^\d\s().+-]/.test(d.telephone) || (cc + nat).length < 8 || (cc + nat).length > 15) {
      e.telephone = "Ce numéro n'est pas valide. Écris-le sans l'indicatif.";
    }

    if (d.profession && (d.profession.length > 100 || /[<>]|https?:|www\./i.test(d.profession))) {
      e.profession = "Vérifie ce champ.";
    }
    return e;
  }

  var CHAMPS_ETAPE = { 1: ["prenom", "nom"], 2: ["email", "telephone"], 3: ["profession"] };
  function etapeDe(champ) {
    for (var n = 1; n <= 3; n++) { if (CHAMPS_ETAPE[n].indexOf(champ) !== -1) { return n; } }
    return 3;
  }

  function effacerErreurs() {
    ["prenom", "nom", "email", "telephone", "profession", "globale"].forEach(function (k) {
      var p = $("err-" + k);
      if (p) { p.textContent = ""; }
      if (p && p.parentNode && p.parentNode.classList) { p.parentNode.classList.remove("invalide"); }
    });
  }

  function montrerErreurs(erreurs) {
    var premier = null;
    var ordre = ["prenom", "nom", "email", "telephone", "profession"];
    ordre.forEach(function (k) {
      if (!erreurs[k]) { return; }
      var p = $("err-" + k);
      if (p) {
        p.textContent = erreurs[k];
        if (p.parentNode && p.parentNode.classList) { p.parentNode.classList.add("invalide"); }
      }
      if (!premier) { premier = k; }
    });
    if (premier) {
      allerA(etapeDe(premier));
      $(premier).focus();
    }
  }

  /* ---------- Formulaire en trois étapes ---------- */
  var etape = 1;
  var NB_ETAPES = 3;
  var bouton = $("envoyer");
  var enCours = false;

  function libelleBouton() { return etape < NB_ETAPES ? "Continuer" : "Réserve maintenant ta place"; }

  function allerA(n) {
    etape = n;
    $$(".etape").forEach(function (bloc) {
      bloc.hidden = parseInt(bloc.getAttribute("data-etape"), 10) !== n;
    });
    $("etape-label").textContent = "Étape " + n + " sur " + NB_ETAPES;
    $("barre-progres").style.setProperty("width", (n / NB_ETAPES * 100) + "%");
    $("retour").hidden = n === 1;
    bouton.textContent = libelleBouton();
  }

  $("retour").addEventListener("click", function () {
    effacerErreurs();
    if (etape > 1) {
      allerA(etape - 1);
      var premier = document.querySelector('.etape[data-etape="' + etape + '"] input, .etape[data-etape="' + etape + '"] select');
      if (premier) { premier.focus(); }
    }
  });

  /* ---------- Turnstile (facultatif) ---------- */
  var widgetId = null;
  function chargerTurnstile() {
    if (!C.turnstileSiteKey) { return; }
    window.__tsPret = function () {
      widgetId = window.turnstile.render("#turnstile", { sitekey: C.turnstileSiteKey, language: "fr" });
    };
    var s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__tsPret";
    s.async = true;
    s.defer = true;
    document.head.appendChild(s);
  }

  /* ---------- Envoi ---------- */
  function etatEnvoi(actif) {
    enCours = actif;
    bouton.disabled = actif;
    bouton.textContent = actif ? "Envoi en cours" : libelleBouton();
  }

  function afficherConfirmation(doublon) {
    $("bloc-form").hidden = true;
    $("doublon").hidden = !doublon;
    var c = $("confirmation");
    c.hidden = false;
    preparerAgenda();
    $("carte").scrollIntoView({ block: "center" });
    c.focus({ preventScroll: true });
  }

  function envoyer(d) {
    var token = "";
    if (C.turnstileSiteKey && window.turnstile && widgetId !== null) {
      token = window.turnstile.getResponse(widgetId) || "";
    }
    var corps = {
      prenom: d.prenom, nom: d.nom, email: d.email,
      indicatif: d.indicatif, telephone: d.telephone, profession: d.profession,
      site: d.site, delai: Date.now() - chargeA, cf: token
    };
    return fetch(C.scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(corps),
      redirect: "follow"
    }).then(function (r) { return r.json(); });
  }

  $("form").addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (enCours) { return; }
    effacerErreurs();

    var d = lire();
    var toutes = valider(d);

    // étapes 1 et 2 : on ne contrôle que les champs de l'étape, puis on avance
    if (etape < NB_ETAPES) {
      var locales = {};
      CHAMPS_ETAPE[etape].forEach(function (k) { if (toutes[k]) { locales[k] = toutes[k]; } });
      if (Object.keys(locales).length) { montrerErreurs(locales); return; }
      allerA(etape + 1);
      var suivant = document.querySelector('.etape[data-etape="' + etape + '"] input, .etape[data-etape="' + etape + '"] select');
      if (suivant) { suivant.focus(); }
      return;
    }

    // dernière étape : tout est contrôlé, la première erreur ramène à la bonne étape
    if (Object.keys(toutes).length) { montrerErreurs(toutes); return; }

    if (C.turnstileSiteKey && (!window.turnstile || !window.turnstile.getResponse(widgetId))) {
      $("err-globale").textContent = "Coche la case de vérification avant d'envoyer.";
      return;
    }
    if (!C.scriptUrl) {
      $("err-globale").textContent = "Le formulaire n'est pas encore relié au Google Sheet.";
      return;
    }

    etatEnvoi(true);

    var attente = Math.max(0, (C.delaiMinSecondes || 0) * 1000 - (Date.now() - chargeA));
    setTimeout(function () {
      envoyer(d).then(function (rep) {
        if (rep && rep.ok) {
          afficherConfirmation(!!rep.doublon);
          return;
        }
        etatEnvoi(false);
        if (window.turnstile && widgetId !== null) { window.turnstile.reset(widgetId); }
        if (rep && rep.champs) { montrerErreurs(rep.champs); return; }
        $("err-globale").textContent = "L'inscription n'a pas pu être enregistrée. Réessaie dans un instant.";
      }).catch(function () {
        etatEnvoi(false);
        if (window.turnstile && widgetId !== null) { window.turnstile.reset(widgetId); }
        $("err-globale").textContent = "Connexion impossible. Vérifie ton réseau et réessaie.";
      });
    }, attente);
  });

  allerA(1);
  chargerTurnstile();
})();
