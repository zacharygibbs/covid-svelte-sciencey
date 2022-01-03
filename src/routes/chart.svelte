<svelte:head>
    <link rel='stylesheet' href='chart.css'/>
</svelte:head>

<script>
    import ChSe from './chartselect.svelte'
    
    import * as d3 from 'd3';//'../../node_modules/.pnpm/d3@7.1.1/node_modules/d3';
    
    import { Styles } from 'sveltestrap';
    import { onMount } from "svelte";
    import { Col, Container, Row } from 'sveltestrap';
    import {getMax, getMin, recursiveGetAttr, recursiveGetAttrTimeSeries} from './helpers.js'
    import { Form, FormGroup, FormText, Input, Label } from 'sveltestrap';
    
    
    import * as jq from 'jquery';

    export let mounted;
    export let mapInData;
    export let mapSelected;
    export let mapradioGroup;
    export let APIKEY;
    export let minVal;
    export let maxVal;
    export let normalizeCheckbox;

    let loadedData = null;
    let mounted2 = false;
    onMount(() => {
        mounted2 = true;
    })

    let attrib;
    let dropdownVals = [];
    let dropdownValsState = [];
    let updateNodeRef = {value:0, reset:0, keepVals:false};
    let stateSelected;
    let attribBuffer;
    let startDate;
    let endDate;
    let movingaverageCheckbox = true;
    let rawdataCheckbox = true;
    


    $:{ //reactively recalc inputs if parent data changes
        attrib = mapSelected;
        if(mounted & mounted2 & !!mapradioGroup){
            if(mapInData != []){
                let resetVal = attrib==attribBuffer ? updateNodeRef['reset'] : updateNodeRef['reset'] + 1;
                updateNodeRef = {value:updateNodeRef['value'] + 1, reset:resetVal, keepVals:true};
                attribBuffer = attrib;
                dropdownVals = mapInData[1].map((dataItem) => {
                    let curVal = recursiveGetAttr(dataItem, attrib, normalizeCheckbox);
                    let curValString = curVal==null ? '' : ' - ' + curVal.toFixed(2)
                    let outObj = {
                                    fips: dataItem.fips,
                                    text: dataItem['county'] + ', ' + dataItem['state'] + curValString,
                                    state: dataItem['state'],
                                    value: curVal
                            };
                    return outObj
                })
                                           .sort((a,b)=>{
                                                  return b.value - a.value
                                              })
                                          
                dropdownValsState = mapInData[2].map((dataItem) => {
                    
                    let curVal = recursiveGetAttr(dataItem, attrib, normalizeCheckbox);
                    let curValString = curVal==null ? '' : ' - ' + curVal.toFixed(2)
                    let outObj = {
                                    fips: dataItem.fips,
                                    text: dataItem['state'] + curValString,
                                    state: dataItem['state'],
                                    value: curVal
                            };

                    return outObj
                })
                                              .sort((a,b)=>{
                                                  return b.value - a.value
                                              })
                if(mapradioGroup=='county'){
                    dropdownValsState = [{fips:'ALL', text:'ALL', state:'ALL'}, ...dropdownValsState]
                }
            }
        }
    }




    const colorFun = (curV, minD, maxD, justFun=false) => {
        const colors = d3.scaleSequential()
                         .domain([minD, maxD])
                         .interpolator(d3.interpolateCool);
        if(justFun){
            return colors
        }
        else{
            return colors(curV)
        }
    }

    
    function makeArr(startValue, stopValue, cardinality) {
        //https://stackoverflow.com/questions/40475155/does-javascript-have-a-method-that-returns-an-array-of-numbers-based-on-start-s
        var arr = [];
        var step = (stopValue - startValue) / (cardinality - 1);
        for (var i = 0; i < cardinality; i++) {
            arr.push(startValue + (step * i));
        }
        return arr;
    }   

    const getSingleTimeSeriesData = (state, fips) => {
        let urlString = null;
        if(!state){
            urlString = 'https://api.covidactnow.org/v2/county/' + fips + '.timeseries.json?apiKey=' + APIKEY;
        }
        else{
            urlString = 'https://api.covidactnow.org/v2/state/' + state + '.timeseries.json?apiKey=' + APIKEY;
        }
        return urlString
    }

    const dataHandler = (event) => {
        loadedData = []
        let mapValsUnordered = [];
        if(mapradioGroup=='county'){
            mapValsUnordered = mapInData[1].filter((mapValData, index) => {
                return event.detail.value.includes(mapValData.fips)
            })
        }
        else{
            mapValsUnordered = mapInData[2].filter((mapValData, index) => {
                return event.detail.value.includes(mapValData.fips)
            })
        }

        //reorder
        let mapVals = [];
        let urls = [];
        for(let i=0;i<event.detail.value.length;i++){
            let fip = event.detail.value[i]
            let tmp = mapValsUnordered.filter((value) => {
                return value.fips == fip
            })
            mapVals.push(tmp[0])
            let isDataLoaded = loadedData.filter((value) => {
                return value.fips == tmp[0].fips
            })
            if(true){//isDataLoaded.length==0){//if no data loaded yet
                let url
                if(mapradioGroup=='county'){
                    url = getSingleTimeSeriesData(null, tmp[0].fips)
                }
                else{
                    url = getSingleTimeSeriesData(tmp[0].state, null)
                }
                urls.push(d3.json(url))
                //Promise.all([d3.json(url), d3.json('https://api.covidactnow.org/v2/counties.json?apiKey='+apikey), d3.json('https://api.covidactnow.org/v2/states.json?apiKey='+apikey)])
            }
        }
        if(urls.length==0){
            draw_chart('reset')
        }
        else{
            Promise.all(urls)
                .then((data) => {
                    loadedData = [...data];
                    draw_chart(data)
                })
        }


    }
    
    const stateHandler = (event) => {
        if(event.detail.value!='ALL' & event.detail.value!='' & event.detail.value!=null){
            let stateSelectedFips = event.detail.value;
            let newState = mapInData[2].filter((dataItem)=>{
                return dataItem.fips == stateSelectedFips
            })
            stateSelected = newState[0]['state'];
            updateNodeRef = {value:updateNodeRef['value'] + 1, reset:true, keepVals:true};
        }
    }



    const widthpct = '100%';
    const padding = 50;
    const paddingTop = 100;
    const paddingLeft = 150;
    const paddingBottom = 150;
    const CIRLCESIZE = 1;
    const draw_chart = (data) => {
        if(data=='reset'){
            jq("#d3linechart").empty() // clear chart
            return null
        }
        if(!!data){
            let dataProcessed = [];
            let absmax = -9999999999999;
            let absmin = 9999999999999;
            let datemax = '1900-01-01';
            let datemin = '2399-01-01';
            for(let i=0; i<data.length; i++){
                let objData = recursiveGetAttrTimeSeries(data[i], attrib, true, normalizeCheckbox)
                if(!!!objData){
                    continue
                }
                dataProcessed.push(objData['results'])
                absmax = objData['max'] > absmax ? objData['max'] : absmax;
                absmin = objData['min'] < absmin ? objData['min'] : absmin;
                let curmax = objData['results'].reduce((prevval, curval) => {
                    return curval.date > prevval ? curval.date : prevval
                }, '1900-01-01')
                let curmin = objData['results'].reduce((prevval, curval) => {
                    return curval.date < prevval ? curval.date : prevval
                }, '2399-01-01')
                datemax = datemax > curmax ? datemax : curmax;
                datemin = datemin < curmin ? datemin : curmin;
            }
            if(!startDate & datemin!='2399-01-01'){
                startDate = datemin;
            }
            else{
                datemin = startDate 
            }
            if(!endDate & datemax!='1900-01-01'){
                endDate = datemax;
            }
            else{
                datemax = endDate 
            }
            for(let i=0; i<dataProcessed.length;i++){

                dataProcessed[i] = dataProcessed[i].filter((d) => {
                    return d.date < datemax & d.date > datemin
                })
            }

            for(let j=0; j<dataProcessed.length; j++){
                let colorVal = colorFun(j, 0, dataProcessed.length - 1);
                for(let i=0; i<dataProcessed[j].length; i++){
                    dataProcessed[j][i]['color'] = colorVal;
                }
            }
            console.log(dataProcessed)
            let origScroll = window.pageYOffset;

            jq("#d3linechart").empty() // clear chart
            let width = document.getElementById("d3linechart-col").offsetWidth
            let height = width * 0.66

            const svg = d3.select("#d3linechart")
                            .append("svg")
                            .attr("width", widthpct)
                            .attr("height", height)
            const xScale = d3.scaleTime()
                .domain([new Date(datemin), new Date(datemax)])
                .range([paddingLeft, width - padding]);
            
            const yScale = d3.scaleLinear()
                .domain([absmin, absmax])
                .range([height - paddingBottom, paddingTop]);
            
            for(let j=0; j<dataProcessed.length; j++){
                if(rawdataCheckbox){
                    svg.selectAll("circle"+j)
                        .data(dataProcessed[j])
                        .enter()
                        .append("circle")
                        .attr("cx", (d, i) => xScale(new Date(d.date)))//i * 30)
                        .attr("cy", (d, i) => yScale(d.value))//)//h - 3 * d)
                        .attr('r', CIRLCESIZE)
                        .attr("class", "dot")
                        .attr('stroke', (d,i) => d.color)//colorFun(j, 0, dataProcessed.length - 1) )
                        .attr('data-xvalue', (d, i) => d.date)
                        .attr('data-yvalue', (d, i) => d.value)
                }

                    
                
                if(movingaverageCheckbox){
                    //https://www.d3-graph-gallery.com/graph/line_basic.html
                    svg.append("path")
                    .datum(dataProcessed[j].filter((d) => {
                        return !!d.movingaverage
                    }))
                    .attr('id', 'movingaverage'+j)
                    .attr("class", "movingaverage-line")
                    .attr('stroke', (d) => colorFun(j, 0, dataProcessed.length - 1) )
                    .attr("d", d3.line()
                            .x((d) => { return xScale(new Date(d.date)) })
                            .y((d) => { return yScale(d.movingaverage) })
                    )
                }

                if(rawdataCheckbox){
                    svg.append("path")
                    .datum(dataProcessed[j].filter((d) => {
                        return !!d.value
                    }))
                    .attr('id', 'path'+j)
                    .attr("class", "path-line")
                    .attr('stroke', (d,i) => colorFun(j, 0, dataProcessed.length - 1) )
                    .attr("d", d3.line()
                            .x((d) => { return xScale(new Date(d.date)) })
                            .y((d) => { return yScale(d.value) })
                    )
                }
            }
            if(dataProcessed.length>0){
                const tickWidth = 200
                const xAxis = d3.axisBottom(xScale)
                                .ticks(width / tickWidth)
                                .tickFormat(d3.timeFormat("%m/%d/%Y"));

                const yAxis = d3.axisLeft(yScale)
                                .tickArguments([5,""])
                                .tickFormat(d3.format('.2f'));
                

                svg.append("g")
                    .attr("transform", "translate(0," + (height - paddingBottom) + ")")
                    .attr('id', 'x-axis')
                    .call(xAxis)
                    .selectAll('.tick')
                    .attr('class','ticklabels');

                svg.append("g")
                    .attr("transform", "translate(" + paddingLeft + ",0)")
                    .attr('id', 'y-axis')
                    .call(yAxis)
                    .selectAll('.tick')
                    .attr('class','ticklabels')

                svg.append('text')
                    .attr('id', 'xlabel')
                    .attr("x", (width + paddingLeft)/2)
                    .attr("y", height - paddingBottom*0.65)
                    .style("text-anchor", "middle")
                    .attr('class', 'axislabel')
                    .text("Date");
                
                svg.append('text')
                    .attr('id', 'ylabel')
                    .attr('transform', 'translate(' + (paddingLeft)/2+',' + (height - paddingBottom) / 2 + ')rotate(270)')
                    .style("text-anchor", "middle")
                    .attr('class', 'axislabel')
                    .text(attrib);
                

                svg.append('g')
                   .attr('id', 'legendlinechart')
                   .attr('transform', 'translate(150, 0)')
                
                let legend = d3.select('#legendlinechart')

                legend.append('rect')
                    .style('stroke', 'black')
                    .style('stroke-width', '3px')
                    .style('padding', '2px')
                    .style('width', width * 0.75)
                    .style('height', 80);
                    
                legend.append('text')
                    .attr('transform', 'translate(15, 25)')
                    .attr('class','legend-text')
                    .style('font-size','24px')
                    .text('Legend')
                let prevx = 15;
                const legtxtpadding = mapradioGroup=='county' ? 15: 40;
                const pxperchar = 6.5;
                for(let i=0; i<dataProcessed.length; i++){
                    let legytxt = i < 5 ? 40 : 60
                    let legtxt = mapradioGroup=='county' ? data[i]['county'] + ', ' + data[i]['state'] : data[i]['state']
                    legend.append('circle')
                        .attr("cx", prevx)//15 + (i - legxtxt) * (width * 0.8 - 50 - padding) / 5 )//i * 30)
                        .attr("cy", legytxt)//)//h - 3 * d)
                        .attr('r', 5)
                        .attr('stroke', (d) => colorFun(i, 0, dataProcessed.length - 1) )
                        .attr('fill', (d) => colorFun(i, 0, dataProcessed.length - 1) )
                    legend.append('text')
                          .attr('x', prevx + 10)//15 + 10 + (i - legxtxt) * (width * 0.8 - 50 - padding) / 5)
                          .attr('y', legytxt + 5)
                          .text(legtxt)
                          .attr('class', 'legend-text')
                    prevx = i != 4 ? prevx + legtxt.length*pxperchar + legtxtpadding : 15;
                }


                // create a tooltip
                let tooltip = d3.select('#d3linechart')
                    .append("div")
                    .attr('id', 'tooltip')
                    .style('opacity', 0)
                    .style('background-color', 'aquarmarine')
                    .style('border', 'solid')
                    .style('border-width', '5px')
                    .style('padding', '2px')

                const mouseover = (event, d) => {
                    tooltip.style('opacity', 1)
                }

                const mousemove = (event, d) => {
                    console.log(event)
                    let moving_avg_text = '';
                    if(event.target.tagName=='path'){
                        //https://medium.com/@louisemoxy/create-an-accurate-tooltip-for-a-d3-area-chart-bf59783f8a2d
                        const currentXPosition = event.layerX//d3.mouse(this)[0];
                        const xValue = xScale.invert(currentXPosition);
                        const bisectDate = d3.bisector(function(dee) { return new Date(dee.date); }).left;
                        // Get the index of the xValue relative to the dataSet
                        const dataIndex = bisectDate(d, xValue, 1);
                        const leftData = d[dataIndex - 1];
                        const rightData = d[dataIndex];
                        let valueattr = 'value'
                        d['value'] = leftData[valueattr];
                        if(event.target.id.match(/^movingaverage/)){
                            valueattr = 'movingaverage'
                            moving_avg_text = '(7d avg)'
                            d['value'] = leftData[valueattr] + (xValue - new Date(leftData.date)) / (leftData[valueattr] - rightData[valueattr]) / (new Date(leftData.date) - new Date(rightData.date))
                        }          
                        d = d[0] //but need to somehow get nearest value?
                        d['value'] = leftData[valueattr];
                    }
                    let area_name = d['county'];
                    let countyStr = mapradioGroup=='county' ? '<strong><span style="color: ' + d.color + '">' + 'County:</span></strong>'  + area_name + '<br/>' : '';
                    tooltip.html(countyStr
                                + '<strong><span style="color: ' + d.color + '">' + 'State:</span></strong>' + d['state'] + '<br/>'
                                + attrib + ' ' + moving_avg_text + ': ' + parseFloat(d['value']).toFixed(2) + '<br/>'
                                + 'Population: ' + d['population']
                                )
                        .style('left', (d3.pointer(event)[0]) + 'px')
                        .style('top', (d3.pointer(event)[1] + 150) + 'px')
                        .style('position', 'absolute')
                }

                const mouseleave = (event, d) => {
                    tooltip.style('opacity', 0)
                }

                d3.select('#d3linechart')
                  .selectAll("circle")
                  .on('mouseover', mouseover)
                  .on('mousemove', mousemove)
                  .on('mouseleave', mouseleave)
                
                d3.select('#d3linechart')
                  .selectAll("path")
                  .on('mouseover', mouseover)
                  .on('mousemove', mousemove)
                  .on('mouseleave', mouseleave)

            }

            window.scrollTo(0, origScroll);
        }

    }

    startDate
    $: {
        startDate
        endDate
        if(!!loadedData){
            draw_chart(loadedData)
        }
    }
    $: {
        rawdataCheckbox
        movingaverageCheckbox
        normalizeCheckbox
        if(!!loadedData){
            draw_chart(loadedData)
        }
    }

</script>

<Styles/>
<div>
    <Container class='float-start chart-container'>
        <Row>
            <h2>Chart</h2>
        </Row>
        <Row>
            <Col xs="3">
                {#if mounted & mounted2}
                    {#if mapradioGroup=='county'}
                        <Row>
                            <span><strong>State: </strong>(If changed, county dropdown will be reset)</span>
                            <ChSe dropdownVals={dropdownValsState} updateNodeRef={updateNodeRef} maxItems=1 divid='chart-select-state-div' selectid='chart-state-select' setValue='ALL' on:change={stateHandler}/>    
                        </Row>
                        <Row>
                            <span><strong>County: </strong></span>
                            <ChSe dropdownVals={dropdownVals} updateNodeRef={updateNodeRef} stateSelected={stateSelected} maxItems=10 divid='chart-select-div' selectid='chart-select' setValue='' on:change={dataHandler} />
                        </Row>

                    {:else}
                        <Row>
                            <span><strong>State: </strong></span>
                            <ChSe dropdownVals={dropdownValsState} updateNodeRef={updateNodeRef} maxItems=10 divid='chart-select-div' selectid='chart-select' setValue='' on:change={dataHandler} />
                        </Row>
                    {/if}    
                    <Row>
                        <FormGroup>
                            <Label for="startDate">Start Date</Label>
                            <Input
                              type="date"
                              name="startDate"
                              id="startDate"
                              placeholder="date placeholder"
                              bind:value={startDate}
                            />
                            <Label for="endDate">End Date</Label>
                            <Input
                              type="date"
                              name="endDate"
                              id="endDate"
                              placeholder="date placeholder"
                              bind:value={endDate}
                            />
                          </FormGroup>
                    </Row>
                    <Row>
                        <FormGroup>
                            <Input id="rawdatacheckbox" type="checkbox" label="raw data" bind:checked={rawdataCheckbox} />
                            <Input id="movingaveragecheckbox" type="checkbox" label="7d avg" bind:checked={movingaverageCheckbox} />
                          </FormGroup>
                    </Row>
                {/if}


            </Col>
            <Col xs="9" id='d3linechart-col'>
                <div id='d3linechart'></div>
            </Col>
        </Row>
    </Container>
</div>


<style>
    .chart-container {
        width: 100%;
        margin: 10px;
        background-color: #fe3e4a;
        
    }



</style>
