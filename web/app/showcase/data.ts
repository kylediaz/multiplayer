export const showcaseMeta = [
  {
    kind: "groceries",
    genre: "app",
    title: "Tahoe groceries",
    ask: "a grocery list for the tahoe trip that everyone can add to and check off, with rough prices",
  },
  {
    kind: "books",
    genre: "app",
    title: "Books to read",
    ask: "a list of books i want to read that I can edit",
  },
  {
    kind: "schedule",
    genre: "app",
    title: "2026 NFL Schedule",
    ask: "the 2026 nfl schedule, week by week",
  },
  {
    kind: "brief",
    genre: "document",
    title: "Three West Village one-bedrooms",
    ask: "put the three west village apartments you found side by side, with your pick",
  },
  {
    kind: "recipe",
    genre: "document",
    title: "Dad's chili",
    ask: "dad's chili recipe with the shopping list we can tick off",
  },
  {
    kind: "tonight",
    genre: "card",
    title: "Dinner at Nopa",
    ask: "tonight's dinner plan, something i can send the group",
  },
  {
    kind: "rsvp",
    genre: "form",
    title: "Cabin weekend",
    ask: "an rsvp for the cabin weekend: who can make it and which nights",
  },
  {
    kind: "cabins",
    genre: "table",
    title: "Tahoe cabins",
    ask: "the three tahoe cabins side by side so we can pick",
  },
  {
    kind: "heater",
    genre: "document",
    title: "The cabin heater",
    ask: "explain why the pine lodge heater doesn't short-cycle, with the formula and the code",
  },
] as const

export type ShowcaseKind = (typeof showcaseMeta)[number]["kind"]

export const heater = {
  on: String.raw`\mathrm{on}(T) = T < S - \frac{g}{2}`,
  off: String.raw`\mathrm{off}(T) = T > S + \frac{g}{2}`,
  coast: String.raw`t = \frac{C}{P}\left(S + \frac{g}{2} - T\right)`,
  code: `function step(temp, set, gap, heating) {
  if (temp < set - gap / 2) return true
  if (temp > set + gap / 2) return false
  return heating
}`,
} as const

export const groceryItems = [
  { name: "Oat milk", price: 6, done: false },
  { name: "Sourdough", price: 7, done: false },
  { name: "Eggs", price: 8, done: false },
  { name: "Coffee", price: 14, done: false },
  { name: "Butter", price: 7, done: false },
  { name: "Lemons", price: 4, done: true },
  { name: "Salt", price: 3, done: true },
] as const

export const readingList = [
  { title: "The Overstory", author: "Richard Powers", read: false },
  { title: "Piranesi", author: "Susanna Clarke", read: false },
  { title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", read: true },
  { title: "Klara and the Sun", author: "Kazuo Ishiguro", read: false },
  { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", read: false },
] as const

export const games = [
  { week: "1", day: "Thursday, Sep 10", time: "8:15 PM", away: "Falcons", home: "Cardinals", tv: "NBC" },
  { week: "1", day: "Sunday, Sep 13", time: "1:00 PM", away: "Commanders", home: "Ravens", tv: "FOX" },
  { week: "1", day: "Sunday, Sep 13", time: "1:00 PM", away: "Bears", home: "Seahawks", tv: "CBS" },
  { week: "1", day: "Sunday, Sep 13", time: "1:00 PM", away: "49ers", home: "Bengals", tv: "FOX" },
  { week: "1", day: "Sunday, Sep 13", time: "4:05 PM", away: "Bills", home: "Titans", tv: "CBS" },
  { week: "1", day: "Sunday, Sep 13", time: "4:25 PM", away: "Eagles", home: "Cowboys", tv: "FOX" },
  { week: "1", day: "Sunday, Sep 13", time: "8:20 PM", away: "Chiefs", home: "Rams", tv: "NBC" },
  { week: "1", day: "Monday, Sep 14", time: "8:15 PM", away: "Chargers", home: "Raiders", tv: "ESPN" },
  { week: "2", day: "Thursday, Sep 17", time: "8:15 PM", away: "Packers", home: "Saints", tv: "Prime" },
  { week: "2", day: "Sunday, Sep 20", time: "1:00 PM", away: "Giants", home: "Lions", tv: "FOX" },
  { week: "2", day: "Sunday, Sep 20", time: "4:25 PM", away: "Patriots", home: "Texans", tv: "CBS" },
  { week: "3", day: "Sunday, Sep 27", time: "1:00 PM", away: "Colts", home: "Vikings", tv: "CBS" },
] as const

export const weeks = ["1", "2", "3"] as const

export const apartments = [
  {
    id: "leroy",
    name: "Leroy St #1J",
    heading: "Leroy Street #1J",
    pick: true,
    facts: [
      { value: "$5,395", label: "Rent" },
      { value: "None", label: "Fee" },
      { value: "Now", label: "Move in" },
    ],
    body: "Renovated, with a private balcony, a fireplace, and a washer and dryer in the unit. Dishwasher, hardwood floors, high ceilings. Cats and dogs allowed. Listed by Christopher Bernard, Keller Williams NYC.",
    href: "https://www.renthop.com/listings/leroy-street/1-j/76926267",
  },
  {
    id: "barrow",
    name: "Barrow St",
    heading: "Barrow Street",
    pick: false,
    facts: [
      { value: "$5,495", label: "Rent" },
      { value: "None", label: "Fee" },
      { value: "Now", label: "Move in" },
    ],
    body: "Renovated, with exposed brick, in-unit laundry, a dishwasher, and stainless appliances. Hardwood floors and high ceilings, near the A, C, E, B, D, F, and M. Cats and dogs allowed. The listing has no photos. Listed by Tony Ji, Highline Residential.",
    href: "https://www.renthop.com/listings/barrow-street/1w/77217078",
  },
  {
    id: "morton",
    name: "Morton St",
    heading: "Morton Street",
    pick: false,
    facts: [
      { value: "$5,200", label: "Rent" },
      { value: "523 sq ft", label: "Size" },
      { value: "Now", label: "Move in" },
    ],
    body: "The cheapest of the three, with a washer and dryer in the unit, a marble bath, exposed brick, and a virtual doorman. Cats and dogs allowed. The photos are of another unit in the building, staged. Listed by Samia Akodu, Compass.",
    href: "https://www.renthop.com/listings/morton-street/a/73435047",
  },
] as const

export const apartmentRows = [
  ["Rent", "$5,395", "$5,495", "$5,200"],
  ["Fee", "None", "None", "None"],
  ["Outdoor", "Private balcony", "No", "No"],
  ["Laundry", "In unit", "In unit", "In unit"],
  ["Size", "Not listed", "Not listed", "523 sq ft"],
] as const

export const recipeItems = [
  { name: "2 lb ground beef", done: false },
  { name: "1 onion", done: false },
  { name: "4 cloves garlic", done: false },
  { name: "Chili powder and cumin", done: false },
  { name: "Crushed tomatoes", done: true },
  { name: "Beef stock", done: false },
  { name: "Kidney beans", done: false },
] as const

export const recipeSteps = [
  "Brown 2 lb of beef in batches, hard, so it takes color.",
  "Soften the onion and garlic in the fat, then the spices for a minute.",
  "Add the tomatoes and stock; simmer 30 minutes.",
  "Beans in for the last 10. Salt at the end.",
] as const

export const dinnerFacts = [
  ["Where", "560 Divisadero St"],
  ["Under", "Rajiv"],
  ["Who", "Maya, Jon, Priya, Sam, Alex, Rajiv"],
] as const

export const nights = ["Friday", "Saturday", "Sunday"] as const

export const rsvpSeed = [
  { name: "Maya", coming: true, nights: "Friday, Saturday", kids: false },
  { name: "Jon", coming: false, nights: "", kids: false },
] as const

export const cabinHeaders = ["", "Pine Lodge", "Creekside", "Ridge House"] as const

export const cabinRows = [
  ["Where", "North Shore", "Truckee", "South Lake"],
  ["Per night", "$640", "$520", "$790"],
  ["Beds", "8", "6", "10"],
  ["Hot tub", "Yes", "No", "Yes"],
  ["To the lift", "12 min", "25 min", "8 min"],
] as const
