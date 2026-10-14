import * as E from './engine.js';
import {chart,comparisonChart,esc} from './charts.js';
import {profile,chartModel,selectedRows,recommendations} from './explore.js';

export function comparisonView({state,t,label,fmt,select,chartContext}){
 const c=state.comparison;
 if(!c)return `<section class="card compare-card"><div class="card-head"><div class="card-title">${esc(t('comparison'))}</div><span class="tag">${esc(t('before'))} → ${esc(t('after'))}</span></div><div class="compare-empty">${esc(t('comparisonEmpty'))}</div></section>`;
 const before=profile(c.rows,c.columns),after=profile(state.rows,state.columns);
 const common=state.columns.filter(col=>c.columns.includes(col)&&(E.infer(c.rows,col)==='number'||E.infer(state.rows,col)==='number'));
 const field=common.includes(state.compareField)?state.compareField:common.includes(c.column)?c.column:common.includes('sales')?'sales':common[0];
 const fig=field?comparisonChart(c.rows,state.rows,field,chartContext()):'';
 return `<section class="card compare-card"><div class="card-head"><div><div class="card-title">${esc(t('comparison'))} · ${esc(t(c.type))}</div><div class="card-sub">${esc(t('comparisonDesc'))}</div></div>${common.length?select('compare-field','compareField',common,field):''}</div><div class="compare-stats">${['rows','missing','duplicates'].map(k=>`<div class="compare-stat"><span>${esc(t(k))}</span><strong><small>${fmt(before[k],0)} →</small> ${fmt(after[k],0)}</strong><em>${after[k]===before[k]?esc(t('unchangedMetric')):(after[k]-before[k]>0?'+':'')+fmt(after[k]-before[k],0)}</em></div>`).join('')}</div>${fig?`<div class="chart-wrap compare-chart">${fig}<div class="tooltip"></div></div>`:`<div class="compare-empty">${esc(t('compareNoNumeric'))}</div>`}</section>`;
}

export function selectionLabel(selection,{t,display,fmt}){
 if(!selection)return t('allRecords');
 if(selection.kind==='point')return `${t('selectionPoint')} #${selection.index+1}`;
 if(selection.kind==='brush')return `${t('selectionBrush')}: ${fmt(selection.xmin)}–${fmt(selection.xmax)} × ${fmt(selection.ymin)}–${fmt(selection.ymax)}`;
 if(selection.kind==='range')return `${t('selectionRange')}: [${fmt(selection.min)}, ${fmt(selection.max)}${selection.includeMax?']':')'}`;
 return selection.keys.length>3?`${t('groupSelection')}: ${selection.keys.length}`:selection.keys.map(display).join(' / ');
}

export function exploreView(ctx){
 const {state,t,label,icon,select,input,button,tableHTML,chartContext,numericCols,cols,fmt,display}=ctx;
 const c=state.chart,nums=numericCols(),interactive=!['heatmap','boxplot'].includes(c.type),context=chartContext();
 const model=chartModel(state.rows,c),fig=chart(state.rows,{...c,interactive,selection:state.selection},context),selected=selectedRows(state.rows,state.selection);
 const recs=recommendations(state.rows,cols());
 const mainControls=select('chart-type','chartType',['bar','line','scatter','histogram','pie','heatmap','boxplot'],c.type,true)
 +(!['histogram','heatmap','boxplot'].includes(c.type)?select('chart-x','xAxis',c.type==='scatter'?nums:cols(),c.x):'')
 +(c.type!=='heatmap'?select('chart-y','yAxis',nums,c.y):'')
 +(!['scatter','histogram','heatmap','boxplot'].includes(c.type)?select('chart-fn','aggregation',['sum','mean','median','count','size','min','max'],c.fn,true):'')
 +(c.type==='bar'?select('chart-sort','sortChart',['desc','asc','label','source'],c.sort||'desc',true).replace('>label<',`>${esc(t('labelOrder'))}<`).replace('>source<',`>${esc(t('sourceOrder'))}<`):'')
 +(c.type==='histogram'?input('chart-bins','bins',c.bins,'number'):'')
 +(c.type!=='heatmap'?input('chart-unit','unit',c.unit||''):'');
 const note=t(c.type==='heatmap'?'corrTip':c.type==='scatter'?'brushHint':c.type==='histogram'?'qualityTip':c.type==='pie'?'pieHint':c.type==='boxplot'?'boxplotHint':'numericHint');
 return `<div class="recommendations">${recs.map((r,i)=>`<button class="recommendation" data-action="recommend-chart" data-rec="${i}"><span class="recommend-icon">${icon(r.type==='line'?'line':'chart',18)}</span><span class="rec-arrow">${icon('arrow',14)}</span><strong>${esc(t(r.reason))}</strong><small>${esc(t(r.type))} · ${esc(label(r.y))}</small></button>`).join('')}</div><div class="work-grid chart-work"><section class="card panel"><h3>${esc(t('chartType'))}</h3>${mainControls}${button('plot','plot','line','primary')}<p class="panel-note">${esc(t('chartNote'))}</p></section><div class="chart-stack"><section class="card"><div class="card-head"><div><div class="card-title">${esc(t(c.type))}${c.type!=='heatmap'?' · '+esc(label(c.y)):''}</div><div class="card-sub">${esc(t('chartPreview'))}</div></div>${button('svgExport','chart-export','download','small')}</div><div class="chart-wrap full-chart" id="main-chart">${fig||`<div class="empty">${esc(t('noChart'))}</div>`}<div class="tooltip"></div></div><div class="chart-method">${model.totalGroups!==undefined?`<span>${esc(t('chartShown'))}: ${model.points?.length||0} / ${model.totalGroups}</span>`:''}${model.truncated?`<span>${esc(t('omittedGroups'))}: ${model.truncated}</span>`:''}${model.excluded?`<span>${esc(t('excludedGroups'))}: ${model.excluded}</span>`:''}${c.type==='heatmap'?`<span>${esc(t('heatmapHint'))}</span>`:''}</div><p class="chart-note">${esc(note)}</p></section>${interactive?`<section class="card" id="linked-records"><div class="card-head"><div><div class="card-title">${esc(t('linkedRows'))}</div><div class="card-sub">${esc(t('linkedDesc'))}</div></div>${button('exportSelection','download-selection','download','small')}</div><div class="linked-toolbar"><span class="selection-pill">${esc(selectionLabel(state.selection,{t,display,fmt}))} · ${selected.length} ${esc(t('records'))}</span>${state.selection?button('clearSelection','clear-selection','refresh','small'):''}</div>${tableHTML(selected,cols(),{result:true})}</section>`:''}</div></div>`;
}
