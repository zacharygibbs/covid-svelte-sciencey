<!--
    
    future?
    add on click map to add to chart (and tell user) and or on click expand state map?
    add whole US metric
    
-->

<svelte:head>
    <link rel='stylesheet' href='mermaid.min.css'/>
</svelte:head>

<script>
    import Map from './map.svelte'
    import Chart from './chart.svelte'
    import {getMax, getMin, recursiveGetAttr} from './helpers.js'
	import { getMapData } from './_data_grabber.js'
    import { onMount } from "svelte";
    import {Col, Container, Row } from 'sveltestrap'
    import { Spinner } from 'sveltestrap';
    import {Dropdown, DropdownItem, DropdownMenu, DropdownToggle} from 'sveltestrap'
    import Grid from "gridjs-svelte";
    import { TabContent, TabPane } from 'sveltestrap';
    import { Form, FormGroup, FormText, Input, Label } from 'sveltestrap';
    
    let mapradioGroup;
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

    onMount(() => {
        console.log('start')
        let radiobtn = document.getElementById("mapCountyRadio");
        radiobtn.checked = true;
        mapradioGroup = 'county';
        getMapData()
            .then((data2) => {
                mapInData = data2;
                mapInData[3]['state'] = 'US';
                mapInData[2] = [...mapInData[2], mapInData[3]];
                console.log(mapInData[3])
                console.log('mount finished');
                mounted = true;
                loadStatus = 'Data Loaded For ' + mapInData[1].length + ' counties, and ' +  mapInData[2].length + " states"
            })      
    })


</script>


<body>
    <div class='cntnr'>
        <Container class='float-start .chart-container' style="margin-top:10px">
            <Row>
                <Col xs='3'>
                    <!-- <div id="map-menus"> -->
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
                    <!--  </div> -->
                </Col>    
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
                <Col xs="3">
                    <div id='checkbox-normalize'>
                        <FormGroup>
                            <Input id="normalizecheckbox" type="checkbox" label="Normalize per 100,000 if applicable" bind:checked={normalizeCheckbox} />
                          </FormGroup>
                    </div>
                </Col>
                <Col xs="4">
                    {#if loadStatus == 'Not Loaded'}
                        Data Load Status: Data loading ... <Spinner color="primary" /> 
                    {:else}
                        <div>Data Load Status: {loadStatus}</div>
                    {/if}
                </Col>
            </Row>
        </Container>
    </div>

    <div>
        <Container class='float-start container-fluid'>
            <Row class="chart-container">
                <TabContent>
                    <TabPane tabId="map" tab="Map" active>
                        <h2>Map - {mapSelected}</h2>
                        <Map {mapInData} {mapSelected} {mounted} {mapradioGroup} {normalizeCheckbox} bind:minVal={minVal} bind:maxVal={maxVal}/>
                    </TabPane>

                    <TabPane tabId="chart" tab="Chart">
                        <Chart {mapInData} {mapSelected} {mounted} {mapradioGroup} {minVal} {maxVal} {normalizeCheckbox}/>
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
                </TabContent>
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
