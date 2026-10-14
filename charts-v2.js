import * as E from './engine.js';
import {chartModel,comparisonData} from './explore.js';
export const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const palette=['#34715b','#568bab','#b48144','#9376ab','#739645','#b66469','#557f82','#798279'];
const compact=v=>new Intl.NumberFormat('en',{notation:Math.abs(v)>=10000?'compact':'standard',maximumFractionDigits:Math.abs(v)<10?2:0}).format(v);
const colorFor=value=>{let n=0;for(const c of String(value))n=(n*31+c.charCodeAt(0))>>>0;return palette[n%palette.length];};
const text=(x,y,value,anchor='start',fill='#637666',size=12)=>`<text x="${x}" y="${y}" text-anchor="${anchor}" fill="${fill}" font-size="${size}" font-family="Segoe UI,Microsoft YaHei,sans-serif">${esc(value)}</text>`;
const short=(s,n=18)=>String(s).length>n?String(s).slice(0,n-1)+'…':s;
const tip=s=>`data-tip="${esc(s)}"`;
const key=s=>JSON.stringify(s);
function selectAttrs(selection,title,opts){const active=!opts.selection||key(opts.selection)===key(selection);return `${opts.interactive?`data-action="chart-select" data-selection="${esc(key(selection))}" role="button" tabindex="0" aria-label="${esc(title)}"`:''} ${tip(title)} opacity="${active?1:.28}"` ;}
const frame=(body,title,opts={})=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 420" role="img" aria-label="${esc(title)}" ${opts.metadata||''}><rect width="760" height="420" fill="white"/>${body}</svg>`;
function axes(low,high,loX,hiX,labelX,labelY){let b='';for(let i=0;i<=4;i++){const yy=330-i*65;b+=`<line x1="85" y1="${yy}" x2="735" y2="${yy}" stroke="#e3e9df" stroke-dasharray="4 5"/>`+text(72,yy+4,compact(low+(high-low)*i/4),'end');if(loX!==undefined)b+=text(85+650*i/4,357,compact(loX+(hiX-loX)*i/4),'middle');}b+=text(85,35,short(labelY,65),'start','#355942',13)+text(410,403,short(labelX,65),'middle','#355942',13);return b;}
export function chart(rows,opts,{t,display,fmt}){
 const {type,x,y,fn='sum',unit=''}=opts;
 if(!rows.length)return '';
 const yLabel=display(y)+(unit?' ('+unit+')':'');
 const title=t(type)+' · '+(type==='heatmap'?t('correlation'):yLabel);
 let body='';
 if(type==='heatmap'){
   const cols=E.fields(rows).filter(c=>E.infer(rows,c)==='number').slice(0,12);if(cols.length<2)return '';
   const cell=Math.min(48,270/cols.length),ox=210,oy=72;
   body+=text(32,28,t('correlation'),'start','#355942',14);
   cols.forEach((a,i)=>{body+=text(ox-14,oy+i*cell+cell*.63,short(display(a),20),'end','#61745b',11);body+=text(ox+i*cell+cell/2,oy-14,short(display(a),7),'middle','#61745b',10);cols.forEach((b,j)=>{const v=E.correlation(rows,a,b);const c=v===null?'#e8ebe5':v>=0?`hsl(145, 32%, ${96-Math.abs(v)*61}%)`:`hsl(25, 48%, ${96-Math.abs(v)*47}%)`;body+=`<g ${tip(`${display(a)} × ${display(b)}: ${v===null?'—':v.toFixed(3)}`)}><rect x="${ox+j*cell}" y="${oy+i*cell}" width="${cell-2}" height="${cell-2}" rx="3" fill="${c}"/>${text(ox+j*cell+cell/2,oy+i*cell+cell*.63,v===null?'—':v.toFixed(2),'middle',v!==null&&v>.6?'#fff':'#485d42',Math.min(11,cell*.33))}</g>`;});});
   body+=`<defs><linearGradient id="corr-scale"><stop stop-color="#bf8752"/><stop offset="50%" stop-color="#f1f4ed"/><stop offset="100%" stop-color="#3d7857"/></linearGradient></defs><rect x="210" y="367" width="270" height="9" rx="3" fill="url(#corr-scale)"/>`+text(210,393,'−1','middle')+text(345,393,'0','middle')+text(480,393,'+1','middle');return frame(body,title);
 }
 if(type==='boxplot'){
   const values=rows.map(r=>r[y]).filter(E.numeric).map(Number).sort((a,b)=>a-b);if(!values.length)return '';
   const s=E.stats(values),iqr=s.q3-s.q1,lo=values.find(v=>v>=s.q1-1.5*iqr),hi=values.findLast(v=>v<=s.q3+1.5*iqr),min=s.min,max=s.max===min?min+1:s.max;
   const sx=v=>85+(v-min)/(max-min)*650;
   body+=text(85,38,yLabel,'start','#355942',14);
   for(let i=0;i<=4;i++)body+=`<line x1="${85+650*i/4}" x2="${85+650*i/4}" y1="80" y2="310" stroke="#e5ebdf" stroke-dasharray="4 5"/>`+text(85+650*i/4,345,compact(min+(max-min)*i/4),'middle');
   body+=`<path d="M${sx(lo)} 160v80M${sx(lo)} 200H${sx(hi)}M${sx(hi)} 160v80" stroke="#547763" stroke-width="2"/><rect x="${sx(s.q1)}" y="135" width="${Math.max(2,sx(s.q3)-sx(s.q1))}" height="130" fill="#dcebdc" stroke="#548365" stroke-width="2" ${tip(`Q1: ${fmt(s.q1)} · ${t('median')}: ${fmt(s.median)} · Q3: ${fmt(s.q3)}`)}/><line x1="${sx(s.median)}" x2="${sx(s.median)}" y1="135" y2="265" stroke="#204e3a" stroke-width="3"/>`;
   const outliers=values.filter(v=>v<lo||v>hi);outliers.slice(0,500).forEach((v,i)=>{body+=`<circle cx="${sx(v)}" cy="${200+(i%7-3)*7}" r="4" fill="#b47e42" ${tip(t('outliers')+': '+fmt(v))}/>`;});
   body+=text(380,383,`${t('median')}: ${fmt(s.median)} · IQR: ${fmt(iqr)} · ${t('outliers')}: ${outliers.length}`,'middle');return frame(body,title);
 }
 const model=chartModel(rows,opts),points=model.points;if(!points?.length)return '';
 if(type==='scatter'){
   const xs=points.map(p=>p.x),ys=points.map(p=>p.y);let xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
   const xpad=(xmax-xmin||1)*.06,ypad=(ymax-ymin||1)*.06;xmin-=xpad;xmax+=xpad;ymin-=ypad;ymax+=ypad;
   const sx=v=>85+(v-xmin)/(xmax-xmin)*650,sy=v=>330-(v-ymin)/(ymax-ymin)*260;
   body=axes(ymin,ymax,xmin,xmax,display(x),yLabel);
   points.forEach(p=>{const active=!opts.selection||opts.selection.kind==='point'&&p.index===opts.selection.index||opts.selection.kind==='brush'&&p.x>=opts.selection.xmin&&p.x<=opts.selection.xmax&&p.y>=opts.selection.ymin&&p.y<=opts.selection.ymax;body+=`<circle class="chart-point" cx="${sx(p.x)}" cy="${sy(p.y)}" r="4.5" fill="#397654" fill-opacity="${active?.7:.15}" ${selectAttrs(p.selection,`${display(x)}: ${fmt(p.x)} · ${yLabel}: ${fmt(p.y)}`,{...opts,selection:null})}/>`;});
   if(opts.interactive)body+='<rect class="brush-box" fill="#66976b22" stroke="#366f4c" stroke-dasharray="4 3" visibility="hidden" pointer-events="none"/>';
   return frame(body,title,{metadata:opts.interactive?`data-brush="${esc(JSON.stringify({x,y,xmin,xmax,ymin,ymax}))}"`:''});
 }
 if(type==='pie'){
   const total=model.total;let angle=-Math.PI/2;const cx=220,cy=207,rad=118,inner=81;
   body+=text(35,31,`${yLabel} · ${t(fn)}`,'start','#355942',14);
   points.forEach((p,i)=>{const delta=p.y/total*Math.PI*2,end=angle+delta,large=delta>Math.PI?1:0,polar=(a,r)=>[cx+Math.cos(a)*r,cy+Math.sin(a)*r];let d;if(delta>=Math.PI*2-.0001)d=`M ${cx} ${cy-rad} A ${rad} ${rad} 0 1 1 ${cx-.001} ${cy-rad} L ${cx-.001} ${cy-inner} A ${inner} ${inner} 0 1 0 ${cx} ${cy-inner} Z`;else d=`M${polar(angle,rad)} A${rad} ${rad} 0 ${large} 1 ${polar(end,rad)} L${polar(end,inner)} A${inner} ${inner} 0 ${large} 0 ${polar(angle,inner)} Z`;
    const name=p.label==='__other__'?t('other'):display(p.label),color=p.label==='__other__'?'#9aa698':palette[i%palette.length],title=`${name}: ${fmt(p.y)} (${(p.y/total*100).toFixed(1)}%)`;
    body+=`<path d="${d}" fill="${color}" stroke="white" stroke-width="2" class="chart-sector" ${selectAttrs(p.selection,title,opts)}/><g ${selectAttrs(p.selection,title,opts)}><rect x="407" y="${81+i*33}" width="10" height="10" rx="2" fill="${color}"/>${text(431,91+i*33,short(name,20),'start','#496348',12)}${text(724,91+i*33,`${(p.y/total*100).toFixed(1)}%`,'end','#355942',12)}</g>`;angle=end;
   });body+=text(cx,cy-2,compact(total),'middle','#2d563c',28)+text(cx,cy+26,t('positiveTotal'),'middle','#657b5f',12);return frame(body,title);
 }
 const labels=points.map(p=>type==='histogram'?`${compact(p.min)}–${compact(p.max)}`:display(p.label));
 const low=Math.min(0,...points.map(p=>p.y)),high=Math.max(0,...points.map(p=>p.y))||1,span=high-low,sy=v=>330-(v-low)/span*260,zero=sy(0),bw=650/points.length;
 body=axes(low,high,undefined,undefined,type==='histogram'?yLabel:display(x),type==='histogram'?t('counts'):`${yLabel} · ${t(fn)}`);
 const pos=points.map((p,i)=>({x:85+bw*(i+.5),y:sy(p.y)}));
 if(type==='line'){
   const path=pos.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ');
   body+=`<path d="${path} L ${pos.at(-1).x},${zero} L ${pos[0].x},${zero} Z" fill="#deecd94a"/><path d="${path}" fill="none" stroke="#3f7853" stroke-width="2.5"/>`;
   pos.forEach((p,i)=>{body+=`<circle cx="${p.x}" cy="${p.y}" r="5" fill="#3f7853" stroke="white" stroke-width="2" ${selectAttrs(points[i].selection,`${labels[i]}: ${fmt(points[i].y)}`,opts)}/>`;});
 }else pos.forEach((p,i)=>{const width=Math.min(64,bw*(type==='histogram'?.94:.64));body+=`<rect class="chart-bar" x="${p.x-width/2}" y="${Math.min(p.y,zero)}" width="${width}" height="${Math.max(1,Math.abs(zero-p.y))}" rx="3" fill="#518366" ${selectAttrs(points[i].selection,`${labels[i]}: ${fmt(points[i].y)}`,opts)}/>`;});
 const skip=Math.max(1,Math.ceil(points.length/8));pos.forEach((p,i)=>{if(i%skip===0)body+=text(p.x,356,short(labels[i],12),'middle','#5e7455',11);});
 return frame(body,title);
}

export function comparisonChart(before,after,column,{t,display,fmt}){
 const data=comparisonData(before,after,column);if(!data)return '';
 const max=Math.max(1,...data.before.map(p=>p.y),...data.after.map(p=>p.y)),bw=650/10;
 let body=axes(0,max,undefined,undefined,display(column),t('counts'));
 for(let i=0;i<10;i++){const b=data.before[i],a=data.after[i],x=85+i*bw+5;body+=`<rect x="${x}" y="${330-b.y/max*260}" width="${bw/2-6}" height="${b.y/max*260}" fill="#c6a570" ${tip(`${t('before')}: ${fmt(b.y)} · ${fmt(b.min)}–${fmt(b.max)}`)}/><rect x="${x+bw/2-3}" y="${330-a.y/max*260}" width="${bw/2-6}" height="${a.y/max*260}" fill="#488064" ${tip(`${t('after')}: ${fmt(a.y)} · ${fmt(a.min)}–${fmt(a.max)}`)}/>`;if(i%2===0)body+=text(x+bw/2,358,compact(b.min),'middle');}
 body+=`<rect x="490" y="22" width="10" height="10" fill="#c6a570"/>`+text(507,31,t('before'))+`<rect x="620" y="22" width="10" height="10" fill="#488064"/>`+text(637,31,t('after'));
 return frame(body,t('comparison'));
}
