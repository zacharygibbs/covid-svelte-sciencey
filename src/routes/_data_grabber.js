import * as d3 from 'd3';

const APIKEY = "7594cedfa81a431c9d6ff4592630b6cd";

export const getMapData = () => {
    return Promise.all([d3.json('counties.json'), d3.json('https://api.covidactnow.org/v2/counties.json?apiKey='+APIKEY), d3.json('https://api.covidactnow.org/v2/states.json?apiKey='+APIKEY)])
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

export async function getChartData(fipsvals, mapValsUnordered, mapradioGroup) {
    let mapVals = [];
    let urls = [];
    for(let i=0;i<fipsvals.length;i++){
        let fip = fipsvals[i]
        let tmp = mapValsUnordered.filter((value) => {
            return value.fips == fip
        })
        mapVals.push(tmp[0])
        let url
        if(mapradioGroup=='county'){
            url = getSingleTimeSeriesData(null, tmp[0].fips)
        }
        else{
            url = getSingleTimeSeriesData(tmp[0].state, null)
        }
        urls.push(d3.json(url))
    }
    if(urls.length==0){
        return 'reset';
    }
    else{
        return await Promise.all(urls)
    }
    
}

