<svelte:head>
    <title> covid-dash-sciencey</title>      
    <link rel='stylesheet' href='mermaid.min.css'/>
</svelte:head>
<script>
    /*import { getMapData } from './_data_grabber.js'
    import { onMount } from "svelte";*/
    import { Styles } from 'sveltestrap';
    import {
        Collapse,
        Navbar,
        NavbarToggler,
        NavbarBrand,
        Nav,
        NavItem,
        NavLink,
        Dropdown,
        DropdownToggle,
        DropdownMenu,
        DropdownItem
    } from 'sveltestrap';
    import {Col, Container, Row } from 'sveltestrap'

    let isOpen = false;
    /*let loadStatus = 'Not Loaded';
    let mapInData = [];*/

    function handleUpdate(event) {
        isOpen = event.detail.isOpen;
    }

  /*onMount(() => {
        console.log('start')
        let radiobtn = document.getElementById("mapCountyRadio");
        radiobtn.checked = true;
        mapradioGroup = 'county';
        getMapData()
            .then((data2) => {
                mapInData = data2;
                console.log('mount finished');
                mounted = true;
                loadStatus = 'Data Loaded For ' + mapInData[1].length + ' counties, and ' +  mapInData[2].length + " states"
            })      
    })*/
</script>

<Styles />

<Navbar color="primary" light={false} dark={true} expand="md">
  <NavbarBrand href="/">covid-svelte-sciencey</NavbarBrand>
  <NavbarToggler on:click={() => (isOpen = !isOpen)} />
  <Collapse {isOpen} navbar expand="md" on:update={handleUpdate}>
    <Nav class="ms-auto" navbar>
      <NavItem>
        <NavLink href="#about">About</NavLink>
      </NavItem>
    </Nav>
  </Collapse>
</Navbar>



<slot></slot>
    <div id='about'>
        <Container class='float-start .chart-container'>
            <Row>
                <hr/>    
                <div class='float-start'>Source: <a href="https://covidactnow.org/">CovidActNow.org</a></div>            
                <div>Created by Zach Gibbs, December 2021 using <a href="https://svelte.dev/"><img src="https://raw.githubusercontent.com/sveltejs/svelte/29052aba7d0b78316d3a52aef1d7ddd54fe6ca84/site/static/images/svelte-android-chrome-512.png" id='svelte-logo'/>Svelte</a>/<a href="https://kit.svelte.dev/">SvelteKit</a></div>
            </Row>
        </Container>
    </div>

<style>
    
    #svelte-logo {
        height: 20px;
        width: auto;

    }

</style>