/**
 * Agenda Cours — lecture de Google Agenda pour l'application
 * https://chrissorbadere.github.io/agenda-cours/
 *
 * Mise en place : voir le guide « Afficher Google Agenda dans Agenda Cours ».
 * 1. Remplace le mot de passe ci-dessous par le tien (lettres et chiffres, sans espace).
 * 2. Déployer → Nouveau déploiement → Application web
 *    Exécuter en tant que : Moi · Qui peut accéder : Tout le monde
 * 3. Copie l'URL de l'application web dans ⚙️ de l'application, avec ce mot de passe.
 */
const MOT_DE_PASSE = "CHANGE-MOI";

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (MOT_DE_PASSE.indexOf("-MOI") > -1) return json_({ error: "Le mot de passe du script n'a pas été changé." });
  if (p.key !== MOT_DE_PASSE) return json_({ error: "Mot de passe incorrect." });
  try {
    if (p.action === "agendas") return json_({ agendas: agendas_() });
    if (p.action === "evenements") return json_({ evenements: evenements_(p.du, p.au, p.agendas) });
    return json_({ ok: true, message: "Script Agenda Cours prêt." });
  } catch (err) {
    return json_({ error: String(err && err.message || err) });
  }
}

/** Liste des agendas visibles par le compte, l'agenda principal en premier. */
function agendas_() {
  const principal = CalendarApp.getDefaultCalendar().getId();
  return CalendarApp.getAllCalendars().map(c => ({
    id: c.getId(),
    nom: c.getName(),
    couleur: c.getColor(),
    principal: c.getId() === principal
  })).sort((a, b) => (b.principal - a.principal) || a.nom.localeCompare(b.nom));
}

/** Événements entre deux dates (AAAA-MM-JJ, au plus 62 jours) pour les agendas demandés. */
function evenements_(du, au, ids) {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(du || "") || !re.test(au || "")) throw new Error("Dates invalides.");
  const tz = Session.getScriptTimeZone();
  const debut = Utilities.parseDate(du + " 00:00", tz, "yyyy-MM-dd HH:mm");
  const fin = Utilities.parseDate(au + " 23:59", tz, "yyyy-MM-dd HH:mm");
  if ((fin - debut) / 864e5 > 62) throw new Error("Période trop longue.");
  const liste = String(ids || "").split(",").filter(Boolean);
  const cals = liste.length ? liste.map(id => CalendarApp.getCalendarById(id)).filter(Boolean)
                            : [CalendarApp.getDefaultCalendar()];
  const f = (d, m) => Utilities.formatDate(d, tz, m);
  const out = [];
  cals.forEach(cal => {
    cal.getEvents(debut, fin).forEach(ev => {
      const jour = ev.isAllDayEvent();
      const d = jour ? ev.getAllDayStartDate() : ev.getStartTime();
      const a = jour ? ev.getAllDayEndDate() : ev.getEndTime();
      out.push({
        agenda: cal.getName(),
        couleur: cal.getColor(),
        titre: ev.getTitle() || "(sans titre)",
        journee: jour,
        debut: f(d, "yyyy-MM-dd'T'HH:mm"),
        fin: f(jour ? new Date(a.getTime() - 864e5) : a, "yyyy-MM-dd'T'HH:mm"),
        lieu: ev.getLocation() || "",
        description: String(ev.getDescription() || "").slice(0, 2000)
      });
    });
  });
  return out.sort((x, y) => x.debut < y.debut ? -1 : x.debut > y.debut ? 1 : 0);
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
