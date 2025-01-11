import { LitElement, css, html, nothing, repeat, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.2.1/all/lit-all.min.js';
import { APP_API_KEY_NPS, APP_API_KEY_WEATHER } from '../assets/js/_keys.js';
import { structure, theme, typography } from '../assets/js/styles.js';

class ParksGrid extends LitElement {
  static properties = {
    appOk: { type: Boolean },
    alerts: [],
    getStorageWithExpiry: { type: String },
    parks: { type: Array },
    parkAlerts: { type: Array },
    parkWeather: { type: Array },
    isOpen: {type: Boolean },
    map: {type: Object},
    mapBounds: {type: Object},
    currentPark:  {type: Object},
    randomPark: {type: Object},
    mapMarkers: { type: Array },
    search: { type: String },
  }

  constructor() {
    super();

    this.isOpen = false;
    this.parks = [];
  }

  async connectedCallback() {
    super.connectedCallback();

    await this.updateComplete;
    document.addEventListener('parks:data-ready', () => {
      const $map = this.renderRoot.getElementById('map');
      if (this.parks?.length) this._initMap($map);
    })

    this._getParks();
    this._getParkAlerts();
  }

  _formatTimestamp(timestamp) {
    const msTimestamp = timestamp * 1000;
    const dateObj = new Date(msTimestamp)
    const dateFormat = dateObj.toLocaleString('en-US', {month: 'long', day: 'numeric'});
    return dateFormat;
  }

  _setStorageWithExpiry(key, value, ttl) {
    const now = new Date();

    // `item` is an object which contains the original value
    // as well as the time when it's supposed to expire
    const item = {
      value: value,
      expiry: now.getTime() + ttl
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  _getStorageWithExpiry(key) {
    const itemStr = localStorage.getItem(key);
    
    // if the item doesn't exist, return null
    if ( !itemStr ) {
      return null;
    }

    // compare the expiry time of the item with the current time
    const item = JSON.parse(itemStr);
    const now = new Date();

    if ( now.getTime() > item.expiry ) {
      // If the item is expired, delete the item from storage
      // and return null
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  }

  async _getParks() {
    if (this._getStorageWithExpiry('parks')) {
      // Retrieve parks data from localStorage
      let storedParksData = this._getStorageWithExpiry('parks');
      console.log('Parks data retrieved from localStorage');
      console.log(storedParksData.data);
      // Store parks data in this instance
      this.parks = storedParksData.data;
      document.dispatchEvent(new CustomEvent('parks:data-ready', {
        detail: storedParksData.data
      }));
    } else {
      // Get parks data from API endpoint
      let parksData;
      let response = await fetch(`https://developer.nps.gov/api/v1/parks?stateCode=CA&api_key=${APP_API_KEY_NPS}`);

      if (response?.status >= 200 && response?.status <= 299) {
        parksData = await response.json();
      } else {
        window.setTimeout(() => {
          document.dispatchEvent(new CustomEvent('parks:data-not-ready'));
        }, 3000);
        throw Error(response.statusText);
      }
      
      if (parksData) { 
        try {
          console.log('Parks data retrieved from API');
          console.log(parksData.data);
          // Store parks data in this instance
          this.parks = parksData.data;
          // Store parks data in localStorage with 7d expiry
          this._setStorageWithExpiry('parks', parksData, 604800000);
          document.dispatchEvent(new CustomEvent('parks:data-ready', {
            detail: parksData.data
          }));
        } catch(error) {
          console.warn("Error retrieving data from parks API");
          console.log(error.name + ': ' + error.message);
        }
      }
    }
  }

  async _getParkAlerts() {
    // When park alerts data is not in local storage
    if ( !this._getStorageWithExpiry('alerts') ) {
      let response = await fetch(`https://developer.nps.gov/api/v1/alerts?stateCode=CA&limit=500&api_key=${APP_API_KEY_NPS}`);
      let data;

      if (response?.status >= 200 && response?.status <= 299) {
        data = await response.json();
      } else {
        throw Error(response.statusText);
      }
      
      if (data) { 
        try {
          console.log('Parks alert data retrieved from API');
          console.log(data.data);
          // Store parks alert data in this instance
          this.alerts = data.data;
          // Store parks alert data in localStorage with 2h expiry
          this._setStorageWithExpiry('alerts', data, 7200000);
        } catch(error) {
          console.warn("Error retrieving alerts data from parks API");
          console.log(error.name + ': ' + error.message);
        }
      }
    } else {
      console.log('Parks alert data retrieved from localStorage');
      // Retrieve parks data from localStorage
      let alertsData = this._getStorageWithExpiry('alerts');
      console.log(alertsData.data);
      // Store parks data in this instance
      this.alerts = alertsData.data;
    }
  }

  _getParkWeather(code, lat, lng) {
    if ( this.parkWeather.length ) {
      this.parkWeather = [];
    }
    if ( !this._getStorageWithExpiry(`weather_${code}`) ) {
      if ( lat !== '' && lng !== '' ) {
        fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&units=imperial&
        exclude=current,minutely,hourly&appid=${APP_API_KEY_WEATHER}`)
        .then(response => { 
          if ( response.status >= 200 && response.status <= 299 ) {
            return response.json();
          } else {
            throw Error(response.statusText);
          }
        })
        .then(data => { 
          let weatherData = data.daily;
          // Build a request URL for the weather condition icons
          weatherData.forEach(day => {
            day.weather[0].iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
          });
  
          // Store park weather data in this instance
          this.parkWeather = weatherData;
          // Store park weather data in local storage with 2h expiry
          this._setStorageWithExpiry(`weather_${code}`, weatherData, 7200000);
        })
        .catch(error => { console.log(error); })
      } else {
        this.parkWeather = [];
      }
    } else {
      // Retrieve park weather data from local storage
      let weatherData = this._getStorageWithExpiry(`weather_${code}`);
      // Build a request URL for the weather condition icons
      weatherData.forEach(day => {
        day.weather[0].iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
      });

      // Store park weather data in this instance
      this.parkWeather = weatherData;
    }
  }

  async _initMap(map) {
    const { Map } = await google.maps.importLibrary("maps");
    this.map = new Map(map, {
      center: {
        lat: 36.7783,
        lng: -119.4179,
      },
      mapId: 'd51bf260405d55a2',
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      streetViewControl: false,
      zoom: 8
    });
    this._addLocations(this.map);
  }

  async _addLocations (map) {
    console.log('Adding locations...');
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    let markers = [];
    
    // Set bounds
    let bounds = new google.maps.LatLngBounds();

    for (const park of this.parks) {
      const latitude = Number(park.latitude);
      const longitude = Number(park.longitude);
      
      // If parks don't have coordinates, and or their coordinates are 
      // outside of California, give that park new coords inside of California.

      if ( latitude && longitude ) {
        // Configure marker appearance
        const markerStyle = new PinElement({
          background: '#345124',
          borderColor: '#345124',
          glyphColor: '#ffffff',
        })
        // Create marker
        const marker = new AdvancedMarkerElement({
          map,
          position: {lat: latitude, lng: longitude},
          title: park.fullName,
          content: markerStyle.element,
        });
        markers.push(marker);

        // What happens when a marker is clicked
        google.maps.event.addListener(marker, 'click', function() {
          // Open info pane
          this._selectLocation(park.parkCode, map, park.latitude, park.longitude);
        });

        // Set marker to bounds
        bounds.extend(marker.position);
      }
    }
      
    // Store the bounds
    this.mapBounds = bounds;

    // Zoom the map to bounds
    this._zoomToBounds(map, bounds); 
  }

  _zoomMap (map, lat, lng) {
    let latitude = Number(lat);
    let longitude = Number(lng);

    if ( latitude === 0 && longitude === 0 ) {
      this._zoomToBounds(this.map, this.mapBounds);
    } else {
      map.panTo({lat: latitude, lng: longitude});
      map.setZoom(12);
    }
  }

  _zoomToBounds (map, bounds) {
    map.fitBounds(bounds);
  }

  _selectLocation (code, map, lat, lng) {
    this._setCurrentPark(code);
    this._zoomMap(map,lat,lng);
    this._openInfoPane();
    this._getParkAlerts(code);
    this._getParkWeather(code, lat, lng);
  }

  _openInfoPane () {
    this.isOpen = true;
    window.location.href = `#content`;
  }

  _closeInfoPane (code) {
    this.isOpen = false;
    this._zoomToBounds(this.map, this.mapBounds, this.mapMarkers); 
    window.location.href = `#${code}`;
  }

  _setCurrentPark(code) {
    let matchedPark;

    this.parks.forEach(park => {
      if ( park.parkCode === code ) {
        matchedPark = park;
      }
    });
    this.currentPark = matchedPark;
  }
  
  _getRandomPark (min, max) {
    let result = Math.floor(Math.random() * (max - min) + min);
    console.log('Park Index: ' + result);
    this.randomPark = this.parks[result];

    let randomParkCode = this.randomPark.parkCode;

    // Check parks alert data for our park code
    this._selectLocation(randomParkCode,this.map,this.randomPark.latitude,this.randomPark.longitude);
  }

  render() {
    return html`
      <section id="parksMap" class="parks__section bg-sand">
        <div
          id="map"
          class="col-1-2"
          role="region"
          aria-label="National Parks in California on a Google Map">
        </div>
      </section>
      <section id="parksContent" class="parks__section bg-scrub">
        <div
          id="interactionPane"
          class="${this.isOpen ? 'is-open' : ''}"
        >
          <div class="header bg-olive c-white">
            <div class="header__content">
              <h1>Explore California NPS</h1>
              <p>
                Whether you're looking to collect a few more stamps for your National Parks passport booklet, or just interested in California's parks, monuments and historical sites, use this app to explore the parts of California that have been protected for all to enjoy.
              </p>
            </div>
            <parks-actions></parks-actions>
          </div>
          ${when(this.parks.length,
            () => html`
              <ul id="parksList" class="grid" data-show="searchFilteredParks.length">
                 ${repeat(
                  this.parks, (park) => park.parkCode, (park, index) => html`
                    <li
                      class="card bg-sand c-green"
                    >
                      ${park.fullName}
                    </li>
                  `
                )}
                <!--<li class="col-1-3 card green bg-sand"
                tabindex="0" 
                :id="park.parkCode" 
                :aria-label="park.fullName" 
                v-for="park in searchFilteredParks" 
                :key="park.id" 
                @click="_selectLocation(park.parkCode, map, park.latitude, park.longitude);" 
                @keydown.enter="_selectLocation(park.parkCode, map, park.latitude, park.longitude)">
                  {{ park.fullName }}
                </li>-->
              </ul>
            `,
            () => nothing,
          )}
          
           
          <div id="listError" class="grid grid--column grid--center content--1x" v-show="!searchFilteredParks.length">
            <p class="white">Sorry, there are no results for that search term.</p>
          </div>
        </div>
      </section>
    `;
  }

  static styles = [
    structure,
    theme,
    typography,
    css`
      :host {
        display: flex;
        flex-direction: column;

        @media screen and (min-width: 768px) {
          height: 100vh;
          flex-direction: row;
        }
      }
      .parks__section {
        width: 100%;

        @media screen and (min-width: 768px) {
          width: 50%;
        }
      }
      #parksMap {
      }
      #map {
        height: 100%;  
        max-height: 360px;
        
        @media only screen and (min-width: 768px) {
          max-height: unset;
        }
      }
      #parksContent {
        height: 100%;

        @media only screen and (min-width: 768px) {
          overflow-x: hidden;
          overflow-y: auto;
          position: relative;
        }
      }
      .header__content {
        padding: var(--var-spacing-4);
      }
      #parksList {
        gap: var(--var-spacing-4);
        grid-template-columns: 1fr 1fr 1fr;
        list-style: none;
        margin: 0;
        padding: var(--var-spacing-4);
      }
      .card {
        border-radius: 4px;
        box-sizing: border-box;
        cursor: pointer;
        font: var(--var-font-p);
        font-family: var(--var-font-heading);
        min-height: 100px;
        padding: 8px;
        text-align: center;
        text-decoration: none;

        &:hover,
        &:focus {
          background: var(--var-color-sand);
        }
        a {
          color: var(--var-color-green);
          text-decoration: none;
        }
      }
    `
  ];
}
customElements.define('parks-grid', ParksGrid);