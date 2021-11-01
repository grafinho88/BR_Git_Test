define(['brease/events/BreaseEvent',
    'brease/core/Utils',
    'brease/controller/WidgetController',
    'brease/controller/PageController', 
    'brease/controller/BindingController', 
    'brease/controller/ActionController',
    'brease/controller/objects/Client',
    'brease/controller/libs/Utils',
    'brease/controller/libs/ContentHelper',
    'brease/controller/WidgetParser',
    'brease/model/BindingModel',
    'brease/services/RuntimeService',
    'brease/helper/stubs/ServiceBridge',
    'brease/helper/jasmine/MatcherFactory'],
function (BreaseEvent, 
    Utils,
    widgetController, 
    pageController, 
    bindingController, 
    actionController,
    client, 
    controllerUtils,
    contentHelper,
    widgetParser,
    bindingModel,
    runtimeService, 
    serviceBridge,
    matcherFactory) {

    'use strict';
    
    var _lang = {}, 
        _mmsDeferred, _cultureDeferred;

    function switchLang(lang, config) {
        _lang.key = lang;
        _lang.start = Date.now();
        _lang.timeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
        _lang.deferred = $.Deferred();
        _lang.config = config;

        document.body.addEventListener(BreaseEvent.LANGUAGE_CHANGED, switchLangReadyHandler);
        if (brease.language.getCurrentLanguage() !== lang) {
            brease.language.switchLanguage(lang);
        } else {
            checkLangReady();
        }
        return _lang.deferred.promise();
    }

    function switchLangReadyHandler() {
        document.body.removeEventListener(BreaseEvent.LANGUAGE_CHANGED, switchLangReadyHandler);
        checkLangReady();
    }

    function checkLangReady() {
        var kbdEl = $('#breaseKeyBoard'),
            config = _lang.config,
            waitForAttribute = (config && config.waitsFor === 'data-lang');
            
        if (brease.language.getCurrentLanguage() === _lang.key && (waitForAttribute !== true || kbdEl.attr('data-lang') === _lang.key)) {
            _lang.deferred.resolve(); 
        } else { 
            if (Date.now() - _lang.start < _lang.timeout) { 
                window.setTimeout(checkLangReady, 50); 
            } else {
                _lang.deferred.reject(); 
            }
        }
    }

    function switchMMS(mms) {
        _mmsDeferred = $.Deferred();
        document.body.addEventListener(BreaseEvent.MEASUREMENT_SYSTEM_CHANGED, switchMmsReadyHandler);
        if (brease.measurementSystem.getCurrentMeasurementSystem() !== mms) {
            brease.measurementSystem.switchMeasurementSystem(mms);
        } else {
            _mmsDeferred.resolve();
        }
        return _mmsDeferred.promise();
    }

    function switchMmsReadyHandler() {
        document.body.removeEventListener(BreaseEvent.MEASUREMENT_SYSTEM_CHANGED, switchMmsReadyHandler);
        _mmsDeferred.resolve();
    }

    function switchCulture(culture) {
        _cultureDeferred = $.Deferred();
        document.body.addEventListener(BreaseEvent.CULTURE_CHANGED, switchCultureReadyHandler);
        if (brease.culture.getCurrentCulture().key !== culture) {
            brease.culture.switchCulture(culture);
        } else {
            _cultureDeferred.resolve();
        }
        return _cultureDeferred.promise();
    }

    function switchCultureReadyHandler() {
        document.body.removeEventListener(BreaseEvent.CULTURE_CHANGED, switchCultureReadyHandler);
        _cultureDeferred.resolve();
    }

    function setConditions(conditions, callback, config) {
        var arConditions = [];
        if (conditions.lang !== undefined) {
            arConditions.push(switchLang(conditions.lang, config));
        }
        if (conditions.mms !== undefined) {
            arConditions.push(switchMMS(conditions.mms));
        }
        if (conditions.culture !== undefined) {
            arConditions.push(switchCulture(conditions.culture));
        }
        $.when.apply(null, arConditions).then(function () {
            callback();
        });
    }

    function runConditions(conditions, config) {

        return new Promise(function (resolve) {
            setConditions(conditions, resolve, config);
        });
    }
    /**
    * @class brease.helper.TestUtils
    * @extends core.javascript.Object
    * Helper class for unit tests
    * @singleton
    */

    var TestUtils = {

        specPath: function (widgetName, libPath, subLib) {
            return libPath + widgetName + '.' + ((subLib !== undefined) ? subLib : widgetName);
        },

        callCount: function (spy) {
            if (spy.calls !== undefined && typeof spy.calls.count === 'function') {
                return spy.calls.count();
            } else {
                return 0;
            }
        },

        isSpy: function (fn) {
            return fn.isSpy === true || (fn.calls !== undefined && fn.and !== undefined);
        },

        /**
        * @method preConditions
        * method to set language and/or measurementSystem and/or culture before a testcase  
        * it can be used on different levels of testcase notation:  
        *    
        * e.g. inside of a "it" or "beforeAll" (ATTENTION: use return statement here):  
        * 
        *     beforeAll(function () {
        *         return TestUtils.preConditions('', { lang: 'de' }, { type: 'runs' });
        *     });
        * 
        * e.g. as an "it" inside of a "describe" (ATTENTION: use NO return statement here):  
        * 
        *     describe('describe block', function () {
        *         TestUtils.preConditions('with some description', { lang: 'de', culture: 'de' }, { type: 'it' });
        *     });
        * 
        * e.g. as standalone "describe" (ATTENTION: use NO return statement here):  
        * 
        *     TestUtils.preConditions('with some description', { mms: 'imperial' }, { type: 'describe' });
        * 
        * @param {String} description description when used as "describe" block or "it" block  
        * @param {Object} conditions contains conditions to be set
        * @param {String} [conditions.lang] if language should be set
        * @param {String} [conditions.mms] if measurementSystem should be set
        * @param {String} [conditions.culture] if culture should be set
        * @param {Object} config
        * @param {String} config.type configuration of the usecase: "describe", "it" or "runs"; this type must match the real use of preConditions to function proper
        * @param {String} config.waitsFor can be set to "data-lang" for conditions.lang: in this case the promise is resolved when the attribute data-lang has the value of the new lang key in DOM of the keyboard
        */
        preConditions: function (title, conditions, config) {

            if (!config || config.type === 'describe') {
                describe(title, function () {
                    it('', function () {
                        return runConditions(conditions, config);
                    });
                }); 
            }
            if (config && config.type === 'it') {
                it(title, function () {
                    return runConditions(conditions, config);
                });
            }
            if (config && config.type === 'runs') {
                return runConditions(conditions, config);
            }
        },

        /**
        * @method logWithParent
        * write description of spec and description of parent suite (describe-block) to console
        * the returned method takes two arguments:
        *   the spec itself ('this' inside of it-block)
        *   config object
        * @param {Boolean} flag to enable or disable
        * @param {Object} parentConfig
        * @param {Color} parentConfig.color
        * @param {String} parentConfig.method of console to use
        * @return {Function}
        */
        logWithParent: function (flag, parentConfig) {
            if (flag) {
                parentConfig = parentConfig || {};
                parentConfig.method = (parentConfig.method) ? parentConfig.method : 'log';
                parentConfig.color = (parentConfig.color) ? parentConfig.color : '#999999';
                parentConfig.parent = (parentConfig.parent !== undefined) ? parentConfig.parent : true;
                return function (spec, config) {
                    if (spec && spec.suite) {
                        if (!config) {
                            config = {};
                        }
                        if (console[parentConfig.method]) {
                            console[parentConfig.method]('%c' + ((config.prefix) ? config.prefix : '') + ((parentConfig.parent) ? spec.suite.parentSuite.description + spec.suite.description : '') + spec.description + ((config.suffix) ? config.suffix : ''), 'color:' + parentConfig.color);
                        } else {
                            console.log('%c' + ((config.prefix) ? config.prefix : '') + ((parentConfig.parent) ? spec.suite.parentSuite.description + spec.suite.description : '') + spec.description + ((config.suffix) ? config.suffix : ''), 'color:' + parentConfig.color);
                        }
                    }
                };
            } else {
                return function () { };
            }
        },

        /**
        * @method log
        * write description of spec to console
        * the returned method takes two arguments:
        *   the spec itself ('this' inside of it-block)
        *   config object
        * @param {Boolean} flag to enable or disable 
        * @param {Color} color
        * @param {String} method of console to use
        * @return {Function}
        */
        log: function (flag, color, method) {
            if (flag) {
                return function (spec, config) {
                    if (spec) {
                        if (!config) {
                            config = {};
                        }
                        var message;
                        if (console[method]) {
                            message = '%c########### ' + ((config.prefix) ? config.prefix : '') + spec.description + ((config.suffix) ? config.suffix : '');
                            console[method](message, 'color:' + (color || '#999999'));
                        } else {
                            message = '%c########### ' + ((config.prefix) ? config.prefix : '') + spec.description + ((config.suffix) ? config.suffix : '');
                            console.log(message, 'color:' + (color || '#999999'));
                        }
                    }
                };
            } else {
                return function () { };
            }
        },

        logSuite: function (suite) {
            var prefix = (brease.config.jenkins === true) ? '\n[' : '[';
            var suffix = (brease.config.jenkins === true) ? ']' : ']';
            console.debug(prefix + ((suite && suite.spec && typeof suite.spec.replace === 'function') ? suite.spec.replace(/\./g, '/') : 'undefined') + suffix);
        },

        console: function (action, callThrough, config) {
            if (action === 'mock') {
                TestUtils.callThrough = callThrough;
                TestUtils.config = config || {};
                window.console = TestUtils.fakeConsole;
            } else {
                window.console = TestUtils.originalConsole;
            }
        },

        originalConsole: window.console,
        fakeConsole: {

            log: function () {
                if (TestUtils.callThrough || TestUtils.config.log === true) {
                    TestUtils.originalConsole.log.apply(TestUtils.originalConsole, arguments);
                }
            },
            warn: function () {
                if (TestUtils.callThrough || TestUtils.config.warn === true) {
                    TestUtils.originalConsole.warn.apply(TestUtils.originalConsole, arguments);
                }
            },
            debug: function () {
                if (TestUtils.callThrough || TestUtils.config.debug === true) {
                    TestUtils.originalConsole.debug.apply(TestUtils.originalConsole, arguments);
                }
            },
            error: function () {
                TestUtils.originalConsole.error.apply(TestUtils.originalConsole, arguments);
            },
            info: function () {
                if (TestUtils.callThrough || TestUtils.config.info === true) {
                    TestUtils.originalConsole.info.apply(TestUtils.originalConsole, arguments);
                }
            },
            trace: function () {
                if (TestUtils.callThrough || TestUtils.config.trace === true) {
                    TestUtils.originalConsole.trace.apply(TestUtils.originalConsole, arguments);
                }
            },
            time: function () {
                if (TestUtils.callThrough || TestUtils.config.time === true) {
                    TestUtils.originalConsole.time.apply(TestUtils.originalConsole, arguments);
                }
            },
            timeEnd: function () {
                if (TestUtils.callThrough || TestUtils.config.timeEnd === true) {
                    TestUtils.originalConsole.timeEnd.apply(TestUtils.originalConsole, arguments);
                }
            },
            iatWarn: function () {
                if (TestUtils.callThrough || TestUtils.config.iatWarn === true) {
                    TestUtils.originalConsole.iatWarn.apply(TestUtils.originalConsole, arguments);
                }
            },
            iatDebug: function () {
                if (TestUtils.callThrough || TestUtils.config.iatDebug === true) {
                    TestUtils.originalConsole.iatDebug.apply(TestUtils.originalConsole, arguments);
                }
            },
            iatDebugLog: function () {
                if (TestUtils.callThrough || TestUtils.config.iatDebugLog === true) {
                    TestUtils.originalConsole.iatDebug.apply(TestUtils.originalConsole, arguments);
                }
            },
            iatInfo: function () {
                if (TestUtils.callThrough || TestUtils.config.iatInfo === true) {
                    TestUtils.originalConsole.iatInfo.apply(TestUtils.originalConsole, arguments);
                }
            },
            dir: function () {
                TestUtils.originalConsole.dir.apply(TestUtils.originalConsole, arguments);
            },
            always: function () {
                TestUtils.originalConsole.log.apply(TestUtils.originalConsole, arguments);
            },
            alwaysWarn: function () {
                TestUtils.originalConsole.warn.apply(TestUtils.originalConsole, arguments);
            }
        },

        addMatchers: function (testcase, arType) {

            if (Array.isArray(arType)) {
                var matcher = {};
                arType.forEach(function (type) {
                    if (objMatcher[type]) {
                        matcher[type] = objMatcher[type];
                    }
                });
                matcherFactory.addMatchers(testcase, matcher);
            }
        },

        resetAppContainer: function () {
            brease.appView.css({
                width: 'initial',
                height: '1px',
                position: 'absolute',
                transform: 'none',
                display: 'inline-block',
                top: '0px',
                left: '0px',
                'font-size': '12px',
                'z-index': 0
            });
        },

        resetFramework: function () {

            brease.config.editMode = false;
            brease.config.preLoadingState = false;
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;
            serviceBridge.testServices.reset();
            pageController.reset();
            widgetController.reset(true);
            bindingModel.reset();
            pageController.rootContainer = brease.appElem;
            pageController.init(runtimeService);
            bindingController.init(runtimeService);
            brease.uiController.bindingController = bindingController;
            actionController.init(runtimeService, contentHelper);
            client.init(runtimeService);
            client.setValid(true);
            TestUtils.resetAppContainer();
        },

        /**
        * @method createWidgets
        * create a bunch of widgets and wait for their ready events  
        * usable in two different ways:  
        *
        *     TestUtils.createWidgets(...).then(function () {
        *       (do something with the newly created widgets)
        *     });
        *
        * or standalone as a runs/waitsFor bundle:  
        *
        *     runs(function () {...});
        *     TestUtils.createWidgets(...);
        *     runs(function () {...});
        *
        * @param {WidgetConfig[]} widgets
        * @param {String} targetId Either the id of the HTMLElement which should be created to contain the widgets, or id of an already existing target.
        * @param {HTMLElement/jQuery/Selector} container Container where the target should be appended (can be null, if target already exists)
        * @param {String} [contentId] contentId for widget creation
        * @param {Object} [targetConfig] height and width of the HTMLElement which contains the widgets.
        * @param {Integer} targetConfig.height
        * @param {Integer} targetConfig.width
        * @return {Promise}
        */
        createWidgets: function (widgets, targetId, container, contentId, targetConfig) {

            var callback, listener, target,
                deferred = new $.Deferred(),
                widgetIds;

            runs(function () {
                widgetIds = widgets.map(function (item) {
                    return item.id;
                });
                callback = jasmine.createSpy();
                target = $('#' + targetId);
                
                if (target.length > 0) {
                    target = target[0];
                } else {
                    target = $('<div id="' + targetId + '" style="height:0px; overflow:hidden;" />').appendTo(container)[0];
                    if (targetConfig) {
                        $(target).css({ height: targetConfig.height, width: targetConfig.width });    
                    }
                }
                listener = function (e) {
                    if (widgetIds.indexOf(e.target.id) !== -1) {
                        callback();
                    }
                };
                target.addEventListener(BreaseEvent.WIDGET_READY, listener, true);
                if (contentId !== undefined) {
                    brease.uiController.createWidgets(target, widgets.slice(0), true, contentId); 
                } else {
                    brease.uiController.createWidgets(target, widgets.slice(0), true); 
                }
            });

            waitsFor(function () {
                return TestUtils.callCount(callback) >= widgets.length;
            }, 'widget creation', 3000);

            runs(function () {
                target.removeEventListener(BreaseEvent.WIDGET_READY, listener, true);
                expect(TestUtils.callCount(callback)).toEqual(widgets.length);
                deferred.resolve();
            });
            return deferred.promise();
        },

        /**
        * @method createWidgetsV3
        * create a bunch of widgets and wait for their ready events  
        * usable in different ways:  
        *
        *     beforeAll(function () { 
        *       return TestUtils.createWidgetsV3(widgets, targetId, brease.appElem, contentId);
        *     });
        * 
        * or                          
        *
        *     beforeAll(function () { 
        *        return TestUtils.createWidgetsV3(widgets, targetId, brease.appElem, contentId) 
        *        .then(function () {
        *           (do something with the newly created widgets)
        *        });
        *     });
        * 
        * or                          
        *
        *     beforeAll(function () { 
        *        return Promise.resolve().then(function () {
        *           (do something before widget creation)
        *        }).then(function () { 
        *           return TestUtils.createWidgetsV3(widgets, targetId, brease.appElem, contentId);
        *        });
        *     });
        *
        * @param {WidgetConfig[]} widgets
        * @param {String} targetId Either the id of the HTMLElement which should be created to contain the widgets, or id of an already existing target.
        * @param {HTMLElement/jQuery/Selector} container Container where the target should be appended (can be null, if target already exists)
        * @param {String} [contentId] contentId for widget creation
        * @param {Object} [targetConfig] height and width of the HTMLElement which contains the widgets.
        * @param {Integer} targetConfig.height
        * @param {Integer} targetConfig.width
        * @return {Promise}
        */
        createWidgetsV3: function (widgets, targetId, container, contentId, targetConfig) {

            return new Promise(function (resolve) {
                var callback = jasmine.createSpy(), 
                    target = $('#' + targetId),
                    widgetIds = widgets.map(function (item) { return item.id; });
                    
                if (target.length > 0) {
                    target = target[0];
                } else {
                    target = $('<div id="' + targetId + '" style="height:0px; overflow:hidden;" />').appendTo(container)[0];
                    if (targetConfig) {
                        $(target).css({ height: targetConfig.height, width: targetConfig.width });    
                    }
                }
                var listener = function (e) {
                    if (widgetIds.indexOf(e.target.id) !== -1) {
                        callback();
                        if (callback.calls.count() === widgets.length) {
                            target.removeEventListener(BreaseEvent.WIDGET_READY, listener, true);
                            resolve();
                        }
                    }
                };
                target.addEventListener(BreaseEvent.WIDGET_READY, listener, true);
                if (contentId !== undefined) {
                    brease.uiController.createWidgets(target, widgets.slice(0), true, contentId); 
                } else {
                    brease.uiController.createWidgets(target, widgets.slice(0), true); 
                }
            });
        },

        /**
        * @method addContent
        * add a content html file and create widgets in it and wait for their ready events  
        * usable in two different ways:  
        *
        * TestUtils.addContent(...).then(function () {
        *   (do something with the newly created widgets)
        * });
        *
        * or standalone as a runs/waitsFor bundle:  
        *
        * runs(function () {...});
        * TestUtils.addContent(...);
        * runs(function () {...});
        *
        * @param {String} url
        * @param {String} targetId Either the id of the HTMLElement which should be created to contain the widgets, or id of an already existing target.
        * @param {HTMLElement/jQuery/Selector} container Container where the target should be appended (can be null, if target already exists)
        * @param {String} contentId contentId for widget creation
        * @param {Object} targetConfig height and width of the HTMLElement which contains the widgets.
        * @return {Promise}
        */
        addContent: function (url, targetId, container, contentId, targetConfig) {
            var callback = jasmine.createSpy(), 
                loadSpy = jasmine.createSpy(),
                target, 
                html,
                widgetIds = [],
                deferred = new $.Deferred();

            runs(function () {
                var $target = $('#' + targetId);
                if ($target.length > 0) {
                    target = $target[0];
                } else {
                    target = $('<div id="' + targetId + '" style="height:0px; overflow:hidden;" />').appendTo(container)[0];
                    if (targetConfig) {
                        $(target).css({ height: targetConfig.height, width: targetConfig.width });    
                    }
                }
                brease.pageController.loadHTML(url).done(function (loadedHtml) {
                    html = loadedHtml;
                    loadSpy();
                });
            });

            waitsFor(function () {
                return TestUtils.callCount(loadSpy) === 1;
            }, 'content html loaded', 5000);

            runs(function () {

                controllerUtils.appendHTML(target, html);
                $(target).find('[data-brease-widget]').each(function () {
                    widgetIds.push(this.id);
                });

                target.addEventListener(BreaseEvent.WIDGET_READY, function (e) {
                    if (widgetIds.indexOf(e.target.id) !== -1) {
                        callback();
                    }
                }, true);
                widgetParser.parse(target, false, contentId);
            });

            waitsFor(function () {
                return TestUtils.callCount(callback) >= widgetIds.length;
            }, 'widgets ready', 5000);

            runs(function () {
                expect(TestUtils.callCount(callback)).toEqual(widgetIds.length);
                deferred.resolve();
            });
            return deferred.promise();
        },

        /*
        * deferStub
        * util to spy on a _.defer call and fullfil it on demand  
        * only one call is supported simultaneously  
        * 
        * spyOn(_, 'defer').andCallFake(TestUtils.deferStub.call);
        * 
        * TestUtils.deferStub.release();
        */
        deferStub: {
            id: 0,
            _call: function () {
                this.fn = arguments[0];
                this.args = Array.prototype.slice.call(arguments, 1);
            },
            _release: function () {
                if (typeof this.fn === 'function') {
                    this.fn.apply(this.fn, this.args);
                }
                this.fn = undefined;
                this.args = undefined;
            }
        },

        /**
        * @method
        * Find all css class names of an HTMLElement which contain a specified string.  
        * @param {HTMLElement} elem
        * @param {String} str
        * @return {String[]}
        */
        findStyleClasses: function (elem, str) {
            var stylePattern = new RegExp('.*' + str + '.*');
            return Array.from(elem.classList).filter(function (cl) {
                return stylePattern.test(cl);
            });
        },

        /**
         * Creates a promise which resolves after timeout.
         * @param {Integer} t timeout in ms
         * @returns {Promise}
         */
        promisedTimeout: function (t) {
            return new Promise(function (resolve) {
                window.setTimeout(resolve, t);
            });
        },

        /**
         * @method
         * This method replaces the polling waitsFor from jasmine 1.3
         * @param {*} condition 
         * @param {Integer} interval the interval at which the function is being called at
         * @param {Integer} timeout the timeout of the function, where the function fails and error message + derscription message is printed
         * @param {String} description error message if function fails
         */
        pollAndWait: function (condition, interval, timeout, description) {
            description = Utils.isString(description) ? description : (Utils.isString(interval) ? interval : (Utils.isString(timeout) ? timeout : ''));
            interval = (isNaN(interval)) ? 10 : parseInt(interval, 10);
            timeout = (isNaN(timeout)) ? 3000 : parseInt(timeout, 10);
            // console.alwaysWarn('description:' + description);
            // console.alwaysWarn('interval:' + interval);
            // console.alwaysWarn('timeout:' + timeout);
            return new Promise(function (resolve, reject) {
                var iv = window.setInterval(function () {
                    if (condition()) {
                        window.clearInterval(iv);
                        window.clearTimeout(to);
                        resolve();
                    }
                }, interval);
                var to = window.setTimeout(function () {
                    window.clearInterval(iv);
                    console.always('pollAndWait timed out' + ((description) ? '(' + description + ')' : ''));
                    reject(new Error('timeout'));
                }, timeout);
            });
        },
        /**
         * @method
         * This method adds some predefined spyStrategies.  
         * Against the docu of jasmine, it's not possible to add the strategy in a beforeAll. It's mandatory to use a beforeEach.
         * 
         *     beforeEach(function () {
         *        TestUtils.addSpyStrategy('callThroughAndThen');
         *     });
         * 
         * @param {String} strategyName predefined name of the strategy
         */
        addSpyStrategy: function (strategyName) {
            if (strategyName === 'callThroughAndThen') {
                jasmine.addSpyStrategy('callThroughAndThen', function (context, spy, thenFn) {
                    return function () {
                        spy.and.originalFn.apply(context, spy.calls.mostRecent().args);
                        thenFn();
                    };
                });
            }
        },
        /**
         * @method
         * shortcut for the spy strategy callThroughAndThen
         * @param {Object} context object on which should be spied
         * @param {String} methodName name of method on which should be spied on
         * @param {Function} thenFn function which should be called after the spy
         */
        spyOnCallThroughAndThen: function (context, methodName, thenFn) {
            var spy = spyOn(context, methodName);
            spy.and.callThroughAndThen(context, spy, thenFn);
        }
    };
    TestUtils.deferStub.call = TestUtils.deferStub._call.bind(TestUtils.deferStub);
    TestUtils.deferStub.release = TestUtils.deferStub._release.bind(TestUtils.deferStub);

    // returns the index at which an element in the array of strings first occurs or -1 if it does not occur.
    function arraysHaveSameMembers(x, y) {
        var equal = Array.isArray(x) && Array.isArray(y) && x.length === y.length;
        for (var i = 0; i < x.length; i += 1) {
            equal = equal && (y.indexOf(x[i]) !== -1);
        }
        return equal;
    }

    var _customMatcher = {
        toEqualArray: function (actual, expected) {
            return {
                pass: arraysHaveSameMembers(actual, expected),
                message: 'Expected ' + JSON.stringify(actual) + ' to equal ' + JSON.stringify(expected) + '.'
            };
        },
        toEqualDefinedProperties: function (actual, expected) {
            var keys1 = Object.keys(actual).filter(function valueIsDefined(key) {
                    return actual[key] !== undefined;
                }),
                keys2 = Object.keys(expected).filter(function valueIsDefined(key) {
                    return expected[key] !== undefined;
                });
            if (!arraysHaveSameMembers(keys1, keys2)) {
                return {
                    pass: false,
                    message: 'Objects do not have the same properties'
                };
            }
            for (var i = 0; i < keys1.length; i += 1) {
                if (actual[keys1[i]] !== expected[keys1[i]]) {
                    return {
                        pass: false,
                        message: 'Objects have different property ' + keys1[i]
                    };
                }
            }
            return {
                pass: true
            };
        }
    };

    var objMatcher = {};

    for (var matcherName in _customMatcher) {
        objMatcher[matcherName] = matcherFactory.createMatcher(_customMatcher[matcherName]);
    }

    return TestUtils;

});
