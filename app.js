const STORE = {
  get stars(){ return +localStorage.getItem("ps_stars") || 0; },
  set stars(n){ localStorage.setItem("ps_stars", n); renderStars(); },
  practiced(){ return JSON.parse(localStorage.getItem("ps_practiced") || "[]"); },
  mark(id){
    const s = new Set(this.practiced());
    const was = s.has(id);
    s.add(id);
    localStorage.setItem("ps_practiced", JSON.stringify([...s]));
    if (!was) this.stars = this.stars + 1;
    updateHome();
  }
};

function toast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg; t.style.display = "block";
  clearTimeout(t._x);
  t._x = setTimeout(() => t.style.display = "none", 1600);
}
function renderStars(){ document.getElementById("starCount").textContent = STORE.stars; }
function updateHome(){
  const n = STORE.practiced().length;
  document.getElementById("pracLabel").textContent = n + " / 22";
  document.getElementById("pracBar").style.width = (n/22*100) + "%";
  renderStars();
}
function go(name){
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("on"));
  document.getElementById(name).classList.add("on");
  document.querySelectorAll("nav.tab button").forEach(b => {
    b.classList.toggle("on", b.dataset.tab === name || (name==="detail" && b.dataset.tab==="learn") || (name==="game" && b.dataset.tab==="play"));
  });
  if (name === "learn") drawList();
  if (name === "stars") drawBadges();
  window.scrollTo(0,0);
  document.querySelector("main").scrollTop = 0;
}

function drawList(){
  const q = (document.getElementById("qsearch").value || "").toLowerCase();
  const done = new Set(STORE.practiced());
  document.getElementById("plist").innerHTML = PRAYERS.filter(p =>
    !q || p.name.toLowerCase().includes(q) || p.kid.toLowerCase().includes(q) || p.when.toLowerCase().includes(q)
  ).map(p => `
    <button class="prow" onclick="openPrayer(${p.id})">
      <div class="num">${String(p.id).padStart(2,"0")}</div>
      <div style="flex:1">
        <b>${p.name}</b>
        <small>${p.when}</small>
      </div>
      <div class="dot">${done.has(p.id) ? "\u2b50" : "\u25cb"}</div>
    </button>
  `).join("");
}
function filterLearn(){ drawList(); }
function openPrayer(id){
  const p = PRAYERS.find(x => x.id === id);
  document.getElementById("detailCard").innerHTML = `
    <span class="tag">${p.kind || "Prayer"} \u00b7 ${p.id} of 22</span>
    <h2 class="baloo" style="margin:8px 0 4px;font-size:26px">${p.name}</h2>
    <div style="color:#8A5A3B;font-weight:800;font-size:13px">\u23f0 ${p.when}</div>
    <div style="margin-top:10px;font-weight:800;color:var(--deep)">SAY IT</div>
    <div class="say">${p.say}</div>
    <div style="font-weight:800;color:var(--deep)">IN KID WORDS</div>
    <p class="mean">${p.mean}</p>
    <div class="do">\ud83c\udf1f TRY THIS<br>${p.do}</div>
    <p style="margin:12px 0 0;font-size:11px;color:#8A5A3B;font-weight:700;line-height:1.4">Prayer lines are traditional. Kid words on this card were written for learning, not copied from a printed book.</p>
    <button class="btn gold" onclick="saidIt(${p.id})">I said it! +\u2b50</button>
    <div class="rowbtns">
      <button class="btn ghost" onclick="openPrayer(${p.id===1?22:p.id-1})">\u25c0 Prev</button>
      <button class="btn ghost" onclick="openPrayer(${p.id===22?1:p.id+1})">Next \u25b6</button>
    </div>
  `;
  go("detail");
}
function saidIt(id){
  STORE.mark(id);
  toast("Nice. Star saved! \u2b50");
}

let G = null;
function shuffle(a){ return a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(x=>x[1]); }
function pick(n){ return shuffle(PRAYERS.slice()).slice(0,n); }

function startQuick(){ startGame("when", 5); }
function startGame(type, n){
  if (type === "match") {
    G = { type, score:0, total:4, left: pick(4) };
    renderMatch();
  } else {
    const count = n || 6;
    G = { type, i:0, score:0, qs: buildQs(type, count) };
    renderQ();
  }
  go("game");
}
function buildQs(type, count){
  if (type === "when") {
    return pick(count).map(p => {
      const wrong = shuffle(PRAYERS.filter(x => x.id !== p.id)).slice(0,3).map(x => x.when);
      return { title:"When do we say it?", q:`Which time fits \u201c${p.name}\u201d?`, ans:p.when, opts: shuffle([p.when, ...wrong]) };
    });
  }
  if (type === "blank") {
    const bank = [
      { q:"Saathe ramiye, saathe ______", ans:"jamiye", opts:["jamiye","nachie","soie"] },
      { q:"Tvameva mata cha ______ tvameva", ans:"pita", opts:["pita","nadi","ghar"] },
      { q:"Guru Brahma guru ______", ans:"Vishnu", opts:["Vishnu","Yamuna","Tulsi"] },
      { q:"Ram rakhe tem ______", ans:"rahiye", opts:["rahiye","khaie","bhagiye"] },
      { q:"Ekaj de ______", ans:"chingari", opts:["chingari","laddu","kapda"] },
      { q:"Raghupati Raghav Raja ______", ans:"Ram", opts:["Ram","Surya","Ganga"] },
      { q:"Nandlala, Nandlala, Nandlala ______", ans:"Gopala", opts:["Gopala","Hanuman","Shiva"] },
      { q:"Mangal mandir ______", ans:"kholo", opts:["kholo","bandho","bhulo"] },
      { q:"Asato ma sad ______", ans:"gamaya", opts:["gamaya","nachaya","hasaya"] },
      { q:"Om bhur bhuvah ______", ans:"swaha", opts:["swaha","namah","shanti"] }
    ];
    return shuffle(bank).slice(0,count).map(x => ({ title:"Missing word", q:x.q, ans:x.ans, opts:shuffle(x.opts) }));
  }
  const bank = [
    { q:"Saathe Ramiye is said before eating.", ans:true },
    { q:"Vandan Karoo is a morning sports cheer.", ans:false },
    { q:"Gayatri Mantra asks God to wake up our mind.", ans:true },
    { q:"Navkar Mantra has five holy bows.", ans:true },
    { q:"Mara Prabhu To Nana is about baby Krishna.", ans:true },
    { q:"Guru Brahma is a prayer for teachers.", ans:true },
    { q:"Mandir Taaru says the world is God\u2019s temple.", ans:true },
    { q:"Raghupati Raghav is only for Diwali night.", ans:false },
    { q:"Choti Choti Gaiya is about little cows and little Krishna.", ans:true },
    { q:"He Karuna means God\u2019s kindness has no end.", ans:true },
    { q:"Tvameva Mata says God is mother and father.", ans:true },
    { q:"Asato Ma asks to go from light into darkness.", ans:false }
  ];
  return shuffle(bank).slice(0,count).map(x => ({
    title:"True or False", q:x.q, ans: x.ans ? "True" : "False", opts:["True","False"]
  }));
}
function renderQ(){
  const {i, qs, score} = G;
  if (i >= qs.length) return renderDone();
  const q = qs[i];
  document.getElementById("gameCard").innerHTML = `
    <div class="scoreline"><span>${q.title}</span><span>${i+1} / ${qs.length} \u00b7 \u2b50 ${score}</span></div>
    <div class="bigq baloo">${q.q}</div>
    ${q.opts.map(o => `<button class="choice" onclick="answer(this,'${esc(o)}','${esc(q.ans)}')">${o}</button>`).join("")}
  `;
}
function esc(s){ return String(s).replace(/'/g,"\\'"); }
function answer(btn, pick, ans){
  const ok = pick === ans;
  document.querySelectorAll(".choice").forEach(b => {
    b.classList.add("off");
    if (b.textContent === ans) b.classList.add("good");
  });
  if (!ok) btn.classList.add("bad");
  if (ok) { G.score++; STORE.stars = STORE.stars + 1; toast("Yes! \u2b50"); }
  else toast("Almost \u2014 look at the green one");
  setTimeout(() => { G.i++; renderQ(); }, 850);
}
function renderMatch(){
  const names = shuffle(G.left.map(p => ({t:"name", id:p.id, label:p.name})));
  const means = shuffle(G.left.map(p => ({t:"kid", id:p.id, label:p.kid})));
  G.sel = null;
  document.getElementById("gameCard").innerHTML = `
    <div class="scoreline"><span>Match up</span><span>\u2b50 ${G.score}</span></div>
    <div class="bigq baloo" style="font-size:20px">Tap a name, then its meaning.</div>
    <div class="match-grid" id="mgrid">
      ${names.map((x)=>`<button class="mbtn" data-k="n${x.id}" onclick="tapMatch(this,${x.id},'n')">${x.label}</button>`).join("")}
      ${means.map((x)=>`<button class="mbtn" data-k="k${x.id}" onclick="tapMatch(this,${x.id},'k')">${x.label}</button>`).join("")}
    </div>
  `;
}
function tapMatch(btn, id, side){
  if (btn.classList.contains("gone")) return;
  if (!G.sel) {
    document.querySelectorAll(".mbtn.sel").forEach(b => b.classList.remove("sel"));
    btn.classList.add("sel");
    G.sel = {id, side, btn};
    return;
  }
  if (G.sel.side === side) {
    G.sel.btn.classList.remove("sel");
    btn.classList.add("sel");
    G.sel = {id, side, btn};
    return;
  }
  if (G.sel.id === id) {
    G.sel.btn.classList.add("gone");
    btn.classList.add("gone");
    G.score++; STORE.stars = STORE.stars + 1;
    G.sel = null;
    toast("Match! \u2b50");
    const left = [...document.querySelectorAll(".mbtn")].filter(b => !b.classList.contains("gone"));
    if (!left.length) setTimeout(renderDone, 400);
  } else {
    toast("Not that pair");
    G.sel.btn.classList.remove("sel");
    G.sel = null;
  }
}
function renderDone(){
  const score = G.score;
  const total = G.total || (G.qs ? G.qs.length : score);
  document.getElementById("gameCard").innerHTML = `
    <h2 class="baloo" style="font-size:28px;margin:0 0 6px">Game over!</h2>
    <p style="font-weight:800">You got <b>${score}</b> right. Stars are saved on this phone.</p>
    <div class="do">${score >= (total-1) ? "Superstar energy. Teach someone one line tonight." : "Nice try. Open Learn, pick one prayer, then play again."}</div>
    <button class="btn gold" onclick="go('play')">Play another</button>
    <button class="btn ghost" onclick="go('learn')">Practice a prayer</button>
  `;
}
function drawBadges(){
  const stars = STORE.stars;
  const n = STORE.practiced().length;
  const list = [
    { e:"\ud83c\udf31", t:"First spark", on: stars>=1 || n>=1 },
    { e:"\ud83c\udf5a", t:"Food-grace friend", on: STORE.practiced().includes(3) },
    { e:"\ud83c\udf19", t:"Bedtime bow", on: STORE.practiced().includes(6) },
    { e:"\ud83d\udcda", t:"Five prayers", on: n>=5 },
    { e:"\ud83d\udd25", t:"Ten stars", on: stars>=10 },
    { e:"\ud83d\udc51", t:"Prayer Superstar", on: n>=12 || stars>=20 }
  ];
  document.getElementById("badges").innerHTML = list.map(b => `
    <div class="badge ${b.on?"":"lock"}"><div class="e">${b.e}</div><b>${b.t}</b><div style="font-size:12px;color:#8A5A3B;font-weight:800">${b.on?"Unlocked":"Locked"}</div></div>
  `).join("");
}
function resetProgress(){
  if (!confirm("Clear stars and practiced prayers on this phone?")) return;
  localStorage.removeItem("ps_stars");
  localStorage.removeItem("ps_practiced");
  updateHome(); drawBadges(); toast("Fresh start");
}
updateHome();
drawList();
