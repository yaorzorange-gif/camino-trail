import { useState, useEffect, useRef } from "react";

const FONT = "'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif";
const C = {
  bg:"#0a0906", paper:"#131008", parchment:"#1a1510",
  gold:"#c4a265", goldLight:"#e8ca8a", goldDim:"#6a5030", goldFaint:"#3a2e18",
  ink:"#f0e8d0", inkDim:"#8a7a5a", inkFaint:"#4a3e28",
  border:"#2e2416", routeLine:"#c4a265", routeGlow:"rgba(196,162,101,0.2)",
  orange:"#e07830", orangeDim:"rgba(224,120,48,0.3)",
};

// ─── Species ──────────────────────────────────────────────────────────────────
const SPECIES = {
  trees:   { label:"Trees",   emoji:"🌿", options:[
    {id:"oak",      name:"Oak",        zh:"橡树",   sym:"🌳", desc:"Rooted, ancient, enduring"},
    {id:"olive",    name:"Olive",      zh:"橄榄树", sym:"🫒", desc:"Peace, patience, sacred"},
    {id:"birch",    name:"Birch",      zh:"白桦树", sym:"🌲", desc:"New beginnings, light"},
    {id:"willow",   name:"Willow",     zh:"柳树",   sym:"🌿", desc:"Flowing, resilient, dreaming"},
    {id:"fig",      name:"Fig",        zh:"无花果", sym:"🍃", desc:"Nourishment, shelter, wisdom"},
    {id:"cedar",    name:"Cedar",      zh:"雪松",   sym:"🎋", desc:"Strength, dignity, incense"},
  ]},
  insects: { label:"Insects", emoji:"🦋", options:[
    {id:"butterfly",name:"Butterfly",  zh:"蝴蝶",   sym:"🦋", desc:"Transformation, lightness"},
    {id:"beetle",   name:"Beetle",     zh:"甲虫",   sym:"🪲", desc:"Resilience, ancient traveler"},
    {id:"firefly",  name:"Firefly",    zh:"萤火虫", sym:"✨", desc:"Brief light, wonder"},
    {id:"bee",      name:"Bee",        zh:"蜜蜂",   sym:"🐝", desc:"Community, purpose, sweetness"},
    {id:"moth",     name:"Moth",       zh:"飞蛾",   sym:"🌙", desc:"Drawn to light, nocturnal"},
    {id:"dragonfly",name:"Dragonfly",  zh:"蜻蜓",   sym:"🪁", desc:"Speed, agility, change"},
  ]},
  animals: { label:"Animals", emoji:"🐾", options:[
    {id:"fox",      name:"Fox",        zh:"狐狸",   sym:"🦊", desc:"Clever, curious, solitary"},
    {id:"deer",     name:"Deer",       zh:"鹿",     sym:"🦌", desc:"Gentle, alert, graceful"},
    {id:"crow",     name:"Crow",       zh:"乌鸦",   sym:"🐦‍⬛", desc:"Intelligent, memory keeper"},
    {id:"wolf",     name:"Wolf",       zh:"狼",     sym:"🐺", desc:"Pack spirit, instinct"},
    {id:"turtle",   name:"Turtle",     zh:"乌龟",   sym:"🐢", desc:"Slow pilgrim, patience"},
    {id:"heron",    name:"Heron",      zh:"苍鹭",   sym:"🦢", desc:"Stillness, solitude, watchful"},
  ]},
  objects: { label:"Objects", emoji:"🪨", options:[
    {id:"stone",    name:"River Stone",zh:"卵石",   sym:"🪨", desc:"Worn smooth, carried far"},
    {id:"shell",    name:"Shell",      zh:"贝壳",   sym:"🐚", desc:"The Camino's symbol, calling"},
    {id:"candle",   name:"Candle",     zh:"蜡烛",   sym:"🕯️", desc:"Light in darkness, offering"},
    {id:"compass",  name:"Compass",    zh:"指南针", sym:"🧭", desc:"Direction, orientation"},
    {id:"feather",  name:"Feather",    zh:"羽毛",   sym:"🪶", desc:"Lightness, letting go"},
    {id:"key",      name:"Old Key",    zh:"旧钥匙", sym:"🗝️", desc:"Opening what was locked"},
  ]},
};
const ALL_SP = Object.values(SPECIES).flatMap(c => c.options);
const getSp = id => ALL_SP.find(s => s.id === id) || {sym:"🌿",name:"?",zh:"",desc:""};

// ─── Camino route: towns in order with real geo mapped to SVG ─────────────────
// Canvas: 900 wide × 380 tall. Route flows left (SJPP) → right (Santiago)
// Actual geo: SJPP lon≈1.24 lat≈43.16  Santiago lon≈-8.55 lat≈42.88
// We map lon -8.55..1.32 → x 60..840, lat 42.2..43.3 → y 320..60 (inverted)
const LX0=-8.55, LX1=1.32, LY0=42.2, LY1=43.3;
const W=900, H=380, PX=60, PY=55;
function geo(lon,lat){
  return {
    x: PX + (lon-LX0)/(LX1-LX0)*(W-PX*2),
    y: PY + (1-(lat-LY0)/(LY1-LY0))*(H-PY*2),
  };
}

const TOWNS = [
  {id:"SJPP",    name:"Saint-Jean-Pied-de-Port", short:"SJPP",       day:0,  km:0,   ...geo(1.24, 43.16)},
  {id:"RONC",    name:"Roncesvalles",             short:"Ronces.",    day:1,  km:25,  ...geo(-1.32,43.01)},
  {id:"PAMP",    name:"Pamplona",                 short:"Pamplona",   day:3,  km:76,  ...geo(-1.64,42.82)},
  {id:"EST",     name:"Estella",                  short:"Estella",    day:5,  km:113, ...geo(-2.03,42.67)},
  {id:"LOG",     name:"Logroño",                  short:"Logroño",    day:7,  km:149, ...geo(-2.45,42.47)},
  {id:"NAJ",     name:"Nájera",                   short:"Nájera",     day:8,  km:161, ...geo(-2.73,42.42)},
  {id:"STO",     name:"Santo Domingo",            short:"S. Domingo", day:9,  km:176, ...geo(-2.95,42.44)},
  {id:"BEL",     name:"Belorado",                 short:"Belorado",   day:10, km:196, ...geo(-3.19,42.42)},
  {id:"BUR",     name:"Burgos",                   short:"Burgos",     day:12, km:243, ...geo(-3.70,42.34)},
  {id:"SAH",     name:"Sahagún",                  short:"Sahagún",    day:17, km:369, ...geo(-5.03,42.37)},
  {id:"LEO",     name:"León",                     short:"León",       day:19, km:416, ...geo(-5.57,42.60)},
  {id:"AST",     name:"Astorga",                  short:"Astorga",    day:21, km:463, ...geo(-6.05,42.46)},
  {id:"PON",     name:"Ponferrada",               short:"Ponferrada", day:23, km:509, ...geo(-6.59,42.55)},
  {id:"OCE",     name:"O Cebreiro",               short:"O Cebreiro", day:26, km:556, ...geo(-7.04,42.71)},
  {id:"SAR",     name:"Sarria",                   short:"Sarria",     day:28, km:600, ...geo(-7.41,42.78)},
  {id:"POR",     name:"Portomarin",               short:"Portomarín", day:29, km:619, ...geo(-7.62,42.81)},
  {id:"SCO",     name:"Santiago de Compostela",   short:"Santiago",   day:35, km:790, ...geo(-8.55,42.88)},
];
const TOWN_BY_ID   = Object.fromEntries(TOWNS.map(t=>[t.id,t]));
const TOWN_BY_NAME = Object.fromEntries(TOWNS.map(t=>[t.name,t]));

// Smooth cubic bezier path through all towns
function makePath(towns) {
  if (towns.length < 2) return "";
  let d = `M${towns[0].x},${towns[0].y}`;
  for (let i=0; i<towns.length-1; i++) {
    const p0 = towns[Math.max(0,i-1)];
    const p1 = towns[i];
    const p2 = towns[i+1];
    const p3 = towns[Math.min(towns.length-1,i+2)];
    const cp1x = p1.x + (p2.x-p0.x)/6;
    const cp1y = p1.y + (p2.y-p0.y)/6;
    const cp2x = p2.x - (p3.x-p1.x)/6;
    const cp2y = p2.y - (p3.y-p1.y)/6;
    d += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}
const ROUTE_PATH = makePath(TOWNS);

// Get perpendicular offset position for pilgrim nodes hanging off the line
// Alternates above/below so nodes at same town don't overlap
function getPilgrimPos(pilgrim, allPilgrims) {
  const town = TOWN_BY_NAME[pilgrim.meetTown] || TOWN_BY_ID[pilgrim.meetTown];
  if (!town) return {x:W/2, y:H/2};
  const atSameTown = allPilgrims.filter(p=>
    (TOWN_BY_NAME[p.meetTown]||TOWN_BY_ID[p.meetTown])?.id === town.id
  );
  const idx = atSameTown.findIndex(p=>p.id===pilgrim.id);
  const total = atSameTown.length;
  // Alternate above/below the line, spreading outward
  const side = idx % 2 === 0 ? -1 : 1; // -1 = above, 1 = below
  const tier = Math.floor(idx / 2);
  const dist = 38 + tier * 28;
  // Use local tangent to compute perpendicular
  const i = TOWNS.findIndex(t=>t.id===town.id);
  const prev = TOWNS[Math.max(0,i-1)];
  const next = TOWNS[Math.min(TOWNS.length-1,i+1)];
  const dx = next.x - prev.x;
  const dy = next.y - prev.y;
  const len = Math.sqrt(dx*dx+dy*dy)||1;
  const nx = -dy/len; // perpendicular
  const ny =  dx/len;
  return {
    x: town.x + nx*dist*side,
    y: town.y + ny*dist*side,
    townX: town.x,
    townY: town.y,
  };
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function makeAvatar(name, hue) {
  const i = (name||"?").slice(0,2).toUpperCase();
  const s = `<svg xmlns='http://www.w3.org/2000/svg' width='60' height='60'><circle cx='30' cy='30' r='30' fill='hsl(${hue},30%,20%)'/><circle cx='30' cy='30' r='29' fill='none' stroke='hsl(${hue},45%,38%)' stroke-width='1.2'/><text x='30' y='37' text-anchor='middle' font-size='19' font-family='Georgia,serif' fill='hsl(${hue},55%,72%)'>${i}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(s)))}`;
}

// ─── Seed data ────────────────────────────────────────────────────────────────
const SEED_PILGRIMS = [];

const SEED_PEER_EDGES = [];

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function CaminoTrail() {
  const [pilgrims, setPilgrims]   = useState(SEED_PILGRIMS);
  const [peerEdges, setPeerEdges] = useState(SEED_PEER_EDGES);
  const [view, setView]           = useState("trail"); // trail | checkin
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [hoveredTown, setHoveredTown] = useState(null);
  const [newId, setNewId]         = useState(null);
  const [form, setForm]           = useState({name:"",species:null,word:"",meetTown:"",connType:"orange",connectTo:[],contactType:"",contact:"",photo:null});
  const [step, setStep]           = useState(1);
  const svgRef                    = useRef(null);
  const containerRef              = useRef(null);
  const [scale, setScale]         = useState(1);

  // Load from API
  useEffect(()=>{
    fetch("/api/pilgrims")
      .then(r=>r.json())
      .then(data=>{
        if(data.pilgrims?.length) setPilgrims(data.pilgrims);
        if(data.edges?.length)    setPeerEdges(data.edges);
      })
      .catch(()=>{}) // fallback to seed data on error
      .finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    const upd = ()=>{
      if(containerRef.current){
        setScale(Math.min(1, containerRef.current.offsetWidth / W));
      }
    };
    upd();
    window.addEventListener("resize",upd);
    return ()=>window.removeEventListener("resize",upd);
  },[]);

  const allPilgrims = pilgrims;

  const handleCheckin = async () => {
    const id = Date.now().toString();
    const town = TOWN_BY_NAME[form.meetTown];
    const newP = {
      id, name:form.name, species:form.species,
      meetTown:form.meetTown, day: town?.day ?? 0,
      word:form.word, contactType:form.contactType,
      contact:form.contact, photo:form.photo||null,
      date: new Date().toLocaleDateString("en-GB",{day:"numeric",month:"short"}),
    };
    const newEdges = form.connectTo.map(tid=>({id:`e_${id}_${tid}`,source:id,target:tid}));

    // Optimistic update
    setPilgrims(p=>[...p, newP]);
    setPeerEdges(e=>[...e, ...newEdges]);

    // Persist to API
    try {
      await fetch("/api/checkin", {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ pilgrim:newP, newEdges }),
      });
    } catch(e) { console.warn("API save failed, data kept locally"); }

    setForm({name:"",species:null,word:"",meetTown:"",connType:"orange",connectTo:[],contactType:"",contact:"",photo:null});
    setStep(1); setView("trail");
    setNewId(id);
    setTimeout(()=>setNewId(null), 3000);
  };

  // Peer connections for selected node
  const getPeerIds = (nodeId) => {
    const ids = new Set();
    peerEdges.forEach(e=>{
      if(e.source===nodeId) ids.add(e.target);
      if(e.target===nodeId) ids.add(e.source);
    });
    return ids;
  };

  const selPeerIds = selected ? getPeerIds(selected.id) : new Set();

  // Compute positions for all pilgrims
  const pilgrimsWithPos = allPilgrims.map(p=>({
    ...p,
    pos: getPilgrimPos(p, allPilgrims),
  }));
  const getPosById = id => pilgrimsWithPos.find(p=>p.id===id)?.pos;

  return (
    <div style={{background:C.bg, minHeight:"100vh", fontFamily:FONT, color:C.ink, overflowX:"hidden"}}>

      {view==="trail" && (
        <TrailView
          pilgrims={pilgrimsWithPos} peerEdges={peerEdges}
          selected={selected} setSelected={setSelected}
          selPeerIds={selPeerIds} getPosById={getPosById}
          hoveredTown={hoveredTown} setHoveredTown={setHoveredTown}
          newId={newId} setView={setView}
          containerRef={containerRef} scale={scale}
        />
      )}

      {view==="checkin" && (
        <CheckinView
          form={form} setForm={setForm} step={step} setStep={setStep}
          pilgrims={pilgrims}
          handleCheckin={handleCheckin}
          onBack={()=>{setView("trail");setStep(1);}}
        />
      )}

      {selected && view==="trail" && (
        <NodePanel
          node={selected} peerIds={selPeerIds} pilgrims={pilgrimsWithPos}
          onClose={()=>setSelected(null)}
          onFocus={n=>setSelected(n)}
        />
      )}
    </div>
  );
}

// ─── Trail View ───────────────────────────────────────────────────────────────
function TrailView({ pilgrims, peerEdges, selected, setSelected, selPeerIds, getPosById, hoveredTown, setHoveredTown, newId, setView, containerRef, scale }) {

  const totalDays   = 35;
  const majorTowns  = ["Saint-Jean-Pied-de-Port","Pamplona","Burgos","León","Santiago de Compostela"];

  return (
    <div>
      {/* Header */}
      <div style={{textAlign:"center", padding:"28px 20px 10px"}}>
        <div style={{fontSize:9, letterSpacing:"0.5em", color:C.goldDim, textTransform:"uppercase", marginBottom:6}}>
          Camino Francés · Jun 5 → Jul 9 · 790 km
        </div>
        <h1 style={{margin:0, fontSize:"clamp(22px,4vw,40px)", color:C.goldLight, fontWeight:700, letterSpacing:"0.05em"}}>
          旷野众生
        </h1>
        <div style={{fontSize:12, color:C.inkDim, fontStyle:"italic", marginTop:4}}>
          Orange's trail · {pilgrims.length} souls encountered
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:10}}>
          <div style={{width:48,height:"1px",background:`linear-gradient(to right,transparent,${C.gold})`}}/>
          <span style={{color:C.gold,fontSize:13}}>🐚</span>
          <div style={{width:48,height:"1px",background:`linear-gradient(to left,transparent,${C.gold})`}}/>
        </div>
        {selected && (
          <div style={{marginTop:8,fontSize:11,color:C.inkDim}}>
            <span style={{color:C.gold,cursor:"pointer"}} onClick={()=>setSelected(null)}>✕ deselect</span>
          </div>
        )}
      </div>

      {/* SVG Map */}
      <div ref={containerRef} style={{width:"100%", overflowX:"auto"}}>
        <div style={{width:W*scale, height:H*scale, margin:"0 auto", position:"relative"}}>
          <svg width={W} height={H}
            style={{display:"block", transform:`scale(${scale})`, transformOrigin:"top left"}}
          >
            <defs>
              <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="softglow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              <filter id="tinyglow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="1.5" result="b"/>
                <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
              {/* Clip paths for each pilgrim avatar */}
              {pilgrims.map(p=>(
                <clipPath key={`clip_${p.id}`} id={`clip_${p.id}`}>
                  <circle cx={p.pos.x} cy={p.pos.y} r={14}/>
                </clipPath>
              ))}
              <clipPath id="clip_orange_trail">
                <circle cx={TOWNS[0].x} cy={TOWNS[0].y} r={20}/>
              </clipPath>
              {/* Gradient for route line */}
              <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={C.gold} stopOpacity="0.9"/>
                <stop offset="50%"  stopColor={C.goldLight} stopOpacity="1"/>
                <stop offset="100%" stopColor={C.gold} stopOpacity="0.7"/>
              </linearGradient>
            </defs>

            {/* Dark parchment bg */}
            <rect width={W} height={H} fill={C.bg}/>

            {/* Subtle latitude lines */}
            {[0.2,0.4,0.6,0.8].map((t,i)=>(
              <line key={i} x1={PX} y1={PY+(1-t)*(H-PY*2)} x2={W-PX} y2={PY+(1-t)*(H-PY*2)}
                stroke={C.goldFaint} strokeWidth="0.4" strokeDasharray="2,10" opacity="0.4"/>
            ))}

            {/* Pyrenees sketch near SJPP */}
            {(()=>{
              const s = TOWNS[0];
              return <g opacity="0.3">
                <path d={`M${s.x+20},${s.y+10} L${s.x+32},${s.y-10} L${s.x+44},${s.y+5} L${s.x+56},${s.y-14} L${s.x+68},${s.y+8}`}
                  fill="none" stroke={C.goldDim} strokeWidth="1"/>
                <path d={`M${s.x+32},${s.y-10} L${s.x+42},${s.y-22} L${s.x+52},${s.y-8}`}
                  fill={C.bg} stroke={C.goldDim} strokeWidth="0.8"/>
              </g>;
            })()}

            {/* Route glow */}
            <path d={ROUTE_PATH} fill="none"
              stroke={C.routeGlow} strokeWidth="18"
              strokeLinecap="round" strokeLinejoin="round"/>

            {/* Route line */}
            <path d={ROUTE_PATH} fill="none"
              stroke="url(#routeGrad)" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              opacity="0.9"/>

            {/* Day markers along route */}
            {TOWNS.filter(t=>t.id!=="SJPP"&&t.id!=="SCO").map(t=>(
              <circle key={`dot_${t.id}`} cx={t.x} cy={t.y} r="2.5"
                fill={C.gold} opacity="0.5"/>
            ))}

            {/* Town labels */}
            {TOWNS.map(t=>{
              const isMajor = majorTowns.includes(t.name);
              const isStart = t.id==="SJPP";
              const isEnd   = t.id==="SCO";
              const labelY  = t.y > H/2 ? t.y+16 : t.y-10;
              return (
                <g key={`lbl_${t.id}`}>
                  {isMajor && (
                    <text x={t.x} y={labelY}
                      textAnchor="middle" fontSize={isStart||isEnd?9:8}
                      fill={isStart||isEnd?C.goldLight:C.inkDim}
                      fontFamily={FONT} fontStyle={isStart||isEnd?"normal":"italic"}
                      opacity={isStart||isEnd?1:0.7}
                    >{t.short}</text>
                  )}
                  {/* Day badge for major towns */}
                  {isMajor && t.id!=="SJPP" && (
                    <text x={t.x} y={labelY+(t.y>H/2?10:-12)}
                      textAnchor="middle" fontSize="6.5"
                      fill={C.goldDim} fontFamily={FONT} opacity="0.6"
                    >Day {t.day}</text>
                  )}
                </g>
              );
            })}

            {/* ── Peer connection lines between pilgrims ── */}
            {peerEdges.map(e=>{
              const ap = getPosById(e.source), bp = getPosById(e.target);
              if(!ap||!bp) return null;
              const isActive = selected && (e.source===selected.id||e.target===selected.id);
              const isDim    = selected && !isActive;
              return (
                <line key={e.id}
                  x1={ap.x} y1={ap.y} x2={bp.x} y2={bp.y}
                  stroke={isActive?C.goldLight:C.gold}
                  strokeWidth={isActive?1.6:0.7}
                  strokeOpacity={isDim?0.04:isActive?0.9:0.25}
                  strokeDasharray={isActive?"none":"3,5"}
                />
              );
            })}

            {/* ── Stem lines: pilgrim → point on route ── */}
            {pilgrims.map(p=>{
              if(!p.pos.townX) return null;
              const isSel  = selected?.id===p.id;
              const isConn = selPeerIds.has(p.id);
              const isDim  = selected && !isSel && !isConn;
              return (
                <line key={`stem_${p.id}`}
                  x1={p.pos.x} y1={p.pos.y}
                  x2={p.pos.townX} y2={p.pos.townY}
                  stroke={isSel?C.goldLight:isConn?C.gold:C.goldDim}
                  strokeWidth={isSel?1.5:0.8}
                  strokeOpacity={isDim?0.08:isSel?0.9:0.45}
                  strokeDasharray={isSel?"none":"2,3"}
                />
              );
            })}

            {/* ── Pilgrim nodes ── */}
            {pilgrims.map(p=>{
              const sp    = getSp(p.species);
              const isSel = selected?.id===p.id;
              const isConn= selPeerIds.has(p.id);
              const isDim = selected && !isSel && !isConn;
              const isNew = newId===p.id;
              const r     = isSel?17:isConn?15:13;
              const clipId= `clip_${p.id}`;

              return (
                <g key={p.id} style={{cursor:"pointer"}} opacity={isDim?0.18:1}
                  onClick={()=>setSelected(isSel?null:p)}>

                  {isSel && (
                    <circle cx={p.pos.x} cy={p.pos.y} r={r+12}
                      fill="none" stroke={C.goldLight} strokeWidth="1"
                      opacity="0.25" style={{animation:"ring 2s ease-in-out infinite"}}/>
                  )}
                  {isNew && (
                    <circle cx={p.pos.x} cy={p.pos.y} r={r+18}
                      fill="none" stroke={C.goldLight} strokeWidth="1.5"
                      opacity="0.5" style={{animation:"ripple 1.2s ease-out infinite"}}/>
                  )}

                  {/* Update clip path to match current radius */}
                  <defs>
                    <clipPath id={clipId}>
                      <circle cx={p.pos.x} cy={p.pos.y} r={r}/>
                    </clipPath>
                  </defs>

                  {p.photo ? (
                    <>
                      <circle cx={p.pos.x} cy={p.pos.y} r={r}
                        fill="#1a1510"
                        stroke={isSel?C.goldLight:isConn?C.gold:C.goldDim}
                        strokeWidth={isSel?2.2:1}
                        filter={isSel?"url(#glow)":isConn?"url(#softglow)":"none"}
                      />
                      <image href={p.photo}
                        x={p.pos.x-r} y={p.pos.y-r} width={r*2} height={r*2}
                        clipPath={`url(#${clipId})`}
                        preserveAspectRatio="xMidYMid slice"
                      />
                      <circle cx={p.pos.x} cy={p.pos.y} r={r} fill="none"
                        stroke={isSel?C.goldLight:isConn?C.gold:C.goldDim}
                        strokeWidth={isSel?2.2:1}/>
                      {/* Species badge */}
                      <circle cx={p.pos.x+r*0.65} cy={p.pos.y+r*0.65} r={r*0.36}
                        fill="#0a0906" stroke={C.goldDim} strokeWidth="0.7"/>
                      <text x={p.pos.x+r*0.65} y={p.pos.y+r*0.65+4}
                        textAnchor="middle" fontSize={r*0.42}>{sp.sym}</text>
                    </>
                  ) : (
                    <>
                      <circle cx={p.pos.x} cy={p.pos.y} r={r}
                        fill="#0e0c08"
                        stroke={isSel?C.goldLight:isConn?C.gold:C.goldDim}
                        strokeWidth={isSel?2.2:1}
                        filter={isSel?"url(#glow)":isConn?"url(#softglow)":"none"}
                      />
                      <text x={p.pos.x} y={p.pos.y+5}
                        textAnchor="middle" fontSize={isSel?13:10}>{sp.sym}</text>
                    </>
                  )}

                  {/* Name — show when selected or connected */}
                  {(isSel||isConn) && (
                    <text x={p.pos.x} y={p.pos.y+r+12}
                      textAnchor="middle" fontSize={isSel?9:8}
                      fill={isSel?C.goldLight:C.inkDim} fontFamily={FONT}
                    >{p.name}</text>
                  )}
                </g>
              );
            })}

            {/* ── Orange start node (SJPP) ── */}
            {(()=>{
              const t = TOWNS[0];
              const isOrangeSel = selected?.id==="orange-start";
              return (
                <g style={{cursor:"pointer"}}
                  onClick={()=>setSelected(isOrangeSel?null:{id:"orange-start",name:"Orange",isOrange:true,meetTown:t.name,word:"旷野 · 790km",species:"shell",contact:"orange在野",contactType:"小红书 RED",date:"Jun 5",photo:makeAvatar("Or",35),pos:{x:t.x,y:t.y}})}>
                  <circle cx={t.x} cy={t.y} r={22}
                    fill="none" stroke={C.orange} strokeWidth="1.5" opacity="0.25"
                    style={{animation:"ring 3s ease-in-out infinite"}}/>
                  <circle cx={t.x} cy={t.y} r={18}
                    fill="#1a0e08"
                    stroke={C.orange} strokeWidth="2"
                    filter="url(#glow)"
                  />
                  <text x={t.x} y={t.y+6} textAnchor="middle" fontSize="14">🐚</text>
                  <text x={t.x} y={t.y+30} textAnchor="middle" fontSize="9"
                    fill={C.orange} fontFamily={FONT} fontStyle="italic">Orange</text>
                </g>
              );
            })()}

            {/* Santiago star */}
            {(()=>{
              const t = TOWNS[TOWNS.length-1];
              return (
                <g>
                  <circle cx={t.x} cy={t.y} r={14}
                    fill="#0e0c08" stroke={C.goldLight} strokeWidth="1.5" opacity="0.8"/>
                  <text x={t.x} y={t.y+5} textAnchor="middle" fontSize="12">⭐</text>
                  <text x={t.x} y={t.y+24} textAnchor="middle" fontSize="8"
                    fill={C.goldLight} fontFamily={FONT}>Santiago</text>
                </g>
              );
            })()}

            {/* Compass */}
            {(()=>{
              const cx=W-38, cy=H-32;
              return <g opacity="0.3">
                <text x={cx} y={cy-12} textAnchor="middle" fontSize="7" fill={C.gold}>N</text>
                <line x1={cx} y1={cy-8} x2={cx} y2={cy+8} stroke={C.gold} strokeWidth="0.8"/>
                <line x1={cx-8} y1={cy} x2={cx+8} y2={cy} stroke={C.gold} strokeWidth="0.8"/>
                <circle cx={cx} cy={cy} r="2.5" fill="none" stroke={C.gold} strokeWidth="0.7"/>
              </g>;
            })()}

            {/* km scale */}
            <g opacity="0.4" transform={`translate(${PX},${H-28})`}>
              <line x1="0" y1="0" x2="60" y2="0" stroke={C.gold} strokeWidth="0.8"/>
              <line x1="0" y1="-3" x2="0" y2="3" stroke={C.gold} strokeWidth="0.8"/>
              <line x1="60" y1="-3" x2="60" y2="3" stroke={C.gold} strokeWidth="0.8"/>
              <text x="30" y="-6" textAnchor="middle" fontSize="7" fill={C.inkDim} fontFamily={FONT}>~200 km</text>
            </g>

          </svg>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display:"flex", justifyContent:"center", gap:32,
        padding:"12px 20px", borderTop:`1px solid ${C.border}`,
        borderBottom:`1px solid ${C.border}`,
        background:"rgba(255,255,255,0.01)",
      }}>
        {[
          {label:"Pilgrims",  val:pilgrims.length},
          {label:"Days",      val:"35"},
          {label:"km",        val:"790"},
          {label:"Towns",     val:TOWNS.length},
        ].map(({label,val})=>(
          <div key={label} style={{textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:700,color:C.goldLight}}>{val}</div>
            <div style={{fontSize:9,color:C.inkDim,letterSpacing:"0.15em",textTransform:"uppercase"}}>{label}</div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{textAlign:"center",padding:"24px 0 48px"}}>
        <button onClick={()=>setView("checkin")} style={{
          background:"transparent", border:`1.5px solid ${C.gold}`,
          color:C.goldLight, padding:"11px 38px", fontSize:12,
          letterSpacing:"0.2em", textTransform:"uppercase",
          cursor:"pointer", fontFamily:FONT, borderRadius:2,
          boxShadow:`0 0 28px rgba(196,162,101,0.1)`, transition:"all 0.2s",
        }}
          onMouseEnter={e=>{e.currentTarget.style.background=C.gold;e.currentTarget.style.color=C.bg;}}
          onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color=C.goldLight;}}
        >✦ I walked this road</button>
        <div style={{fontSize:10,color:C.inkFaint,marginTop:10,fontStyle:"italic"}}>
          Tap any pilgrim to see their connections · Tap Orange to see the journey
        </div>
      </div>

      <style>{`
        @keyframes ring   {0%,100%{opacity:0.2}50%{opacity:0.45}}
        @keyframes ripple {0%{opacity:0.5}100%{opacity:0;r:50}}
      `}</style>
    </div>
  );
}

// ─── Node Panel ───────────────────────────────────────────────────────────────
function NodePanel({ node, peerIds, pilgrims, onClose, onFocus }) {
  const sp = getSp(node.species);
  const town = TOWN_BY_NAME[node.meetTown];
  const peerList = [...peerIds].map(id=>pilgrims.find(p=>p.id===id)).filter(Boolean);

  return (
    <div style={{
      position:"fixed", bottom:0, left:0, right:0,
      background:C.parchment, borderTop:`1px solid ${C.border}`,
      borderRadius:"14px 14px 0 0", padding:"20px 22px 40px",
      zIndex:200, maxHeight:"55vh", overflowY:"auto",
      boxShadow:"0 -16px 60px rgba(0,0,0,0.8)",
    }}>
      <button onClick={onClose} style={{
        position:"absolute",top:14,right:18,background:"none",
        border:"none",color:C.inkDim,cursor:"pointer",fontSize:18,
      }}>✕</button>

      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
        {/* Avatar */}
        <div style={{
          width:58,height:58,borderRadius:"50%",flexShrink:0,
          border:`2px solid ${node.isOrange?C.orange:C.gold}`,
          overflow:"hidden", background:"#1a1510", position:"relative",
        }}>
          {node.photo
            ? <img src={node.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{sp.sym}</div>
          }
          {node.photo && (
            <div style={{
              position:"absolute",bottom:0,right:0,width:20,height:20,
              borderRadius:"50%",background:"#0a0906",
              border:`1px solid ${C.goldDim}`,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,
            }}>{sp.sym}</div>
          )}
        </div>

        <div>
          <div style={{fontSize:20,fontWeight:700,color:node.isOrange?C.orange:C.goldLight}}>
            {node.name}
          </div>
          <div style={{fontSize:11,color:C.inkDim,fontStyle:"italic"}}>{sp.name} · {sp.zh}</div>
          {town && (
            <div style={{fontSize:10,color:C.goldDim,marginTop:3}}>
              📍 {node.meetTown} · Day {town.day} · {town.km} km · {node.date}
            </div>
          )}
        </div>
      </div>

      {node.word && (
        <div style={{
          fontSize:13,fontStyle:"italic",color:C.ink,
          borderLeft:`2px solid ${node.isOrange?C.orange:C.gold}`,
          paddingLeft:12,marginBottom:14,lineHeight:1.7,
        }}>"{node.word}"</div>
      )}

      {node.contact && (
        <div style={{fontSize:12,color:C.inkDim,marginBottom:14}}>
          <span style={{color:C.gold}}>{node.contactType}: </span>{node.contact}
        </div>
      )}

      {peerList.length>0 && (
        <>
          <div style={{fontSize:9,letterSpacing:"0.22em",color:C.inkDim,textTransform:"uppercase",marginBottom:8}}>
            Also knows · {peerList.length}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {peerList.map(p=>{
              const psp=getSp(p.species);
              const pTown=TOWN_BY_NAME[p.meetTown];
              return (
                <div key={p.id} onClick={()=>onFocus(p)} style={{
                  display:"flex",alignItems:"center",gap:7,
                  border:`1px solid ${C.border}`,borderRadius:24,
                  padding:"5px 12px",cursor:"pointer",
                  background:"rgba(255,255,255,0.02)",transition:"all 0.15s",
                }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}
                >
                  {p.photo
                    ? <img src={p.photo} style={{width:18,height:18,borderRadius:"50%",objectFit:"cover"}} alt=""/>
                    : <span style={{fontSize:13}}>{psp.sym}</span>
                  }
                  <span style={{fontSize:11,color:C.ink}}>{p.name}</span>
                  {pTown&&<span style={{fontSize:9,color:C.inkFaint,fontStyle:"italic"}}>{pTown.short}</span>}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Check-in flow ────────────────────────────────────────────────────────────
function CheckinView({ form, setForm, step, setStep, pilgrims, handleCheckin, onBack }) {
  const sp = form.species ? getSp(form.species) : null;
  const fileRef = useRef(null);

  const toggleConnect = id =>
    setForm(f=>({...f, connectTo: f.connectTo.includes(id)?f.connectTo.filter(x=>x!==id):[...f.connectTo,id]}));

  const handlePhoto = e => {
    const file = e.target.files?.[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = ev => setForm(f=>({...f,photo:ev.target.result}));
    reader.readAsDataURL(file);
  };

  const TOTAL=5;
  const titles=["","Who are you?","Choose your form","Where on the road?","A photo","How to find you?"];
  const zhs   =["","你是谁？","你的存在形态","你在路上哪里？","路上的一张自拍","如何找到你？"];

  return (
    <div style={{minHeight:"100vh",paddingBottom:60}}>
      <div style={{padding:"20px 20px 0"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:C.inkDim,cursor:"pointer",fontFamily:FONT,fontSize:13}}>
          ← Back
        </button>
      </div>

      <div style={{textAlign:"center",padding:"12px 20px 18px"}}>
        <div style={{fontSize:9,letterSpacing:"0.4em",color:C.goldLight,textTransform:"uppercase",marginBottom:5}}>
          Pilgrim Check-in
        </div>
        <h2 style={{margin:0,fontSize:"clamp(18px,3.5vw,28px)",color:C.goldLight,fontWeight:700}}>
          {titles[step]}
        </h2>
        <div style={{fontSize:12,color:C.inkDim,fontStyle:"italic",marginTop:3}}>{zhs[step]}</div>
        <div style={{display:"flex",justifyContent:"center",gap:5,marginTop:12}}>
          {Array.from({length:TOTAL},(_,i)=>i+1).map(s=>(
            <div key={s} style={{
              width:20,height:20,borderRadius:"50%",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:8,fontWeight:700,transition:"all 0.25s",
              border:`1.5px solid ${step>=s?C.gold:C.border}`,
              background:step>s?C.gold:"transparent",
              color:step>s?C.bg:step===s?C.goldLight:C.inkDim,
            }}>{step>s?"✓":s}</div>
          ))}
        </div>
      </div>

      <div style={{maxWidth:440,margin:"0 auto",padding:"0 20px"}}>

        {/* Step 1 */}
        {step===1 && (
          <div>
            <FL>Your name *</FL>
            <FI value={form.name} onChange={v=>setForm({...form,name:v})} placeholder="How people call you on the Camino"/>
            <FL style={{marginTop:16}}>One sentence <Opt/></FL>
            <FI value={form.word} onChange={v=>setForm({...form,word:v})} placeholder="What brought you here?"/>
            <FB disabled={!form.name} onClick={()=>setStep(2)}>Choose your species →</FB>
          </div>
        )}

        {/* Step 2 */}
        {step===2 && (
          <div>
            {Object.entries(SPECIES).map(([cat,data])=>(
              <div key={cat} style={{marginBottom:14}}>
                <div style={{fontSize:8,letterSpacing:"0.2em",color:C.inkDim,textTransform:"uppercase",marginBottom:6}}>
                  {data.emoji} {data.label}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                  {data.options.map(opt=>{
                    const sel=form.species===opt.id;
                    return (
                      <div key={opt.id} onClick={()=>setForm({...form,species:opt.id})} style={{
                        border:`1.5px solid ${sel?C.gold:C.border}`,
                        background:sel?"rgba(196,162,101,0.1)":"rgba(255,255,255,0.02)",
                        borderRadius:3,padding:"8px 5px",cursor:"pointer",textAlign:"center",
                        transition:"all 0.15s",transform:sel?"scale(1.04)":"scale(1)",
                      }}>
                        <div style={{fontSize:19,marginBottom:2}}>{opt.sym}</div>
                        <div style={{fontSize:9,fontWeight:600,color:sel?C.goldLight:C.ink}}>{opt.name}</div>
                        <div style={{fontSize:7,color:C.inkDim,fontStyle:"italic",marginTop:1,lineHeight:1.3}}>{opt.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div style={{display:"flex",gap:8}}>
              <FB secondary onClick={()=>setStep(1)}>← Back</FB>
              <FB disabled={!form.species} onClick={()=>setStep(3)}>Where on the road →</FB>
            </div>
          </div>
        )}

        {/* Step 3: town on the trail */}
        {step===3 && (
          <div>
            <FL>Where did you meet Orange? *</FL>
            <div style={{fontSize:11,color:C.inkDim,fontStyle:"italic",marginBottom:12}}>
              你在哪个小镇遇见了 Orange？
            </div>

            {/* Mini route visualizer */}
            <div style={{overflowX:"auto",marginBottom:14}}>
              <svg width={560} height={60} style={{display:"block",minWidth:560}}>
                <line x1="20" y1="30" x2="540" y2="30" stroke={C.goldDim} strokeWidth="1.5" strokeDasharray="4,3"/>
                {TOWNS.map((t,i)=>{
                  const x = 20 + (i/(TOWNS.length-1))*520;
                  const sel = form.meetTown===t.name;
                  const isMajor = ["Saint-Jean-Pied-de-Port","Pamplona","Burgos","León","Santiago de Compostela"].includes(t.name);
                  return (
                    <g key={t.id} style={{cursor:"pointer"}} onClick={()=>setForm({...form,meetTown:t.name})}>
                      <circle cx={x} cy={30} r={sel?7:isMajor?4:3}
                        fill={sel?C.gold:"#0a0906"}
                        stroke={sel?C.goldLight:isMajor?C.gold:C.goldDim}
                        strokeWidth={sel?2:1}/>
                      {(sel||isMajor) && (
                        <text x={x} y={i%2===0?18:50} textAnchor="middle" fontSize="6.5"
                          fill={sel?C.goldLight:C.inkDim} fontFamily={FONT}>{t.short}</text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Town chips */}
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:16}}>
              {TOWNS.map(t=>{
                const sel=form.meetTown===t.name;
                return (
                  <div key={t.id} onClick={()=>setForm({...form,meetTown:t.name})} style={{
                    border:`1px solid ${sel?C.gold:C.border}`,
                    background:sel?"rgba(196,162,101,0.12)":"transparent",
                    borderRadius:20,padding:"3px 10px",cursor:"pointer",
                    fontSize:10,color:sel?C.goldLight:C.inkDim,transition:"all 0.12s",
                  }}>
                    {t.short}
                    {sel && <span style={{fontSize:8,color:C.goldDim,marginLeft:4}}>Day {t.day}</span>}
                  </div>
                );
              })}
            </div>

            {/* Also know someone? */}
            {pilgrims.length>0 && (
              <>
                <FL style={{marginTop:4}}>Also connected to someone here? <Opt/></FL>
                <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:4}}>
                  {pilgrims.map(p=>{
                    const psp=getSp(p.species); const sel=form.connectTo.includes(p.id);
                    return (
                      <div key={p.id} onClick={()=>toggleConnect(p.id)} style={{
                        display:"flex",alignItems:"center",gap:5,
                        border:`1.5px solid ${sel?C.gold:C.border}`,
                        background:sel?"rgba(196,162,101,0.1)":"transparent",
                        borderRadius:20,padding:"4px 10px",cursor:"pointer",
                        fontSize:10,color:sel?C.goldLight:C.inkDim,transition:"all 0.12s",
                      }}>
                        {p.photo
                          ? <img src={p.photo} style={{width:14,height:14,borderRadius:"50%",objectFit:"cover"}} alt=""/>
                          : <span style={{fontSize:11}}>{psp.sym}</span>
                        }
                        {p.name}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            <div style={{display:"flex",gap:8}}>
              <FB secondary onClick={()=>setStep(2)}>← Back</FB>
              <FB disabled={!form.meetTown} onClick={()=>setStep(4)}>Add photo →</FB>
            </div>
          </div>
        )}

        {/* Step 4: photo */}
        {step===4 && (
          <div>
            <FL>A selfie from the road <Opt/></FL>
            <div style={{fontSize:11,color:C.inkDim,fontStyle:"italic",marginBottom:14}}>
              这张脸，永远留在这条路上
            </div>
            <div onClick={()=>fileRef.current?.click()} style={{
              border:`1.5px dashed ${form.photo?C.gold:C.border}`,
              borderRadius:4,padding:"22px 16px",textAlign:"center",
              cursor:"pointer",background:form.photo?"rgba(196,162,101,0.05)":"rgba(255,255,255,0.02)",
              transition:"all 0.2s",marginBottom:14,
            }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=C.gold}
              onMouseLeave={e=>e.currentTarget.style.borderColor=form.photo?C.gold:C.border}
            >
              {form.photo ? (
                <div style={{position:"relative",display:"inline-block"}}>
                  <img src={form.photo} alt="" style={{width:80,height:80,borderRadius:"50%",objectFit:"cover",border:`2px solid ${C.gold}`,display:"block"}}/>
                  {sp && (
                    <div style={{position:"absolute",bottom:1,right:1,width:22,height:22,borderRadius:"50%",background:"#0a0906",border:`1px solid ${C.goldDim}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11}}>{sp.sym}</div>
                  )}
                  <div style={{fontSize:9,color:C.goldLight,marginTop:8}}>Tap to change</div>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:28,marginBottom:6}}>📷</div>
                  <div style={{fontSize:11,color:C.inkDim}}>Upload a photo</div>
                  <div style={{fontSize:9,color:C.inkFaint,marginTop:3}}>JPG · PNG</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handlePhoto}/>
            <div style={{display:"flex",gap:8}}>
              <FB secondary onClick={()=>setStep(3)}>← Back</FB>
              <FB onClick={()=>setStep(5)}>{form.photo?"Looks good →":"Skip →"}</FB>
            </div>
          </div>
        )}

        {/* Step 5: contact + submit */}
        {step===5 && (
          <div>
            {/* Preview */}
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16,padding:"12px",border:`1px solid ${C.border}`,borderRadius:3,background:"rgba(255,255,255,0.02)"}}>
              <div style={{width:48,height:48,borderRadius:"50%",border:`1.5px solid ${C.gold}`,overflow:"hidden",background:"#1a1510",position:"relative",flexShrink:0}}>
                {form.photo
                  ? <img src={form.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{sp?.sym}</div>
                }
                {form.photo&&sp&&(
                  <div style={{position:"absolute",bottom:0,right:0,width:16,height:16,borderRadius:"50%",background:"#0a0906",border:`1px solid ${C.goldDim}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:8}}>{sp.sym}</div>
                )}
              </div>
              <div>
                <div style={{fontSize:14,color:C.goldLight,fontWeight:600}}>{form.name}</div>
                {sp&&<div style={{fontSize:10,color:C.inkDim,fontStyle:"italic"}}>{sp.name} · {sp.zh}</div>}
                {form.meetTown&&<div style={{fontSize:9,color:C.goldDim,marginTop:2}}>📍 {form.meetTown}</div>}
              </div>
            </div>

            <FL>How to find you? <Opt/></FL>
            <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:10}}>
              {["Instagram","小红书 RED","Email","WhatsApp","Just words"].map(opt=>{
                const sel=form.contactType===opt;
                return (
                  <div key={opt} onClick={()=>setForm({...form,contactType:sel?"":opt,contact:""})} style={{
                    border:`1.5px solid ${sel?C.gold:C.border}`,
                    background:sel?"rgba(196,162,101,0.1)":"transparent",
                    borderRadius:20,padding:"4px 11px",cursor:"pointer",
                    fontSize:10,color:sel?C.goldLight:C.inkDim,transition:"all 0.12s",
                  }}>{opt}</div>
                );
              })}
            </div>
            {form.contactType&&form.contactType!=="Just words"&&(
              <FI value={form.contact} onChange={v=>setForm({...form,contact:v})} placeholder={`Your ${form.contactType}`}/>
            )}
            <div style={{display:"flex",gap:8}}>
              <FB secondary onClick={()=>setStep(4)}>← Back</FB>
              <FB onClick={handleCheckin}>✦ Enter the field</FB>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mini components ──────────────────────────────────────────────────────────
const Opt = () => <span style={{color:"#4a3e28",fontSize:8}}>(optional)</span>;
function FL({children,style}){
  return <div style={{fontSize:9,letterSpacing:"0.22em",color:C.inkDim,textTransform:"uppercase",marginBottom:7,...style}}>{children}</div>;
}
function FI({value,onChange,placeholder}){
  return (
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{width:"100%",padding:"9px 12px",background:"rgba(255,255,255,0.04)",
        border:`1.5px solid ${C.border}`,borderRadius:3,fontSize:13,color:C.ink,
        fontFamily:FONT,outline:"none",boxSizing:"border-box",transition:"border-color 0.2s"}}
      onFocus={e=>e.target.style.borderColor=C.gold}
      onBlur={e=>e.target.style.borderColor=C.border}
    />
  );
}
function FB({children,onClick,disabled,secondary}){
  return (
    <button onClick={onClick} disabled={disabled} style={{
      flex:1,padding:"10px 16px",marginTop:12,
      background:secondary?"transparent":disabled?"rgba(196,162,101,0.1)":"rgba(196,162,101,0.85)",
      border:`1.5px solid ${secondary?C.border:disabled?C.border:C.gold}`,
      color:secondary?C.inkDim:disabled?C.inkDim:C.bg,
      borderRadius:2,fontSize:12,letterSpacing:"0.1em",
      cursor:disabled?"not-allowed":"pointer",fontFamily:FONT,transition:"all 0.2s",
    }}>{children}</button>
  );
}
