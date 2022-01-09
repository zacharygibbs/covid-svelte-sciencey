<svelte:head>
    <link rel='stylesheet' href='chart.css'/>
</svelte:head>

<script>
	import { getChartData } from './_data_grabber.js'
    import {getMax, getMin, recursiveGetAttr, recursiveGetAttrTimeSeries, minMaxResolver} from './helpers.js'
    import * as d3 from 'd3';//'../../node_modules/.pnpm/d3@7.1.1/node_modules/d3';
    
    import { Styles } from 'sveltestrap';
    import { onMount } from "svelte";
    import { Col, Container, Row } from 'sveltestrap';
    
    import { Form, FormGroup, FormText, Input, Label } from 'sveltestrap';
    import MultiSelect from 'svelte-multiselect'
    

    export let mounted;
    export let mapInData;
    export let mapSelected;
    export let mapradioGroup;
    export let APIKEY;
    export let minVal;
    export let maxVal;
    export let normalizeCheckbox;

    let selectedValues = [];
    let stateSelectedValues = [];
    let selectedState = []; //object
    let selected = []; //object
    let stateSelected = 'ALL';

    let loadedData = null;
    let mounted2 = false;
    onMount(() => {
        mounted2 = true;
    })

    let attrib;
    let dropdownVals = [];
    let dropdownValsState = [];
    
    let attribBuffer;
    let startDate;
    let endDate;
    let movingaverageCheckbox = true;
    let rawdataCheckbox = true;
    let firstTime = true;

    $:{ //reactively recalc inputs if parent data changes
        console.log('attrib', attrib)
        attrib = mapSelected;
        console.log(stateSelected)
        if(mounted & mounted2 & !!mapradioGroup){
            if(mapInData != []){
                attribBuffer = attrib;    
                genAllDropdowns(!firstTime)
                draw_chart(loadedData)
                if(firstTime){
                    firstTime = false;
                }
            }
        }
    }

    const genDropdown = (keepSelected=false) => {
        dropdownVals = mapInData[1].map((dataItem) => {
            let curVal = recursiveGetAttr(dataItem, attrib, normalizeCheckbox);
            let curValString = curVal==null ? '' : ' - ' + curVal.toFixed(2)
            let outObj = {
                            label: dataItem['county'] + ', ' + dataItem['state'] + curValString,
                            value: dataItem.fips,
                            state: dataItem['state'],
                            metricVal: curVal
                    };
            return outObj
        })
                    .sort((a,b)=>{
                            return b.metricVal - a.metricVal
                        })

        if(keepSelected){
            let newSelected = [];
            for(let i=0; i<selected.length; i++){
                const matchVal = dropdownVals.filter((d) => {
                    return selected[i].value == d.value
                })
                newSelected.push(matchVal[0]);
            }
            if(!!newSelected[0]){
                let isequal = selected.reduce((prevvalue, curvalue, index) => {
                    return prevvalue & (selected[index].value == newSelected[index].value & selected[index].label == newSelected[index].label)
                }, true)
                if(!isequal){
                    selected = [...newSelected];
                }
            }
        }
                                        
                                                            
    }

    const genDropdownState = (keepSelected=false) => {
        dropdownValsState = mapInData[2].map((dataItem) => {
                    
                    let curVal = recursiveGetAttr(dataItem, attrib, normalizeCheckbox);
                    let curValString = curVal==null ? '' : ' - ' + curVal.toFixed(2)
                    let outObj = {
                                    label: dataItem['state'] + curValString,
                                    value: dataItem.fips,
                                    metricVal: curVal
                            };
                    return outObj
                })
                .sort((a,b)=>{
                    console.log(b.curVal - a.curVal)
                    return b.metricVal - a.metricVal
                })
        if(keepSelected & selectedState.length>0){
            let chooseSelected = mapradioGroup=='county' ? selectedState : selected; // if county dropdown, then we are using selectedState variable, otherwise; we're in state mode so we should use selected variable directly
            let newSelected = [];
            for(let i=0; i<chooseSelected.length; i++){
                const matchVal = dropdownValsState.filter((d) => {
                    return chooseSelected[i].value == d.value
                })
                newSelected.push(matchVal[0]);
            }
            //debugger;
            if(!!newSelected[0]){
                //debugger;
                let isequal = chooseSelected.reduce((prevvalue, curvalue, index) => {
                    return prevvalue & (chooseSelected[index].value == newSelected[index].value & chooseSelected[index].label == newSelected[index].label)
                }, true)
                if(!isequal ){
                    if(mapradioGroup=='county'){
                        selectedState = [...newSelected];
                    }
                    else{
                        selected = [...newSelected];
                    }
                    
                }
            }
            
        }
    }

    const genAllDropdowns = (keepSelected=false) => {
        if(mapradioGroup=='county'){
            genDropdown(keepSelected);
        }
        genDropdownState(keepSelected);
        if(mapradioGroup=='county'){
            if(keepSelected){
                dropdownValsState = [{value:'ALL', label:'ALL'}, ...dropdownValsState];    
            }
            else{
                dropdownValsState = [{value:'ALL', label:'ALL', preselected:true}, ...dropdownValsState];
            }     
            dropdownVals = filterCountyByState(dropdownVals, stateSelected);
        }
    }

    const filterCountyByState = (dropdown, state) => {
        if(state!='ALL' & state!='' & state != null){
            dropdown = dropdown.filter((d) => {
                            return d.state == state
                        })
        }

        return dropdown
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


    $: {
        console.log('data handler', selectedValues)
        if(selectedValues.length > 0 ){
            dataHandler()
        }
        else{
            draw_chart('reset')
        }
    }

    const dataHandler = () => {
        loadedData = [];
        let mapValsUnordered = [];
        if(mapradioGroup=='county'){
            mapValsUnordered = mapInData[1].filter((mapValData, index) => {
                return selectedValues.includes(mapValData.fips)
            })
        }
        else{
            mapValsUnordered = mapInData[2].filter((mapValData, index) => {
                return selectedValues.includes(mapValData.fips)
            })
        }
        if(selected.length==0){
            draw_chart('reset')
        }
        else{
            getChartData(selectedValues, mapValsUnordered, mapradioGroup)
                .then((data) => {
                    for(let i=0; i<data.length; i++){
                        if(!!!data[i].state){
                            data[i].state = 'US'
                            console.log(data[i])
                        }
                    }
                    loadedData = [...data];
                    draw_chart(data);
                })
        }

    }
    
    $: {
        console.log('state handler', stateSelectedValues)
        if(stateSelectedValues.length > 0){
            stateHandler()
        }
        else{
            draw_chart('reset')
        }   
    }

    const stateHandler = () => {
        //if(stateSelectedValues[0]!='ALL' & stateSelectedValues[0]!='' & stateSelectedValues[0]!=null){
        console.log('state handler', stateSelectedValues[0])
        if(mapInData != []){
            let stateSelectedFips = stateSelectedValues[0];
            let newState = mapInData[2].filter((dataItem)=>{
                return dataItem.fips == stateSelectedFips
            })
            if(newState.length>0){
                stateSelected = newState[0]['state'];
            }
            else{
                selectedState = [{value:'ALL', label:'ALL'}];
                stateSelected = 'ALL';
            }
            
            console.log(stateSelected,'------ chart')
            selected = [];
            dataHandler();
            genAllDropdowns();
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
            if(mounted2 & mounted){
                document.getElementById("d3linechart").innerHTML = ""; // clear chart
            }
            return null
        }
        if(!!data){
            let dataProcessed = [];
            let absmax = -9999999999999;
            let absmin = 9999999999999;
            let datemax = '1900-01-01';
            let datemin = '2399-01-01';
            const dateminmax0 = minMaxResolver(startDate, endDate, datemin, datemax, true);
            for(let i=0; i<data.length; i++){
                let objData = recursiveGetAttrTimeSeries(data[i], attrib, true, normalizeCheckbox, dateminmax0[0], dateminmax0[1])
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
            const dateminmax1 = minMaxResolver(startDate, endDate, datemin, datemax, false);
            datemin = dateminmax1[0];
            datemax = dateminmax1[1];
            if(!!dateminmax1[2]){
                startDate = dateminmax1[2];
            }
            if(!!dateminmax1[3]){
                endDate = dateminmax1[3];
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

            let origScroll = window.pageYOffset;

            if(mounted2 & mounted){
                document.getElementById("d3linechart").innerHTML = ""; // clear chart
            }
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
                        .style('left', (d3.pointer(event)[0] + 100) + 'px')
                        .style('top', (d3.pointer(event)[1] + 8000) + 'px')
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
        console.log('statdate, enddate', startDate, endDate)
        startDate
        endDate
        if(!!loadedData){
            draw_chart(loadedData)
        }
    }
    $: {
        console.log('rawdataCheckbox, movingaverageCheckbox, normalizeCheckbox', rawdataCheckbox, movingaverageCheckbox, normalizeCheckbox)
        rawdataCheckbox
        movingaverageCheckbox
        normalizeCheckbox
        if(!!loadedData){
            genAllDropdowns(true);
            draw_chart(loadedData);
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
            <Col xs="4">
                {#if mounted & mounted2}
                    {#if mapradioGroup=='county'}
                        <Row>
                            <span><strong>State: </strong></span>
                            <!--<ChSe dropdownVals={dropdownValsState} updateNodeRef={updateNodeRef} maxItems={1} divid='chart-select-state-div' selectid='chart-state-select' setValue='ALL' on:chonge={stateHandler} bind:selectedValuesIn={stateSelectedValues}/> -->
                            <MultiSelect bind:selectedValues={stateSelectedValues} bind:selected={selectedState} options={dropdownValsState} maxSelect={1} id='chart-state-select' class='multi-select'/> <!--on:change={stateHandler}/>-->
                        </Row>
                        <Row>
                            <span><strong>County: </strong></span>
                            <!-- <ChSe dropdownVals={dropdownVals} updateNodeRef={updateNodeRef} stateSelected={stateSelected} maxItems=10 divid='chart-select-div' selectid='chart-select' setValue='' on:chonge={dataHandler} bind:selectedValuesIn={selectedValues}/>-->
                            <MultiSelect bind:selectedValues={selectedValues} bind:selected={selected} options={dropdownVals} maxSelect={10} id='chart-select' class='multi-select'/><!-- on:change={dataHandler}/>-->
                        </Row>

                    {:else}
                        <Row>
                            <span><strong>State: </strong></span>
                            <!-- <ChSe dropdownVals={dropdownValsState} updateNodeRef={updateNodeRef} maxItems=10 divid='chart-select-div' selectid='chart-select' setValue='' on:chonge={dataHandler} bind:selectedValuesIn={selectedValues}/> -->
                            <MultiSelect bind:selectedValues={selectedValues} bind:selected={selected} options={dropdownValsState} maxSelect={10} id='chart-select' class='multi-select'/> <!-- on:change={dataHandler}/>-->
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
            <Col xs="8" id='d3linechart-col'>
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
