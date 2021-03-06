/**
 * Copyright 2018 The Subscribe with Google Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {Dialog} from './dialog';
import {
  computedStyle,
  getStyle,
  googleFontsUrl,
} from '../utils/style';

const NO_ANIMATE = false;
const ANIMATE = true;


describes.realWin('Dialog', {}, env => {
  let win;
  let doc;
  let dialog;
  let view;
  let element;
  const documentHeight = 100;

  beforeEach(() => {
    win = env.win;
    doc = env.win.document;
    dialog = new Dialog(win, {height: `${documentHeight}px`});

    element = doc.createElement('div');
    view = {
      getElement: function() {
        return element;
      },
      init: function(dialog) {
        return Promise.resolve(dialog);
      },
      resized: function() {
        return;
      },
      shouldFadeBody: function() {
        return true;
      },
    };
  });

  function immediate() {
    win.setTimeout = function(callback) {
      callback();
    };
  }

  describe('dialog', () => {

    it('should have created a friendly iframe instance', function* () {
      const iframe = dialog.getElement();
      expect(iframe.nodeType).to.equal(1);
      expect(iframe.nodeName).to.equal('IFRAME');

      expect(getStyle(iframe, 'opacity')).to.equal('1');
      expect(getStyle(iframe, 'bottom')).to.equal('0px');
      expect(getStyle(iframe, 'display')).to.equal('block');
      // These two properties are not set !important.
      expect(getStyle(iframe, 'width')).to.equal('100%');
      expect(getStyle(iframe, 'left')).to.equal('0px');
    });

    it('should have created fade background', function* () {
      const openedDialog = yield dialog.open(NO_ANIMATE);

      const backgroundElement =
          win.document.querySelector('swg-popup-background');
      expect(backgroundElement.nodeName).to.equal('SWG-POPUP-BACKGROUND');

      // Background is hidden initially.
      expect(computedStyle(win, backgroundElement)['display']).to.equal('none');

      yield openedDialog.openView(view);
      // Background is not hidden when dialog is open.
      expect(computedStyle(win, backgroundElement)['display'])
          .to.equal('block');
    });

    it('should open dialog with animation', function* () {
      immediate();
      dialog.open(ANIMATE);
      yield dialog.animating_;

      expect(getStyle(dialog.getElement(), 'transform'))
          .to.equal('translateY(0px)');
    });

    it('should build the view', function* () {
      const openedDialog = yield dialog.open(NO_ANIMATE);
      yield openedDialog.openView(view);
      expect(computedStyle(win, element)['opacity']).to.equal('1');
      expect(computedStyle(win, element)['max-height']).to.equal('100%');
      expect(computedStyle(win, element)['max-width']).to.equal('100%');
      expect(computedStyle(win, element)['min-height']).to.equal('100%');
      expect(computedStyle(win, element)['min-width']).to.equal('100%');
      expect(computedStyle(win, element)['height']).to.match(/px$/g);
      expect(computedStyle(win, element)['width']).to.match(/px$/g);
    });

    it('should resize the element', function* () {
      const openedDialog = yield dialog.open(NO_ANIMATE);
      yield openedDialog.openView(view);
      const dialogHeight = 99;
      yield openedDialog.resizeView(view, dialogHeight, NO_ANIMATE);
      // TODO(dparikh): When animiation is implemented, need to wait for
      // resized() call.
      expect(computedStyle(win, dialog.getElement())['height'])
          .to.equal(`${dialogHeight}px`);

      // Check if correct document padding was added.
      expect(win.document.documentElement.style.paddingBottom)
          .to.equal(`${dialogHeight + 20}px`);
    });

    it('should resize the element to expand with animation', function* () {
      immediate();
      yield dialog.open(NO_ANIMATE);
      yield dialog.openView(view);
      yield dialog.resizeView(view, 99, ANIMATE);

      expect(getStyle(dialog.getElement(), 'transform'))
          .to.equal('translateY(0px)');
      expect(getStyle(dialog.getElement(), 'height'))
          .to.equal('99px');
      // Check if correct document padding was added.
      expect(win.document.documentElement.style.paddingBottom)
          .to.equal(`${99 + 20}px`);
    });

    it('should resize the element to collapse with animation', function* () {
      immediate();
      yield dialog.open(NO_ANIMATE);
      yield dialog.openView(view);
      yield dialog.resizeView(view, 19, ANIMATE);

      expect(getStyle(dialog.getElement(), 'transform'))
          .to.equal('translateY(0px)');
      expect(getStyle(dialog.getElement(), 'height'))
          .to.equal('19px');
      // Check if correct document padding was added.
      expect(win.document.documentElement.style.paddingBottom)
          .to.equal(`${19 + 20}px`);
    });

    it('should open the dialog', function* () {

      const openedDialog = yield dialog.open(NO_ANIMATE);
      expect(openedDialog.getContainer().getAttribute('class'))
          .to.equal('swg-container');

      // Should have top level friendly iframe created.
      const iframe = openedDialog.getElement();
      expect(iframe.getAttribute('src')).to.equal('about:blank');
      expect(iframe.nodeName).to.equal('IFRAME');

      // Should have document loaded.
      const iframeDoc = openedDialog.getIframe().getDocument();
      expect(iframeDoc.nodeType).to.equal(9);
      expect(iframeDoc.nodeName).to.equal('#document');

      // Should have Google fonts link added to the HEAD section.
      const fontsLink =
          iframeDoc.querySelector('link[rel="stylesheet"][type="text/css"]');
      expect(fontsLink.getAttribute('href')).to.equal(googleFontsUrl);

      // Should have container created.
      const container = openedDialog.getContainer();
      expect(container.nodeType).to.equal(1);
      expect(container.nodeName).to.equal('DIV');
      expect(container.getAttribute('class')).to.equal('swg-container');
    });

    it('should remove the dialog', function* () {
      const openedDialog = yield dialog.open(NO_ANIMATE);
      expect(openedDialog.getContainer().getAttribute('class'))
          .to.equal('swg-container');

      // Should have top level friendly iframe created.
      const iframe = openedDialog.getElement();
      expect(iframe.getAttribute('src')).to.equal('about:blank');
      expect(iframe.nodeName).to.equal('IFRAME');
      expect(doc.querySelector('iframe')).to.equal(iframe);
      expect(openedDialog.getIframe().isConnected()).to.equal(true);

      // Remove the element from the dom.
      yield dialog.close(NO_ANIMATE);

      expect(doc.querySelector('iframe')).to.be.null;
      expect(openedDialog.getIframe().isConnected()).to.equal(false);

      // Check if document padding was removed.
      expect(win.document.documentElement.style.paddingBottom).to.equal('');
    });

    it('should remove the dialog with animation', function* () {
      immediate();
      yield dialog.open(NO_ANIMATE);
      yield dialog.close(ANIMATE);
      expect(win.document.documentElement.contains(dialog.getElement()))
          .to.be.false;
      // Check if document padding was removed.
      expect(win.document.documentElement.style.paddingBottom).to.equal('');
    });

    it('should have Loading view element added', function* () {
      const openedDialog = yield dialog.open(NO_ANIMATE);
      const iframeDoc = openedDialog.getIframe().getDocument();
      const loadingView = iframeDoc.querySelector('.swg-loading');
      expect(loadingView.nodeName).to.equal('DIV');

      expect(loadingView.children.length).to.equal(4);
    });
  });
});
