import { LitElement, css, html, nothing, repeat, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.2.1/all/lit-all.min.js';
import { structure, theme } from '../assets/js/styles.js';
import { formatTimestamp } from '../assets/js/utils.js';

class ParksInfoDrawer extends LitElement {
  static properties = {
    active: { type: Boolean },
    currentPark: { type: Object },
    currentParkAlerts: { type: Object },
    currentParkWeather: { type: Object },
  }

  constructor() {
    super();

    this.active = false;
    this.currentPark = {};
    this.currentParkAlerts = {};
    this.currentParkWeather = {};
  }

  connectedCallback() {
    super.connectedCallback();

    document.addEventListener('parks:park-selected', (event) => {
      this.currentPark = event.detail.selected_park;
      this.currentParkAlerts = event.detail.selected_park_alerts;
      this.currentParkWeather = event.detail.selected_park_weather;
      this._openInfoDrawer();
    })
  }

  _openInfoDrawer () {
    this.active = true;
    window.location.hash = this.currentPark.parkCode;
    document.dispatchEvent(new CustomEvent('parks:info-drawer-opened'));
  }

  _closeInfoDrawer () {
    this.active = false;
    window.location.hash = 'main';
    document.dispatchEvent(new CustomEvent('parks:info-drawer-closed'));
  }

  render() {
    return html`
      ${when(Object.keys(this.currentPark).length,
        () => html`
          <article
            id="infoDrawer"
            class="${this.active ? 'active' : ''} bg-sand"
          >
            <div class="info-content">
              <button
                id="backButton"
                class="white bg-green"
                @click=${this._closeInfoDrawer}
              >
                Back
              </button>
              <div class="flex flex-nowrap">
                <h2>
                  ${this.currentPark.fullName}<a class="icon__link-external icon__link-external--heading" href="${this.currentPark.url}" target="_blank" rel="noopener" aria-label="Visit Website" title="Visit Website"></a>
                </h2>
              </div>
              <p>${this.currentPark.description}</p>
              <section class="info-content__weather">
                <h3>Weather</h3>
                <p class="weather__description">
                  ${this.currentPark.weatherInfo}
                </p>
                ${when(this.currentParkWeather.length,
                  () => html`
                    <ul class="weather__forecast flex flex-justify-space-between">
                      ${repeat(this.currentParkWeather, (day) => day.dt, (day, index) => html`
                        <li class="weather-item flex flex-column flex-center">
                          <img
                            class="weather-item__icon"
                            src="${day.weather[0].iconUrl}"
                            alt="${day.weather[0].description}"
                            title="${day.weather[0].description}"
                          />
                          <span class="weather-item__day">
                            ${formatTimestamp(day.dt)}
                          </span>
                          <span class="weather-item__temp">
                            ${day.temp.max.toFixed()} / ${day.temp.min.toFixed()}&#186;F
                          </span>
                        </li>
                      `)}
                    </ul>
                  `,
                  () => html`
                    <div class=""weather__forecast">
                      The weather forecast is not available at this time. Please try again later.
                    </div>
                  `,
                )}
              </section>
              <section>
                <h3>Access</h3>
                <p>${this.currentPark.operatingHours[0].description}</p>
                <h3>Alerts</h3>
                ${when(this.currentParkAlerts.length,
                  () => html`
                    <ul>
                      ${repeat(this.currentParkAlerts, (alert) => alert.id, (alert, index) => html`
                        <li>
                          <h4>${alert.title}</h4>
                          <div class="flex flex-nowrap">
                            <a
                              href="${alert.url}"
                              target="_blank"
                              rel="noopener"
                              class="has-icon font__size--small"
                            >
                              More Information<span class="icon__link-external icon__link-external--info" aria-label="External link opens a new tab"></span>
                            </a>
                          </div>
                        </li>
                      `)}
                    </ul>
                  `,
                  () => html`
                    <div>
                      Park alerts are not available at this time. Please visit the <a href="${this.currentPark.url}">park's website</a> for up-to-date information on park conditions, or try again later.
                    </div>
                  `,
                )}
              </section>
            </div>
          </article>
        `,
        () => nothing
      )}
    `;
  }

  static styles = [
    structure,
    theme,
    css`
      #backButton:before {
        display: inline;
        content: '<< ';
      }
      #infoDrawer {
        box-sizing: border-box;
        height: 100%;
        opacity: 0;
        overflow-y: auto;
        padding: 24px;
        visibility: hidden;
        width: 50%;
        transition: all .4s ease;

        @media only screen and (max-width: 800px) {
          display: none;
        }
        @media only screen and (min-width: 800px) {
          position: absolute;
          top: 0;
          right: -100%;
          bottom: 0;
        }
      }
      #infoDrawer.active {
        opacity: 1;
        visibility: visible;

        @media only screen and (max-width: 800px) {
          display: block;
        }
        @media only screen and (min-width: 800px) {
          right: 0;
          bottom: 0;
        }
      }
      .info-content {
        p {
          line-height: 1.2;
        }
        & > p:nth-of-type(2) {
          font-size: 20px;
        }
      }
      .weather__forecast {
        background: var(--var-color-sand);
        border-radius: 8px;
        font-family: var(--var-font--heading);
        font-size: .7em;
        list-style: none;
        padding: 16px 16px 0px 16px;
      }
      .weather-item {
        padding: 0px 4px 16px 4px;
        text-align: center;
        width: calc(25% - 16px);

        &:nth-child(1), 
        &:nth-child(2), 
        &:nth-child(3), 
        &:nth-child(4) {
          border-bottom: 1px solid var(--var-color-sand);
        }
      }
      .weather-item__icon {
        height: 50px;
        width: 50px;
      }
    `
  ];
}
customElements.define('parks-info-drawer', ParksInfoDrawer);