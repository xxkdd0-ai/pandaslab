// Pointer brushing operates on the actual SVG coordinates, including narrow-screen scrolling.
export function installBrush(root,onSelect){
 let drag=null,suppressClick=false;
 const position=(event,svg)=>{const p=svg.createSVGPoint();p.x=event.clientX;p.y=event.clientY;return p.matrixTransform(svg.getScreenCTM().inverse());};
 root.addEventListener('pointerdown',event=>{
  const svg=event.target.closest('svg[data-brush]');if(!svg||event.button!==0)return;
  const p=position(event,svg);if(p.x<85||p.x>735||p.y<70||p.y>330)return;
  drag={svg,id:event.pointerId,start:p,end:p,metadata:JSON.parse(svg.dataset.brush),box:svg.querySelector('.brush-box')};
 });
 root.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id)return;
  const p=position(event,drag.svg);drag.end={x:Math.max(85,Math.min(735,p.x)),y:Math.max(70,Math.min(330,p.y))};
  const x=Math.min(drag.start.x,drag.end.x),y=Math.min(drag.start.y,drag.end.y),w=Math.abs(drag.end.x-drag.start.x),h=Math.abs(drag.end.y-drag.start.y);
  if(w>4||h>4)drag.svg.setPointerCapture(event.pointerId);
  for(const [k,v]of Object.entries({x,y,width:w,height:h,visibility:w>4||h>4?'visible':'hidden'}))drag.box.setAttribute(k,v);
 });
 root.addEventListener('pointerup',event=>{
  if(!drag||event.pointerId!==drag.id)return;const d=drag;drag=null;d.box.setAttribute('visibility','hidden');if(d.svg.hasPointerCapture(event.pointerId))d.svg.releasePointerCapture(event.pointerId);
  const width=Math.abs(d.end.x-d.start.x),height=Math.abs(d.end.y-d.start.y);if(width<5||height<5)return;
  const m=d.metadata,toX=v=>m.xmin+(v-85)/650*(m.xmax-m.xmin),toY=v=>m.ymax-(v-70)/260*(m.ymax-m.ymin);
  suppressClick=true;onSelect({kind:'brush',x:m.x,y:m.y,xmin:toX(Math.min(d.start.x,d.end.x)),xmax:toX(Math.max(d.start.x,d.end.x)),ymin:toY(Math.max(d.start.y,d.end.y)),ymax:toY(Math.min(d.start.y,d.end.y))});setTimeout(()=>suppressClick=false,0);
 });
 root.addEventListener('pointercancel',()=>{if(drag)drag.box.setAttribute('visibility','hidden');drag=null;});
 root.addEventListener('click',e=>{if(suppressClick){e.preventDefault();e.stopImmediatePropagation();}},true);
 root.addEventListener('keydown',e=>{const target=e.target.closest('[data-selection],svg [data-action="lab-filter"]');if(target&&['Enter',' '].includes(e.key)){e.preventDefault();target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
}
