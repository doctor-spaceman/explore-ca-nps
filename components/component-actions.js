import { LitElement, createRef, css, html, ref } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.2.1/all/lit-all.min.js';
import { structure, theme, utilities } from '../assets/js/styles.js';
import { debounce } from '../assets/js/utils.js';

class ParksActions extends LitElement {
  static properties = {
    parksCount: { type: Number },
    searchTerm: { type: String },
  }

  constructor() {
    super();
    this.searchInputRef = createRef();
  }

  connectedCallback() {
    super.connectedCallback();

    const $grid = document.querySelector('parks-grid');
    this.parksCount = $grid.parks.length;
  }

  _getRandomPark = (min, max) => {
    let result = Math.floor(Math.random() * (max - min) + min);
    document.dispatchEvent(new CustomEvent('parks:parks-random', {
      detail: { park_index: result }
    }));
  }

  _getSearchTerm = () => {
    this.searchTerm = this.searchInputRef.value?.value;
    document.dispatchEvent(new CustomEvent('parks:parks-searched', {
      detail: { search_term: this.searchTerm }
    }));
  }

  render() {
    return html`
      <div class="parks-actions flex flex-nowrap bg-faded-olive">
        <div class="parks-actions__randomizer">
          <button
            aria-label="Load a random park from the list."
            class="bg-sand c-green"
            @click=${() => this._getRandomPark(0, this.parksCount)}
          >
            Random Park
          </button>
        </div>
        <div class="park-actions__search">
          <label for="search" class="sr-only">
            Search Parks
          </label>
          <input
            ${ref(this.searchInputRef)}
            id="search"
            type="text"
            placeholder="Search Parks"
            @input=${debounce(this._getSearchTerm, 500)}
          />
          <span class="park-actions__search-underline"></span>
        </div>
      </div>
    `
  }

  static styles = [
    structure,
    theme,
    utilities,
    css`
      :host {
        display: block;
      }
      .parks-actions {
        gap: var(--var-spacing-4);
        padding: var(--var-spacing-4);
      }
      .parks-actions__randomizer {
        flex: 0 0 calc(33% - var(--var-spacing-2));

        button {
          border: none;
          border-image: none;
          border-radius: var(--var-spacing);
          box-sizing: border-box;
          cursor: pointer;
          font: var(--var-font-p);
          font-family: var(--var-font-heading);
          opacity: 1;
          padding: var(--var-spacing-4);
          width: 100%;
        }
        button:hover,
        button:focus {
          opacity: .9;
        }
      }
      .park-actions__search {
        overflow: hidden;
        position: relative;
        width: 100%;

        .park-actions__search-underline {
          display: block;
          background-color: var(--var-color-sage);
          height: calc(var(--var-spacing) / 2);
          width: 100%;
          position: absolute;
          left: 0;
          bottom: 0;
          transform: translateX(-100%);
          transition: transform .2s ease;
        }
        #search {
          background: url('./assets/img/icon__search--white.svg') left center/28px no-repeat;
          border: 0;
          box-sizing: border-box;
          color: var(--var-color-white);
          font: var(--var-font-p-large);
          height: 100%;
          outline: none;
          padding: 8px 0px 8px 34px;
        }
        #search::placeholder {
          color: rgba(255, 255, 255, .6);
        }
        #search:focus {
          outline: 1px dotted transparent;
        }
        #search:focus + .park-actions__search-underline {
          transform: translateX(0%);
        }
      }
    `
  ]
}
customElements.define('parks-actions', ParksActions);