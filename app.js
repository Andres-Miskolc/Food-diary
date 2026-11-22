const $ = s => document.querySelector(s);
const TIPOS = ["Breakfast", "Lunch", "Dinner", "Snack"];
let S = { meals: [], foods: [], goals: { kcal: 2000, p: 120, c: 230, f: 65 } };
function load() { try { const r = localStorage.getItem("diario-v1"); if (r) S = Object.assign(S, JSON.parse(r)) } catch (e) { } }
function save() { try { localStorage.setItem("diario-v1", JSON.stringify(S)) } catch (e) { } }
const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10) };
let fecha = iso(new Date()), editId = null;
const kcal = m => m.p * 4 + m.c * 4 + m.f * 9;
// valores de una comida (por la cantidad en gramos)
const k100 = m => m.k100 > 0 ? m.k100 : m.p100 * 4 + m.c100 * 4 + m.f100 * 9;
const val = m => { const k = m.g / 100; return { p: m.p100 * k, c: m.c100 * k, f: m.f100 * k, k: k100(m) * k } };
function totals(day) { return S.meals.filter(m => m.fecha === day).reduce((a, m) => { const v = val(m); a.p += v.p; a.c += v.c; a.f += v.f; a.k += v.k; return a }, { p: 0, c: 0, f: 0, k: 0 }) }
const r = n => Math.round(n);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function bar(label, v, goal, color, unit) {
    const pct = goal ? Math.min(100, v / goal * 100) : 0;
    return `<div class="row"><span>${label}</span><span>${r(v)} / ${goal} ${unit}</span></div><div class="bar"><i style="width:${pct}%;background:${color}"></i></div>`
}

function renderResumen() {
    const t = totals(fecha), g = S.goals;
    $("#resumen").innerHTML = `<div class="row" style="align-items:baseline;margin-bottom:12px"><span class="big">${r(t.k)}</span><span class="mu">kcal of ${g.kcal}</span></div>` +
        bar("Calories", t.k, g.kcal, "var(--ok)", "kcal") + bar("Protein", t.p, g.p, "var(--p)", "g") + bar("Carbs", t.c, g.c, "var(--c)", "g") + bar("Fat", t.f, g.f, "var(--f)", "g")
}

function renderForm() {
    const m = S.meals.find(x => x.id === editId) || { tipo: "Breakfast", nombre: "", g: 100, p100: 0, c100: 0, f100: 0 };
    $("#ft").textContent = editId ? "Edit meal" : "Add meal";
    $("#form").innerHTML = `<div class="g">
<div><label for="tipo">Type</label><select id="tipo">${TIPOS.map(t => `<option${t === m.tipo ? " selected" : ""}>${t}</option>`).join("")}</select></div>
<div><label for="g">Amount (g)</label><input id="g" type="number" min="1" step="any" value="${m.g}"></div>
<div style="grid-column:1/-1"><label for="nombre">Food</label><input id="nombre" list="dl" autocomplete="off" placeholder="e.g. cooked rice" value="${esc(m.nombre)}"></div></div>
<p class="tag">Values per 100 g</p>
<div class="g g4"><div><label for="p100">Protein (g)</label><input id="p100" type="number" min="0" step="any" value="${m.p100}"></div>
<div><label for="c100">Carbs (g)</label><input id="c100" type="number" min="0" step="any" value="${m.c100}"></div>
<div><label for="f100">Fat (g)</label><input id="f100" type="number" min="0" step="any" value="${m.f100}"></div>
<div><label for="k100">Calories (kcal)</label><input id="k100" type="number" min="0" step="any" value="${m.k100 || ""}"></div></div>
<p style="margin:14px 0 0"><button class="btn" id="add">${editId ? "Save changes" : "Add meal"}</button> ${editId ? '<button class="btn s" id="cx">Cancel</button>' : ""}</p>`;
    const upd = () => { $("#k100").placeholder = "auto: " + r(+$("#p100").value * 4 + +$("#c100").value * 4 + +$("#f100").value * 9) };
    ["p100", "c100", "f100"].forEach(i => $("#" + i).oninput = upd); upd();
    $("#nombre").oninput = e => {
        const f = S.foods.find(x => x.nombre.toLowerCase() === e.target.value.trim().toLowerCase());
        if (f) { $("#p100").value = f.p100; $("#c100").value = f.c100; $("#f100").value = f.f100; $("#k100").value = f.k100 || ""; upd() }
    };
    $("#add").onclick = () => {
        const nombre = $("#nombre").value.trim(), g = +$("#g").value;
        if (!nombre || !(g > 0)) { $("#nombre").focus(); return }
        const o = { tipo: $("#tipo").value, nombre, g, p100: +$("#p100").value || 0, c100: +$("#c100").value || 0, f100: +$("#f100").value || 0, k100: +$("#k100").value || 0 };
        const i = S.foods.findIndex(x => x.nombre.toLowerCase() === nombre.toLowerCase());
        const fd = { nombre, p100: o.p100, c100: o.c100, f100: o.f100, k100: o.k100 }; if (i >= 0) S.foods[i] = fd; else S.foods.push(fd);
        if (editId) { Object.assign(S.meals.find(x => x.id === editId), o); editId = null }
        else S.meals.push({ id: Date.now(), fecha, ...o });
        save(); renderAll()
    };
    if ($("#cx")) $("#cx").onclick = () => { editId = null; renderAll() };
}

function renderLista() {
    const ms = S.meals.filter(m => m.fecha === fecha);
    if (!ms.length) { $("#lista").innerHTML = '<p class="empty">No meals logged for this day yet. Add the first one above.</p>'; return }
    $("#lista").innerHTML = TIPOS.filter(t => ms.some(m => m.tipo === t)).map(t => `<p class="tag"><b>${t}</b></p>` +
        ms.filter(m => m.tipo === t).map(m => {
            const v = val(m); return `<div class="meal"><div><b>${esc(m.nombre)}</b> <small>${m.g} g</small><br><small>${r(v.k)} kcal · P ${v.p.toFixed(1)} · C ${v.c.toFixed(1)} · F ${v.f.toFixed(1)}</small></div>
 <div><button class="ib" data-e="${m.id}" aria-label="Edit">Edit</button><button class="ib" data-d="${m.id}" aria-label="Delete">Delete</button></div></div>`
        }).join("")).join("");
    $("#lista").querySelectorAll("[data-e]").forEach(b => b.onclick = () => { editId = +b.dataset.e; renderForm(); $("#form").scrollIntoView({ behavior: "smooth" }) });
    $("#lista").querySelectorAll("[data-d]").forEach(b => b.onclick = () => { if (confirm("Delete this meal?")) { S.meals = S.meals.filter(m => m.id !== +b.dataset.d); save(); renderAll() } })
}

function renderSemana() {
    const base = new Date(fecha + "T12:00:00"), days = [];
    for (let i = 6; i >= 0; i--) { const d = new Date(base); d.setDate(d.getDate() - i); days.push(d) }
    const ds = days.map(d => ({ d, t: totals(iso(d)) })), goal = S.goals.kcal;
    const max = Math.max(goal, ...ds.map(x => x.t.k), 1), W = 560, H = 220, bw = 48, gap = (W - bw * 7) / 8, L = ["S", "M", "T", "W", "T", "F", "S"];
    let svg = `<svg viewBox="0 0 ${W} ${H + 28}" role="img" aria-label="Calories for the last 7 days">`;
    const gy = H - goal / max * H;
    svg += `<line x1="0" x2="${W}" y1="${gy}" y2="${gy}" stroke="var(--mu)" stroke-dasharray="4 4"/><text x="${W}" y="${gy - 4}" text-anchor="end" font-size="11" fill="var(--mu)">goal ${goal}</text>`;
    ds.forEach((x, i) => {
        const h = x.t.k / max * H, xx = gap + i * (bw + gap);
        svg += `<rect x="${xx}" y="${H - h}" width="${bw}" height="${h}" rx="5" fill="${x.t.k > goal * 1.1 ? "var(--f)" : "var(--ok)"}"/>` +
            (x.t.k ? `<text x="${xx + bw / 2}" y="${H - h - 5}" text-anchor="middle" font-size="12" fill="var(--tx)">${r(x.t.k)}</text>` : "") +
            `<text x="${xx + bw / 2}" y="${H + 18}" text-anchor="middle" font-size="12" fill="var(--mu)">${L[x.d.getDay()]} ${x.d.getDate()}</text>`
    });
    $("#chCal").innerHTML = svg + "</svg>";
    const reg = ds.filter(x => x.t.k > 0), n = reg.length || 1, av = k => reg.reduce((a, x) => a + x.t[k], 0) / n;
    $("#prom").textContent = reg.length ? `Average over ${reg.length} day(s) with entries: ${r(av("k"))} kcal per day.` : "No entries in these 7 days.";
    const pk = av("p") * 4, ck = av("c") * 4, fk = av("f") * 9, tot = pk + ck + fk;
    if (!tot) { $("#chMac").innerHTML = '<p class="empty">No data yet.</p>'; return }
    const parts = [["Protein", pk, "var(--p)", av("p")], ["Carbs", ck, "var(--c)", av("c")], ["Fat", fk, "var(--f)", av("f")]];
    $("#chMac").innerHTML = `<div style="display:flex;height:22px;border-radius:99px;overflow:hidden;margin-bottom:12px">${parts.map(p => `<i style="width:${p[1] / tot * 100}%;background:${p[2]}"></i>`).join("")}</div>` +
        parts.map(p => `<div class="row" style="margin-bottom:4px"><span><b style="color:${p[2]}">■</b> ${p[0]}</span><span>${r(p[1] / tot * 100)}% · ${r(p[3])} g/day</span></div>`).join("")
}

function renderAjustes() {
    const g = S.goals, f = [["kcal", "Calories (kcal)"], ["p", "Protein (g)"], ["c", "Carbs (g)"], ["f", "Fat (g)"]];
    $("#metas").innerHTML = f.map(([k, l]) => `<div><label for="m_${k}">${l}</label><input id="m_${k}" type="number" min="0" value="${g[k]}"></div>`).join("");
    $("#gm").onclick = () => { f.forEach(([k]) => S.goals[k] = +$("#m_" + k).value || 0); save(); renderAll(); $("#ok").textContent = "Saved."; setTimeout(() => $("#ok").textContent = "", 2000) };
    $("#foods").innerHTML = S.foods.length ? S.foods.map((x, i) => `<div class="meal"><div><b>${esc(x.nombre)}</b><br><small>per 100 g: ${x.k100 ? x.k100 + " kcal · " : ""}P ${x.p100} · C ${x.c100} · F ${x.f100}</small></div><button class="ib" data-x="${i}">Delete</button></div>`).join("") : '<p class="empty">Foods you add are saved here so you can reuse them.</p>';
    $("#foods").querySelectorAll("[data-x]").forEach(b => b.onclick = () => { S.foods.splice(+b.dataset.x, 1); save(); renderAll() })
}

function renderAll() {
    $("#fecha").value = fecha; $("#dl").innerHTML = S.foods.map(f => `<option value="${esc(f.nombre)}">`).join("");
    renderResumen(); renderForm(); renderLista(); renderSemana(); renderAjustes()
}

function shift(n) { const d = new Date(fecha + "T12:00:00"); d.setDate(d.getDate() + n); fecha = iso(d); editId = null; renderAll() }
$("#prev").onclick = () => shift(-1); $("#next").onclick = () => shift(1);
$("#fecha").onchange = e => { if (e.target.value) { fecha = e.target.value; editId = null; renderAll() } };
document.querySelectorAll("nav button").forEach(b => b.onclick = () => {
    document.querySelectorAll("nav button").forEach(x => x.setAttribute("aria-selected", x === b));
    ["hoy", "sem", "aj"].forEach(id => $("#" + id).classList.toggle("hide", id !== b.dataset.t))
});
$("#th").onclick = () => { const el = document.documentElement, dark = el.dataset.theme ? el.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches; el.dataset.theme = dark ? "light" : "dark" };
load(); renderAll();
