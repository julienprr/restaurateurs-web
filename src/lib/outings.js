/**
 * Dates des sorties. L'API juge « aujourd'hui » à l'heure de Paris : le front
 * doit faire pareil, sinon un téléphone réglé sur un autre fuseau proposerait
 * une date que l'API refuse.
 */

const ZONE = 'Europe/Paris';

/** La date du jour à Paris, au format AAAA-MM-JJ attendu par l'API. */
export function todayInParis() {
  // La locale canadienne écrit les dates en AAAA-MM-JJ.
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONE }).format(new Date());
}

/** « samedi 7 novembre », à partir d'une date AAAA-MM-JJ. */
export function formatDay(isoDate) {
  // Midi UTC : la date ne peut pas basculer la veille ou le lendemain, quel
  // que soit le fuseau dans lequel on la formate.
  const date = new Date(`${isoDate}T12:00:00Z`);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: ZONE
  }).format(date);
}

/** « ce soir », « demain soir », ou « samedi 7 novembre ». */
export function describeDay(isoDate) {
  const today = todayInParis();
  if (isoDate === today) return 'ce soir';
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  if (isoDate === tomorrow.toISOString().slice(0, 10)) return 'demain soir';
  return formatDay(isoDate);
}
