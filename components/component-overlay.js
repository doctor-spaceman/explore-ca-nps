import { LitElement, css, html, nothing, when } from 'https://cdn.jsdelivr.net/gh/lit/dist@3.2.1/all/lit-all.min.js';
import { structure, theme } from '../assets/js/styles.js';

class ParksOverlay extends LitElement {
  static properties = {
    appOK: { type: Boolean },
    show: { type: Boolean },
  }

  constructor() {
    super();

    this.show = true;
    this.appOK = true;

    document.addEventListener('parks:data-ready', (event) => {
      if (event.detail.length) {
        this.show = false;
        this.appOK = true;
      }
    });

    document.addEventListener('parks:data-not-ready', () => {
      this.appOK = false;
    });
  }

  connectedCallback() {
    super.connectedCallback();
  }

  render() {
    return html`
      ${when(this.show,
        () => html`
          <aside id="loadOverlay" class="bg-sand flex flex-column flex-center">
            <div class="load-container">
              <h1 class="c-green">Explore California National Parks</h1>
              <div class="load-status">
                ${when(this.appOK,
                  () => html`<p aria-role="status">Loading park data ...</p>
                    <div class="load-spinner">
                      <svg version="1.1" id="loader-1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                      width="40px" height="40px" viewBox="0 0 40 40" enable-background="new 0 0 40 40" xml:space="preserve">
                        <title>Loading spinner animation</title>
                        <path opacity="0.2" fill=#5A9B8B d="M20.201,5.169c-8.254,0-14.946,6.692-14.946,14.946c0,8.255,6.692,14.946,14.946,14.946
                        s14.946-6.691,14.946-14.946C35.146,11.861,28.455,5.169,20.201,5.169z M20.201,31.749c-6.425,0-11.634-5.208-11.634-11.634
                        c0-6.425,5.209-11.634,11.634-11.634c6.425,0,11.633,5.209,11.633,11.634C31.834,26.541,26.626,31.749,20.201,31.749z"/>
                        <path fill=#5A9B8B d="M26.013,10.047l1.654-2.866c-2.198-1.272-4.743-2.012-7.466-2.012h0v3.312h0
                        C22.32,8.481,24.301,9.057,26.013,10.047z">
                          <animateTransform
                            attributeType="xml"
                            attributeName="transform"
                            type="rotate"
                            from="0 20 20"
                            to="360 20 20"
                            dur="1s"
                            repeatCount="indefinite"
                          />
                        </path>
                      </svg>
                    </div>
                  `,
                  () => html`<p class="load-status" aria-role="alert">Sorry, park data could not be loaded.<br>Please try again later.</p>`
                )}  
              </div>
            </div>
          </aside>
        `,
        () => nothing,
      )}
    `
  }

  static styles = [
    structure,
    theme,
    css`
      #loadOverlay {
        position: absolute;
        width: 100%;
        text-align: center;
        transition: all 1s ease;
        z-index: 100;
      }
      .load-container {
        margin-top: 30vh;
      }
    `
  ]
}
customElements.define('parks-overlay', ParksOverlay);