import {html} from '@polymer/polymer/lib/utils/html-tag.js';
import {PolymerElement} from '@polymer/polymer/polymer-element.js';

import 'yo-paper-cropper/yo-paper-cropper'
import 'yo-file-uploader/yo-file-uploader'
/**
 * `yo-image`
 * A image input with uplaod and crop
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class YoImage extends PolymerElement {
  static get template() {
    return html`
        <style>
            :host {
                display: block;
            }

            #cropper {
                display: block;
                width: 100%;
                --yo-paper-cropper-height: var(--yo-image-height, 300px);
            }

            #uploader {
                display: block;
                width: 100%;
                margin: auto;
            }

            #cropper.hidden,
            #uploader.hidden,
            #slot.hidden ::slotted(*) {
                display: none;
            }
        </style>
        <yo-paper-cropper id="cropper" class="hidden" on-image-loaded="_setCurrentOptions" on-cropper-ready="_hackToPreview"></yo-paper-cropper>
        <yo-file-uploader id="uploader" maxsize\$="[[maxsize]]" on-change="_uploadFiles" hide-droparea=""></yo-file-uploader>
        <div id="slot" class="hidden">
            <slot></slot>
        </div>
`;
  }

  static get is() { return 'yo-image'; }
  static get properties() {
      return {
          src: {
              type: String
          },
          uploaderLabel: {
              type: String,
              observer: '_uploaderLabelChanged'
          },
          target: {
              type: Element | String,
              observer: '_targetChanged'
          },
          preview: {
              type: Element | String,
              observer: '_previewChanged'
          },
          maxsize: {
              type: Number,
              value: 5120
          },
          cropperOptions: {
              type: Object,
              value: {}
          }
      };
  }

  _uploaderLabelChanged(newLabel, oldLabel) {
      if (!oldLabel && !newLabel) return;
      this.$.uploader.label = this.uploaderLabel;
  }

  /**
  * I dont know why but the preview only works with this hack
  **/
  _hackToPreview() {
      if (!this.previewElem) return;
      const img = this.previewElem.childNodes[0];

      img.style.removeProperty('min-width');
      img.style.removeProperty('min-height');
      img.style.removeProperty('max-width');
      img.style.removeProperty('max-height');
  }

  _setCurrentOptions(e) {
      const newOptions = this._getCropperOptions();
      if (Object.keys(this.$.cropper.options).length > 0)
          e.preventDefault();
      if (!this.$.cropper.src) return;
      this.$.cropper.options = newOptions;
  }

  _isImgLoaded(img) {
      if (!img.complete) {
          return false;
      }
      if (img.naturalWidth === 0) {
          return false;
      }
      return true;
  }

  _getAspectRatio() {
      const gcd = (a, b) => b == 0 ? a : gcd(b, a % b);
      var w = this.targetElem.offsetWidth;
      var h = this.targetElem.offsetHeight;
      var r = gcd(w, h);
      return (w / r) / (h / r);
  }

  _getCropperOptions() {
      let options = {
          preview: this.previewElem,
          aspectRatio: this._getAspectRatio()
      };
      options = Object.assign(options, this._defaultOptions);
      return Object.assign(options, this._getCropperOptions);
  }

  _updatePreviewSize() {
      if (this._isImgLoaded(this.targetElem)) {
          this._setPreviewSize();
      }
      else {
          this.targetElem.addEventListener('load', this._setPreviewSize.bind(this));
      }
  }

  _targetChanged() {
      this.targetElem = (typeof (this.target) === "string") ? document.querySelector(this.target) : this.target;
      if (!this.targetElem) console.error(`It's required a target element`);
      this._updatePreviewSize();
  }

  _previewChanged() {
      this.previewElem = (typeof (this.preview) === "string") ? document.querySelector(this.preview) : this.preview;
      if (!this.targetElem) return;
      this._updatePreviewSize();
  }

  _setPreviewSize() {
      if (!this.previewElem) return;
      this.previewElem.style.height = this.targetElem.offsetHeight;
      this.previewElem.style.width = this.targetElem.offsetWidth;
  }

  _uploadFiles(e) {
      var file = e.detail.files[0];
      if (!file) return;

      this.$.cropper.classList.remove('hidden');
      this.$.slot.classList.remove('hidden');
      this.$.cropper.src = URL.createObjectURL(file);
  }

  constructor() {
      super();
      this._defaultOptions = {
          dragMode: 'none',
          viewMode: 2,
          zoomable: false,
          //minCropBoxHeight: 200,
          //minCropBoxWidth: 100
      };
  }

  connectedCallback() {
      super.connectedCallback();
      const confirmElem = this.querySelector('[confirm-crop]');
      if (confirmElem) {
          confirmElem.addEventListener('click', e => {
              e.preventDefault();
              this.targetElem.src = this.getCroppedData();
              this.reset();
          });
      }

      const cancelElem = this.querySelector('[cancel-crop]');
      if (cancelElem) {
          cancelElem.addEventListener('click', e => {
              e.preventDefault();
              this.reset();
          })
      }
  }

  reset() {
      this.$.uploader.reset();
      this.$.cropper.classList.add('hidden');
      this.$.slot.classList.add('hidden');
      this.$.cropper.src = '';
  }

  setFeedback(name, message) {
      return this.$.uploader.setFeedback(name, message);
  }

  getCroppedData() {
      return this.$.cropper._cropper.getCroppedCanvas().toDataURL();
  }
}

window.customElements.define(YoImage.is, YoImage);
