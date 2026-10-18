---
name: cabins
description: A few options compared side by side, then one picked to look at closely. Load for comparing places, products, plans, or anything with a choice to make.
---

# Cabins

Comparison first: a short table with the options as columns and terse rows, so it fits a phone. Then a map of all of them, then a button per option that sets $cabin, the chosen one filled and the rest outlined. Below, the picked option's photo, its costs worked out for the group, and one line of pitch. The map's selected marker is the same $cabin.

## OpenUI

```openui
$cabin = "Pine Lodge"
root = Card([header, compare, map, choose, photo, cost, pitch])
header = CardHeader("Tahoe cabins")
options = [{"name":"Pine Lodge","where":"North Shore","night":640,"beds":8,"lat":39.242,"lng":-120.028,"photo":"https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=900&q=70&auto=format&fit=crop","pitch":"On the water, with the hot tub on the deck."},{"name":"Creekside","where":"Truckee","night":520,"beds":6,"lat":39.328,"lng":-120.183,"photo":"https://images.unsplash.com/photo-1587061949409-02df41d5e562?w=900&q=70&auto=format&fit=crop","pitch":"The cheapest, in the trees by the river. Six beds is tight."},{"name":"Ridge House","where":"South Lake","night":790,"beds":10,"lat":38.94,"lng":-119.96,"photo":"https://images.unsplash.com/photo-1542718610-a1d656d1884c?w=900&q=70&auto=format&fit=crop","pitch":"The biggest and closest to the lift, and it costs like it."}]
compare = Table(["","Pine","Creekside","Ridge"], [["Night","$640","$520","$790"],["Beds",8,6,10],["Hot tub","Yes","No","Yes"],["Lift","12 min","25 min","8 min"]])
map = Map(@Each(options, "c", MapMarker(c.name, c.lat, c.lng, null, "🏡")), false, $cabin, 240)
choose = Buttons(@Each(options, "c", Button(c.name, @Set($cabin, c.name), $cabin == c.name ? "primary" : "secondary", "normal", "small")))
picked = @Find(options, "name", $cabin)
photo = ImageBlock(picked.photo, picked.name + ", " + picked.where)
cost = KVList([{label: "Three nights", value: @Format(picked.night * 3, "currency", 0)}, {label: "Split six ways", value: @Format(picked.night * 3 / 6, "currency", 0)}, {label: "Beds for six", value: picked.beds >= 6 ? "Enough" : "Short " + (6 - picked.beds)}], picked.name)
pitch = TextContent(picked.pitch, "small")
```
