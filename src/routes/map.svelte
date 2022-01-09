<svelte:head>
    <link rel='stylesheet' href='map.css'/>
</svelte:head>
<script>
    import * as d3 from 'd3';//'../../node_modules/.pnpm/d3@7.1.1/node_modules/d3';
    import * as topojson from 'topojson';//'../../node_modules/.pnpm/d3@7.1.1/node_modules/d3';
    import { Styles } from 'sveltestrap';
    import { onMount } from "svelte";
    import { createEventDispatcher} from 'svelte';
    import {getMax, getMin, recursiveGetAttr} from './helpers.js'
    const dispatch = createEventDispatcher();
    function handleClick(event){
        dispatch('playing', {
		});
    }
    
    export let mounted
    export let mapInData
    export let mapSelected
    export let mapradioGroup
    export let minVal
    export let maxVal
    export let normalizeCheckbox

    let mounted2 = false;
    onMount(() => {
        mounted2 = true;
    })
    const width = 1000;
    const height = 700;
    const padding = 50;
    let mapData = null;
    let mapValData = null;
    let mapValDataState = null;
    
    let yearString = '2015-19';
    let yearStringBuffer = '2015-19';
    let curOpacity = 0.0;
    let map_initialized=0;
    let attrib = null;
    
    $:{ //reactively recalc inputs if parent data changes
        attrib = mapSelected;
        if(mounted & mounted2){
            console.log('trigger remap' + mapradioGroup)
            if(mapInData != []){
                mapData = mapInData[0];
                mapValData = mapInData[1];
                mapValDataState = mapInData[2];
                mapValData = addIndextoObjects([...mapValDataState, ...mapValData]);
                if(mapradioGroup=='state'){
                    minVal = getMin(mapValDataState, attrib, normalizeCheckbox)
                    maxVal = getMax(mapValDataState, attrib, normalizeCheckbox)
                }
                else{
                    minVal = getMin(mapValData, attrib, normalizeCheckbox)
                    maxVal = getMax(mapValData, attrib, normalizeCheckbox)
                }
                if(map_initialized==0){
                    initialize_map();
                }
                
                draw_map(mapInData);
            }
        }
    }

//    let mapSelected_options = ['actuals/cases', 'actuals/deaths', 'actuals/newCases', 'actuals/newDeaths',
//                               'metrics/icuCapacityRatio', 'metrics/caseDensity', 'metrics/testPositivityRatio',
//                               'metrics/vaccinationsInitiatedRatio', 'metrics/vaccinationsCompletedRatio',
//                               'riskLevels/overall'];

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



    const filterfun = (mapValData1, attrib, index1=false) => {
        
        const res = (d)=>{
            let theOne = mapValData1.filter((d2, index) => {
                return d.id==d2.fips
            })
            if(theOne.length>0){
                return recursiveGetAttr(theOne[0], attrib, normalizeCheckbox)
            }
            else{
                return []
            }
        }
        return res
    }

    const convertObjToArray = (inObj) => {
        
        if(inObj instanceof Object){
            return Object.values(inObj)
        }
        else{
            return inObj
        }
    }

    const addIndextoObjects = (inArr) => {
        let outArr = [...inArr];
        outArr.forEach((element,index) => {
            outArr[index].index = index
        });
        return outArr
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



    const initialize_map = () => {
        const svg = d3.select("#d3chart")
                            .append("svg")
                            .attr('id','svg')
                            .attr("width", width)
                            .attr("height", height)
    }            
            
    

    const draw_map = () => {   
        d3.selectAll("#d3chart > *").remove();
        const svg = d3.select("#d3chart")
                            .append("svg")
                            .attr('id','svg')
                            .attr("width", width)
                            .attr("height", height)
        d3.select('#d3chart')
                .append("div")
                .attr('id', 'tooltip')
        let path = d3.geoPath();
        let path2 = d3.geoPath();
        if(mapradioGroup=='county'){
        let map = d3.select("#svg")
                    .append('g')
                        .attr('class', 'map')
                        .selectAll('path')
                        .data(topojson.feature(mapData, mapData.objects.counties).features)
                        .enter()
                        .append('path')
                        .attr('class', 'county')
                        .attr('d', path)
                        .attr('data-fips', (d)=>{return d.id})
                        .attr('data-current', filterfun(mapValData, attrib))
                        .attr('fill', (d) => {
                            let res = filterfun(mapValData, attrib) 
                            return colorFun(res(d), minVal, maxVal)
                        })
        }

        
        




        if(mapradioGroup=='state'){
            let statemap = d3.select("#svg")
                        .append('g')
                        .selectAll('path')
                        .data(topojson.feature(mapData, mapData.objects.states).features)
                        .enter()
                        .append('path')
                        .attr('class', 'state')
                        .attr('d', path2)
                        .attr('data-fips', (d)=>{return d.id})
                        .attr('data-current', filterfun(mapValData, attrib))
                        .attr('fill', (d) => {
                            let res = filterfun(mapValData, attrib) 
                            return colorFun(res(d), minVal, maxVal)
                        })
        }
        else{
            let statemap = d3.select("#svg")
                        .append('g')
                        .selectAll('path')
                        .data(topojson.feature(mapData, mapData.objects.states).features)
                        .enter()
                        .append('path')
                        .attr('class', 'state-outline')
                        .attr('d', path2)
        }
        
        
        let legWidth = 300;
        let legRectWidth = 1;
        let legRectHeight = 15;
        let legPadding=0;
        d3.select('#legend')
            .html("")
        d3.select("#svg").append('g')
            .attr('id', 'legend')
            .attr('transform', 'translate(' + 500 + ', ' + 0 + ')')
            
        let legend = d3.select('#legend')

            
        legend.append('text')
                .attr('transform', 'translate(100, 25)')
                .attr('class','legend-text')
                .style('font-size','24px')
                .text('Legend')
                
        let avgVal = d3.mean(mapValData, (d) => recursiveGetAttr(d, attrib, normalizeCheckbox))
        let stdVal = d3.deviation(mapValData, (d) => recursiveGetAttr(d, attrib, normalizeCheckbox))
        let medVal = d3.median(mapValData, (d) => recursiveGetAttr(d, attrib, normalizeCheckbox))
        //let q1Val = d3.quantile(mapValData, (d) => recursiveGetAttr(d, attrib, normalizeCheckbox), 1)
        //let q3Val = d3.quantile(mapValData, (d) => recursiveGetAttr(d, attrib, normalizeCheckbox), 3)
        //console.log(q1Val, q3Val)
        const numStds = 5;
        

        let colorsAxis = colorFun(0,minVal, maxVal, true);//d3.scaleQuantize()
                        //.domain([0, 100])
                        //.range(colorsRes.range())
        let colorLegendAxis = d3.scaleLinear()
                        .domain([minVal, maxVal])
                        .range([0, legWidth])
        let dataLegend = makeArr(minVal,maxVal,legWidth / legRectWidth);
        if(!attrib.includes('riskLevels')){
            let newminVal = d3.max([0, avgVal - numStds*stdVal]);
            let newmaxVal = avgVal + numStds * stdVal
            console.log(minVal, newminVal, newmaxVal, maxVal);
            console.log(avgVal, stdVal, medVal)
            colorsAxis = colorFun(0,newminVal, newmaxVal, true);//d3.scaleQuantize()
                        //.domain([0, 100])
                        //.range(colorsRes.range())
            colorLegendAxis = d3.scaleLinear()
                        .domain([newminVal, newmaxVal])
                        .range([0, legWidth])
            dataLegend = makeArr(newminVal, newmaxVal, legWidth / legRectWidth);
        }


        
        //dataLegendAxis = dataLegendAxis.map((d) => {return d-0.001})
        const legAxis = d3.axisTop(colorLegendAxis)
                          .ticks([4])
                        //.tickValues(dataLegendAxis)
                        //.tickFormat(d3.format('.0f'));

        legend.append("g")
            .attr("transform", "translate(50, 50)")
            .attr('id', 'leg-axis')
            .call(legAxis)
            .selectAll('.tick')
            .attr('class','ticklabels')
        

        let newg = legend.selectAll('rect')
                    .data(dataLegend)
                    .enter()
                    .append('rect')
                    .attr("x", (d, i) => 50 + i*legRectWidth)//i * 30)
                    .attr("y", 50)//)//h - 3 * d)
                    .attr('height', legRectHeight)
                    .attr('width', legRectWidth)
                    .style('fill', (d, i) => colorsAxis(d))
            //.attr("class", "dot")

        // create a tooltip
        let tooltip = d3.select('#tooltip')
            .style('opacity', 0)
            .style('background-color', 'aquamarine')
            .style('border', 'solid')
            .style('border-width', '5px')
            .style('padding', '2px')
            .attr('data-fips', null)
            .attr('data-current', null)

        const mouseover = (event, d) => {
            curOpacity = 0.7;
            tooltip.style('opacity', curOpacity)
            tooltip.style('z-index', 100);
        }

        const mousemove = (event, d) => {
            let curindex = filterfun(mapValData,'index')(d)
            let area_name = ''
            if(mapValData[curindex]==undefined){
                //console.log('state boundary')
            }
            else{
                if(mapValData[curindex].hasOwnProperty('county')){
                    area_name = mapValData[curindex]['county']
                    let curValue = recursiveGetAttr(mapValData[curindex], attrib, normalizeCheckbox);
                    let countyStr = mapradioGroup=='county' ? 'County: '  + area_name + '<br/>' : ''
                    tooltip.html(countyStr
                                + 'State: ' + mapValData[curindex]['state'] + '<br/>'
                                + attrib + ': ' + parseFloat(curValue).toFixed(2) + '<br/>'
                                + 'Population: ' + mapValData[curindex]['population']
                    )
                            .style('left', (d3.pointer(event)[0]+ 30) + 'px')
                            .style('top', (d3.pointer(event)[1] + 30) + 'px')
                            .style('position', 'absolute')
                            .attr('data-fips', d.id)
                            .attr('data-current',parseFloat(curValue))
                }
            }


            
        }

        const mouseleave = (event, d) => {
            curOpacity = 0//curOpacity - 0.1;
            tooltip.style('opacity', curOpacity)
            tooltip.style('z-index', -100);
        }

        d3.selectAll("path").on('mouseover', mouseover)
        .on('mousemove', mousemove)
        .on('mouseleave', mouseleave)

        d3.selectAll('.state').on('mouseleave', mouseleave)

        
    }

</script>

<Styles/>
<div id='d3chart'></div>


