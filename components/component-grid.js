import { LitElement, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.2.1/core/lit-core.min.js';
import { APP_API_KEY_GMAPS, APP_API_KEY_NPS, APP_API_KEY_WEATHER } from '../assets/js/_keys.js';

class ParksGrid extends LitElement {
  static properties = {
    getStorageWithExpiry: { type: String },
    parks: { type: Array },
    parkAlerts: { type: Array },
    parkWeather: { type: Array },
  }

  constructor() {
    super();

    this._getParks();
    this._getParkAlerts();
  }

  connectedCallback() {
    super.connectedCallback();

    console.log('Parks Grid ready');
  }

  _getParks() {
    // When parks data is not in local storage
    if ( !this._getStorageWithExpiry('parks') ) {
      // Get parks data from API endpoint
      fetch(`https://developer.nps.gov/api/v1/parks?stateCode=CA&api_key=${APP_API_KEY_NPS}`)
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
        //console.log(data.data);
        // Store parks data in this instance
        this.parks = data.data;
        // Store parks data in local storage with 7d expiry
        this._setStorageWithExpiry('parks', data, 604800000);
        this.initMap();
      })
      .catch(error => { console.log(error); });
      
      // When parks data is in local storage
    } else {
      // Retrieve parks data from local storage
      let parkData = this._getStorageWithExpiry('parks');
      //console.log(parkData.data);
      // Store parks data in this instance
      this.parks = parkData.data;
      this.initMap();
    }
  }

  _getParkAlerts() {
    // When park alerts data is not in local storage
    if ( !this._getStorageWithExpiry('alerts') ) {
      fetch(`https://developer.nps.gov/api/v1/alerts?stateCode=CA&limit=500&api_key=${APP_API_KEY_NPS}`)
      .then(response => { 
        if ( response.status >= 200 && response.status <= 299 ) {
          return response.json();
        } else {
          throw Error(response.statusText);
        }
      })
      .then(data => { 
        //console.log(data.data);
        // Store parks alert data in this instance
        this.alerts = data.data;
        // Store parks alert data in local storage with 2h expiry
        this._setStorageWithExpiry('alerts', data, 7200000);
      })
      .catch(error => { console.log(error); });
      
      // When park alerts data is in local storage
    } else {
      // Retrieve parks data from local storage
      let alertsData = this._getStorageWithExpiry('alerts');
      //console.log(alertsData.data);
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

  render() {
    return html`
      <div>YO MATTY</div>
    `;
  }
}
customElements.define('parks-grid', ParksGrid);