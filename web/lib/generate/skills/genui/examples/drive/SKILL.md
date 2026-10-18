---
name: drive
description: A route or itinerary with stops on a map. Load for a road trip, directions with stops, a walking tour, or a day's itinerary.
---

# Drive

The trip is data written once, and everything else is computed from it: total miles in both units, total time as a duration, and the stop count. The map draws the route and binds the selected marker to $stop, the list sets the same $stop, and a callout shows the picked stop's note. Tapping a pin or a row is the same action.

## OpenUI

```openui
$stop = "Ikeda's"
root = Card([header, summary, map, here, stops])
header = CardHeader("Up to Tahoe")
trip = [{"label":"Home","place":"Mission, San Francisco","lat":37.7599,"lng":-122.4148,"miles":0,"minutes":0,"icon":"🏠","note":"Leave by 3 to beat the bridge."},{"label":"Ikeda's","place":"Auburn","lat":38.9135,"lng":-121.0691,"miles":123,"minutes":125,"icon":"🥧","note":"Pie and a bathroom. The only real stop."},{"label":"Donner Summit","place":"Soda Springs","lat":39.3166,"lng":-120.3283,"miles":52,"minutes":55,"icon":"🏔️","note":"Chains control starts here when it snows."},{"label":"Pine Lodge","place":"Tahoe Vista","lat":39.242,"lng":-120.028,"miles":23,"minutes":34,"icon":"🏡","note":"Door code is in the group chat. Groceries are at the Safeway in Truckee on the way."}]
miles = @Sum(trip.miles)
summary = KVList([{label: "Distance", value: @Format(miles, "number", 0) + " mi, " + @Format(@Convert(miles, "mi", "km"), "number", 0) + " km"}, {label: "Driving", value: @Duration(@Sum(trip.minutes) * 60)}, {label: "Stops", value: @Plural(@Count(trip) - 2, "stop")}])
map = Map(@Each(trip, "s", MapMarker(s.label, s.lat, s.lng, null, s.icon)), true, $stop, 300)
picked = @Find(trip, "label", $stop)
here = TextCallout("info", picked.label + ", " + picked.place, picked.note)
stops = ListBlock(@Each(trip, "s", ListItem(s.label, s.place, null, s.miles > 0 ? s.miles + " mi" : "Start", @Set($stop, s.label))), "Tap a stop")
```
