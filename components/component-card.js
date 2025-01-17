import { LitElement, css, html } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.2.1/core/lit-core.min.js';
import { theme } from '../assets/js/styles.js';

if (!customElements.get('parks-card')) {
  customElements.define('parks-card',
    class ParksCard extends LitElement {
      static properties = {
        park: { type: Object }
      }

      constructor() {
        super();
      }

      connectedCallback() {
        super.connectedCallback();

        this.$grid = document.querySelector('parks-grid');
      }

      render() {
        return html`
          <button
            label="View details for ${this.park.fullName}."
            class="card bg-sand c-green"
            @click=${() => {
              this.$grid._selectLocation(
                this.park.parkCode,
                this.park.latitude,
                this.park.longitude
              )
            }}
            @keydown=${(e) => {
              if (e.key === 'Enter') {
                this.$grid._selectLocation(
                  this.park.parkCode,
                  this.park.latitude,
                  this.park.longitude
                )
              }
            }}
          >
            ${this.park.fullName}
          </button>
        `
      }

      static styles = [
        theme,
        css`
          .card {
            border: none;
            border-image: none;
            border-radius: var(--var-spacing);
            box-sizing: border-box;
            cursor: pointer;
            font: var(--var-font-p);
            font-family: var(--var-font-heading);
            height: 100%;
            min-height: 100px;
            opacity: 1;
            padding: 8px;
            text-align: center;
            width: 100%;
          }
          .card:hover,
          .card:focus {
              opacity: .9;
            }
          }
        `
      ]
    }
  )
}