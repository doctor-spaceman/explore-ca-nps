import { LitElement, css, html, nothing, repeat, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.2.1/all/lit-all.min.js';
import { APP_API_KEY_NPS, APP_API_KEY_WEATHER } from '../assets/js/_keys.js';
import { structure, theme, typography } from '../assets/js/styles.js';
import { getLocalStorageWithExpiry, setLocalStorageWithExpiry } from '../assets/js/utils.js';

class ParksGrid extends LitElement {
  static properties = {
    alerts: { type: Array },
    parks: { type: Array },
    parkAlerts: { type: Array },
    parkWeather: { type: Array },
    map: {type: Object},
    mapBounds: {type: Object},
    currentPark:  {type: Object},
    randomPark: {type: Object},
    mapInfoWindows: { type: Array },
    mapMarkers: { type: Array },
    searchTerm: { type: String },
  }

  get filteredParks() {
    return this.parks?.filter(park => {
      return park.fullName.toLowerCase().includes(
        this.searchTerm.toLowerCase()
      );
    });
  }

  get parkOnLoad() {
    return this.parks?.find(
      (park) => `#${park.parkCode}` === window.location.hash
    )
  }

  constructor() {
    super();

    this.alerts = [];
    this.parks = [];
    this.parkAlerts = [];
    this.parkWeather = [];
    this.mapInfoWindows = [];
    this.mapMarkers = [];
    this.searchTerm = '';
  }

  async connectedCallback() {
    super.connectedCallback();

    await this.updateComplete;

    window.addEventListener('popstate', () => {
      if (this.parkOnLoad) {
        this._selectLocation(
          this.parkOnLoad.parkCode,
          this.parkOnLoad.latitude,
          this.parkOnLoad.longitude,
        )
        for (const infoWindow of this.mapInfoWindows) {
          infoWindow.instance.close();
        }
      } else {
        const $infoDrawer = document.querySelector('parks-info-drawer');
        if ($infoDrawer.active) $infoDrawer._closeInfoDrawer();
      }
    })
    document.addEventListener('parks:data-ready', () => {
      const $map = this.renderRoot.getElementById('map');
      if (this.parks?.length) this._initMap($map);
    })
    document.addEventListener('parks:parks-searched', (event) => {
      this.searchTerm = event.detail.search_term;
    })
    document.addEventListener('parks:parks-random', (event) => {
      this._setRandomPark(event);
    })
    document.addEventListener('parks:info-drawer-closed', () => {
      for (const infoWindow of this.mapInfoWindows) {
        infoWindow.instance.close();
      }
      this._zoomToBounds(this.map, this.mapBounds);
    })

    this._getParks();
    this._getParkAlerts();
  }

  async _getParks() {
    if (getLocalStorageWithExpiry('parks')) {
      // Retrieve parks data from localStorage
      let storedParksData = getLocalStorageWithExpiry('parks');

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
          this.parks = parksData.data;

          // Store parks data in localStorage with 7d expiry
          setLocalStorageWithExpiry('parks', parksData, 604800000);

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

  async _getParkAlerts(identifier) {
    if (identifier) {
      let alerts = [];
      for (const alert of this.alerts) {
        if (alert.parkCode === identifier ) alerts.push(alert);
      }
      this.parkAlerts = alerts;
    } else {
      // When park alerts data is not in local storage
      if ( !getLocalStorageWithExpiry('alerts') ) {
        let response = await fetch(`https://developer.nps.gov/api/v1/alerts?stateCode=CA&limit=500&api_key=${APP_API_KEY_NPS}`);
        let data;

        if (response?.status >= 200 && response?.status <= 299) {
          data = await response.json();
        } else {
          throw Error(response.statusText);
        }
        
        if (data) { 
          try {
            this.alerts = data.data;

            // Store parks alert data in localStorage with 2h expiry
            setLocalStorageWithExpiry('alerts', data, 7200000);
          } catch(error) {
            console.warn("Error retrieving alerts data from parks API");
            console.log(error.name + ': ' + error.message);
          }
        }
      } else {
        // Retrieve parks data from localStorage
        let alertsData = getLocalStorageWithExpiry('alerts');
        this.alerts = alertsData.data;
      }
    }
  }

  async _getParkWeather(identifier, lat, lng) {
    let response;
    let data;

    if (!getLocalStorageWithExpiry(`weather_${identifier}`)) {
      if (lat.length && lng.length ) {
        response = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&units=imperial&exclude=current,minutely,hourly&appid=${APP_API_KEY_WEATHER}`);
        if (response.status >= 200 && response.status <= 299) {
          data = await response.json();
        } else {
          throw Error(response.statusText);
        }
        if (data) {
          try {
            let weatherData = data.daily;
            // Build a request URL for the weather condition icons
            for (const day of weatherData) {
              day.weather[0].iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
            }
    
            // Store park weather data in this instance
            this.parkWeather = weatherData;

            // Store park weather data in local storage with 2h expiry
            setLocalStorageWithExpiry(`weather_${identifier}`, weatherData, 7200000);
          } catch(error) {
            console.warn("Error retrieving conditions from weather API");
            console.log(error.name + ': ' + error.message);
          }
        }
      }
    } else {
      // Retrieve park weather data from local storage
      let weatherData = getLocalStorageWithExpiry(`weather_${identifier}`);

      // Build a request URL for the weather condition icons
      for (const day of weatherData) {
        day.weather[0].iconUrl = `https://openweathermap.org/img/wn/${day.weather[0].icon}@2x.png`;
      }

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
    const { InfoWindow } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    let bounds = new google.maps.LatLngBounds();

    for (const park of this.parks) {
      const latitude = Number(park.latitude);
      const longitude = Number(park.longitude);

      if ( latitude && longitude ) {
        // Configure marker appearance
        const markerStyle = new PinElement({
          background: '#345124',
          borderColor: '#345124',
          glyphColor: '#ffffff',
        })

        // Create marker
        const marker = new AdvancedMarkerElement({
          map: map,
          position: {lat: latitude, lng: longitude},
          title: park.fullName,
          content: markerStyle.element,
        });
        const markerItem = {
          instance: marker,
          lat: latitude,
          lng: longitude
        }
        this.mapMarkers.push(markerItem);

        const infoWindow = new InfoWindow({
          headerContent: park.fullName
        });
        const infoWindowItem = {
          instance: infoWindow,
          lat: latitude,
          lng: longitude
        }
        this.mapInfoWindows.push(infoWindowItem);

        google.maps.event.addListener(marker, 'click', () => {
          for (const infoWindow of this.mapInfoWindows) {
            infoWindow.instance.close();
          }
          infoWindow.open({
            anchor: marker,
            map: map
          });
          this._selectLocation(park.parkCode, park.latitude, park.longitude);
        });

        bounds.extend(marker.position); // Set marker to bounds
      }
    }
      
    this.mapBounds = bounds; // Store the bounds
    this._zoomToBounds(map, bounds); // Zoom the map to bounds

    // When the page is requested with a park code in window.location.hash
    if (this.parkOnLoad) {
      this._selectLocation(
        this.parkOnLoad.parkCode,
        this.parkOnLoad.latitude,
        this.parkOnLoad.longitude,
      )
    }
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

  async _selectLocation (identifier, lat, lng) {
    this._setCurrentPark(identifier);
    this._zoomMap(this.map, lat, lng);
    await this._getParkAlerts(identifier);
    await this._getParkWeather(identifier, lat, lng);

    document.dispatchEvent(new CustomEvent('parks:park-selected', {
      detail: {
        selected_park: this.currentPark,
        selected_park_alerts: this.parkAlerts,
        selected_park_weather: this.parkWeather
      }
    }));

    // Show info window
    const activeInfoWindow = this.mapInfoWindows.find((infoWindow) => (
      infoWindow.lat === Number(lat) && infoWindow.lng === Number(lng)
    ));
    const activeMarker = this.mapMarkers.find((marker) => (
      marker.lat === Number(lat) && marker.lng === Number(lng)
    ));
    if (activeInfoWindow && activeMarker) {
      activeInfoWindow.instance.open({
        anchor: activeMarker.instance,
        map: this.map
      });
    } 
  }

  _setCurrentPark (identifier) {
    for (const park of this.parks) {
      if (park.parkCode === identifier) this.currentPark = park;
    }
  }
  
  _setRandomPark (event) {
    this.randomPark = this.parks[event.detail.park_index]
    this._selectLocation(
      this.randomPark.parkCode,
      this.randomPark.latitude,
      this.randomPark.longitude
    );
  }

  render() {
    return html`
      <section id="parksMap" class="parks__section bg-sand">
        <div
          id="map"
          role="region"
          aria-label="National Parks in California on a Google Map">
        </div>
      </section>
      <section id="parksContent" class="parks__section bg-scrub">
        <div id="interactionPane">
          <header class="header bg-olive c-white">
            <div class="header__content">
              <h1>Explore California NPS</h1>
              <p>
                Whether you're looking to collect a few more stamps for your National Parks passport booklet, or just interested in California's parks, monuments and historical sites, use this app to explore the parts of California that have been protected for all to enjoy.
              </p>
            </div>
            <parks-actions parks-count=${this.parks.length}></parks-actions>
          </header>
          ${when(this.filteredParks.length,
            () => html`
              <div
                id="parksList"
                class="grid"
                role="list"
              >
                ${repeat(this.filteredParks,
                  (park) => park.parkCode,
                  (park, index) => html`
                    <parks-card
                      .park=${park}
                      role="listitem"
                    ></parks-card>
                  `
                )}
              </div>
            `,
            () => html`
              <div
                id="listError"
                class="flex flex-column flex-center"
              >
                <p
                  class="white"
                  role="alert"
                >
                  Sorry, there are no results for that search term.
                </p>
              </div>
            `,
          )}
        </div>
        <parks-footer data-presentation="desktop"></parks-footer>
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
          flex-direction: row;
          height: 100vh;
        }
      }
      .parks__section {
        width: 100%;

        @media screen and (min-width: 768px) {
          width: 50%;
        }
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
    `
  ];
}
customElements.define('parks-grid', ParksGrid);