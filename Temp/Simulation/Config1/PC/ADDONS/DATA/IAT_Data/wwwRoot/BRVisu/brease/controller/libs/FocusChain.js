define(['brease/events/BreaseEvent', 'brease/controller/libs/Utils'], function (BreaseEvent, Utils) {

    'use strict';

    var FocusChain = function () {
        // chain contains all contents with widgets in the order according to tabindex/dom position
        // position: current focused element index: chain[position.content].widgets[position.widget]
        // example chain: [{ contentId: 'content', widgets: [widget1, widget2] }]
        this.chain = [];
        this.position = { content: undefined, widget: undefined  };
        this.orderedContents = [];
    };

    FocusChain.prototype.hasFocus =  function () {
        return this.position.content !== undefined && this.chain[this.position.content] !== undefined;
    };

    FocusChain.prototype.resetFocus = function () {
        if (this.hasFocus()) {
            this.getFocusedElem().focus();
        } else {
            this.position.content = 0;
            this.position.widget = 0;
            this.focusNext(true, true);
        }
    };

    FocusChain.prototype.add = function (contentId, widgets) {
        if (!_hasContent.call(this, contentId)) {
            if (brease.pageController.isPageChangeInProgress()) {
                this.chain.push({ contentId: contentId, widgets: widgets });
            } else {
                if (this.position.content === undefined) {
                    this.chain.push({ contentId: contentId, widgets: widgets });
                    this.resetFocus();
                } else {
                    _insert.call(this, { contentId: contentId, widgets: widgets });
                }
            }
        }
    };

    FocusChain.prototype.remove = function (contentId) {
        if (brease.pageController.isPageChangeInProgress() && !brease.pageController.isContentToBeRemoved(contentId)) {
            return;
        }
        var index = _getFocusPositionOfContent.call(this, contentId);
        if (index === -1) {
            return;
        }
        this.chain.splice(index, 1);
        if (index === this.position.content) {
            if (!brease.pageController.isPageChangeInProgress() && this.chain.length > 0) {
                this.position.widget = 0;
                this.focusNext(true, true);
            } else {
                // if content removed due to page change we recover the focus on next page load or content add
                this.position.content = undefined;
                this.position.widget = undefined;
            }
        } else if (index < this.position.content) {
            --this.position.content;
        }
    };
    FocusChain.prototype.sort = function (pageId) {
        var orderedContents = getOrderedContents(pageId),
            newFocusPosition;
        for (var i = 0; i < orderedContents.length; ++i) {
            var indexOfContent = this.chain.findIndex(function (link) {
                return orderedContents[i].contentId === link.contentId; 
            });
            if (indexOfContent >= 0) {
                if (this.hasFocus() && this.position.content === indexOfContent) {
                    newFocusPosition = i;
                }
                orderedContents[i].widgets = this.chain[indexOfContent].widgets;
            } else {
                // if there is no content for a area (loadContentInArea) create a dummy in chain 
                // so if a content is loaded later in this area it can be inserted right after the dummy
                orderedContents[i].widgets = [];
                delete orderedContents[i].contentId;
            }
        }
        this.position.content = newFocusPosition;
        this.chain = orderedContents;
    };

    FocusChain.prototype.focus = function (elem) {
        if (elem === this.getFocusedElem()) return;

        for (var i = 0; i < this.chain.length; ++i) {
            var widgets = this.chain[i].widgets;
            for (var j = 0; j < widgets.length; ++j) {
                if (widgets[j].elem.isSameNode(elem)) {
                    this.position = { content: i, widget: j };
                    return;
                }
            }
        }
    };

    /**
     * Set focus on next focusable widget in chain. 
     * @param {*} current Start at the current position
     * @param {Boolean} omitEvent omit BEFORE_FOCUS_MOVE move event i.e the element is not available anymore 
     */
    FocusChain.prototype.focusNext = function (current, omitEvent) {
        if (this.chain.length === 0) {
            this.position.widget = undefined;
            this.position.content = undefined;
            return;
        }
        var focusedElem = this.getFocusedElem();
        // exit if we found no visible focusable element in the whole chain
        for (var i = 0; i < this.chain.length + 1; ++i) {
            if (this.position.content >= this.chain.length) {
                this.position.content = 0;
            }
            var widgets = this.chain[this.position.content].widgets;
            for (; this.position.widget < widgets.length; ++this.position.widget) {
                if (!current) {
                    current = true;
                    continue;
                }
                var widget = widgets[this.position.widget];
                if (widget.isFocusable()) {
                    if (!omitEvent) {
                        focusedElem.dispatchEvent(new CustomEvent(BreaseEvent.BEFORE_FOCUS_MOVE, { bubbles: false, cancelable: false, detail: {} }));
                    }
                    widget.elem.focus();
                    return;
                }
            }
            this.position.widget = 0;          
            ++this.position.content;
        }
        this.position.widget = undefined;
        this.position.content = undefined;
    };

    FocusChain.prototype.focusPrevious = function () {
        var current = false;
        if (this.chain.length === 0) {
            this.position.widget = undefined;
            this.position.content = undefined;
            return;
        }
        var focusedElem = this.getFocusedElem();
        // exit if we found no visible focusable element in the whole chain
        for (var i = 0; i < this.chain.length + 1; ++i) {
            if (this.position.content < 0) {
                this.position.content = this.chain.length - 1;
            }
            var widgets = this.chain[this.position.content].widgets;
            if (widgets.length > 0) {
                if (this.position.widget === undefined) {
                    this.position.widget = widgets.length - 1;
                }
                for (; this.position.widget >= 0; --this.position.widget) {
                    if (!current) {
                        current = true;
                        continue;
                    }
                    var widget = widgets[this.position.widget];
                    if (widget.isFocusable()) {
                        if (!focusedElem.isSameNode(widget.elem)) {
                            focusedElem.dispatchEvent(new CustomEvent(BreaseEvent.BEFORE_FOCUS_MOVE, { bubbles: false, cancelable: false, detail: {} }));
                        }
                        widget.elem.focus();
                        return;
                    }
                }
            }
            this.position.widget = undefined;          
            --this.position.content;
        }
        this.position.widget = undefined;
        this.position.content = undefined;
    };

    FocusChain.prototype.getFocusedElem = function () {
        if (this.hasFocus() && this.chain[this.position.content].widgets.length > 0) {
            return this.chain[this.position.content].widgets[this.position.widget].elem;
        }
    };

    function _hasContent(contentId) {
        return _getFocusPositionOfContent.call(this, contentId) !== -1;
    }

    function _getFocusPositionOfContent(contentId) {
        for (var i = 0; i < this.chain.length; ++i) {
            if (this.chain[i].contentId === contentId) {
                return i;
            }
        }
        return -1;
    }

    function getOrderedContents(pageId) {
        var page = brease.pageController.getPageById(pageId),
            areas = brease.pageController.getLayoutById(page.layout).areas,
            ordered = [];
        for (var areaAssignment in page.assignments) {
            var assignment = page.assignments[areaAssignment],
                tabIndex = areas[assignment.areaId].tabIndex > 0 ? areas[assignment.areaId].tabIndex : undefined;
            if (assignment.type === 'Content') {
                ordered.push({ pageId: pageId, areaId: assignment.areaId, contentId: assignment.contentId, tabIndex: [tabIndex] });
            } else if (assignment.type === 'Page') {
                var contents = getOrderedContents(assignment.contentId);
                contents.forEach(function (content) {
                    content.tabIndex.unshift(tabIndex);
                });
                ordered = ordered.concat(contents);
            } // else { // type visu
            // the code below would only work if you have no navigation in emb visu.. otherwise we would need a new FocusChain for the emb visu
            // var visu = brease.pageController.getVisuById(assignment.contentId),
            //     visuPageId = brease.pageController.getCurrentPage(visu.containerId);
            // var c = getOrderedContents(visuPageId);
            // ordered = ordered.concat(c);
            // }
        }
        ordered.sort(function (a, b) {
            // sort back undefined tabIndexs
            if (a.tabIndex[0] === undefined) return 1;
            if (b.tabIndex[0] === undefined) return -1;
            return a.tabIndex[0] - b.tabIndex[0];
        });
        return ordered;
    }

    // insert a content with widgets into sorted chain according the area of the content 
    function _insert(content) {
        Object.assign(content, Utils.getContentPageAreaIds(content.contentId));

        var insertIndex = _findLastIndexOfPageArea.call(this, content.pageId, content.areaId);
        if (insertIndex === -1) {
            return;
        }
        this.chain.splice(++insertIndex, 0, content);
        if (insertIndex <= this.position.content) {
            ++this.position.content;
        }
    }

    function _findLastIndexOfPageArea(pageId, areaId) {
        for (var i = this.chain.length - 1; i >= 0; i--) {
            if (this.chain[i].pageId === pageId && this.chain[i].areaId === areaId) {
                return i;
            }
        }
        return -1;
    }

    return FocusChain;
});
