/* Page d'inscription : webinaire Excel avancé (2AS).
   Tout ce qui change d'un webinaire à l'autre se règle dans config.js. */
(function () {
  "use strict";

  var C = window.WEBINAIRE || {};
  var chargeA = Date.now();

  /* ---------- Outils ---------- */
  function $(id) { return document.getElementById(id); }
  function capitale(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function dateLongue() {
    try {
      var d = new Date(C.date + "T12:00:00Z");
      var txt = new Intl.DateTimeFormat("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC"
      }).format(d);
      return capitale(txt);
    } catch (e) { return ""; }
  }

  function heureCourte(h) {
    var p = String(h).split(":");
    var hh = parseInt(p[0], 10);
    return p[1] && p[1] !== "00" ? hh + "h" + p[1] : hh + "h";
  }

  function heures() { return heureCourte(C.debut) + " à " + heureCourte(C.fin); }

  function telHref() { return "tel:" + String(C.telephone || "").replace(/[^\d+]/g, ""); }

  /* ---------- Remplissage depuis config.js ---------- */
  var valeurs = {
    titre: C.titre,
    titreAccent: C.titreAccent,
    dateLongue: C.date ? dateLongue() : "",
    heures: C.debut && C.fin ? heures() : "",
    telephone: C.telephone,
    adresseSite: C.adresseSite,
    whatsappUrl: C.whatsappUrl,
    linkedinUrl: C.linkedinUrl,
    telHref: C.telephone ? telHref() : "",
    siteHref: C.adresseSite ? "https://" + C.adresseSite : ""
  };

  Array.prototype.forEach.call(document.querySelectorAll("[data-cfg]"), function (el) {
    var v = valeurs[el.getAttribute("data-cfg")];
    if (v) { el.textContent = v; }
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-href]"), function (el) {
    var v = valeurs[el.getAttribute("data-href")];
    if (v) { el.setAttribute("href", v); }
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-cache-si-vide]"), function (el) {
    var v = valeurs[el.getAttribute("data-cache-si-vide")];
    if (v) { el.hidden = false; }
  });

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
    function p(n) { return n < 10 ? "0" + n : "" + n; }
    return date.getUTCFullYear() + p(date.getUTCMonth() + 1) + p(date.getUTCDate()) +
      "T" + p(date.getUTCHours()) + p(date.getUTCMinutes()) + p(date.getUTCSeconds()) + "Z";
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
    var off = C.decalageUTC || "+00:00";
    var debut = new Date(C.date + "T" + C.debut + ":00" + off);
    var fin = new Date(C.date + "T" + C.fin + ":00" + off);
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
  function preparerAgenda() {
    var lien = $("lien-agenda");
    try {
      var blob = new Blob([fabriquerIcs()], { type: "text/calendar;charset=utf-8" });
      lien.href = URL.createObjectURL(blob);
    } catch (e) { lien.parentNode.hidden = true; }
  }

  /* ---------- Validation côté navigateur ---------- */
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

  function effacerErreurs() {
    ["prenom", "nom", "email", "telephone", "profession", "globale"].forEach(function (k) {
      var p = $("err-" + k);
      if (p) { p.textContent = ""; }
      if (p && p.parentNode && p.parentNode.classList) { p.parentNode.classList.remove("invalide"); }
    });
  }

  function montrerErreurs(erreurs) {
    var premier = null;
    Object.keys(erreurs).forEach(function (k) {
      var p = $("err-" + k);
      if (!p) { return; }
      p.textContent = erreurs[k];
      if (p.parentNode && p.parentNode.classList) { p.parentNode.classList.add("invalide"); }
      if (!premier && $(k)) { premier = $(k); }
    });
    if (premier) { premier.focus(); }
  }

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
  var bouton = $("envoyer");
  var enCours = false;

  function etatEnvoi(actif) {
    enCours = actif;
    bouton.disabled = actif;
    bouton.textContent = actif ? "Envoi en cours" : "Réserve maintenant ta place";
  }

  function afficherConfirmation(doublon) {
    $("bloc-form").hidden = true;
    $("doublon").hidden = !doublon;
    var c = $("confirmation");
    c.hidden = false;
    preparerAgenda();
    c.scrollIntoView({ block: "start" });
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
    var erreurs = valider(d);
    if (Object.keys(erreurs).length) { montrerErreurs(erreurs); return; }

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

  chargerTurnstile();
})();
