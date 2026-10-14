import * as E from './engine.js';

export function profile(rows,columns=E.fields(rows)){
  const cells=rows.length*columns.length;
  const missing=rows.reduce((n,r)=>n+columns.filter(c=>E.missing(r[c])).length,0);
  return {rows:rows.length,columns:columns.length,missing,duplicates:E.duplicateCount(rows),complete:cells?(cells-missing)/cells*100:0};
}

export function histogram(values,bins=10,domain){
  const a=values.filter(E.numeric).map(Number),n=Math.max(3,Math.min(30,Math.round(Number(bins)||10)));
  if(!a.length&&!domain)return [];
  let [lo,hi]=domain||[Math.min(...a),Math.max(...a)];
  if(lo===hi){lo-=.5;hi+=.5;}
  const step=(hi-lo)/n;
  const points=Array.from({length:n},(_,i)=>({min:lo+i*step,max:lo+(i+1)*step,includeMax:i===n-1,y:0}));
  a.forEach(v=>{if(v>=lo&&v<=hi)points[Math.min(n-1,Math.floor((v-lo)/step))].y++;});
  return points;
}

export function chartModel(rows,opts){
  const {type,x,y,fn='sum',sort='desc',bins=10}=opts;
  if(type==='histogram')return {points:histogram(rows.map(r=>r[y]),bins).map(p=>({...p,selection:{kind:'range',column:y,min:p.min,max:p.max,includeMax:p.includeMax}}))};
  if(type==='scatter')return {points:rows.map((r,index)=>({x:r[x],y:r[y],index})).filter(p=>E.numeric(p.x)&&E.numeric(p.y)).slice(0,1000).map(p=>({...p,x:Number(p.x),y:Number(p.y),selection:{kind:'point',index:p.index}}))};
  const monthly=type==='line'&&E.infer(rows,x)==='date',groups=new Map();
  for(const r of rows){if(E.missing(r[x]))continue;const value=monthly?String(r[x]).slice(0,7):r[x],key=JSON.stringify(value);if(!groups.has(key))groups.set(key,{label:value,values:[]});groups.get(key).values.push(r[y]);}
  let points=[...groups.values()].map(g=>({label:g.label,y:E.aggregate(g.values,fn),selection:{kind:'group',column:x,keys:[g.label],period:monthly?7:0}})).filter(p=>E.numeric(p.y));
  const totalGroups=points.length;
  if(monthly||type==='line')points.sort((a,b)=>E.numeric(a.label)&&E.numeric(b.label)?Number(a.label)-Number(b.label):String(a.label).localeCompare(String(b.label)));
  else if(sort==='desc'||sort==='asc')points.sort((a,b)=>sort==='asc'?a.y-b.y:b.y-a.y);
  else if(sort==='label')points.sort((a,b)=>String(a.label).localeCompare(String(b.label)));
  if(type==='pie'){
    const excluded=points.filter(p=>p.y<=0).length;
    points=points.filter(p=>p.y>0).sort((a,b)=>b.y-a.y);
    if(points.length>8){const remaining=points.slice(7);points=[...points.slice(0,7),{label:'__other__',y:remaining.reduce((sum,p)=>sum+p.y,0),selection:{kind:'group',column:x,keys:remaining.flatMap(p=>p.selection.keys),period:0}}];}
    return {points,totalGroups,excluded,total:points.reduce((n,p)=>n+p.y,0)};
  }
  return {points:points.slice(0,30),totalGroups,truncated:Math.max(0,totalGroups-30)};
}

export function selectedRows(rows,selection){
  if(!selection)return rows;
  if(selection.kind==='point')return rows[selection.index]?[rows[selection.index]]:[];
  if(selection.kind==='group'){const keys=new Set(selection.keys.map(v=>JSON.stringify(v)));return rows.filter(r=>!E.missing(r[selection.column])&&keys.has(JSON.stringify(selection.period?String(r[selection.column]).slice(0,selection.period):r[selection.column])));}
  if(selection.kind==='range')return rows.filter(r=>E.numeric(r[selection.column])&&Number(r[selection.column])>=selection.min&&(selection.includeMax?Number(r[selection.column])<=selection.max:Number(r[selection.column])<selection.max));
  if(selection.kind==='brush')return rows.filter(r=>E.numeric(r[selection.x])&&E.numeric(r[selection.y])).slice(0,1000).filter(r=>Number(r[selection.x])>=selection.xmin&&Number(r[selection.x])<=selection.xmax&&Number(r[selection.y])>=selection.ymin&&Number(r[selection.y])<=selection.ymax);
  return rows;
}

export function comparisonData(before,after,column){
  const values=[...before,...after].map(r=>r[column]).filter(E.numeric).map(Number);
  if(!values.length)return null;
  const domain=[Math.min(...values),Math.max(...values)];
  return {before:histogram(before.map(r=>r[column]),10,domain),after:histogram(after.map(r=>r[column]),10,domain)};
}

export function recommendations(rows,columns=E.fields(rows)){
  const nums=columns.filter(c=>E.infer(rows,c)==='number'),dates=columns.filter(c=>E.infer(rows,c)==='date'),cats=columns.filter(c=>E.infer(rows,c)==='string');
  const y=nums.includes('sales')?'sales':nums[0],out=[];
  if(dates.length&&y)out.push({type:'line',x:dates[0],y,reason:'recommendTime'});
  const ranked=cats.map(c=>({c,n:new Set(rows.map(r=>r[c]).filter(v=>!E.missing(v))).size})).filter(a=>a.n>1).sort((a,b)=>a.n-b.n);
  if(cats.length&&y)out.push({type:'bar',x:ranked[0]?.c||cats[0],y,reason:'recommendCompare'});
  if(y)out.push({type:'histogram',y,reason:'recommendDistribution'});
  if(nums.length>1)out.push({type:'scatter',x:nums.find(c=>c!==y),y,reason:'recommendRelation'});
  return out;
}
