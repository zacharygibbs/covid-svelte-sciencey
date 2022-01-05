<svelte:head>
    
</svelte:head>



<script> 
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
    export let selectedValues;

    let selectedLabels;
    let selectedValuesCur; //currently selected on dropdown; this may be different than what is passed from parent selectedValues
    let selected;

    $:{
        
    }

    let resetBuffer = updateNodeRef['reset'];
    let keepVals = false;
    let selfValue;
    let valueSet=false;
    let dropdownOptions = [{value: 'testvalue', label:'testlabel'}];
    let mounted3 = false;
    

    const dispatch = createEventDispatcher();

    $: {
        dispatch('chonge', {
            divid: divid,
            selectid: selectid,
            selectedValues: selectedValues
        })
    }

    $: {
        console.log(stateSelected)
        stateSelected
        updateNodeRef
        dropdownVals
        if(resetBuffer!=updateNodeRef['reset']){
            keepVals = true
        }
        if(valueSet & !(stateSelected=='' | stateSelected==null | stateSelected=='ALL') | resetBuffer!=updateNodeRef['reset']){
            valueSet = false;
            draw()
            resetBuffer = updateNodeRef['reset'];
        }
    }

    const draw = () => {
        if(mounted3){
            let newDropdownOptions = [];
            let selfValue = [...selectedValues];
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
                selectedValues = [];//setValue;
                valueSet = true;
                console.log(selectedValues, selectid);
            }
            else if(keepVals){
                selectedValues = selfValue;
                keepVals = false;

            }
            
            dropdownOptions = [...newDropdownOptions];
            
            
            
        }
    }
    

    onMount(() => {
        mounted3 = true;
        draw();
    })


</script>
<div id={divid} class='selectize-input1'>
        <MultiSelect bind:selected={selected} {selectedValuesCur} {selectedLabels} options={dropdownOptions} maxSelect={maxItems} id={selectid} class='multi-select'/>
</div>

<style>
    .multi-select {



    }


</style>