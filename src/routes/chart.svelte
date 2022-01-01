<svelte:head>
    <link rel='stylesheet' href='chart.css'/>
</svelte:head>

<script>
    import ChSe from './chartselect.svelte'
    
    import * as d3 from 'd3';//'../../node_modules/.pnpm/d3@7.1.1/node_modules/d3';
    
    import { Styles } from 'sveltestrap';
    import { onMount } from "svelte";
    import { Col, Container, Row } from 'sveltestrap';
    import {getMax, getMin, recursiveGetAttr} from './helpers.js'
    import { Form, FormGroup, FormText, Input, Label } from 'sveltestrap';
    
    import * as jq from 'jquery';

    export let mounted;
    export let mapInData;
    export let mapSelected;
    export let mapradioGroup;
    export let APIKEY;
    export let minVal;
    export let maxVal;

    let loadedData = [];
    let mounted2 = false;
    onMount(() => {
        mounted2 = true;
    })
    const width = 1000;
    const height = 700;
    const padding = 50;
    const paddingLeft = 150;
    const paddingBottom = 150;
    const CIRLCESIZE = 1;
    let attrib;
    let dropdownVals = [];
    let dropdownValsState = [];
    let updateNodeRef = {value:0, reset:0, keepVals:false};
    let stateSelected;
    let attribBuffer;
    let startDate;
    let endDate;
    


    $:{ //reactively recalc inputs if parent data changes
        attrib = mapSelected;
        if(mounted & mounted2 & !!mapradioGroup){
            if(mapInData != []){
                let resetVal = attrib==attribBuffer ? updateNodeRef['reset'] : updateNodeRef['reset'] + 1;
                updateNodeRef = {value:updateNodeRef['value'] + 1, reset:resetVal, keepVals:true};
                attribBuffer = attrib;
                dropdownVals = mapInData[1].map((dataItem) => {
                    let curVal = recursiveGetAttr(dataItem, attrib);
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
                    
                    let curVal = recursiveGetAttr(dataItem, attrib);
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
            mapValsUnordered = mapInData[1].filter((mapValData, index) => {
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
            if(isDataLoaded.length==0){//if no data loaded yet
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
        Promise.all(urls)
                .then((data) => {
                    loadedData = [...data];
                    console.log(loadedData)
                    draw_chart(data)
                })

    }
    
    const stateHandler = (event) => {
        if(event.detail.value!='ALL' & event.detail.value!='' & event.detail.value!=null){
            let stateSelectedFips = event.detail.value;
            let newState = mapInData[2].filter((dataItem)=>{
                return dataItem.fips == stateSelectedFips
            })
            stateSelected = newState[0]['state'];
        }
    }

    const recursiveGetAttrTimeSeries = (inObj, attrib, returnmaxmin=false) => {
        
        let attribSplit = attrib.split('/');
        let getVal = inObj;
        if(getVal[attribSplit[0]+'Timeseries']!=null){
                getVal = getVal[attribSplit[0] + 'Timeseries']
            }
        else{
            return null
        }
        let getVal1;
        let results = [];
        let mvavg;
        let mvavgValue;
        let resmax = -90000000000000
        let resmin = 90000000000000
        const MOVINGAVGPOINTS = 7;
        for(let i=0; i<getVal.length; i++){
            getVal1 = getVal[i];
            let foundDate = getVal1['date']
            for(let j=1; j<attribSplit.length; j++){
                getVal1 = getVal1[attribSplit[j]]
            }
            //while i am here, might as well approximate a moving average
            if(i==0){
                mvavg = getVal1;
            }
            else{
                mvavg = mvavg * (1-1/MOVINGAVGPOINTS) + 1/MOVINGAVGPOINTS * getVal1
            }
            if(i<MOVINGAVGPOINTS){
                mvavgValue = null;
            }
            else{
                mvavgValue = mvavg;
            }
            results.push({
                date: foundDate,
                value: getVal1,
                movingaverage: mvavgValue
            })
            resmax = getVal1 > resmax ? getVal1 : resmax;
            resmin = getVal1 < resmin ? getVal1 : resmin;
        }
        if(returnmaxmin){
            return{
                results: results,
                max: resmax,
                min: resmin
            }
        }
        else{
            return results
        }
        
    }


    const draw_chart = (data) => {
        if(!!data){
            
            let dataProcessed = [];
            let absmax = -9999999999999;
            let absmin = 9999999999999;
            let datemax = '1900-01-01';
            let datemin = '2399-01-01';
            for(let i=0; i<data.length; i++){
                let objData = recursiveGetAttrTimeSeries(data[i], attrib, true)
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
            if(!endDate & datemax!='1900-01-01'){
                endDate = datemax;
            }
            console.log(absmin, absmax, datemin, datemax)
            jq("#d3linechart").empty() // clear chart
            const svg = d3.select("#d3linechart")
                            .append("svg")
                            .attr("width", width)
                            .attr("height", height)

            const xScale = d3.scaleTime()
                .domain([new Date(datemin), new Date(datemax)])
                .range([paddingLeft, width - padding]);
            
            const yScale = d3.scaleLinear()
                .domain([absmin, absmax])
                .range([height - paddingBottom, padding]);
            
            for(let i=0; i<dataProcessed.length; i++){
                svg.selectAll("circle"+i)
                    .data(dataProcessed[i])
                    .enter()
                    .append("circle")
                    .attr("cx", (d, i) => xScale(new Date(d.date)))//i * 30)
                    .attr("cy", (d, i) => yScale(d.value))//)//h - 3 * d)
                    .attr('r', CIRLCESIZE)
                    .attr("class", "dot")
                    .attr('data-xvalue', (d, i) => d.date)
                    .attr('data-yvalue', (d, i) => d.value)

                //https://www.d3-graph-gallery.com/graph/line_basic.html
                svg.append("path"+i)
                .data(dataProcessed[i])
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                        .x((d) => { return xScale(new Date(d.date)) })
                        .y((d) => { return yScale(d.movingaverage) })
                )
            }
        

            const xAxis = d3.axisBottom(xScale)
                            .tickFormat(d3.format('.0f'));

            const yAxis = d3.axisLeft(yScale)
                            .tickArguments([10,""])
                            .tickFormat(d3.timeFormat("%M:%S"));
            

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
                .text("Year");

            svg.append('text')
                .attr('id', 'ylabel')
                .attr('transform', 'translate(' + (paddingLeft)/2+',' + (height - paddingBottom) / 2 + ')rotate(270)')
                .style("text-anchor", "middle")
                .attr('class', 'axislabel')
                .text("Time (mm:ss)");
            

            svg.append('g')
               .attr('id', 'legendlinechart')
               .attr('transform', 'translate(600, 200)')
               
            let legend = d3.select('#legendlinechart')

            legend.append('rect')
                  .style('stroke', 'black')
                  .style('stroke-width', '3px')
                  .style('padding', '2px')
                  .style('width', 200)
                  .style('height', 100);
                
            legend.append('text')
                  .attr('transform', 'translate(100, 25)')
                  .attr('class','legend-text')
                  .style('font-size','24px')
                  .text('Legend')
                  
               
            legend.append('circle')
               .attr("cx", 30)//i * 30)
               .attr("cy", 50)//)//h - 3 * d)
               .attr('r', CIRLCESIZE)
               .attr("class", "dot")
               
            legend.append('text')
                  .attr('transform', 'translate(90, 53)')
                  .attr('class','legend-text')
                  .text('Data')



            // create a tooltip
            let tooltip = d3.select('#d3linechart')
                .append("div")
                .attr('id', 'tooltip')
                .style('opacity', 0)
                .style('background-color', 'aquamarine')
                .style('border', 'solid')
                .style('border-width', '5px')
                .style('padding', '2px')
                .attr('datadate', null)

            const mouseover = (event, d) => {
                tooltip.style('opacity', 0.7)
            }

            const mousemove = (event, d) => {
                tooltip.html('Name: ' + d.Name + '<br/>' 
                        + 'Doping: ' + d.Doping + '<br/>'
                        + 'Nationality: ' + d.Nationality + '<br/>'
                        + 'URL: <a href="' + d.URL + '">Wikipedia</a>')
                    .style('left', (d3.pointer(event)[0]) + 'px')
                    .style('top', (d3.pointer(event)[1] + 150) + 'px')
                    .style('position', 'absolute')
                    .attr('data-year', d.Year)
            }

            const mouseleave = (event, d) => {
                tooltip.style('opacity', 0)
            }

            d3.selectAll("circle").on('mouseover', mouseover)
            .on('mousemove', mousemove)
            .on('mouseleave', mouseleave)

        }
    }

    const handleDateChange = (event) => {
        console.log(event.target.id, startDate, endDate)
        draw_chart()
        //if(event.target.id=='startDate'){
        //    startDate = event.target.value
        //}
        //else{
        //    endDate = event.target.value
        //}
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
                            <span><strong>State: </strong>(If changed, county dropdown will be reset)</span>
                            <ChSe dropdownVals={dropdownValsState} updateNodeRef={updateNodeRef} maxItems=1 divid='chart-select-state-div' selectid='chart-state-select' setValue='ALL' on:change={stateHandler}/>    
                        </Row>
                        <Row>
                            <span><strong>County: </strong></span>
                            <ChSe dropdownVals={dropdownVals} updateNodeRef={updateNodeRef} stateSelected={stateSelected} maxItems=10 divid='chart-select-div' selectid='chart-select' setValue='' on:change={dataHandler} />
                        </Row>
                        <Row>
                            <FormGroup>
                                <Label for="startDate">Start Date</Label>
                                <Input
                                  type="date"
                                  name="startDate"
                                  id="startDate"
                                  placeholder="date placeholder"
                                  bind:value={startDate}
                                  on:change={handleDateChange}
                                />
                                <Label for="endDate">End Date</Label>
                                <Input
                                  type="date"
                                  name="endDate"
                                  id="endDate"
                                  placeholder="date placeholder"
                                  bind:value={endDate}
                                  on:change={handleDateChange}
                                />
                              </FormGroup>
                        </Row>
                    {:else}
                        <span><strong>State: </strong></span>
                        <ChSe dropdownVals={dropdownValsState} updateNodeRef={updateNodeRef} maxItems=10 divid='chart-select-div' selectid='chart-select' setValue='' on:change={dataHandler} />
                    {/if}    
                {/if}


            </Col>
            <Col xs="auto">
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
