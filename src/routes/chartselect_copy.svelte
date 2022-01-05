<svelte:head>
    <link rel='stylesheet' href='selectize.css'/>
    
</svelte:head>



<script> 
    import selectize from 'selectize';
    import jque from 'jquery';
    import { createEventDispatcher, onMount } from 'svelte';

    export let dropdownVals
    export let updateNodeRef
    export let maxItems;
    export let setValue;
    export let divid;
    export let selectid;
    export let stateSelected;
    

    let resetBuffer = updateNodeRef['reset'];
    let keepVals = false;
    let selfValue;
    let valueSet=false;

    let mounted3 = false;

    const dispatch = createEventDispatcher();

    const handleChange = (value) => {
        selfValue = value;
        dispatch('change', {
            value: value,
            divid: divid,
            selectid: selectid
        })
    }


    $: {
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
            let chdiv = jque('#'+divid)
            chdiv.empty()//children().remove()//chdiv.removeChild(chdiv.childNodes[0]);  
            jque('<select id="' + selectid + '"></select>').appendTo('#'+divid)
            for(let i=0;i<dropdownVals.length;i++){
                if(stateSelected=='' | stateSelected==null | stateSelected=='ALL'){
                    jque('#' + selectid).append(`<option value="${dropdownVals[i].fips}">${dropdownVals[i].text}</option>`);
                }
                else{
                    if(dropdownVals[i]['state']==stateSelected){
                        jque('#' + selectid).append(`<option value="${dropdownVals[i].fips}">${dropdownVals[i].text}</option>`);
                    }
                }
            }
            let selectizeItem1 = jque('#' + selectid).selectize({
                items: [],    
                maxItems: maxItems,
                onChange: (value) => {
                        handleChange(value);
                },
                //plugins: ['item_color']
            })            
            let selectizeItem = selectizeItem1[0].selectize; // This stores the selectize object to a variable (with name 'selectize')
            
            if(!valueSet & !keepVals){
                selectizeItem.setValue(setValue, false);
                valueSet = true;
            }
            else if(keepVals){
                selectizeItem.setValue(selfValue, false);
                keepVals = false;
            }
            

            
            
        }
    }
    
    onMount(() => {
        mounted3 = true;
        draw();
    })


</script>
<div id={divid} class='selectize-input1'>
</div>

<style>


</style>