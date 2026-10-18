export const reactShowcase = [
  {
    kind: "groceries",
    ask: "a grocery list for the tahoe trip that everyone can add to and check off, with rough prices",
    phones: 2,
  },
  {
    kind: "books",
    ask: "a list of books i want to read that I can edit",
  },
  {
    kind: "poll",
    ask: "a poll for where we eat tonight, then lock in the winner",
  },
  {
    kind: "rsvp",
    ask: "an rsvp for the cabin weekend: who can make it and which nights",
  },
  {
    kind: "recipe",
    ask: "dad's chili recipe with the shopping list we can tick off and a simmer timer",
  },
  {
    kind: "kitty",
    ask: "track what everyone spent on the tahoe trip and who owes who",
  },
  {
    kind: "heater",
    ask: "let me play with the pine lodge thermostat and see how often the boiler starts",
  },
] as const

export const openuiShowcase = [
  {
    kind: "tonight",
    ask: "tonight's dinner plan, something i can send the group",
  },
  {
    kind: "drive",
    ask: "the drive up to tahoe with the stops",
  },
  {
    kind: "cabins",
    ask: "the three tahoe cabins side by side so we can pick",
  },
  {
    kind: "brief",
    ask: "put the three west village apartments you found side by side, with your pick",
  },
  {
    kind: "recipe",
    ask: "dad's chili, scaled for however many people show up",
  },
  {
    kind: "split",
    ask: "split the pine lodge bill by how many nights each person stays",
  },
  {
    kind: "heater",
    ask: "explain why the pine lodge heater doesn't short-cycle, with the formula and the code",
  },
  {
    kind: "dishes",
    ask: "a wheel to pick who does the dishes",
  },
] as const

export type ReactKind = (typeof reactShowcase)[number]["kind"]
export type OpenUIKind = (typeof openuiShowcase)[number]["kind"]

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&q=70&auto=format&fit=crop`

export const people = ["Maya", "Jon", "Priya", "Sam"] as const

export const groceryItems = [
  { name: "Oat milk", price: 6, done: false },
  { name: "Sourdough", price: 7, done: false },
  { name: "Eggs", price: 8, done: false },
  { name: "Coffee", price: 14, done: false },
  { name: "Butter", price: 7, done: false },
  { name: "Lemons", price: 4, done: true },
  { name: "Salt", price: 3, done: true },
]

export const readingList = [
  { title: "The Overstory", author: "Richard Powers", read: false, note: "Maya keeps bringing it up." },
  { title: "Piranesi", author: "Susanna Clarke", read: false, note: "" },
  { title: "Tomorrow, and Tomorrow, and Tomorrow", author: "Gabrielle Zevin", read: true, note: "" },
  { title: "Klara and the Sun", author: "Kazuo Ishiguro", read: false, note: "" },
  { title: "The Left Hand of Darkness", author: "Ursula K. Le Guin", read: false, note: "" },
]

export const restaurants = ["Nopa", "Zuni Café", "Kin Khao", "Delfina"] as const

export const votesSeed = [
  { place: "Nopa", voter: "maya" },
  { place: "Nopa", voter: "jon" },
  { place: "Kin Khao", voter: "priya" },
  { place: "Zuni Café", voter: "sam" },
  { place: "Nopa", voter: "alex" },
  { place: "Kin Khao", voter: "rajiv" },
]

export const nights = ["Friday", "Saturday", "Sunday"] as const

export const rsvpSeed = [
  { name: "Maya", coming: true, nights: "Friday, Saturday", kids: false, note: "Arriving late Friday" },
  { name: "Jon", coming: false, nights: "", kids: false, note: "" },
  { name: "Priya", coming: true, nights: "Friday, Saturday, Sunday", kids: true, note: "No nuts for Leo" },
]

export const recipeItems = ["2 lb ground beef", "1 onion", "4 cloves garlic", "Chili powder and cumin", "Crushed tomatoes", "Beef stock", "Kidney beans"]

export const boughtSeed = [{ name: "Crushed tomatoes" }]

export const recipeSteps = [
  "Brown 2 lb of beef in batches, hard, so it takes color.",
  "Soften the onion and garlic in the fat, then the spices for a minute.",
  "Add the tomatoes and stock; simmer 30 minutes.",
  "Beans in for the last 10. Salt at the end.",
] as const

export const kittySeed = [
  { what: "Cabin deposit", amount: 640, paidBy: "Maya" },
  { what: "Groceries", amount: 186, paidBy: "Jon" },
  { what: "Gas", amount: 72, paidBy: "Priya" },
  { what: "Lift tickets", amount: 412, paidBy: "Maya" },
]

export const chili = [
  { name: "Ground beef", amount: 2, unit: "lb", places: 1, metric: "kg", metricPlaces: 1 },
  { name: "Onion", amount: 1, unit: "", places: 0, metric: "", metricPlaces: 0 },
  { name: "Garlic", amount: 4, unit: "cloves", places: 0, metric: "", metricPlaces: 0 },
  { name: "Crushed tomatoes", amount: 28, unit: "oz", places: 0, metric: "g", metricPlaces: 0 },
  { name: "Beef stock", amount: 2, unit: "cup", places: 1, metric: "ml", metricPlaces: 0 },
  { name: "Kidney beans", amount: 15, unit: "oz", places: 0, metric: "g", metricPlaces: 0 },
] as const

export const dinnerFacts = [
  ["Where", "560 Divisadero St"],
  ["Under", "Rajiv"],
  ["Who", "Maya, Jon, Priya, Sam, Alex, Rajiv"],
] as const

export const dinnerPhoto = photo("1414235077428-338989a2e8c0")

export const dinnerThread = [
  { text: "Booked Nopa for 7:30, six of us", me: true, time: "4:12 PM" },
  { text: "amazing. pork chop is mine", me: false },
  { text: "can we sit outside?", me: false },
  { text: "Asked. Patio if it's open, inside if not", me: true },
] as const

export const driveStops = [
  { label: "Home", place: "Mission, San Francisco", lat: 37.7599, lng: -122.4148, miles: 0, minutes: 0, icon: "🏠", note: "Leave by 3 to beat the bridge." },
  { label: "Ikeda's", place: "Auburn", lat: 38.9135, lng: -121.0691, miles: 123, minutes: 125, icon: "🥧", note: "Pie and a bathroom. The only real stop." },
  { label: "Donner Summit", place: "Soda Springs", lat: 39.3166, lng: -120.3283, miles: 52, minutes: 55, icon: "🏔️", note: "Chains control starts here when it snows." },
  { label: "Pine Lodge", place: "Tahoe Vista", lat: 39.242, lng: -120.028, miles: 23, minutes: 34, icon: "🏡", note: "Door code is in the group chat. Groceries are at the Safeway in Truckee on the way." },
] as const

export const cabins = [
  {
    id: "pine",
    name: "Pine Lodge",
    where: "North Shore",
    night: 640,
    beds: 8,
    hotTub: true,
    lift: 12,
    lat: 39.242,
    lng: -120.028,
    photo: photo("1510798831971-661eb04b3739"),
    pitch: "On the water, with the hot tub on the deck.",
  },
  {
    id: "creek",
    name: "Creekside",
    where: "Truckee",
    night: 520,
    beds: 6,
    hotTub: false,
    lift: 25,
    lat: 39.328,
    lng: -120.183,
    photo: photo("1587061949409-02df41d5e562"),
    pitch: "The cheapest, in the trees by the river. Six beds is tight.",
  },
  {
    id: "ridge",
    name: "Ridge House",
    where: "South Lake",
    night: 790,
    beds: 10,
    hotTub: true,
    lift: 8,
    lat: 38.94,
    lng: -119.96,
    photo: photo("1542718610-a1d656d1884c"),
    pitch: "The biggest and closest to the lift, and it costs like it.",
  },
] as const

export const stays = [
  { name: "Maya", nights: 3 },
  { name: "Jon", nights: 2 },
  { name: "Priya", nights: 3 },
  { name: "Sam", nights: 1 },
] as const

export const apartments = [
  {
    id: "leroy",
    name: "Leroy St #1J",
    heading: "Leroy Street #1J",
    rent: 5395,
    fee: "None",
    outdoor: "Private balcony",
    size: "Not listed",
    photos: [photo("1502672260266-1c1ef2d93688"), photo("1484154218962-a197022b5858"), photo("1505693416388-ac5ce068fe85")],
    body: "Renovated, with a private balcony, a fireplace, and a washer and dryer in the unit. Dishwasher, hardwood floors, high ceilings. Cats and dogs allowed. Listed by Christopher Bernard, Keller Williams NYC.",
    href: "https://www.renthop.com/listings/leroy-street/1-j/76926267",
  },
  {
    id: "barrow",
    name: "Barrow St",
    heading: "Barrow Street",
    rent: 5495,
    fee: "None",
    outdoor: "No",
    size: "Not listed",
    photos: [],
    body: "Renovated, with exposed brick, in-unit laundry, a dishwasher, and stainless appliances. Hardwood floors and high ceilings, near the A, C, E, B, D, F, and M. Cats and dogs allowed. Listed by Tony Ji, Highline Residential.",
    href: "https://www.renthop.com/listings/barrow-street/1w/77217078",
  },
  {
    id: "morton",
    name: "Morton St",
    heading: "Morton Street",
    rent: 5200,
    fee: "None",
    outdoor: "No",
    size: "523 sq ft",
    photos: [photo("1522708323590-d24dbb6b0267"), photo("1493809842364-78817add7ffb")],
    body: "The cheapest of the three, with a washer and dryer in the unit, a marble bath, exposed brick, and a virtual doorman. Cats and dogs allowed. Listed by Samia Akodu, Compass.",
    href: "https://www.renthop.com/listings/morton-street/a/73435047",
  },
] as const

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

export const heaterMarkdown = [
  "The boiler at Pine Lodge short-cycles if it chases the set point. It doesn't. It holds a deadband and keeps doing what it was already doing.",
  "",
  "Call the set point $S$ and the gap $g$. Heat starts below the band and stops above it.",
  "",
  "$$",
  heater.on,
  "$$",
  "",
  "$$",
  heater.off,
  "$$",
  "",
  "```",
  heater.code,
  "```",
  "",
  "The coast back down takes about",
  "",
  "$$",
  heater.coast,
  "$$",
  "",
  "where $C$ is the heat the room holds and $P$ is how fast the boiler puts it back. A wider gap means fewer starts, and a longer wait.",
].join("\n")

export const dishCrew = ["Maya", "Jon", "Priya", "Sam", "Alex", "Rajiv"] as const
