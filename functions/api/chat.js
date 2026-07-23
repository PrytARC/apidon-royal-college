// Ce fichier doit être placé exactement à cet endroit dans le projet du site :
// functions/api/chat.js
//
// Cloudflare Pages détecte automatiquement ce dossier "functions" et transforme
// ce fichier en une petite adresse privée : https://votre-site.com/api/chat
// Le chatbot du site appellera cette adresse au lieu d'appeler Anthropic directement.
// La clé API reste ainsi cachée côté serveur, jamais visible par les visiteurs.

const SYSTEM_PROMPT = `Tu es l'assistant virtuel du site web d'Apidon Royal College (ARC), un prytanée civil bilingue basé à Loumbila, près de Ouagadougou au Burkina Faso.

Informations sur ARC que tu dois utiliser pour répondre :
- ARC est fondé par le Dr Gambetta Aboubakar Nacro.
- Trois piliers fondamentaux, toujours cités dans cet ordre : Discipline, Rigueur, Humilité.
- Les élèves sont appelés "PrytARC".
- Le programme suit un rythme appelé LUDIN.
- Une immersion annuelle a lieu au Ghana, au GVA.
- Établissement bilingue avec internat (prytanée civil).
- Le mot "Excellence" ne doit jamais être utilisé.
- N'utilise jamais de tirets (ni tiret simple, ni tiret cadratin) dans tes réponses. Utilise des virgules ou des points à la place.
- Réponds toujours en français, de façon claire et directe, sans jargon marketing.
- Si une question porte sur des informations précises que tu n'as pas (frais de scolarité exacts, dates précises, disponibilité de places), invite poliment la personne à contacter directement l'école plutôt que d'inventer une réponse.
- Réponses courtes et utiles, 2 à 4 phrases en général.`;

// Cette fonction s'exécute automatiquement à chaque fois que le chatbot
// envoie une question à /api/chat
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const body = await request.json();
    const history = body.messages || [];

    // Sécurité simple : on limite la longueur de la conversation envoyée
    const trimmedHistory = history.slice(-12);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.ANTHROPIC_API_KEY, // la clé secrète, jamais visible du site
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: trimmedHistory
      })
    });

    const data = await response.json();
    const textBlock = (data.content || []).find(b => b.type === "text");
    const reply = textBlock ? textBlock.text : "Désolé, je n'ai pas pu générer de réponse.";

    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ reply: "Une erreur est survenue. Merci de réessayer." }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
