import { LitElement, css, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.2.1/core/lit-core.min.js';
import { structure, theme, typography } from '../assets/js/styles.js';

class ParksInfoDrawer extends LitElement {
  constructor() {
    super();
  }

  render() {
    return html`
      <article id="infoPane" class="${this.isOpen ? 'is-open' : ''}" style="display: none;">
        <div class="info-content" v-if="currentPark">
          <button id="backButton" class="white bg-green" @click="closeInfoPane(currentPark.parkCode)">
            Back
          </button>
          <div class="grid grid--unwrap">
            <h2>{{ currentPark.fullName }}<a class="icon__link-external icon__link-external--heading" v-if="currentPark.url" :href="currentPark.url" target="_blank" rel="noopener" aria-label="Visit Website" title="Visit Website"></a></h2>
          </div>
          <p v-if="currentPark.description">{{ currentPark.description }}</p>
          <div class="info-content__weather">
            <h3>Weather</h3>
            <ul class="weather__forecast grid grid--space" v-if="parkWeather.length">
              <li class="weather-item grid grid--center grid--column" v-for="day in parkWeather" :key="day.dt">
                <img class="weather-item__icon" :src="day.weather[0].iconUrl" :alt="day.weather[0].description" :title="day.weather[0].description"/>
                <span class="weather-item__day">{{ formatTimestamp(day.dt) }}</span>
                <span class="weather-item__temp">{{ day.temp.max.toFixed() }} / {{ day.temp.min.toFixed() }}&#186;F</span>
              </li>
            </ul>
            <p class="weather__description" v-if="currentPark.weatherInfo">{{ currentPark.weatherInfo }}</p>
          </div>
          <div v-if="currentPark.operatingHours[0].description">
            <h3>Access</h3>
            <p>{{ currentPark.operatingHours[0].description }}</p>
          <div v-if="parkAlerts.length">
            <h3>Alerts</h3>
            <ul>
              <li v-for="alert in parkAlerts" :key="alert.id">{{ alert.title }}
                <div v-if="alert.url" class="grid grid--unwrap">
                  <a :href="alert.url" target="_blank" rel="noopener" class="has-icon font__size--small">
                    More Information<span class="icon__link-external icon__link-external--info" aria-label="External link opens a new tab"></span>
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </article>
    `
  }
}
customElements.define('parks-info-drawer', ParksInfoDrawer);