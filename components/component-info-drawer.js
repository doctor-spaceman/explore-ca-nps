import { LitElement, css, html, nothing, repeat, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.2.1/all/lit-all.min.js';
import { structure, theme, typography } from '../assets/js/styles.js';
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

    const $grid = document.querySelector('parks-grid');
    for (const infoWindow of $grid.mapInfoWindows) {
      infoWindow.instance.close();
    }
  }

  render() {
    return html`
      ${when(Object.keys(this.currentPark).length,
        () => html`
          <article
            id="infoDrawer"
            class="${this.active ? 'active' : ''} bg-sand"
            ?aria-hidden=${!this.active}
            aria-labelledby="infoDrawerTitle"
            role="dialog"
            tabindex=${this.active ? '0' : nothing}
          >
            <div class="info-content">
              <button
                id="backButton"
                class="bg-green c-white"
                @click=${this._closeInfoDrawer}
              >
                Back
              </button>
              <div class="flex flex-nowrap">
                <h2
                  id="infoDrawerTitle"
                  class="flex flex-center"
                >
                  ${this.currentPark.fullName}
                  <a
                    aria-label="Visit this park's website (opens in a new tab)."
                    class="icon__link-external icon__link-external--heading"
                    href="${this.currentPark.url}"
                    target="_blank"
                    rel="noopener"
                    title="Visit Website">
                  </a>
                </h2>
              </div>
              <p>${this.currentPark.description}</p>
              <section id="weather">
                <h3>Weather</h3>
                <p class="weather__description">
                  ${this.currentPark.weatherInfo}
                </p>
                ${when(this.currentParkWeather.length,
                  () => html`
                    <ul class="weather__forecast flex flex-justify-space-between">
                      ${repeat(this.currentParkWeather, (day) => day.dt, (day, index) => html`
                        <li class="weather-item p4 flex flex-column flex-center">
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
                    <div
                      class="weather__forecast p3"
                      role="status"
                    >
                      The weather forecast is not available at this time. Please try again later.
                    </div>
                  `,
                )}
              </section>
              <section id="access">
                <h3>Access</h3>
                <p>${this.currentPark.operatingHours[0].description}</p>
                <h3>Alerts</h3>
                ${when(this.currentParkAlerts.length,
                  () => html`
                    <ul>
                      ${repeat(this.currentParkAlerts,
                        (alert) => alert.id,
                        (alert, index) => html`
                          <li class="alert-item">
                            <span>${alert.title}</span>
                            <a
                              href="${alert.url}"
                              target="_blank"
                              rel="noopener"
                              class="has-icon flex flex-center c-teal p3"
                            >
                              More Information
                              <span class="icon__link-external icon__link-external--info" aria-label="Link opens in a new tab."></span>
                            </a>
                          </li>
                        `
                      )}
                    </ul>
                  `,
                  () => html`
                    <div
                      class="p2"
                      role="status"
                    >
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
    typography,
    css`
      #backButton {
        border: none;
        border-image: none;
        border-radius: var(--var-spacing);
        box-sizing: border-box;
        cursor: pointer;
        font: var(--var-font-p);
        font-family: var(--var-font-heading);
        padding: var(--var-spacing) var(--var-spacing-4);
      }
      #backButton:before {
        content: '<< ';
        display: inline;
      }
      #infoDrawer {
        box-sizing: border-box;
        height: 100%;
        opacity: 0;
        overflow-y: auto;
        padding: var(--var-spacing-6);
        visibility: hidden;
        width: 50%;
        transition: all .4s ease;

        @media only screen and (max-width: 768px) {
          display: none;
        }
        @media only screen and (min-width: 768px) {
          position: absolute;
          top: 0;
          right: -100%;
          bottom: 0;
        }
      }
      #infoDrawer.active {
        opacity: 1;
        visibility: visible;

        @media only screen and (max-width: 768px) {
          display: block;
        }
        @media only screen and (min-width: 768px) {
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
        border-radius: var(--var-spacing-2);
        list-style: none;
        padding: var(--var-spacing-4);
        padding-bottom: 0;
      }
      .weather-item {
        font-family: var(--var-font-heading);
        padding: 0 var(--var-spacing) var(--var-spacing-4);
        text-align: center;
        width: calc(25% - var(--var-spacing-4));

        &:nth-child(1), 
        &:nth-child(2), 
        &:nth-child(3), 
        &:nth-child(4) {
          border-bottom: 1px solid var(--var-color-sand);
        }
      }
      .weather-item__icon {
        height: calc(var(--var-spacing-10) + var(--var-spacing-3));
        width: calc(var(--var-spacing-10) + var(--var-spacing-3));
      }
      #access li {
        margin-bottom: var(--var-spacing-4);
      }
      .alert-item a.has-icon {
        font-family: var(--var-font-heading);
        margin-top: var(--var-spacing);
      }
      .alert-item a.has-icon:hover {
        .icon__link-external--info {
          background-image: url('./assets/img/icon__link-external--green.svg');
        }
      }
      .icon__link-external {
        display: inline-block;
        height: .9em;
      }
      .icon__link-external--heading {
        background: url('./assets/img/icon__link-external--green.svg') left center/contain no-repeat;
        margin-left: .5em;
        width: .6em;
      }
      .icon__link-external--info {
        background: url('./assets/img/icon__link-external--teal.svg') left top/contain no-repeat;
        margin-left: .2em;
        width: .8em;
      }
    `
  ];
}
customElements.define('parks-info-drawer', ParksInfoDrawer);