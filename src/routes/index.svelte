<!--

    
    2) fix map legend text & number of items and decimal points
    
    (done) 4) normalize number of cases, deaths; number of new cases/deaths
    -- defer till later; 5) 7 day moving average? - doesn't look great for FL? it's incorrect when their reporting is wonky; or for LA ICU Bed Capaicty
    (done) 6) changing state does not change county drop down? when many counties already selected this in the case.
    (done) 8) on popup - show population?
    --defer 9) double trigger draw event when checkbox?
    10) Need to fix up data pull so that not as many API calls are needed during each switch?
    11) need to pretty up the whole thing (layout/menu, about page?)
    12 - need to not factor max/min for scale when value is outside of date range (perhaps do date filtering first?)
    (done) 13 - new cases - showing zero in dropdown for OK. same with map for many states; not ideal! - new deaths would require more work.
    14- pretty up 
    15) Security around api key?
    
    add on click map to add to chart (and tell user) and or on click expand state map?
    add whole US metrics
    





    a few options - on click chart - table pops up with releant info?

    Toggle for state vs county view, checkbox to normalize w/ population (if not already)

    Add a time-series for a particular county or group of counties

    on clicking on a state it pops up the state view by county?

    Selectize Dropdown with ability to add counties to time series trend
    
    fix legend ticks in some cases

    fix scale in some cases 

    


-->

<svelte:head>
    <title> covid-dash-sciencey</title>      
    <link rel='stylesheet' href='mermaid.min.css'/>
</svelte:head>

<script>
    import Map from './map.svelte'
    import Chart from './chart.svelte'
    import {getMax, getMin, recursiveGetAttr} from './helpers.js'

    import * as d3 from 'd3';//'../../node_modules/.pnpm/d3@7.1.1/node_modules/d3';
    import { onMount } from "svelte";
    import { Styles } from 'sveltestrap';
    import {Col, Container, Row } from 'sveltestrap'
    import {Dropdown, DropdownItem, DropdownMenu, DropdownToggle} from 'sveltestrap'
    import Grid from "gridjs-svelte";
    import { TabContent, TabPane } from 'sveltestrap';
    import { Form, FormGroup, FormText, Input, Label } from 'sveltestrap';
    
    let mapradioGroup;
    let APIKEY = '';
    let mounted = false;
    let loadStatus = 'Not Loaded';
    let mapInData = [];
    let normalizeCheckbox = true;

    let mapSelected_options = [
                               'riskLevels/overall',
                               'riskLevels/caseDensity',
                               'riskLevels/icuCapacityRatio',
                               'riskLevels/infectionRate',
                               'riskLevels/testPositivityRatio',
                               'metrics/caseDensity',
                               'metrics/testPositivityRatio', 
                               'metrics/icuCapacityRatio',
                               'metrics/vaccinationsInitiatedRatio', 
                               'metrics/vaccinationsCompletedRatio',
                               'metrics/infectionRate',
                               'actuals/cases', 
                               'actuals/deaths', 
                               'actuals/newCases', 
                               'actuals/newCases_7d', 
                               'actuals/newDeaths',
                               'actuals/hospitalBeds/capacity',
                               'actuals/hospitalBeds/currentUsageCovid',
                               'actuals/hospitalBeds/currentUsageTotal',
                               'actuals/icuBeds/capacity',
                               'actuals/icuBeds/currentUsageCovid',
                               'actuals/icuBeds/currentUsageTotal',
                               'population'
                               ];
    let mapSelected = mapSelected_options[0];
    let minVal = null;
    let maxVal = null;
    let columns = ['county', 'state', 'lastUpdatedDate', mapSelected];
    let grid
    let data = null;
    $: {
        mapSelected
        if(mapInData!=[] & mounted){
            let mapData = null;
            if(mapradioGroup=='county'){
                mapData = mapInData[1];
            }
            else{
                mapData = mapInData[2];
            }
            let tmpData = mapData.filter((item, index) => {
                return recursiveGetAttr(item, mapSelected, normalizeCheckbox)!=null;
            })
            .map((item, index) => {
                let outObj = [];
                if(mapradioGroup=='county'){
                    outObj =  [item['county'] + ', ' + item['state'], item['lastUpdatedDate']];
                }
                else{
                    outObj = [item['state'], item['lastUpdatedDate']];
                }
                outObj.push(recursiveGetAttr(item, mapSelected, normalizeCheckbox));
           //for(let i=0;i<mapSelected_options.length;i++){
            //outObj.push(recursiveGetAttr(item, mapSelected_options[i]));
           //}
           return outObj
        })
        data = tmpData.sort((a,b) => {
            
            return b[2] - a[2]
        });
        }
    }

    $: columns = ['county, state', 'lastUpdatedDate', mapSelected];
    
    



    let getAPIKey = () => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if(APIKEY==''){
                    d3.json('covid_api_key.json')
                        .then((data) => {
                            resolve(data);
                        })
                    }
                else{
                    resolve(APIKEY)
                }
            }, 2000);
        });
    }


    const getMapData = (apikey) => {
        return Promise.all([d3.json('counties.json'), d3.json('https://api.covidactnow.org/v2/counties.json?apiKey='+apikey), d3.json('https://api.covidactnow.org/v2/states.json?apiKey='+apikey)])
    }

    onMount(() => {
        console.log('start')
        let radiobtn = document.getElementById("mapCountyRadio");
        radiobtn.checked = true;
        mapradioGroup = 'county';
        getAPIKey()
            .then(
                (data) => {
                    APIKEY = data;
                    getMapData(data)
                        .then((data2) => {
                            mapInData = data2;
                            console.log('mount finished');
                            mounted = true;
                            loadStatus = 'Data Loaded For ' + mapInData[1].length + ' counties, and ' +  mapInData[2].length + " states"
                            console.log(mapInData);
                        })    
                    
                }
            )
    })


</script>

<Styles />

<body>
    <h1 id="title"> covid-svelte-sciencey</h1>
    <div>Data Load Status: {loadStatus}</div>
    <div class='cntnr'>
        <Container class='float-start .chart-container'>
            <Row>
                <Col xs='2'>
                    <FormGroup>
                        <div class="radiofieldgroup">
                            <Input
                                id="mapCountyRadio"
                                type="radio"
                                bind:group={mapradioGroup}
                                value="county"
                                label="county"
                            />
                        </div>
                        <div class="radiofieldgroup">
                            <Input
                                id="mapStateRadio"
                                type="radio"
                                bind:group={mapradioGroup}
                                value="state"
                                label="State"
                            />
                        </div>
                    </FormGroup>
                </Col>
                <Col xs = "4">
                    <div id='checkbox-normalize'>
                        <FormGroup>
                            <Input id="normalizecheckbox" type="checkbox" label="Normalize per 100,000 for applicable items" bind:checked={normalizeCheckbox} />
                          </FormGroup>
                    </div>
                </Col>
            </Row>
            <Row>
                <Col xs='1'>
                    <div id="map-menus">
                        <Row>
                            <Col>
                                <Dropdown>
                                    <DropdownToggle caret>{mapSelected}</DropdownToggle>
                                    <DropdownMenu>
                                        {#each mapSelected_options as mst}
                                            <DropdownItem on:click={() => {
                                                                            mapSelected = mst;
                                                                            Map.mapSelected
                                                                            }}>
                                                {mst}
                                            </DropdownItem>
                                        {/each}
                                    </DropdownMenu>
                                </Dropdown>
                            </Col>
                        </Row>
                    </div>
                </Col>
            </Row>
                
            
        </Container>
    </div>

    <div>
        <Container class='float-start container-fluid'>
            <Row class="chart-container">
                <TabContent>
                    <TabPane tabId="map" tab="Map" active>
                        <h2>Map</h2>
                        <Map {mapInData} {mapSelected} {mounted} {mapradioGroup} {normalizeCheckbox} bind:minVal={minVal} bind:maxVal={maxVal}/>
                    </TabPane>
                    <TabPane tabId="table" tab="Table">
                        <h2>Table</h2>
                        {#if data!=null}
                        <Grid 
                            bind:instance={grid}
                            {data} 
                            columns={columns} 
                            pagination= {
                                {
                                    enabled: true,
                                    limit: 100,
                                    summary: true
                                }
                            }
                            
                            search={true}
                            sort={true}
                            resizeable={true}
                            width=100%
                        />
                        {/if}
                    </TabPane>
                    <TabPane tabId="chart" tab="Chart">
                        <Chart {mapInData} {mapSelected} {mounted} {mapradioGroup} {APIKEY} {minVal} {maxVal} {normalizeCheckbox}/>
                    </TabPane>
                </TabContent>
            </Row>
        </Container>
    </div>
    <div>
        <Container class='float-start .chart-container'>
            <Row>
                <hr/>    
                <div class='float-start'>Source: <a href="https://covidactnow.org/">CovidActNow.org</a></div>            
            </Row>
        </Container>
    </div>
      

</body>

<style>
    #map-menus {
        width: 500px;
        stroke: black;
        stroke-width: 1;
    }

    .radiofieldgroup{
    float: left;
    width: auto;
    margin-left: 5px;
    margin-right: 5px;
    }

    .tabdiv{
        width: auto;
    }    

    .chart-container {
        width: 100%;
        margin: 10px;
        background-color: #fe3e4a;
        
    }

</style>
