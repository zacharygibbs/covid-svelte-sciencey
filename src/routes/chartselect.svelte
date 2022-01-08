<svelte:head>
    
</svelte:head>


<script> 
    // The problem is that we need to use selected rather than selected values i believe (selected values and selected labels are read only..)
//realistically we just need to move this guy into the chart.svelte?
    //import selectize from 'selectize';
    //import jque from 'jquery';
    import MultiSelect from 'svelte-multiselect'
    
    
    import { createEventDispatcher, onMount } from 'svelte';

    export let dropdownVals
    export let updateNodeRef
    export let maxItems;
    export let setValue;
    export let divid;
    export let selectid;
    export let stateSelected;
    export let selectedValuesIn;

    let selected = [];
    let selectedValues;
    let resetBuffer;
    


    
    let keepVals = false;
    let selfValue;
    let valueSet=false;
    let dropdownOptions = [{value: 'testvalue', label:'testlabel'}];
    let mounted3 = false;
    

    const dispatch = createEventDispatcher();

    $: console.log('selectedValuesIn have changed', selectedValuesIn, divid, selectid)

    $: {
        selectedValuesIn = selectedValues;
        dispatch('chonge', {
            divid: divid,
            selectid: selectid,
            selectedValues: selectedValues
        })
    }

    $: {
        if(!!!resetBuffer){
            resetBuffer = 0;//updateNodeRef['reset'];
        }
        console.log(stateSelected)
        stateSelected
        updateNodeRef
        dropdownVals
        keepVals = resetBuffer!=updateNodeRef['reset']
        if(valueSet & !(stateSelected=='' | stateSelected==null | stateSelected=='ALL') | resetBuffer!=updateNodeRef['reset']){
            valueSet = false;
            draw()
            resetBuffer = updateNodeRef['reset'];
        }
    }

    const draw = () => {
        if(mounted3){
            let newDropdownOptions = [];
            selfValue = [...selected];
            for(let i=0;i<dropdownVals.length;i++){
                
                if(stateSelected=='' | stateSelected==null | stateSelected=='ALL'){
                    newDropdownOptions.push({
                                            value:dropdownVals[i].fips,
                                            label: dropdownVals[i].text,
                                            preselected: dropdownVals[i].text=='ALL'
                    });
                    
                }
                else{
                    if(stateSelected == dropdownVals[i].state){
                        newDropdownOptions.push({
                                                value:dropdownVals[i].fips,
                                                label: dropdownVals[i].text,
                        });
                    }
                }
                
            }

            if(!valueSet & !keepVals){
                selected = setValue=='' ? [] : [{label: setValue, value: setValue}];
                //setValue;
                valueSet = true;
                console.log('1setforfirst time', selectedValues, selectid);
            }
            else if(keepVals){
                selected = selfValue.map((value) => {
                    let res = newDropdownOptions.filter(value2 => value.value == value2.value)
                    return ({value:value, label:res[0].text})
                });
                keepVals = false;
                console.log('2-change dropdowns but keep values', selected, selectid);
            }
            else{
                selected = setValue=='' ? [] : [{label: setValue, value: setValue}];
                console.log('3-change dropdowns, reset values', selected, selectid);
            }
            console.log(newDropdownOptions);
            dropdownOptions = [...newDropdownOptions];
            
            
            
        }
    }
    

    onMount(() => {
        mounted3 = true;
        draw();
    })


</script>
<div id={divid} class='selectize-input1'>
        <MultiSelect bind:selectedValues={selectedValues} selected={selected} options={dropdownOptions} maxSelect={maxItems} id={selectid} class='multi-select'/>
</div>

<style>
    .multi-select {



    }


</style>