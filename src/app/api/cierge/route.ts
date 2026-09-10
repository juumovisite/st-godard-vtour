// Demande de cierge — envoie deux e-mails au moment où le donateur part vers
// le paiement SumUp (lien statique : pas de webhook de confirmation possible ;
// la Catho de Rouen vérifie la réception du paiement côté SumUp avant dépôt).
//
// Envoi via Resend (https://resend.com) — RESEND_API_KEY dans les env vars.
// Sans clé : mode démo (log serveur, réponse ok) pour le travail en local.

const PARISH_EMAIL = "cathorouen.pastorale@gmail.com";
// Domaine notifications.juumo.fr déjà vérifié dans le compte Resend JUUMO :
// aucun DNS à ajouter, l'envoi vers n'importe quel destinataire est autorisé.
const FROM =
  process.env.CIERGE_FROM_EMAIL ??
  "Église Saint-Godard <cierges@notifications.juumo.fr>";

async function sendEmail(to: string, subject: string, html: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.log("[cierge][démo — RESEND_API_KEY absente]", { to, subject });
    return { demo: true };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to: [to], subject, html }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return res.json();
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export async function POST(request: Request) {
  let body: { email?: string; firstname?: string; intention?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const firstname = (body.firstname ?? "").trim().slice(0, 80);
  const intention = (body.intention ?? "").trim().slice(0, 500);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "email invalide" }, { status: 400 });
  }

  const bonjour = firstname ? `Bonjour ${esc(firstname)},` : "Bonjour,";
  const donorHtml = `
    <div style="font-family: Georgia, serif; color: #1a2332; line-height: 1.65; max-width: 560px;">
      <p>${bonjour}</p>
      <p>Merci de tout cœur pour votre geste. 🕯️</p>
      <p><strong>Votre cierge sera déposé et allumé pour vous dans l'Église
      Sainte Jeanne d'Arc par un membre de la Catho de Rouen</strong>, dès
      réception de votre don.</p>
      ${intention ? `<p>Votre intention de prière :</p><blockquote style="margin: 0 0 0 12px; padding-left: 12px; border-left: 3px solid #D97706; color: #5a6577;">${esc(intention)}</blockquote>` : ""}
      <p>Si vous n'avez pas encore finalisé votre don, vous pouvez le faire ici :
      <a href="https://pay.sumup.com/b2c/QCSIXK2K">pay.sumup.com/b2c/QCSIXK2K</a></p>
      <p style="color: #5a6577;">Avec toute notre gratitude,<br/>
      La Catho de Rouen — Église Sainte Jeanne d'Arc</p>
    </div>`;

  const parishHtml = `
    <div style="font-family: Arial, sans-serif; color: #1a2332; line-height: 1.6; max-width: 560px;">
      <p><strong>Nouvelle demande de cierge</strong> via la visite virtuelle
      de l'Église Sainte Jeanne d'Arc (saintejeannedarc.juumo.fr).</p>
      <ul>
        <li>Prénom : ${firstname ? esc(firstname) : "—"}</li>
        <li>E-mail : ${esc(email)}</li>
        <li>Intention : ${intention ? esc(intention) : "—"}</li>
      </ul>
      <p>⚠️ La personne a été redirigée vers le paiement SumUp — merci de
      <strong>vérifier la réception du don sur le compte SumUp</strong> avant
      de déposer le cierge.</p>
    </div>`;

  try {
    const [donor, parish] = await Promise.all([
      sendEmail(email, "Votre cierge à l'Église Sainte Jeanne d'Arc 🕯️", donorHtml),
      sendEmail(PARISH_EMAIL, "Nouveau cierge demandé — visite virtuelle Sainte Jeanne d'Arc", parishHtml),
    ]);
    return Response.json({ ok: true, demo: !!(donor as { demo?: boolean }).demo });
  } catch (e) {
    console.error("[cierge] envoi échoué", e);
    return Response.json({ error: "send failed" }, { status: 502 });
  }
}
