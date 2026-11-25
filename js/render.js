// Open Door Index markup. Pure functions that turn window.ODI into HTML strings.
// Shared by the browser (js/app.js) and the build (scripts/build-data.mjs), which
// writes the same markup into index.html so every finding is readable without JavaScript.
// Never put a finding, source, or date here; they all live in data/bodies.js.
(function () {
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
// Format "2026-11-01" as "November 1, 2026" without time zones shifting the day.
const longDate = iso => { const [y,m,d] = iso.split("-").map(Number); return `${MONTHS[m-1]} ${d}, ${y}`; };
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

// Marble step and ramp drawings. Outlined in --door so the shapes keep 3:1 contrast on the wall color.
const STOOP = `<svg viewBox="0 0 100 10" preserveAspectRatio="none" focusable="false"><rect x="1" y="1" width="98" height="8" rx="1" fill="#F7F5F0" stroke="#14324A" stroke-width="2" vector-effect="non-scaling-stroke"/><line x1="1" y1="4" x2="99" y2="4" stroke="#C9D1D9" stroke-width="1" vector-effect="non-scaling-stroke"/></svg>`;
const RAMP = `<svg viewBox="0 0 100 10" preserveAspectRatio="none" focusable="false"><polygon points="1,1 99,9 1,9" fill="#F7F5F0" stroke="#14324A" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;

const SORT_LABEL = {list:"in list order", az:"from A to Z"};

function ODIRender(ODI){
  const { CHECKED_ISO, PRACTICES, LABEL, SOURCES, BODIES } = ODI;
  const CHECKED = longDate(CHECKED_ISO);
  const metCount = b => PRACTICES.filter(p => b.p[p.id].s === "met").length;
  const partCount = b => PRACTICES.filter(p => b.p[p.id].s === "partial").length;
  const statusHTML = s => `<span class="status s-${s}"><span class="dot" aria-hidden="true">${s==="met"?"✓":""}</span>${LABEL[s]}</span>`;
  // How far a door opens: a crack when nothing is documented, nearly wide open at nine of nine.
  // Only met practices open it, the same way only met practices count toward the score.
  const openness = b => 4 + metCount(b) / PRACTICES.length * 84;
  const hasRamp = b => b.p.venue.s === "met";
  // The nearest Internet Archive copy to the day the index was checked.
  const archiveURL = url => `https://web.archive.org/web/${CHECKED_ISO.replace(/-/g, "")}/${url}`;

  // One rowhouse doorway: cornice, brick, door, stoop or ramp, sidewalk. Decoration only; the text says the same.
  function house(b, cls = "house", openNow = false){
    const ramp = hasRamp(b);
    const style = openNow ? ` style="--open:${openness(b).toFixed(1)}"` : "";
    return `<span class="${cls}" aria-hidden="true"><span class="cornice"></span><span class="entry">
      <span class="frame"><span class="leaf"${style}></span></span>
      <span class="${ramp ? "ramp" : "stoop"}">${ramp ? RAMP : STOOP}</span></span>
      <span class="walk"></span></span>`;
  }

  // openNow: draw the doors already open (the prebuilt page); the browser redraws them shut and swings them open.
  function doors(openNow = false){
    return BODIES.map(b => {
      const m = metCount(b), open = openness(b);
      // Philadelphia rowhouse stoop: a marble step unless the body documents a step-free venue.
      const ramp = hasRamp(b);
      return `<li><a class="door-btn" href="#body-${b.id}" data-open="${open.toFixed(1)}">
      ${house(b, "house", openNow)}
      <span class="door-name">${esc(b.name)}</span>
      <span class="door-count">${m} of 9<span class="sr-only"> practices met${ramp ? "" : "; step-free access not described"}</span></span></a></li>`;
    }).join("");
  }

  function findings(){
    const n = BODIES.length;
    const by = id => BODIES.filter(b => b.p[id].s === "met").length;
    const asl = BODIES.filter(b => b.p.asl.s === "met").map(b => b.name);
    return [
      [by("captions"), `of ${n} bodies document live captions at their meetings.`],
      [by("asl"), `of ${n} document how to get an ASL interpreter${asl.length===1?`: ${esc(asl[0])}`:""}.`],
      [by("venue"), `of ${n} describe whether their meeting room is accessible.`],
      [by("remote"), `of ${n} let residents speak live from home, by video or phone. That's the good news.`]
    ].map(([num, txt]) => `<div class="finding"><strong>${num}</strong><p>${txt}</p></div>`).join("");
  }

  const sources = ids => ids.map(k => `<a href="${esc(SOURCES[k][1])}" rel="noopener">${esc(SOURCES[k][0])}</a>`).join("; ");

  // allOpen: the prebuilt page opens every card, so it prints and reads whole without JavaScript.
  function bodies(sort = "list", only = "", allOpen = false){
    let list = BODIES.slice();
    if (sort === "az") list.sort((a,b) => a.name.localeCompare(b.name));
    const pr = only ? PRACTICES.filter(p => p.id === only) : PRACTICES;
    return list.map(b => {
      const m = metCount(b), p = partCount(b);
      const meter = PRACTICES.map(x => `<span class="${b.p[x.id].s==='met'?'m':b.p[x.id].s==='partial'?'p':''}"></span>`).join("");
      const rows = pr.map(x => {
        const f = b.p[x.id];
        const dated = f.d && f.d !== CHECKED_ISO ? ` <span class="dated">Checked ${longDate(f.d)}.</span>` : "";
        return `<tr><th scope="row">${x.name}</th><td class="st">${statusHTML(f.s)}</td><td class="ev">${esc(f.t)}${dated}<br><span>Source: ${sources(f.src)}</span></td></tr>`;
      }).join("");
      const summary = only ? `Read the ${esc(pr[0].name.toLowerCase())} finding for ${esc(b.name)}` : `Read the nine findings for ${esc(b.name)}`;
      return `<article class="body" id="body-${b.id}" aria-labelledby="h-${b.id}">
      <div class="card-top">${house(b, "doorway", true)}
      <div class="card-head"><header><h3 id="h-${b.id}">${esc(b.name)}</h3>
      <p class="score"><span class="n">${m}</span> of 9 practices met${p?` <small>plus ${p} partial</small>`:""}</p></header>
      <div class="meter" aria-hidden="true">${meter}</div>
      <p class="about">${esc(b.about)}</p></div></div>
      ${b.note?`<p class="note">${esc(b.note)}</p>`:""}
      <details class="findings-d"${allOpen || b.id===BODIES[0].id || only ?" open":""}><summary>${summary}</summary>
      <table class="practices"><caption class="sr-only">${esc(b.name)}: access practices, status, and evidence. Checked ${CHECKED}.</caption>
      <thead><tr><th scope="col">Practice</th><th scope="col">Status</th><th scope="col">What we found</th></tr></thead><tbody>${rows}</tbody></table></details>
      <p class="checked">Checked ${CHECKED}.</p>
      <div class="card-actions"><button class="btn ghost js-only" type="button" data-print="${b.id}">Print this report card</button>
      <a class="btn ghost" href="#tip" data-tip="${b.id}">Send a correction</a></div>
    </article>`;
    }).join("");
  }

  function compare(){
    const head = `<thead><tr><th scope="col">Body</th>${PRACTICES.map(p=>`<th scope="col">${p.name}</th>`).join("")}<th scope="col">Met</th></tr></thead>`;
    const body = BODIES.map(b => `<tr><th scope="row">${esc(b.name)}</th>${PRACTICES.map(p => { const s=b.p[p.id].s; return `<td><span class="status s-${s}"><span class="dot" aria-hidden="true">${s==="met"?"✓":""}</span><span class="sr-only">${LABEL[s]}</span></span></td>`;}).join("")}<td><strong>${metCount(b)}</strong></td></tr>`).join("");
    return `<caption class="sr-only">Every body and every practice. Checked ${CHECKED}.</caption>` + head + `<tbody>${body}</tbody>`;
  }

  // Each source with a link to the nearest Internet Archive copy, so the evidence outlives a moved page.
  const sourceList = () => Object.values(SOURCES).map(([t,u]) => `<li><a href="${esc(u)}" rel="noopener">${esc(t)}</a> <span class="arch">(<a href="${esc(archiveURL(u))}" rel="noopener">archived copy<span class="sr-only"> of ${esc(t)}</span></a>)</span></li>`).join("");

  const filterOptions = () => `<option value="">All nine practices</option>` + PRACTICES.map(p => `<option value="${p.id}">${p.name}</option>`).join("");
  const tipBodyOptions = () => BODIES.map(b => `<option value="${b.id}">${esc(b.name)}</option>`).join("") + `<option value="other">A body not listed yet</option>`;
  const tipPracticeOptions = () => `<option value="">Any or several</option>` + PRACTICES.map(p => `<option value="${p.id}">${p.name}</option>`).join("");

  return { CHECKED, longDate, metCount, archiveURL, SORT_LABEL, doors, findings, bodies, compare, sourceList, filterOptions, tipBodyOptions, tipPracticeOptions };
}
window.ODIRender = ODIRender;
})();
