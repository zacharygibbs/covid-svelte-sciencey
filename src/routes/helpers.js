

export const getMax = (mapValData1, attrib, mapradioGroup) => {
    return mapValData1.reduce((previousValue, currentObj, currentIndex) => {
        let currentVal = recursiveGetAttr(currentObj, attrib)
        if(currentVal > previousValue){
            return currentVal
        }
        else{
            return previousValue
        }
    }, -100000000)
}

export const getMin = (mapValData1, attrib, mapradioGroup) => {
    return mapValData1.reduce((previousValue, currentObj, currentIndex) => {
        let currentVal = recursiveGetAttr(currentObj, attrib)
        if(currentVal < previousValue){
            return currentVal
        }
        else{
            return previousValue
        }
    }, 10000000000)
}

export const recursiveGetAttr = (inObj, attrib) => {
    let attribSplit = attrib.split('/');
            let getVal = inObj
            for(let i=0; i<attribSplit.length; i++){
                getVal = getVal[attribSplit[i]]
            }
            return getVal
}