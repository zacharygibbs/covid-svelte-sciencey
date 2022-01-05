const perPopNormFactor=100000;
const normalizeList = [
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

export const getMax = (mapValData1, attrib, normalize=false) => {
    return mapValData1.reduce((previousValue, currentObj, currentIndex) => {
        let currentVal = recursiveGetAttr(currentObj, attrib, normalize=normalize)
        if(currentVal > previousValue){
            return currentVal
        }
        else{
            return previousValue
        }
    }, -100000000)
}

export const getMin = (mapValData1, attrib, normalize=false) => {
    return mapValData1.reduce((previousValue, currentObj, currentIndex) => {
        let currentVal = recursiveGetAttr(currentObj, attrib, normalize)
        if(currentVal < previousValue){
            return currentVal
        }
        else{
            return previousValue
        }
    }, 10000000000)
}



export const recursiveGetAttr = (inObj, attrib, normalize=false) => {
    let altcalc = false;
    if(attrib == 'actuals/newCases_7d'){
        altcalc = true;
        attrib = 'metrics/caseDensity';
    }
    
    let attribSplit = attrib.split('/');
    let getVal = inObj
    for(let i=0; i<attribSplit.length; i++){
        getVal = getVal[attribSplit[i]]
    }
    if(altcalc){
        getVal = getVal * inObj.population / 100000;
    }
    if(normalize){
        if(normalizeList.includes(attrib) | altcalc){
            return getVal / inObj.population * perPopNormFactor
        }
    }
    return getVal
            
}

export const recursiveGetAttrTimeSeries = (inObj, attrib, returnmaxmin=false, normalize=false, minDate='1900-01-01', maxDate='2099-01-01') => {
    let altcalc = false;
    if(attrib == 'actuals/newCases_7d'){
        altcalc = true;
        attrib = 'metrics/caseDensity';
    }
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
    let lastDate;
    
    for(let i=0; i<getVal.length; i++){
        getVal1 = getVal[i];
        let foundDate = getVal1['date']
        for(let j=1; j<attribSplit.length; j++){
            getVal1 = getVal1[attribSplit[j]]
        }

        if(altcalc){
            getVal1 = getVal1 * inObj.population / 100000;
        }

        if(normalize){
            if(normalizeList.includes(attrib) | altcalc){
                getVal1 = getVal1 / inObj.population * perPopNormFactor
            }
        }

        //while i am here, might as well approximate a moving average
        if(i==0){
            mvavg = getVal1;
            lastDate = foundDate;
        }
        else{
            //desire 7 days, not 7 points..
            let weightalpha = (new Date(foundDate) - new Date(lastDate))/3600/1000/24/MOVINGAVGPOINTS
            mvavg = mvavg * (1 - weightalpha) + weightalpha * getVal1

        }
        if(i<MOVINGAVGPOINTS){
            mvavgValue = null;
        }
        else{
            mvavgValue = mvavg;
        }


        results.push({
            fips: inObj['fips'],
            county: inObj['county'],
            state: inObj['state'],
            url: inObj['url'],
            population: inObj['population'],
            date: foundDate,
            value: getVal1,
            movingaverage: mvavgValue
        })
        resmax = (getVal1 > resmax) & 
                 (
                    foundDate > minDate & 
                    foundDate < maxDate
                 ) ? getVal1 : resmax;
                
        resmin = (getVal1 < resmin) &
                 (
                    foundDate > minDate & 
                    foundDate < maxDate
                 ) ? getVal1 : resmin;
        
        lastDate = foundDate;
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

export const minMaxResolver = (startDate, endDate, datemin, datemax, firstTime=false) => {
    //console.log('minMaxResolver', startDate, endDate, datemin, datemax, firstTime)
    let outstartDate = null;
    let outendDate = null;
    if(!startDate & (datemin!='2399-01-01' | firstTime ) ){
        outstartDate = datemin;
    }
    else{
        datemin = startDate;
    }
    if(!endDate & ( datemax!='1900-01-01' | firstTime )){
        outendDate = datemax;
    }
    else{
        datemax = endDate;
    }
    return [datemin, datemax, outstartDate, outendDate]
}