define([
    'brease/controller/libs/FocusChain',
    'brease/events/BreaseEvent', 
    'brease/core/Utils', 
    'brease/events/ClientSystemEvent', 
    'brease/controller/libs/Utils'], function (FocusChain, BreaseEvent, Utils, ClientSystemEvent, ControllerUtils) {

    'use strict';

    /**
    * @class brease.controller.FocusManager
    * This module is only used in case config.vis.keyboardOperation=true
    * 
    * This class is responsible for setting the focus if user hits (shift+)tab key or the page/content is changed. 
    * 
    * How it basically works:
    * On event CONTENT_LOADED => query all focusable widgets from a content and sort them according to tabindex/dom position and push it to the _focusChain
    * On event PAGE_LOADED => sort all contents in _focusChain and set the focus to the first widget of first content if its not already set.
    * On event CONTENT_REMOVED => remove the content from the _focusChain and try to recover the focus
    * 
    * On tab keydown => Set focus on next focusable (visible, enabled) widget in chain
    * On shift+tab keydown => Set focus on previous focusable widget in chain
    * On focusin => check if the user has changed the focus => just update _focusPosition
    * On focusout => check if focusout was caused by disabled/invisible widget => focus next.
    * 
    * @singleton
    */
    var FocusManager = {
        start: function () {
            _isStarted = true;
            brease.appElem.addEventListener(BreaseEvent.PAGE_LOADED, _pageLoadedHandler);
            brease.appElem.addEventListener(ClientSystemEvent.CONTENT_LOADED, _contentLoadedHandler);
            document.body.addEventListener(BreaseEvent.CONTENT_REMOVED, _contentRemovedHandler);
            document.body.addEventListener('focusin', _focusInHandler);
            document.body.addEventListener('focusout', _focusOutHandler);
            window.addEventListener('keydown', _onKeyDown);
        },

        stop: function () {
            _isStarted = false;
            brease.appElem.removeEventListener(BreaseEvent.PAGE_LOADED, _pageLoadedHandler);
            brease.appElem.removeEventListener(ClientSystemEvent.CONTENT_LOADED, _contentLoadedHandler);
            document.body.removeEventListener(BreaseEvent.CONTENT_REMOVED, _contentRemovedHandler);
            document.body.removeEventListener('focusin', _focusInHandler);
            document.body.removeEventListener('focusout', _focusOutHandler);
            window.removeEventListener('keydown', _onKeyDown);
        },

        /**
         * focus next focusable widget according to tabindex
         */
        focusNext: function () {
            if (!_isStarted) {
                return;
            }
            _focusChain.focusNext();
        },

        /**
         * focus previous focusable widget according to tabindex
         */
        focusPrevious: function () {
            if (!_isStarted) {
                return;
            }
            _focusChain.focusPrevious();
        },

        /**
         * Shows focus position overlay for each widget. Call again or hit space to update.
         */
        debug: function () {
            console.log('update with SPACE key');
            console.log('FocusChain:', _focusChain.chain);
            console.log('FocusPosition:', _focusChain.position);
            createDebugStyle();
            var cnt = 1;
            _focusChain.chain.forEach(function (content) {
                content.widgets.forEach(function (widget) {
                    widget.elem.dataset.focuspos = cnt++;
                });
            });
            document.addEventListener('keydown', _debugKeyDown);
        },

        /**
         * Remove focus position overlays.
         */
        debugOff: function () {
            var widgetElems = brease.appElem.querySelectorAll('[data-focuspos]');
            Array.from(widgetElems).forEach(function (elem) {
                elem.removeAttribute('data-focuspos');
            });
            document.head.removeChild(_debugStyleElem);
            document.removeEventListener('keydown', _debugKeyDown);
        }
    };

    var _focusChain = new FocusChain(),
        _isStarted = false,
        _debugStyleElem;

    function _pageLoadedHandler(e) {
        if (e.detail.pageId === brease.pageController.getCurrentPage(brease.appElem.id)) {
            _focusChain.sort(e.detail.pageId);
            if (e.detail.containerId === brease.appElem.id) {
                _focusChain.resetFocus();
            }
        }
    }

    function _contentLoadedHandler(e) {
        var contentId = e.detail.contentId,
            widgets = _getFocusableWidgetsOfContent(contentId);
        _focusChain.add(contentId, widgets);
    }

    function _contentRemovedHandler(e) {
        _focusChain.remove(e.detail.contentId);
    }

    function _onKeyDown(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                FocusManager.focusPrevious();
            } else {
                FocusManager.focusNext();
            }
        }
    }

    function _focusInHandler(e) {
        var targetWidgetElem = Utils.closestWidgetElem(e.target);
        _focusChain.focus(targetWidgetElem);
    }
    
    function _focusOutHandler(e) {
        if (e.relatedTarget !== null) {
            return;
        }
        // we also have to check for tabindex because i.e Keyboard has an input which could lose focus
        var targetWidgetElem = Utils.closestWidgetElem(e.target),
            widget = brease.callWidget(targetWidgetElem.id, 'widget');
        if (widget && widget.getTabIndex() >= 0 && !widget.isFocusable() && Utils.isVisible(targetWidgetElem.parentElement)) {
            _focusChain.focusNext();
        }
    }

    // returns a tabindex/dom sorted array of all widgets which have tabindex >= 0 
    function _getFocusableWidgetsOfContent(contentId) {
        var widgets = brease.uiController.widgetsController.getWidgetsOfContent(contentId).map(function (widgetId) {
            return brease.callWidget(widgetId, 'widget');
        }).filter(function (widget) {
            return widget.getTabIndex() >= 0;
        });
        return _sortWidgets(widgets);
    }

    // sortes array of widgets according to tabindex and position in DOM
    function _sortWidgets(widgets) {
        widgets.sort(function (a, b) {
            var tabIndexA = a.getTabIndex(),
                tabIndexB = b.getTabIndex();
            if (tabIndexA === tabIndexB) {
                return a.elem.compareDocumentPosition(b.elem) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
            } else if (tabIndexA === 0) {
                return 1;
            } else if (tabIndexB === 0) {
                return -1;
            }
            return tabIndexA - tabIndexB;
        });
        return widgets;
    }

    function createDebugStyle() {
        if (!_debugStyleElem) {
            _debugStyleElem = ControllerUtils.injectCSS('[data-focuspos]::after {' +
                'position: absolute;' +
                'top: 50%;' +
                'left: 50%;' +
                'background: #ccc; ' +
                'font-size: large;' +
                'border-style: solid;' +
                'border-radius: 3px;' +
                'text-align: center;' +
                'transform: translateX(-50%) translateY(-50%);' +
                'min-width: 2em;' +
                'z-index: 20000;' +
                'content: attr(data-focuspos);' +
            '}');
        }
        document.head.appendChild(_debugStyleElem);
    }

    function _debugKeyDown(e) {
        // space
        if (e.key === ' ') {
            FocusManager.debug();
        }
    }

    return FocusManager;
});
