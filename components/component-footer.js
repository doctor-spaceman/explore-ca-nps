import { LitElement, css, html, nothing, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.2.1/all/lit-all.min.js';
import { structure, theme, typography } from '../assets/js/styles.js';

if (!customElements.get('parks-footer')) {
  customElements.define('parks-footer',
    class ParksFooter extends LitElement {
      static properties = {
        presentation: { type: String },
        resizing: { type: Boolean }
      }

      constructor() {
        super();

        this.resizing = false;
      }

      connectedCallback() {
        super.connectedCallback();

        this._getPresentation();
        window.addEventListener('resize', () => {
          if (!this.resizing) {
            window.requestAnimationFrame(() => {
              this._getPresentation();
              this.resizing = false;
            })
            this.resizing = true;
          }
        });
      }

      _getPresentation() {
        return this.presentation = window.innerWidth <= 768
          ? 'mobile'
          : 'desktop';
      }

      render() {
        return html`
          ${when(
            (this.dataset.presentation === 'mobile' && this.presentation === 'desktop') ||
            (this.dataset.presentation === 'desktop' && this.presentation === 'mobile'),
            () => nothing,
            () => html`
              <footer class="footer flex flex-justify-space-between c-white bg-olive">
                <p class="p3">
                  Created by <a href="https://github.com/doctor-spaceman/explore-ca-nps" target="_blank" rel="noopener">Matt McLean</a>
                </p>
                <p class="p3">
                  Powered by the <a href="https://www.nps.gov/subjects/developer/index.htm" target="_blank" rel="noopener">National Park Service API</a>
                </p>
              </footer>`,
          )}
        `
      }

      static styles = [
        structure,
        theme,
        typography,
        css`
          :host {
            background-color: var(--var-color-olive);
            display: block;
          }
          .footer {
            padding: var(--var-spacing-4);
            
            p {
              margin: 0;
            }
          }
        `
      ]
    }
  )
}