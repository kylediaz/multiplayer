import {
  apartments,
  cabins,
  chili,
  dinnerFacts,
  dinnerPhoto,
  dinnerThread,
  dishCrew,
  driveStops,
  heaterMarkdown,
  recipeSteps,
  stays,
  type OpenUIKind,
} from "./data"

const v = (value: unknown) => JSON.stringify(value)

const tonight = `root = Card([hero, header, when, facts, map, thread, actions])
hero = ImageBlock(${v(dinnerPhoto)}, "Nopa, tonight")
header = CardHeader("Dinner at Nopa")
when = TextContent("7:30 PM, table for six", "large-heavy")
facts = KVList(${v(dinnerFacts.map(([label, value]) => ({ label, value })))}, "The table")
map = Map([nopa], false, null, 220)
nopa = MapMarker("Nopa", 37.7749, -122.4376, null, "🍽️")
thread = Bubbles(${v(dinnerThread)})
actions = Buttons([directions, call], "column")
directions = Button("Directions", @OpenUrl("https://maps.apple.com/?daddr=560+Divisadero+St,+San+Francisco"))
call = Button("Call Nopa", @OpenUrl("tel:+14158648643"), "secondary")`

const drive = `$stop = "Ikeda's"
root = Card([header, summary, map, here, stops])
header = CardHeader("Up to Tahoe")
trip = ${v(driveStops)}
miles = @Sum(trip.miles)
summary = KVList([{label: "Distance", value: @Format(miles, "number", 0) + " mi, " + @Format(@Convert(miles, "mi", "km"), "number", 0) + " km"}, {label: "Driving", value: @Duration(@Sum(trip.minutes) * 60)}, {label: "Stops", value: @Plural(@Count(trip) - 2, "stop")}])
map = Map(@Each(trip, "s", MapMarker(s.label, s.lat, s.lng, null, s.icon)), true, $stop, 300)
picked = @Find(trip, "label", $stop)
here = TextCallout("info", picked.label + ", " + picked.place, picked.note)
stops = ListBlock(@Each(trip, "s", ListItem(s.label, s.place, null, s.miles > 0 ? s.miles + " mi" : "Start", @Set($stop, s.label))), "Tap a stop")`

const cabinsProgram = `$cabin = "Pine Lodge"
root = Card([header, compare, map, choose, photo, cost, pitch])
header = CardHeader("Tahoe cabins")
options = ${v(cabins)}
compare = Table(${v(["", ...cabins.map((cabin) => cabin.name.split(" ")[0])])}, ${v([
  ["Night", ...cabins.map((cabin) => `$${cabin.night}`)],
  ["Beds", ...cabins.map((cabin) => cabin.beds)],
  ["Hot tub", ...cabins.map((cabin) => (cabin.hotTub ? "Yes" : "No"))],
  ["Lift", ...cabins.map((cabin) => `${cabin.lift} min`)],
])})
map = Map(@Each(options, "c", MapMarker(c.name, c.lat, c.lng, null, "🏡")), false, $cabin, 240)
choose = Buttons(@Each(options, "c", Button(c.name, @Set($cabin, c.name), $cabin == c.name ? "primary" : "secondary", "normal", "small")))
picked = @Find(options, "name", $cabin)
photo = ImageBlock(picked.photo, picked.name + ", " + picked.where)
cost = KVList([{label: "Three nights", value: @Format(picked.night * 3, "currency", 0)}, {label: "Split six ways", value: @Format(picked.night * 3 / 6, "currency", 0)}, {label: "Beds for six", value: picked.beds >= 6 ? "Enough" : "Short " + (6 - picked.beds)}], picked.name)
pitch = TextContent(picked.pitch, "small")`

function apartmentTab(place: (typeof apartments)[number]): string {
  const id = place.id
  const [first, ...rest] = place.photos
  const media = first
    ? [`${id}Hero = ImageBlock(${v(first)}, ${v(place.heading)})`, ...(rest.length ? [`${id}Grid = PhotoGrid(${v(rest.map((src) => ({ src })))})`] : [])]
    : [`${id}Hero = TextCallout("warning", "No photos", "The listing has none. Ask the agent before you go.")`]
  const parts = [`${id}Hero`, ...(rest.length ? [`${id}Grid`] : []), `${id}Facts`, `${id}Body`, ...(id === "morton" ? [`${id}Staged`] : []), `${id}Open`]
  return [
    `${id} = TabItem(${v(place.name.split(" ")[0])}, [${parts.join(", ")}])`,
    ...media,
    `${id}Facts = KVList([{label: "Rent", value: @Format(${place.rent}, "currency", 0) + " a month"}, {label: "A year", value: @Format(${place.rent} * 12, "currency", 0)}, {label: "Fee", value: ${v(place.fee)}}])`,
    `${id}Body = Markdown(${v(place.body)})`,
    ...(id === "morton" ? [`${id}Staged = TextCallout("warning", "Staged photos", "These are of another unit in the building.")`] : []),
    `${id}Open = Buttons([Button("Open the listing", @OpenUrl(${v(place.href)}), "secondary")])`,
  ].join("\n")
}

const brief = [
  `root = Card([header, pick, compare, tabs, before])`,
  `header = CardHeader("Three West Village one-bedrooms")`,
  `pick = TextCallout("success", "Leroy Street is the pick", "The only one with outdoor space and a fireplace, and the laundry is in the unit.")`,
  `compare = Table(${v(["", ...apartments.map((place) => place.name.split(" ")[0])])}, ${v([
    ["Rent", ...apartments.map((place) => `$${place.rent.toLocaleString("en-US")}`)],
    ["Outdoor", ...apartments.map((place) => (place.outdoor === "No" ? "None" : "Balcony"))],
    ["Size", ...apartments.map((place) => (place.size === "Not listed" ? "Not listed" : place.size))],
    ["Photos", ...apartments.map((place) => (place.photos.length === 0 ? "None" : place.id === "morton" ? "Staged" : "Real"))],
  ])})`,
  `tabs = Tabs([${apartments.map((place) => place.id).join(", ")}])`,
  ...apartments.map(apartmentTab),
  `before = TextCallout("neutral", "Before you go", "None of the three lists a floor plan, so ask each agent for one. Confirm availability before applying.")`,
].join("\n")

const recipe = `$serves = 6
$metric = false
root = Card([header, pot, adjust, units, shopping, method, rule])
header = CardHeader("Dad's chili")
pot = KVList([{label: "Serves", value: @Plural($serves, "person", "people")}, {label: "Time", value: "45 min"}, {label: "Pot", value: $serves > 8 ? "The big one" : "The usual"}], "The pot")
adjust = Buttons([Button("Fewer", @Set($serves, @Clamp($serves - 2, 2, 16)), "secondary"), Button("More", @Set($serves, @Clamp($serves + 2, 2, 16)), "secondary")])
units = Buttons([Button("US", @Set($metric, false), $metric ? "tertiary" : "primary", "normal", "small"), Button("Metric", @Set($metric, true), $metric ? "primary" : "tertiary", "normal", "small")])
pantry = ${v(chili)}
scale = $serves / 6
shopping = ListBlock(@Each(pantry, "i", ListItem(i.name, null, null, $metric && i.metric != "" ? @Format(@Convert(i.amount * scale, i.unit, i.metric), "number", i.metricPlaces) + " " + i.metric : @Trim(@Format(i.amount * scale, "number", i.places) + " " + i.unit))), "Shopping for " + $serves)
steps = ${v(recipeSteps)}
method = ListBlock(@Each(@Range(0, @Count(steps)), "n", ListItem(steps[n], null, null, @Pad(n + 1, 2))), "Method")
rule = TextCallout("info", "Dad's one rule", "Chili is better the second day, so make it the day before.")`

const split = `$mode = "nights"
root = Card([header, bill, choose, chart, table, note])
header = CardHeader("Splitting Pine Lodge")
guests = ${v(stays)}
total = 640 * 3 + 180
bill = KVList([{label: "Three nights", value: @Format(640 * 3, "currency", 0)}, {label: "Cleaning", value: @Format(180, "currency", 0)}, {label: "Total", value: @Format(total, "currency", 0)}], "The bill")
choose = Buttons([Button("By nights", @Set($mode, "nights"), $mode == "nights" ? "primary" : "secondary", "normal", "small"), Button("Evenly", @Set($mode, "even"), $mode == "even" ? "primary" : "secondary", "normal", "small")])
shares = $mode == "even" ? @Allocate(total, [1, 1, 1, 1]) : @Allocate(total, guests.nights)
top = @Max(shares)
chart = Svg(@Each(@Range(0, @Count(guests)), "i", G([SvgText(guests[i].name, 0, i * 40 + 22, 14, "ink", "start", "medium"), Rect(64, i * 40 + 6, shares[i] / top * 176, 24, "info", null, null, null, 6), SvgText(@Format(shares[i], "currency", 0), 64 + shares[i] / top * 176 + 8, i * 40 + 23, 13, "muted")])), "0 0 320 160")
table = Table(["", "Nights", "Owes"], @Each(@Range(0, @Count(guests)), "i", [guests[i].name, guests[i].nights, @Format(shares[i], "currency", 2)]))
note = TextContent($mode == "nights" ? "Each night costs the same per person, cleaning included." : "Everyone pays the same, however long they stay.", "small")`

const T0 = 62
const scale = 280 / 12
const tx = (temp: number) => Math.round(20 + (temp - T0) * scale)

const heater = `$temp = 68
$heating = false
root = Card([header, lede, sim, controls, status, body])
header = CardHeader("The cabin heater")
lede = TextContent("Nudge the room and watch the boiler hold its band.", "small")
sim = Svg([band, track, ${[64, 66, 68, 70, 72].map((t) => `tick${t}`).join(", ")}, onLabel, offLabel, dot, reading], "0 0 320 110")
band = Rect(${tx(67)}, 34, ${tx(69) - tx(67)}, 42, "info", null, null, 0.12, 8)
track = Line(20, 55, 300, 55, "muted", 2)
${[64, 66, 68, 70, 72].map((t) => `tick${t} = SvgText("${t}°", ${tx(t)}, 98, 11, "muted", "middle")`).join("\n")}
onLabel = SvgText("on", ${tx(67)}, 28, 10, "muted", "middle")
offLabel = SvgText("off", ${tx(69)}, 28, 10, "muted", "middle")
x = 20 + ($temp - ${T0}) * ${scale.toFixed(4)}
dot = Circle(x, 55, 9, $heating ? "danger" : "ink")
reading = SvgText($temp + "°", x, 81, 12, "ink", "middle", "semibold")
controls = Buttons([colder, warmer])
colder = Button("Colder", Action([@Set($heating, $temp - 1 < 67 ? true : $temp - 1 > 69 ? false : $heating), @Set($temp, @Clamp($temp - 1, 62, 74))]), "secondary")
warmer = Button("Warmer", Action([@Set($heating, $temp + 1 < 67 ? true : $temp + 1 > 69 ? false : $heating), @Set($temp, @Clamp($temp + 1, 62, 74))]), "secondary")
status = $heating ? TextCallout("warning", "Boiler on", "It stays on until the room passes 69°F.") : TextCallout("neutral", "Boiler off", "It stays off until the room drops below 67°F.")
body = Markdown(${v(heaterMarkdown)})`

const wheelHtml = `<style>
body{display:flex;flex-direction:column;align-items:center;gap:14px;padding:12px 0 16px;font-family:Inter,system-ui,sans-serif}
canvas{width:280px;height:280px}
button{font:600 15px Inter,system-ui,sans-serif;width:280px;padding:12px;border:0;border-radius:16px;background:CanvasText;color:Canvas}
p{margin:0;font-size:15px;min-height:22px}
</style>
<canvas id="w" width="560" height="560"></canvas>
<p id="r">Tap spin.</p>
<button id="b">Spin</button>
<script>
const names=${JSON.stringify(dishCrew)};
const c=document.getElementById("w"),x=c.getContext("2d"),r=document.getElementById("r"),b=document.getElementById("b");
const ink=getComputedStyle(document.body).color;
const seg=Math.PI*2/names.length;let angle=0,spinning=false;
function draw(){x.clearRect(0,0,560,560);x.save();x.translate(280,280);x.rotate(angle);
names.forEach((n,i)=>{x.beginPath();x.moveTo(0,0);x.arc(0,0,250,i*seg,(i+1)*seg);x.closePath();x.fillStyle=ink;x.globalAlpha=i%2?0.1:0.2;x.fill();x.globalAlpha=1;
x.save();x.rotate(i*seg+seg/2);x.fillStyle=ink;x.font="600 30px Inter,system-ui,sans-serif";x.textAlign="right";x.textBaseline="middle";x.fillText(n,204,0);x.restore()});
x.restore();x.fillStyle=ink;x.beginPath();x.moveTo(264,4);x.lineTo(296,4);x.lineTo(280,40);x.closePath();x.fill();
x.beginPath();x.arc(280,280,22,0,Math.PI*2);x.fill()}
function winner(){const a=((-Math.PI/2-angle)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);return names[Math.floor(a/seg)]}
b.onclick=()=>{if(spinning)return;spinning=true;r.textContent="…";const start=angle,turn=Math.PI*2*(4+Math.random()*2),t0=performance.now(),d=3200;
function tick(t){const k=Math.min(1,(t-t0)/d);angle=start+turn*(1-Math.pow(1-k,3));draw();if(k<1)requestAnimationFrame(tick);else{spinning=false;r.textContent=winner()+" does the dishes."}}
requestAnimationFrame(tick)};
draw();
</script>`

const dishes = `root = Card([header, lede, wheel, rule])
header = CardHeader("Who does the dishes")
lede = TextContent("Spin it once. No rerolls.", "small")
wheel = HtmlView(${v(wheelHtml)}, null, "Dish wheel")
rule = TextCallout("neutral", "House rule", "Whoever cooked is off the wheel tonight.")`

export const openuiSources: Record<OpenUIKind, string> = {
  tonight,
  drive,
  cabins: cabinsProgram,
  brief,
  recipe,
  split,
  heater,
  dishes,
}
