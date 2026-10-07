/**
 * Bundled Lisbon → Porto demo briefing, viewable without an API key or network.
 * sample-facts.json is a real fetch from 4 Oct 2026; the report below is a fixed
 * example written from those facts. Also used by the unit tests.
 */
import sample from "./sample-facts.json";
import { AiReportSchema, type Briefing, type StopFacts, type TripInput } from "../types";

const ai = AiReportSchema.parse({
  verdict: {
    score: 8.2,
    label: "Great time to go",
    summary:
      "Mid-October is a sweet spot: Lisbon's forecast is dry and warm (25–28 °C), summer crowds have thinned, and there are no official safety alerts for Portugal. The one thing to plan around is a recent easyJet cabin-crew strike, so check your flights.",
    factors: [
      { factor: "weather", impact: "positive", text: "Lisbon forecast is dry all week, 25–28 °C highs. Porto turns cooler (22 °C) and showers become more likely by the 19th." },
      { factor: "safety", impact: "positive", text: "UK Foreign Office has no alert flags for Portugal; usual city pickpocket care applies." },
      { factor: "news", impact: "neutral", text: "An easyJet cabin-crew walkout cancelled 443 flights. It isn't known to affect your dates, but it's worth checking." },
      { factor: "season", impact: "positive", text: "Shoulder season: fewer crowds than summer and lower hotel prices, with long sunny afternoons in Lisbon." },
    ],
  },
  headsUp: [
    { title: "Check your airline for strike disruption", detail: "easyJet cancelled 443 flights when Portugal-based cabin crew walked out (N6). If you fly easyJet, enable alerts and know your rebooking rights.", severity: "warning" },
    { title: "Strong sun despite autumn", detail: "UV index around 5 every day in Lisbon. Wear sunscreen on the miradouros (viewpoints); there is little shade on the hills.", severity: "caution", stop: "Lisbon" },
    { title: "Porto is wetter than Lisbon", detail: "Historically it rains on 75% of these late-October days in Porto. The forecast for 17–19 Oct looks kinder (10–16% rain chance), but pack a layer.", severity: "caution", stop: "Porto" },
    { title: "Pickpockets on tram 28 and in Bairro Alto", detail: "Wikivoyage flags train stations, public transport and Bairro Alto / Cais do Sodré late at night. Keep phones zipped away in crowds.", severity: "caution", stop: "Lisbon" },
    { title: "Tuk-tuk stops moved in Porto's Ribeira", detail: "From 1 October, tuk-tuk stops moved away from Ribeira (N9), so the riverfront is calmer for walking and photos.", severity: "info", stop: "Porto" },
    { title: "Steep, slippery streets", detail: "Both cities are built on hills paved with polished limestone (calçada) that gets slick when wet. Shoes with grip matter more than style.", severity: "info" },
  ],
  todo: [
    { title: "Sunset at Miradouro da Senhora do Monte", detail: "Lisbon's highest viewpoint, with golden light over the castle and the Tagus. Ideal for photography.", category: "see", stop: "Lisbon", bestWhen: "Clear evening of 13 or 14 Oct" },
    { title: "Belém: Jerónimos Monastery & Tower", detail: "Manueline architecture at its finest. Book Jerónimos tickets online to skip the queue.", category: "book-ahead", stop: "Lisbon", bestWhen: "Weekday morning" },
    { title: "Pastéis de nata, warm", detail: "Try them fresh from the oven in Belém, then compare with Manteigaria in Chiado.", category: "eat", stop: "Lisbon" },
    { title: "Day trip to Sintra", detail: "Fairytale palaces in the hills; cooler than the city. Go early and pre-book Pena Palace time slots.", category: "do", stop: "Lisbon", bestWhen: "15 Oct (overcast is fine for Sintra)" },
    { title: "Fado night in Alfama", detail: "Small family-run fado houses beat the big tourist dinner shows. Reserve a table.", category: "book-ahead", stop: "Lisbon" },
    { title: "Walk the Ribeira and cross Dom Luís I bridge", detail: "Cross the top deck at sunset for the classic Porto view, then port tasting in Vila Nova de Gaia.", category: "see", stop: "Porto", bestWhen: "Dry evening of 17 or 18 Oct" },
    { title: "Livraria Lello & São Bento station tiles", detail: "Timed tickets at Lello sell out, so book a slot. São Bento's azulejos are free.", category: "book-ahead", stop: "Porto" },
    { title: "Sunset at Foz do Douro", detail: "Where the river meets the Atlantic. Wikivoyage's tip for evening walks.", category: "do", stop: "Porto", bestWhen: "18 Oct" },
  ],
  packing: [
    { category: "Clothing", items: [
      { item: "Breathable day layers", why: "Lisbon highs of 25–28 °C all week" },
      { item: "Light sweater or jacket", why: "Evenings drop to 16–18 °C, cooler by the river in Porto" },
      { item: "Packable rain shell", why: "Porto historically rains on most late-October days" },
      { item: "Walking shoes with grip", why: "Steep hills and slippery limestone pavements" },
    ] },
    { category: "Health", items: [
      { item: "Sunscreen SPF 30+", why: "UV index around 5 daily" },
      { item: "Blister plasters", why: "Hilly cities, lots of walking at a balanced pace" },
    ] },
    { category: "Documents & money", items: [
      { item: "Schengen visa & travel insurance papers", why: "Required for most Indian passport holders; check the EU Entry-Exit System registration at the border" },
      { item: "Contactless card + some euros", why: "Small cafés and tram tickets may be cash-only" },
    ] },
    { category: "Tech", items: [
      { item: "Type F plug adapter", why: "Portugal uses European two-pin sockets (230 V)" },
      { item: "Power bank", why: "Long photography days away from your hotel" },
    ] },
  ],
  news: {
    mood: "mixed",
    summary: "Mostly everyday city news, plus one travel-relevant item: an easyJet cabin-crew strike in Portugal that cancelled hundreds of flights. Porto is also reorganising tourist traffic around the Ribeira.",
    picks: [
      { id: "N6", takeaway: "If you're flying easyJet, watch for further walkouts before departure." },
      { id: "N9", takeaway: "Ribeira should be quieter on foot, which is good for photos." },
      { id: "N2", takeaway: "Autumn is a good time for a wine-country day trip from Lisbon." },
    ],
  },
  tips: [
    { title: "Get a Viva Viagem card", detail: "One rechargeable card covers Lisbon's metro, trams, buses and ferries, and it's cheaper than single tickets." },
    { title: "Couvert isn't free", detail: "Bread, olives and cheese placed on the table are charged if you eat them. It's fine to send them back." },
    { title: "Dinner starts late", detail: "Locals eat from 8 pm; book popular restaurants for 7:30 to avoid waits." },
    { title: "Train between the cities", detail: "Alfa Pendular trains link Lisbon and Porto in about 3 hours; book ahead for the best fares." },
  ],
  alternatives: {
    destinations: [
      { name: "Seville", country: "Spain", why: "Similar history-and-food city break with October highs in the high 20s, and direct trains/flights from Lisbon." },
      { name: "Valencia", country: "Spain", why: "Drier than Porto in autumn, with great architecture and seafood. A good swap if rain is a worry." },
    ],
    timing:
      "Your dates are a good choice. Our weather records rate May and September as Lisbon's most comfortable months (highs 25–27 °C, few rainy days), with June close behind. For Porto, summer (June–August) is the driest.",
  },
});

export const SAMPLE_BRIEFING: Briefing = {
  id: "sample",
  createdAt: "2026-10-04T22:10:00.000Z",
  trip: sample.trip as TripInput,
  facts: sample.facts as StopFacts[],
  ai,
  model: "sample (hand-written)",
};
