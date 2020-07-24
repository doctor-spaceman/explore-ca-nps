import './styles/style.scss';
import pinImg from './assets/img/icon__map-pin--green.png';

const apiKeyNPS = process.env.APP_API_KEY_NPS;
const apiKeyWeather = process.env.APP_API_KEY_WEATHER;

const app = new Vue ({
  el: '#app',
  data: {
    alerts: [],
    appOk: true,
    currentPark: undefined,
    currentParkCode: '',
    isOpen: false,
    map: {},
    mapBounds: {},
    mapMarkers: [],
    parks: [],
    parkAlerts: [],
    parkWeather: [],
    randomPark: {},
    search: '',
  },
  computed: {
    parksCount () {
      return this.parks.length;
    },
    searchFilteredParks () {
      return this.parks.filter(park => {
        return park.fullName.toLowerCase().includes(this.search.toLowerCase());
      });
    }
  },
  watch: {
    currentParkCode () {
      let code = this.currentParkCode;
      let matchedPark;

      this.parks.forEach(park => {
        if ( park.parkCode === code ) {
          matchedPark = park;
        }
      });
      this.currentPark = matchedPark;
    }
  },
  mounted() {
    // Get parks
    // When parks data is not in local storage
    if ( !this.getStorageWithExpiry('parks') ) {
      // Get parks data from API endpoint
      fetch(`https://developer.nps.gov/api/v1/parks?stateCode=CA&api_key=${apiKeyNPS}`)
      .then(response => { 
        if ( response.status >= 200 && response.status <= 299 ) {
          return response.json();
        } else {
          let appInstance = this;
          window.setTimeout(function() {
            appInstance.appOk = false;
          },3000);
          throw Error(response.statusText);
        }
      })
      .then(data => { 
        console.log(data.data);
        // Store parks data in this instance
        this.parks = data.data;
        // Store parks data in local storage with 7d expiry
        this.setStorageWithExpiry('parks', data, 604800000);
        this.initMap();
      })
      .catch(error => { console.log(error); });
      
      // When parks data is in local storage
    } else {
      // Retrieve parks data from local storage
      let parkData = this.getStorageWithExpiry('parks');
      console.log(parkData.data);
      // Store parks data in this instance
      this.parks = parkData.data;
      this.initMap();
    }
      
    // Get park alerts
    // When park alerts data is not in local storage
    if ( !this.getStorageWithExpiry('alerts') ) {
      fetch(`https://developer.nps.gov/api/v1/alerts?stateCode=CA&limit=500&api_key=${apiKeyNPS}`)
      .then(response => { 
        if ( response.status >= 200 && response.status <= 299 ) {
          return response.json();
        } else {
          throw Error(response.statusText);
        }
      })
      .then(data => { 
        console.log(data.data);
        // Store parks alert data in this instance
        this.alerts = data.data;
        // Store parks alert data in local storage with 2h expiry
        this.setStorageWithExpiry('alerts', data, 7200000);
      })
      .catch(error => { console.log(error); });
      
      // When park alerts data is in local storage
    } else {
      // Retrieve parks data from local storage
      let alertsData = this.getStorageWithExpiry('alerts');
      console.log(alertsData.data);
      // Store parks data in this instance
      this.alerts = alertsData.data;
    }
  },
  methods: {
    setStorageWithExpiry (key, value, ttl) {
      const now = new Date();

      // `item` is an object which contains the original value
      // as well as the time when it's supposed to expire
      const item = {
        value: value,
        expiry: now.getTime() + ttl
      };
      localStorage.setItem(key, JSON.stringify(item));
    },

    getStorageWithExpiry (key) {
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
    },

    getRandomPark (min, max) {
      let result = Math.floor(Math.random() * (max - min) + min);
      console.log('Park Index: ' + result);
      this.randomPark = this.parks[result];

      let randomParkCode = this.randomPark.parkCode;

      // Check parks alert data for our park code
      this.selectLocation(randomParkCode,this.map,this.randomPark.latitude,this.randomPark.longitude);
    },

    getParkAlerts (code) {
      let alertsArr = [];

      if ( this.alerts.length ) {
        this.alerts.forEach(function(alert) {
          if ( alert.parkCode === code ) {
            alertsArr.push(alert);
          }
        });
      }
      this.parkAlerts = alertsArr;
    },

    getParkWeather (code, lat, lng) {
      if ( !this.getStorageWithExpiry(`weather_${code}`) ) {
        if ( lat !== '' && lng !== '' ) {
          fetch(`https://api.openweathermap.org/data/2.5/onecall?lat=${lat}&lon=${lng}&units=imperial&
          exclude=current,minutely,hourly&appid=${apiKeyWeather}`)
          .then(response => { 
            if ( response.status >= 200 && response.status <= 299 ) {
              return response.json();
            } else {
              throw Error(response.statusText);
            }
          })
          .then(data => { 
            console.log(data.daily);
            // Store park weather data in this instance
            this.parkWeather = data.daily;
            // Store park weather data in local storage with 2h expiry
            this.setStorageWithExpiry(`weather_${code}`, data.daily, 7200000);
          })
          .catch(error => { console.log(error); })
        }
      } else {
        // Retrieve park weather data from local storage
        let weatherData = this.getStorageWithExpiry(`weather_${code}`);
        console.log(weatherData);
        // Store park weather data in this instance
        this.parkWeather = weatherData;
      }
    },

    initMap () {
      if ( this.parks ) {
        this.map = new google.maps.Map(document.getElementById("map"), {
          center: new google.maps.LatLng(36.7783,-119.4179),
          mapId: 'd51bf260405d55a2',
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          streetViewControl: false,
          zoom: 8
        });
        this.addLocations(this.map);
      }
    },

    addLocations (map) {
      let appInstance = this;
      let parks = this.parks;
      let latitude;
      let longitude;
      let markers = [];
      
      // Set bounds
      let bounds = new google.maps.LatLngBounds();

      // Configure marker appearance
      let customIcon = {
        url			: pinImg,
        scaledSize  : new google.maps.Size(31,40),
      };

      parks.forEach(function(park) {
        latitude = Number(park.latitude);
        longitude = Number(park.longitude);
        
        // Some parks don't have coords so 
        // let's check that the coords exist
        if ( latitude && longitude ) {
          // Create marker
          var marker = new google.maps.Marker({
            icon: customIcon,
            map: map,
            position: {lat: latitude, lng: longitude},
            title: park.fullName
          });
          markers.push(marker);

          // What happens when a marker is clicked
          google.maps.event.addListener(marker, 'click', function() {
            // Open info pane
            appInstance.selectLocation(park.parkCode, map, park.latitude, park.longitude);
            console.log('Selected ' + park.fullName);
          });

          // Set marker to bounds
          bounds.extend(marker.getPosition());
          }
      });
        
      // Store the bounds
      this.mapBounds = bounds;

      // Zoom the map to bounds
      this.zoomToBounds(map, bounds); 
    },

    zoomMap (map, lat, lng) {
      let latitude = Number(lat);
      let longitude = Number(lng);

      if ( latitude === 0 && longitude === 0 ) {
        this.zoomToBounds(this.map, this.mapBounds);
      } else {
        map.panTo({lat: latitude, lng: longitude});
        map.setZoom(12);
      }
    },

    zoomToBounds (map, bounds) {
      map.fitBounds(bounds);
    },

    selectLocation (code, map, lat, lng) {
      this.currentParkCode = code;
      this.zoomMap(map,lat,lng);
      this.openInfoPane();
      this.getParkAlerts(code);
      this.getParkWeather(code, lat, lng);
    },

    openInfoPane () {
      this.isOpen = true;
    },

    closeInfoPane () {
      this.isOpen = false;
      this.zoomToBounds(this.map, this.mapBounds, this.mapMarkers); 
    }
  }
});