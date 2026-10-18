---
name: dishes
description: A small game or animation that needs a canvas and its own script. Load for a spinner, a dice roll, a timer with motion, or a drawing the built-in components can't make.
---

# Dishes

When the screen needs real motion or drawing, put a small page in an HtmlView and keep the Card around it ordinary: a header, the view, and a rule. The page draws its colors from the theme, reading `getComputedStyle(document.body).color` for ink and using CanvasText and Canvas for its button, so it matches light and dark. The canvas is drawn at twice its size for sharp lines. Nothing in it is shared.

## OpenUI

```openui
root = Card([header, wheel, rule])
header = CardHeader("Who does the dishes")
wheel = HtmlView("<style>\nbody{display:flex;flex-direction:column;align-items:center;gap:14px;padding:12px 0 16px;font-family:Inter,system-ui,sans-serif}\ncanvas{width:280px;height:280px}\nbutton{font:600 15px Inter,system-ui,sans-serif;width:280px;padding:12px;border:0;border-radius:16px;background:CanvasText;color:Canvas}\np{margin:0;font-size:15px;min-height:22px}\n</style>\n<canvas id=\"w\" width=\"560\" height=\"560\"></canvas>\n<p id=\"r\"></p>\n<button id=\"b\">Spin</button>\n<script>\nconst names=[\"Maya\",\"Jon\",\"Priya\",\"Sam\",\"Alex\",\"Rajiv\"];\nconst c=document.getElementById(\"w\"),x=c.getContext(\"2d\"),r=document.getElementById(\"r\"),b=document.getElementById(\"b\");\nconst ink=getComputedStyle(document.body).color;\nconst seg=Math.PI*2/names.length;let angle=0,spinning=false;\nfunction draw(){x.clearRect(0,0,560,560);x.save();x.translate(280,280);x.rotate(angle);\nnames.forEach((n,i)=>{x.beginPath();x.moveTo(0,0);x.arc(0,0,250,i*seg,(i+1)*seg);x.closePath();x.fillStyle=ink;x.globalAlpha=i%2?0.1:0.2;x.fill();x.globalAlpha=1;\nx.save();x.rotate(i*seg+seg/2);x.fillStyle=ink;x.font=\"600 30px Inter,system-ui,sans-serif\";x.textAlign=\"right\";x.textBaseline=\"middle\";x.fillText(n,204,0);x.restore()});\nx.restore();x.fillStyle=ink;x.beginPath();x.moveTo(264,4);x.lineTo(296,4);x.lineTo(280,40);x.closePath();x.fill();\nx.beginPath();x.arc(280,280,22,0,Math.PI*2);x.fill()}\nfunction winner(){const a=((-Math.PI/2-angle)%(Math.PI*2)+Math.PI*2)%(Math.PI*2);return names[Math.floor(a/seg)]}\nb.onclick=()=>{if(spinning)return;spinning=true;r.textContent=\"…\";const start=angle,turn=Math.PI*2*(4+Math.random()*2),t0=performance.now(),d=3200;\nfunction tick(t){const k=Math.min(1,(t-t0)/d);angle=start+turn*(1-Math.pow(1-k,3));draw();if(k<1)requestAnimationFrame(tick);else{spinning=false;r.textContent=winner()+\" does the dishes.\"}}\nrequestAnimationFrame(tick)};\ndraw();\n</script>", null, "Dish wheel")
rule = TextCallout("neutral", "House rule", "Whoever cooked is off the wheel tonight.")
```
