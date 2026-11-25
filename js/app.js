// Open Door Index page logic. All findings live in data/bodies.js (window.ODI).
// Markup comes from js/render.js; this file wires up the controls. Never put a finding, source, or date here.
const R = window.ODIRender(window.ODI);
const $ = s => document.querySelector(s);

// The build already wrote every finding into index.html, so the page reads without JavaScript.
// Here the doors are redrawn shut so they can swing open, and sorting and filtering redraw the cards.
function renderDoors(){
  const ul = $("#doors");
  ul.innerHTML = R.doors(false);
  requestAnimationFrame(() => {
    ul.classList.add("ready");
    requestAnimationFrame(() => ul.querySelectorAll(".door-btn").forEach(a => a.querySelector(".leaf").style.setProperty("--open", a.dataset.open)));
  });
}

function renderBodies(announce){
  const sort = $("#sort").value, only = $("#filter").value;
  $("#bodies").innerHTML = R.bodies(sort, only);
  // Announce a short summary, not the whole re-rendered scorecard.
  if (announce){
    const what = only ? `showing only ${window.ODI.PRACTICES.find(p => p.id === only).name.toLowerCase()}` : "showing all nine practices";
    $("#sortMsg").textContent = `${window.ODI.BODIES.length} bodies sorted ${R.SORT_LABEL[sort]}, ${what}.`;
  }
}

function setupForms(){
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

// Open a body's findings when its door (or a shared link like #body-council) is followed.
function openFromHash(scroll){
  const m = location.hash.match(/^#body-([\w-]+)$/);
  if (!m) return;
  const card = document.getElementById(`body-${m[1]}`);
  if (!card) return;
  card.querySelector("details").open = true;
  // On first load the card didn't exist yet when the browser tried to jump to it, so jump now.
  if (scroll) card.scrollIntoView();
}
window.addEventListener("hashchange", () => openFromHash(false));
window.addEventListener("beforeprint", () => { if (!document.body.classList.contains("print-one")) document.querySelectorAll(".findings-d").forEach(d => d.open = true); });
// With JavaScript, show the first card's findings and fold the rest, as before.
// If the browser restored an earlier sort or filter (Back button), redraw so the list matches the controls.
function syncList(){
  if ($("#sort").value !== "list" || $("#filter").value) renderBodies(false);
  else document.querySelectorAll(".findings-d").forEach((d, i) => { d.open = i === 0; });
}
window.addEventListener("pageshow", e => { if (e.persisted) syncList(); });
renderDoors(); setupForms(); syncList(); openFromHash(true);
