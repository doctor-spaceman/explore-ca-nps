import { LitElement, css, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.2.1/core/lit-core.min.js';
import { structure, theme, typography } from '../assets/js/styles.js';

class ParksActions extends LitElement {
  constructor() {
    super();
    this.parksCount = 0;

    document.addEventListener('parks:data-ready', (event) => {
      console.log('parks:data-ready event received in actions');
      this.parksCount = event.detail.length;
    });
  }

  _getRandomPark (min, max) {
    console.log('Offer the user a random park from the list.')
    /*
    let result = Math.floor(Math.random() * (max - min) + min);
    console.log('Park Index: ' + result);
    this.randomPark = this.parks[result];

    let randomParkCode = this.randomPark.parkCode;

    // Check parks alert data for our park code
    this._selectLocation(randomParkCode,this.map,this.randomPark.latitude,this.randomPark.longitude);
    */
  }

  render() {
    return html`
      <div class="parks-actions flex flex-nowrap bg-faded-olive">
        <div class="parks-actions__randomizer">
          <button
            class="bg-sand c-green"
            @click=${this._getRandomPark(0, this.parksCount)}
          >
            Random Park
          </button>
        </div>
        <div class="park-actions__search">
          <label for="search" class="screen-reader-text">
            Search Parks
          </label>
          <input id="search" type="text" v-model="search" placeholder="Search Parks" />
          <span class="search__underscore"></span>
        </div>
      </div>
    `
  }

  static styles = [
    structure,
    theme,
    typography,
    css`
      :host {
        display: block;
      }
      .parks-actions {
        gap: var(--var-spacing-4);
        padding: var(--var-spacing-4);
      }
      .parks-actions__randomizer {
        width: 33%;
      }
      button {
        border: none;
        border-image: none;
        border-radius: var(--var-spacing);
        box-sizing: border-box;
        font: var(--var-font-p);
        font-family: var(--var-font-heading);
        padding: var(--var-spacing-4);
        width: 100%;
      }
    `
  ]
}
customElements.define('parks-actions', ParksActions);