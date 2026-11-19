// Open Door Index page logic. All findings live in data/bodies.js (window.ODI).
// This file only renders them; never put a finding, source, or date here.
const { CHECKED_ISO, PRACTICES, LABEL, SOURCES, BODIES } = window.ODI;

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
// Format "2026-11-01" as "November 1, 2026" without time zones shifting the day.
const longDate = iso => { const [y,m,d] = iso.split("-").map(Number); return `${MONTHS[m-1]} ${d}, ${y}`; };
const CHECKED = longDate(CHECKED_ISO);

const $ = s => document.querySelector(s);
const metCount = b => PRACTICES.filter(p => b.p[p.id].s === "met").length;
const partCount = b => PRACTICES.filter(p => b.p[p.id].s === "partial").length;
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const statusHTML = s => `<span class="status s-${s}"><span class="dot" aria-hidden="true">${s==="met"?"✓":""}</span>${LABEL[s]}</span>`;

// Marble step and ramp drawings. Outlined in --door so the shapes keep 3:1 contrast on the wall color.
const STOOP = `<svg viewBox="0 0 100 10" preserveAspectRatio="none" focusable="false"><rect x="1" y="1" width="98" height="8" rx="1" fill="#F7F5F0" stroke="#14324A" stroke-width="2" vector-effect="non-scaling-stroke"/><line x1="1" y1="4" x2="99" y2="4" stroke="#C9D1D9" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;
const RAMP = `<svg viewBox="0 0 100 10" preserveAspectRatio="none" focusable="false"><polygon points="1,1 99,9 1,9" fill="#F7F5F0" stroke="#14324A" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;

function renderDoors(){
  const ul = $("#doors");
  ul.innerHTML = BODIES.map(b => {
    const m = metCount(b), p = partCount(b);
    const open = 4 + (m + p*0.5) / 9 * 84;
    // Philadelphia rowhouse stoop: a marble step unless the body documents a step-free venue.
    const ramp = b.p.venue.s === "met";
    return `<li><a class="door-btn" href="#body-${b.id}" data-open="${open.toFixed(1)}">
      <span class="frame" aria-hidden="true"><span class="leaf"></span></span>
      <span class="${ramp ? "ramp" : "stoop"}" aria-hidden="true">${ramp ? RAMP : STOOP}</span>
      <span class="door-name">${esc(b.name)}</span>
      <span class="door-count">${m} of 9<span class="sr-only"> practices met${ramp ? "" : "; step-free access not described"}</span></span></a></li>`;
  }).join("");
  requestAnimationFrame(() => {
    ul.classList.add("ready");
    requestAnimationFrame(() => ul.querySelectorAll(".door-btn").forEach(a => a.querySelector(".leaf").style.setProperty("--open", a.dataset.open)));
  });
}

function renderFindings(){
  const n = BODIES.length;
  const by = id => BODIES.filter(b => b.p[id].s === "met").length;
  const asl = BODIES.filter(b => b.p.asl.s === "met").map(b => b.name);
  $("#findings").innerHTML = [
    [by("captions"), `of ${n} bodies document live captions at their meetings.`],
    [by("asl"), `of ${n} document how to get an ASL interpreter${asl.length===1?`: ${esc(asl[0])}`:""}.`],
    [by("venue"), `of ${n} describe whether their meeting room is accessible.`],
    [by("remote"), `of ${n} let residents speak live from home, by video or phone. That's the good news.`]
  ].map(([num, txt]) => `<div class="finding"><strong>${num}</strong><p>${txt}</p></div>`).join("");
}

function sources(ids){ return ids.map(k => `<a href="${SOURCES[k][1]}" rel="noopener">${esc(SOURCES[k][0])}</a>`).join("; "); }

const SORT_LABEL = {list:"in list order", most:"by most practices met", fewest:"by fewest practices met", az:"from A to Z"};

function renderBodies(announce){
  const sort = $("#sort").value, only = $("#filter").value;
  let list = BODIES.slice();
  if (sort === "most") list.sort((a,b) => metCount(b)-metCount(a) || partCount(b)-partCount(a));
  if (sort === "fewest") list.sort((a,b) => metCount(a)-metCount(b) || partCount(a)-partCount(b));
  if (sort === "az") list.sort((a,b) => a.name.localeCompare(b.name));
  const pr = only ? PRACTICES.filter(p => p.id === only) : PRACTICES;
  $("#bodies").innerHTML = list.map(b => {
    const m = metCount(b), p = partCount(b);
    const meter = PRACTICES.map(x => `<span class="${b.p[x.id].s==='met'?'m':b.p[x.id].s==='partial'?'p':''}"></span>`).join("");
    const rows = pr.map(x => {
      const f = b.p[x.id];
      const dated = f.d && f.d !== CHECKED_ISO ? ` <span class="dated">Checked ${longDate(f.d)}.</span>` : "";
      return `<tr><th scope="row">${x.name}</th><td class="st">${statusHTML(f.s)}</td><td class="ev">${esc(f.t)}${dated}<br><span>Source: ${sources(f.src)}</span></td></tr>`;
    }).join("");
    const summary = only ? `Read the ${esc(pr[0].name.toLowerCase())} finding for ${esc(b.name)}` : `Read the nine findings for ${esc(b.name)}`;
    return `<article class="body" id="body-${b.id}" aria-labelledby="h-${b.id}">
      <header><h3 id="h-${b.id}">${esc(b.name)}</h3>
      <p class="score">${m} of 9 practices met${p?` <small>plus ${p} partial</small>`:""}</p></header>
      <div class="meter" aria-hidden="true">${meter}</div>
      <p class="about">${esc(b.about)}</p>
      ${b.note?`<p class="note">${esc(b.note)}</p>`:""}
      <details class="findings-d"${b.id===BODIES[0].id || only ?" open":""}><summary>${summary}</summary>
      <table class="practices"><caption class="sr-only">${esc(b.name)}: access practices, status, and evidence. Checked ${CHECKED}.</caption>
      <thead><tr><th scope="col">Practice</th><th scope="col">Status</th><th scope="col">What we found</th></tr></thead><tbody>${rows}</tbody></table></details>
      <p class="checked">Checked ${CHECKED}.</p>
      <div class="card-actions"><button class="btn ghost" type="button" data-print="${b.id}">Print this report card</button>
      <a class="btn ghost" href="#tip" data-tip="${b.id}">Send a correction</a></div>
    </article>`;
  }).join("");
  // Announce a short summary, not the whole re-rendered scorecard.
  if (announce){
    const what = only ? `showing only ${pr[0].name.toLowerCase()}` : "showing all nine practices";
    $("#sortMsg").textContent = `${list.length} bodies sorted ${SORT_LABEL[sort]}, ${what}.`;
  }
}

function renderCompare(){
  const head = `<thead><tr><th scope="col">Body</th>${PRACTICES.map(p=>`<th scope="col">${p.name}</th>`).join("")}<th scope="col">Met</th></tr></thead>`;
  const body = BODIES.map(b => `<tr><th scope="row">${esc(b.name)}</th>${PRACTICES.map(p => { const s=b.p[p.id].s; return `<td><span class="status s-${s}"><span class="dot" aria-hidden="true">${s==="met"?"✓":""}</span><span class="sr-only">${LABEL[s]}</span></span></td>`;}).join("")}<td><strong>${metCount(b)}</strong></td></tr>`).join("");
  $("#compareTable").innerHTML = `<caption class="sr-only">Every body and every practice. Checked ${CHECKED}.</caption>` + head + `<tbody>${body}</tbody>`;
}

function renderSources(){ $("#sourceList").innerHTML = Object.values(SOURCES).map(([t,u]) => `<li><a href="${u}" rel="noopener">${esc(t)}</a></li>`).join(""); }

function setupForms(){
  $("#filter").innerHTML += PRACTICES.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  $("#tipBody").innerHTML = BODIES.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join("") + `<option value="other">A body not listed yet</option>`;
  $("#tipPractice").innerHTML = `<option value="">Any or several</option>` + PRACTICES.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  $("#sort").addEventListener("change", () => renderBodies(true));
  $("#filter").addEventListener("change", () => renderBodies(true));
  document.addEventListener("click", e => {
    const pb = e.target.closest("[data-print]");
    if (pb){ const card = document.getElementById("body-"+pb.dataset.print); card.querySelector("details").open = true; document.body.classList.add("print-one"); card.classList.add("printing"); window.print(); }
    const tb = e.target.closest("[data-tip]");
    if (tb){ $("#tipBody").value = tb.dataset.tip; setTimeout(()=>$("#tipText").focus(),300); }
  });
  window.addEventListener("afterprint", () => { document.body.classList.remove("print-one","print-checklist"); document.querySelectorAll(".printing").forEach(c => c.classList.remove("printing")); });
  $("#printChecklist").addEventListener("click", () => { document.body.classList.add("print-checklist"); window.print(); });
  $("#copyStandard").addEventListener("click", async () => {
    const text = [...document.querySelectorAll("#standardText p")].map(p => p.textContent).join("\n\n");
    try { await navigator.clipboard.writeText(text); $("#copyMsg").textContent = "Copied. Paste it into your agenda template."; }
    catch { $("#copyMsg").textContent = "Copy didn't work in this browser. Select the paragraph and copy it by hand."; }
  });
  $("#tipForm").addEventListener("submit", e => {
    e.preventDefault();
    const txt = $("#tipText").value.trim();
    if (!txt){ $("#tipMsg").textContent = "Describe what you saw first, then write the email."; $("#tipText").focus(); return; }
    const body = $("#tipBody").selectedOptions[0].text, pr = $("#tipPractice").selectedOptions[0].text;
    const subject = encodeURIComponent(`Open Door Index tip: ${body}`);
    const mail = encodeURIComponent(`Body: ${body}\nPractice: ${pr}\n\n${txt}\n`);
    $("#tipMsg").textContent = "Opening your email app.";
    location.href = `mailto:meyeringn@gmail.com?subject=${subject}&body=${mail}`;
  });
}

function openFromHash(){ const m = location.hash.match(/^#body-([\w-]+)$/); if (m){ const d = document.querySelector(`#body-${m[1]} details`); if (d) d.open = true; } }
window.addEventListener("hashchange", openFromHash);
window.addEventListener("beforeprint", () => { if (!document.body.classList.contains("print-one")) document.querySelectorAll(".findings-d").forEach(d => d.open = true); });
renderDoors(); renderFindings(); setupForms(); renderBodies(false); renderCompare(); renderSources(); openFromHash();
