(function($,window,document){function fnInvertKeyValues(aIn)
{var aRet=[];for(var i=0,iLen=aIn.length;i<iLen;i++)
{aRet[aIn[i]]=i;}
return aRet;}
function fnArraySwitch(aArray,iFrom,iTo)
{var mStore=aArray.splice(iFrom,1)[0];aArray.splice(iTo,0,mStore);}
function fnDomSwitch(nParent,iFrom,iTo)
{var anTags=[];for(var i=0,iLen=nParent.childNodes.length;i<iLen;i++)
{if(nParent.childNodes[i].nodeType==1)
{anTags.push(nParent.childNodes[i]);}}
var nStore=anTags[iFrom];if(iTo!==null)
{nParent.insertBefore(nStore,anTags[iTo]);}
else
{nParent.appendChild(nStore);}}
$.fn.dataTableExt.oApi.fnColReorder=function(oSettings,iFrom,iTo)
{var i,iLen,j,jLen,iCols=oSettings.aoColumns.length,nTrs,oCol;if(iFrom==iTo)
{return;}
if(iFrom<0||iFrom>=iCols)
{this.oApi._fnLog(oSettings,1,"ColReorder 'from' index is out of bounds: "+iFrom);return;}
if(iTo<0||iTo>=iCols)
{this.oApi._fnLog(oSettings,1,"ColReorder 'to' index is out of bounds: "+iTo);return;}
var aiMapping=[];for(i=0,iLen=iCols;i<iLen;i++)
{aiMapping[i]=i;}
fnArraySwitch(aiMapping,iFrom,iTo);var aiInvertMapping=fnInvertKeyValues(aiMapping);for(i=0,iLen=oSettings.aaSorting.length;i<iLen;i++)
{oSettings.aaSorting[i][0]=aiInvertMapping[oSettings.aaSorting[i][0]];}
if(oSettings.aaSortingFixed!==null)
{for(i=0,iLen=oSettings.aaSortingFixed.length;i<iLen;i++)
{oSettings.aaSortingFixed[i][0]=aiInvertMapping[oSettings.aaSortingFixed[i][0]];}}
for(i=0,iLen=iCols;i<iLen;i++)
{oCol=oSettings.aoColumns[i];for(j=0,jLen=oCol.aDataSort.length;j<jLen;j++)
{oCol.aDataSort[j]=aiInvertMapping[oCol.aDataSort[j]];}}
for(i=0,iLen=iCols;i<iLen;i++)
{oCol=oSettings.aoColumns[i];if(typeof oCol.mData=='number'){oCol.mData=aiInvertMapping[oCol.mData];oCol.fnGetData=oSettings.oApi._fnGetObjectDataFn(oCol.mData);oCol.fnSetData=oSettings.oApi._fnSetObjectDataFn(oCol.mData);}}
if(oSettings.aoColumns[iFrom].bVisible)
{var iVisibleIndex=this.oApi._fnColumnIndexToVisible(oSettings,iFrom);var iInsertBeforeIndex=null;i=iTo<iFrom?iTo:iTo+1;while(iInsertBeforeIndex===null&&i<iCols)
{iInsertBeforeIndex=this.oApi._fnColumnIndexToVisible(oSettings,i);i++;}
nTrs=oSettings.nTHead.getElementsByTagName('tr');for(i=0,iLen=nTrs.length;i<iLen;i++)
{fnDomSwitch(nTrs[i],iVisibleIndex,iInsertBeforeIndex);}
if(oSettings.nTFoot!==null)
{nTrs=oSettings.nTFoot.getElementsByTagName('tr');for(i=0,iLen=nTrs.length;i<iLen;i++)
{fnDomSwitch(nTrs[i],iVisibleIndex,iInsertBeforeIndex);}}
for(i=0,iLen=oSettings.aoData.length;i<iLen;i++)
{if(oSettings.aoData[i].nTr!==null)
{fnDomSwitch(oSettings.aoData[i].nTr,iVisibleIndex,iInsertBeforeIndex);}}}
fnArraySwitch(oSettings.aoColumns,iFrom,iTo);fnArraySwitch(oSettings.aoPreSearchCols,iFrom,iTo);for(i=0,iLen=oSettings.aoData.length;i<iLen;i++)
{if($.isArray(oSettings.aoData[i]._aData)){fnArraySwitch(oSettings.aoData[i]._aData,iFrom,iTo);}
fnArraySwitch(oSettings.aoData[i]._anHidden,iFrom,iTo);}
for(i=0,iLen=oSettings.aoHeader.length;i<iLen;i++)
{fnArraySwitch(oSettings.aoHeader[i],iFrom,iTo);}
if(oSettings.aoFooter!==null)
{for(i=0,iLen=oSettings.aoFooter.length;i<iLen;i++)
{fnArraySwitch(oSettings.aoFooter[i],iFrom,iTo);}}
for(i=0,iLen=iCols;i<iLen;i++)
{$(oSettings.aoColumns[i].nTh).unbind('click');this.oApi._fnSortAttachListener(oSettings,oSettings.aoColumns[i].nTh,i);}
$(oSettings.oInstance).trigger('column-reorder',[oSettings,{"iFrom":iFrom,"iTo":iTo,"aiInvertMapping":aiInvertMapping}]);if(typeof oSettings.oInstance._oPluginFixedHeader!='undefined')
{oSettings.oInstance._oPluginFixedHeader.fnUpdate();}};ColReorder=function(oDTSettings,oOpts)
{if(!this.CLASS||this.CLASS!="ColReorder")
{alert("Warning: ColReorder must be initialised with the keyword 'new'");}
if(typeof oOpts=='undefined')
{oOpts={};}
this.s={"dt":null,"init":oOpts,"fixed":0,"dropCallback":null,"mouse":{"startX":-1,"startY":-1,"offsetX":-1,"offsetY":-1,"target":-1,"targetIndex":-1,"fromIndex":-1},"aoTargets":[]};this.dom={"drag":null,"pointer":null};this.s.dt=oDTSettings.oInstance.fnSettings();this._fnConstruct();oDTSettings.oApi._fnCallbackReg(oDTSettings,'aoDestroyCallback',jQuery.proxy(this._fnDestroy,this),'ColReorder');ColReorder.aoInstances.push(this);return this;};ColReorder.prototype={"fnReset":function()
{var a=[];for(var i=0,iLen=this.s.dt.aoColumns.length;i<iLen;i++)
{a.push(this.s.dt.aoColumns[i]._ColReorder_iOrigCol);}
this._fnOrderColumns(a);},"_fnConstruct":function()
{var that=this;var i,iLen;if(typeof this.s.init.iFixedColumns!='undefined')
{this.s.fixed=this.s.init.iFixedColumns;}
if(typeof this.s.init.fnReorderCallback!='undefined')
{this.s.dropCallback=this.s.init.fnReorderCallback;}
for(i=0,iLen=this.s.dt.aoColumns.length;i<iLen;i++)
{if(i>this.s.fixed-1)
{this._fnMouseListener(i,this.s.dt.aoColumns[i].nTh);}
this.s.dt.aoColumns[i]._ColReorder_iOrigCol=i;}
this.s.dt.oApi._fnCallbackReg(this.s.dt,'aoStateSaveParams',function(oS,oData){that._fnStateSave.call(that,oData);},"ColReorder_State");var aiOrder=null;if(typeof this.s.init.aiOrder!='undefined')
{aiOrder=this.s.init.aiOrder.slice();}
if(this.s.dt.oLoadedState&&typeof this.s.dt.oLoadedState.ColReorder!='undefined'&&this.s.dt.oLoadedState.ColReorder.length==this.s.dt.aoColumns.length)
{aiOrder=this.s.dt.oLoadedState.ColReorder;}
if(aiOrder)
{if(!that.s.dt._bInitComplete)
{var bDone=false;this.s.dt.aoDrawCallback.push({"fn":function(){if(!that.s.dt._bInitComplete&&!bDone)
{bDone=true;var resort=fnInvertKeyValues(aiOrder);that._fnOrderColumns.call(that,resort);}},"sName":"ColReorder_Pre"});}
else
{var resort=fnInvertKeyValues(aiOrder);that._fnOrderColumns.call(that,resort);}}},"_fnOrderColumns":function(a)
{if(a.length!=this.s.dt.aoColumns.length)
{this.s.dt.oInstance.oApi._fnLog(this.s.dt,1,"ColReorder - array reorder does not "+
"match known number of columns. Skipping.");return;}
for(var i=0,iLen=a.length;i<iLen;i++)
{var currIndex=$.inArray(i,a);if(i!=currIndex)
{fnArraySwitch(a,currIndex,i);this.s.dt.oInstance.fnColReorder(currIndex,i);}}
if(this.s.dt.oScroll.sX!==""||this.s.dt.oScroll.sY!=="")
{this.s.dt.oInstance.fnAdjustColumnSizing();}
this.s.dt.oInstance.oApi._fnSaveState(this.s.dt);},"_fnStateSave":function(oState)
{var i,iLen,aCopy,iOrigColumn;var oSettings=this.s.dt;for(i=0;i<oState.aaSorting.length;i++)
{oState.aaSorting[i][0]=oSettings.aoColumns[oState.aaSorting[i][0]]._ColReorder_iOrigCol;}
aSearchCopy=$.extend(true,[],oState.aoSearchCols);oState.ColReorder=[];for(i=0,iLen=oSettings.aoColumns.length;i<iLen;i++)
{iOrigColumn=oSettings.aoColumns[i]._ColReorder_iOrigCol;oState.aoSearchCols[iOrigColumn]=aSearchCopy[i];oState.abVisCols[iOrigColumn]=oSettings.aoColumns[i].bVisible;oState.ColReorder.push(iOrigColumn);}},"_fnMouseListener":function(i,nTh)
{var that=this;$(nTh).bind('mousedown.ColReorder',function(e){e.preventDefault();that._fnMouseDown.call(that,e,nTh);});},"_fnMouseDown":function(e,nTh)
{var
that=this,aoColumns=this.s.dt.aoColumns;var nThTarget=e.target.nodeName=="TH"?e.target:$(e.target).parents('TH')[0];var offset=$(nThTarget).offset();this.s.mouse.startX=e.pageX;this.s.mouse.startY=e.pageY;this.s.mouse.offsetX=e.pageX-offset.left;this.s.mouse.offsetY=e.pageY-offset.top;this.s.mouse.target=nTh;this.s.mouse.targetIndex=$('th',nTh.parentNode).index(nTh);this.s.mouse.fromIndex=this.s.dt.oInstance.oApi._fnVisibleToColumnIndex(this.s.dt,this.s.mouse.targetIndex);this.s.aoTargets.splice(0,this.s.aoTargets.length);this.s.aoTargets.push({"x":$(this.s.dt.nTable).offset().left,"to":0});var iToPoint=0;for(var i=0,iLen=aoColumns.length;i<iLen;i++)
{if(i!=this.s.mouse.fromIndex)
{iToPoint++;}
if(aoColumns[i].bVisible)
{this.s.aoTargets.push({"x":$(aoColumns[i].nTh).offset().left+$(aoColumns[i].nTh).outerWidth(),"to":iToPoint});}}
if(this.s.fixed!==0)
{this.s.aoTargets.splice(0,this.s.fixed);}
$(document).bind('mousemove.ColReorder',function(e){that._fnMouseMove.call(that,e);});$(document).bind('mouseup.ColReorder',function(e){that._fnMouseUp.call(that,e);});},"_fnMouseMove":function(e)
{var that=this;if(this.dom.drag===null)
{if(Math.pow(Math.pow(e.pageX-this.s.mouse.startX,2)+
Math.pow(e.pageY-this.s.mouse.startY,2),0.5)<5)
{return;}
this._fnCreateDragNode();}
this.dom.drag.style.left=(e.pageX-this.s.mouse.offsetX)+"px";this.dom.drag.style.top=(e.pageY-this.s.mouse.offsetY)+"px";var bSet=false;for(var i=1,iLen=this.s.aoTargets.length;i<iLen;i++)
{if(e.pageX<this.s.aoTargets[i-1].x+((this.s.aoTargets[i].x-this.s.aoTargets[i-1].x)/2))
{this.dom.pointer.style.left=this.s.aoTargets[i-1].x+"px";this.s.mouse.toIndex=this.s.aoTargets[i-1].to;bSet=true;break;}}
if(!bSet)
{this.dom.pointer.style.left=this.s.aoTargets[this.s.aoTargets.length-1].x+"px";this.s.mouse.toIndex=this.s.aoTargets[this.s.aoTargets.length-1].to;}},"_fnMouseUp":function(e)
{var that=this;$(document).unbind('mousemove.ColReorder');$(document).unbind('mouseup.ColReorder');if(this.dom.drag!==null)
{document.body.removeChild(this.dom.drag);document.body.removeChild(this.dom.pointer);this.dom.drag=null;this.dom.pointer=null;this.s.dt.oInstance.fnColReorder(this.s.mouse.fromIndex,this.s.mouse.toIndex);if(this.s.dt.oScroll.sX!==""||this.s.dt.oScroll.sY!=="")
{this.s.dt.oInstance.fnAdjustColumnSizing();}
if(this.s.dropCallback!==null)
{this.s.dropCallback.call(this);}
this.s.dt.oInstance.oApi._fnSaveState(this.s.dt);}},"_fnCreateDragNode":function()
{var that=this;this.dom.drag=$(this.s.dt.nTHead.parentNode).clone(true)[0];this.dom.drag.className+=" DTCR_clonedTable";while(this.dom.drag.getElementsByTagName('caption').length>0)
{this.dom.drag.removeChild(this.dom.drag.getElementsByTagName('caption')[0]);}
while(this.dom.drag.getElementsByTagName('tbody').length>0)
{this.dom.drag.removeChild(this.dom.drag.getElementsByTagName('tbody')[0]);}
while(this.dom.drag.getElementsByTagName('tfoot').length>0)
{this.dom.drag.removeChild(this.dom.drag.getElementsByTagName('tfoot')[0]);}
$('thead tr:eq(0)',this.dom.drag).each(function(){$('th',this).eq(that.s.mouse.targetIndex).siblings().remove();});$('tr',this.dom.drag).height($('tr:eq(0)',that.s.dt.nTHead).height());$('thead tr:gt(0)',this.dom.drag).remove();$('thead th:eq(0)',this.dom.drag).each(function(i){this.style.width=$('th:eq('+that.s.mouse.targetIndex+')',that.s.dt.nTHead).width()+"px";});this.dom.drag.style.position="absolute";this.dom.drag.style.top="0px";this.dom.drag.style.left="0px";this.dom.drag.style.width=$('th:eq('+that.s.mouse.targetIndex+')',that.s.dt.nTHead).outerWidth()+"px";this.dom.pointer=document.createElement('div');this.dom.pointer.className="DTCR_pointer";this.dom.pointer.style.position="absolute";if(this.s.dt.oScroll.sX===""&&this.s.dt.oScroll.sY==="")
{this.dom.pointer.style.top=$(this.s.dt.nTable).offset().top+"px";this.dom.pointer.style.height=$(this.s.dt.nTable).height()+"px";}
else
{this.dom.pointer.style.top=$('div.dataTables_scroll',this.s.dt.nTableWrapper).offset().top+"px";this.dom.pointer.style.height=$('div.dataTables_scroll',this.s.dt.nTableWrapper).height()+"px";}
document.body.appendChild(this.dom.pointer);document.body.appendChild(this.dom.drag);},"_fnDestroy":function()
{for(var i=0,iLen=ColReorder.aoInstances.length;i<iLen;i++)
{if(ColReorder.aoInstances[i]===this)
{ColReorder.aoInstances.splice(i,1);break;}}
$(this.s.dt.nTHead).find('*').unbind('.ColReorder');this.s.dt.oInstance._oPluginColReorder=null;this.s=null;}};ColReorder.aoInstances=[];ColReorder.fnReset=function(oTable)
{for(var i=0,iLen=ColReorder.aoInstances.length;i<iLen;i++)
{if(ColReorder.aoInstances[i].s.dt.oInstance==oTable)
{ColReorder.aoInstances[i].fnReset();}}};ColReorder.prototype.CLASS="ColReorder";ColReorder.VERSION="1.0.8";ColReorder.prototype.VERSION=ColReorder.VERSION;if(typeof $.fn.dataTable=="function"&&typeof $.fn.dataTableExt.fnVersionCheck=="function"&&$.fn.dataTableExt.fnVersionCheck('1.9.3'))
{$.fn.dataTableExt.aoFeatures.push({"fnInit":function(oDTSettings){var oTable=oDTSettings.oInstance;if(typeof oTable._oPluginColReorder=='undefined'){var opts=typeof oDTSettings.oInit.oColReorder!='undefined'?oDTSettings.oInit.oColReorder:{};oTable._oPluginColReorder=new ColReorder(oDTSettings,opts);}else{oTable.oApi._fnLog(oDTSettings,1,"ColReorder attempted to initialise twice. Ignoring second");}
return null;},"cFeature":"R","sFeature":"ColReorder"});}
else
{alert("Warning: ColReorder requires DataTables 1.9.3 or greater - www.datatables.net/download");}})(jQuery,window,document);