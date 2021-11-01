define(['brease/core/BaseWidget',
    'brease/enum/Enum',
    'brease/events/BreaseEvent',
    'brease/core/Utils',
    'brease/decorators/LanguageDependency',
    'brease/decorators/UserDependency',
    'brease/core/Types',
    'brease/decorators/DragAndDropCapability'
], function (SuperClass, Enum, BreaseEvent, Utils, languageDependency, userDependency, Types, dragAndDropCapability) {

    'use strict';

    /**
     * @class widgets.brease.Login
     * #Description
     * widget provides an interface to login a user
     *
     * @mixins widgets.brease.common.DragDropProperties.libs.DroppablePropertiesEvents
     *
     * @breaseNote 
     * @extends brease.core.BaseWidget
     * @requires widgets.brease.TextInput
     * @requires widgets.brease.Label
     * @requires widgets.brease.Password
     * @requires widgets.brease.Button
     * @requires widgets.brease.BusyIndicator
     *
     * @iatMeta category:Category
     * Login,System
     * @iatMeta description:short
     * Benutzeranmeldung
     * @iatMeta description:de
     * Widget bietet Möglichkeit zum Login eines Benutzers
     * @iatMeta description:en
     * Widget provides an interface to login a user
     */

    /**
     * @cfg {String} userLabel='Username'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Label for username
     */

    /**
     * @cfg {String} passwordLabel='Password'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Label for password
     */

    /**
     * @cfg {String} buttonLabel='Login'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Label for button
     */

    /**
     * @cfg {String} userName=''
     * @iatStudioExposed
     * @iatCategory Appearance
     * user name
     */

    /**
     * @cfg {StyleReference} buttonStyle='default'
     * @iatStudioExposed
     * @iatCategory Appearance
     * @typeRefId widgets.brease.Button
     * assignment of style for the login Button
     * the style needs to be available for the widget brease.Button
     */

    /**
     * @cfg {StyleReference} userInputStyle='default'
     * @iatStudioExposed
     * @iatCategory Appearance
     * @typeRefId widgets.brease.TextInput
     * assignment of style for the user input
     * the style needs to be available for the widget brease.TextInput
     */

    /**
     * @cfg {StyleReference} passwordInputStyle='default'
     * @iatStudioExposed
     * @iatCategory Appearance
     * @typeRefId widgets.brease.Password
     * assignment of style for the password input
     * the style needs to be available for the widget brease.Password
     */

    /**
     * @cfg {StyleReference} labelStyle='default'
     * @iatStudioExposed
     * @iatCategory Appearance
     * @typeRefId widgets.brease.Label
     * assignment of style for the labels for username and password input
     * the style needs to be available for the widget brease.Label
     */

    /**
     * @cfg {StyleReference} messageStyle='default'
     * @iatStudioExposed
     * @iatCategory Appearance
     * @typeRefId widgets.brease.Label
     * assignment of style for the status message label
     * the style needs to be available for the widget brease.Label
     */

    /**
     * @cfg {Boolean} enableUserInput=true
     * @iatStudioExposed
     * @iatCategory Behavior
     * Enables or disables the input of the Username
     */

    /**
     * @cfg {String} userChangedMessage='User changed to: '
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Message which appears if user changes + username
     */

    /**
     * @cfg {String} autFailMessage='Authorisation failed'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Message which appears if authorisation fails
     */

    /**
     * @cfg {String} setUserFailMessage='Set User failed'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Message which appears if login of the user fails
     */

    /**
     * @cfg {String} setUserSuccessMessage='Login successful'
     * @localizable
     * @iatStudioExposed
     * @iatCategory Appearance
     * Message which appears if login is successful
     */

    /**
     * @cfg {Boolean} keyboard=true
     * @iatStudioExposed
     * @iatCategory Behavior
     * Determines if internal soft keyboard should open
     */

    /**
     * @cfg {Integer} tabIndex=0
     * @iatStudioExposed
     * @iatCategory Behavior 
     * sets if a widget should have autofocus enabled (0), the order of the focus (>0),
     * or if autofocus should be disabled (-1)
     */

    var brease = window.brease,
        defaultSettings = {
            userLabel: 'Username',
            passwordLabel: 'Password',
            buttonLabel: 'Login',
            userName: '',
            enableUserInput: true,
            buttonStyle: 'default',
            userInputStyle: 'default',
            passwordInputStyle: 'default',
            labelStyle: 'default',
            messageStyle: 'default',
            userChangedMessage: 'User changed to: ',
            autFailMessage: 'Authorisation failed',
            setUserFailMessage: 'Set User failed',
            setUserSuccessMessage: 'Login successful',
            keyboard: true,
            tabIndex: 0
        },

        WidgetClass = SuperClass.extend(function Login() {
            SuperClass.apply(this, arguments);
        }, defaultSettings),

        p = WidgetClass.prototype;

    p.init = function () {
        if (this.settings.omitClass !== true) {
            this.addInitialClass('breaseLogin');
        }
        SuperClass.prototype.init.call(this, true);

        this.buttonId = Utils.uniqueID(this.elem.id + '_liButton');
        this.userNameId = Utils.uniqueID(this.elem.id + '_liUser');
        this.userLabelId = Utils.uniqueID(this.elem.id + '_liUserLabel');
        this.passwordId = Utils.uniqueID(this.elem.id + '_liPassword');
        this.passwordLabelId = Utils.uniqueID(this.elem.id + '_liPasswordLabel');
        this.messageLabelId = Utils.uniqueID(this.elem.id + '_liMessageLabel');
        this.busyId = Utils.uniqueID(this.elem.id + '_liBusyIndi');

        this.el.append($('<div class="userRow"/><div class="passRow"/><div class="btnRow"/><div class="breaseLoginBusyWrapper"/>'));

        _addChildWidgets(this);
        _setUserChangedMessageText(this);
    };

    p._clickHandler = function (e) {
        SuperClass.prototype._clickHandler.call(this, e, { origin: this.elem.id });
    };

    p.langChangeHandler = function () {
        _setUserChangedMessageText(this);
        if (this.settings.status === 3) {
            this._setMessage(this.settings.userChangedMessageText + this.settings.currentUser);
        }
    };

    p.enable = function () {
        SuperClass.prototype.enable.call(this);
        if (this.state === Enum.WidgetState.READY) {
            this.userLabelWidget.setEnable(true);
            this.textInputWidget.setEnable(this.getEnableUserInput());
            this.passwordLabelWidget.setEnable(true);
            this.passwordWidget.setEnable(true);
            this.buttonWidget.setEnable(true);
            this.messageLabelWidget.setEnable(true);
        }
    };

    p.disable = function () {
        SuperClass.prototype.disable.call(this);
        if (this.state === Enum.WidgetState.READY) {
            this.userLabelWidget.setEnable(false);
            this.textInputWidget.setEnable(false);
            this.passwordLabelWidget.setEnable(false);
            this.passwordWidget.setEnable(false);
            this.buttonWidget.setEnable(false);
            this.messageLabelWidget.setEnable(false);
        }
    };

    /**
     * @method setUserLabel
     * Sets userLabel
     * @param {String} userLabel
     */
    p.setUserLabel = function (userLabel) {
        this.settings.userLabel = userLabel;
        brease.callWidget(this.userLabelId, 'setText', userLabel);
    };

    /**
     * @method getUserLabel 
     * Returns userLabel.
     * @return {String}
     */
    p.getUserLabel = function () {
        return this.settings.userLabel;
    };

    /**
     * @method setPasswordLabel
     * Sets passwordLabel
     * @param {String} passwordLabel
     */
    p.setPasswordLabel = function (passwordLabel) {
        this.settings.passwordLabel = passwordLabel;
        brease.callWidget(this.passwordLabelId, 'setText', passwordLabel);
    };

    /**
     * @method getPasswordLabel 
     * Returns passwordLabel.
     * @return {String}
     */
    p.getPasswordLabel = function () {
        return this.settings.passwordLabel;
    };

    /**
     * @method setButtonLabel
     * Sets buttonLabel
     * @param {String} buttonLabel
     */
    p.setButtonLabel = function (buttonLabel) {
        this.settings.buttonLabel = buttonLabel;
        brease.callWidget(this.buttonId, 'setText', buttonLabel);
    };

    /**
     * @method getButtonLabel 
     * Returns buttonLabel.
     * @return {String}
     */
    p.getButtonLabel = function () {
        return this.settings.buttonLabel;
    };

    /**
     * @method setEnableUserInput
     * Sets enableUserInput
     * @param {Boolean} enableUserInput
     */
    p.setEnableUserInput = function (enableUserInput) {
        this.settings.enableUserInput = enableUserInput;
        brease.callWidget(this.userNameId, 'setEnable', enableUserInput);
    };

    /**
     * @method getEnableUserInput 
     * Returns enableUserInput
     * @return {Boolean}
     */
    p.getEnableUserInput = function () {
        return this.settings.enableUserInput;
    };

    /**
     * @method setUserName
     * Sets userName
     * @param {String} userName
     */
    p.setUserName = function (userName) {
        this.settings.userName = userName;
        brease.callWidget(this.userNameId, 'setValue', userName);
    };

    /**
     * @method getUserName
     * Returns userName.
     * @return {String}
     */
    p.getUserName = function () {
        return this.settings.userName;
    };

    /**
     * @method setAutFailMessage
     * Sets autFailMessage
     * @param {String} autFailMessage
     */
    p.setAutFailMessage = function (autFailMessage) {
        this.settings.autFailMessage = autFailMessage;
    };

    /**
     * @method getAutFailMessage 
     * Returns autFailMessage.
     * @return {String}
     */
    p.getAutFailMessage = function () {
        return this.settings.autFailMessage;
    };

    /**
     * @method setSetUserFailMessage
     * Sets setUserFailMessage
     * @param {String} setUserFailMessage
     */
    p.setSetUserFailMessage = function (setUserFailMessage) {
        this.settings.setUserFailMessage = setUserFailMessage;
    };

    /**
     * @method getSetUserFailMessage 
     * Returns setUserFailMessage.
     * @return {String}
     */
    p.getSetUserFailMessage = function () {
        return this.settings.setUserFailMessage;
    };

    /**
     * @method setSetUserSuccessMessage
     * Sets setUserSuccessMessage
     * @param {String} setUserSuccessMessage
     */
    p.setSetUserSuccessMessage = function (setUserSuccessMessage) {
        this.settings.setUserSuccessMessage = setUserSuccessMessage;
    };

    /**
     * @method getSetUserSuccessMessage 
     * Returns setUserSuccessMessage.
     * @return {String}
     */
    p.getSetUserSuccessMessage = function () {
        return this.settings.setUserSuccessMessage;
    };

    /**
     * @method setUserChangedMessage
     * Sets userChangedMessage
     * @param {String} userChangedMessage
     */
    p.setUserChangedMessage = function (userChangedMessage) {
        this.settings.userChangedMessage = userChangedMessage;
    };

    /**
     * @method getUserChangedMessage 
     * Returns userChangedMessage.
     * @return {String}
     */
    p.getUserChangedMessage = function () {
        return this.settings.userChangedMessage;
    };

    /**
     * @method setButtonStyle
     * Sets buttonStyle
     * @param {StyleReference} buttonStyle
     */
    p.setButtonStyle = function (buttonStyle) {
        this.settings.buttonStyle = buttonStyle;
        this.buttonWidget.setStyle(buttonStyle);
    };

    /**
     * @method getButtonStyle 
     * Returns buttonStyle.
     * @return {StyleReference}
     */
    p.getButtonStyle = function () {
        return this.settings.buttonStyle;
    };

    /**
     * @method setLabelStyle
     * Sets labelStyle
     * @param {StyleReference} labelStyle
     */
    p.setLabelStyle = function (labelStyle) {
        this.settings.labelStyle = labelStyle;
        this.userLabelWidget.setStyle(labelStyle);
        this.passwordLabelWidget.setStyle(labelStyle);
    };

    /**
     * @method getLabelStyle 
     * Returns labelStyle.
     * @return {StyleReference}
     */
    p.getLabelStyle = function () {
        return this.settings.labelStyle;
    };

    /**
     * @method setMessageStyle
     * Sets messageStyle
     * @param {StyleReference} messageStyle
     */
    p.setMessageStyle = function (messageStyle) {
        this.settings.messageStyle = messageStyle;
        this.messageLabelWidget.setStyle(messageStyle);
    };

    /**
     * @method getMessageStyle 
     * Returns messageStyle.
     * @return {StyleReference}
     */
    p.getMessageStyle = function () {
        return this.settings.messageStyle;
    };

    /**
     * @method setPasswordInputStyle
     * Sets passwordInputStyle
     * @param {StyleReference} passwordInputStyle
     */
    p.setPasswordInputStyle = function (passwordInputStyle) {
        this.settings.passwordInputStyle = passwordInputStyle;
        this.passwordWidget.setStyle(passwordInputStyle);
    };

    /**
     * @method getPasswordInputStyle 
     * Returns passwordInputStyle.
     * @return {StyleReference}
     */
    p.getPasswordInputStyle = function () {
        return this.settings.passwordInputStyle;
    };

    /**
     * @method setUserInputStyle
     * Sets userInputStyle
     * @param {StyleReference} userInputStyle
     */
    p.setUserInputStyle = function (userInputStyle) {
        this.settings.userInputStyle = userInputStyle;
        this.textInputWidget.setStyle(userInputStyle);
    };

    /**
     * @method getUserInputStyle 
     * Returns userInputStyle.
     * @return {StyleReference}
     */
    p.getUserInputStyle = function () {
        return this.settings.userInputStyle;
    };

    /**
     * @method setKeyboard
     * Sets keyboard
     * @param {Boolean} keyboard
     */
    p.setKeyboard = function (keyboard) {
        this.settings.keyboard = keyboard;
    };

    /**
     * @method getKeyboard 
     * Returns keyboard.
     * @return {Boolean}
     */
    p.getKeyboard = function () {
        return this.settings.keyboard;
    };

    p.userChangeHandler = function (e) {
        var widget = this;
        widget.settings.status = 3;
        widget.settings.currentUser = e.detail.userID;
        setTimeout(function () {
            widget._setMessage(widget.settings.userChangedMessageText + widget.settings.currentUser);
        }, 200);
    };

    p.dispose = function () {

        var widget = this;
        brease.uiController.dispose(this.busyWrapper, false, function () {
            widget.busyWrapper.remove();
            widget.busyWrapper = null;
            widget.button.off();
            SuperClass.prototype.dispose.apply(widget, arguments);
        });
    };

    /* Private */

    p._onButtonClick = function (e) {
        if (!this.isDisabled) {
            var username = brease.callWidget(this.userNameId, 'getValue'),
                password = brease.callWidget(this.passwordId, 'getValue');

            if (username !== null && password !== null) {
                this._showBusyIndicator();
                brease.user.authenticateUser(username, password).then(
                    this._bind('_authSuccessHandler'),
                    this._bind('_authFailHandler')
                );
            }
        }

    };

    p._authSuccessHandler = function (user) {
        brease.user.setCurrentUser(user).then(
            this._bind('_setUserSuccessHandler'),
            this._bind('_setUserFailHandler')
        );
    };

    p._authFailHandler = function (user) {
        this._hideBusyIndicator();
        this._setMessage(this.settings.autFailMessage, 'fail');
        this.settings.status = 0;
        this.clearPassword();

        /**
         * @event LoginFailed
         * @iatStudioExposed
         * Fired when login failed.
         */
        var ev = this.createEvent('LoginFailed');
        ev.dispatch();
    };

    p._setUserSuccessHandler = function (user) {
        this._setMessage(this.settings.setUserSuccessMessage, 'success');
        this.settings.status = 1;
        this._hideBusyIndicator();
        this.clearPassword();

        /**
         * @event LoginSuccess
         * @iatStudioExposed
         * Fired when login was successfull.
         */
        var ev = this.createEvent('LoginSuccess');
        ev.dispatch();

    };

    p._setUserFailHandler = function (user) {
        this._setMessage(this.settings.setUserFailMessage, 'fail');
        this.settings.status = 2;
        this._hideBusyIndicator();
        this.clearPassword();

    };

    p._showBusyIndicator = function () {
        brease.appView.append(this.busyWrapper);
        this.busyWrapper.addClass('visible');
        this.busyWrapper.show();
    };

    p._hideBusyIndicator = function () {
        this.busyWrapper.removeClass('visible');
        this.busyWrapper.hide();

    };

    p._setMessage = function (text, level) {
        var widget = this;
        this.messageLabel.show();
        this.messageLabel.removeClass('fail');
        this.messageLabel.removeClass('success');

        if (level === 'success') {
            this.messageLabel.addClass('success');

        } else if (level === 'fail') {
            this.messageLabel.addClass('fail');

        }
        brease.callWidget(widget.messageLabelId, 'setText', text);

    };

    p.clearPassword = function () {
        brease.callWidget(this.passwordId, 'setValue', '');
    };

    p._onWidgetsReady = function (e) {

        switch (e.target.id) {
            case this.userNameId:
                this.userName = $(e.target);
                break;

            case this.passwordId:
                this.password = $(e.target);
                break;

            case this.userLabelId:
                this.userLabel = $(e.target);
                break;

            case this.passwordLabelId:
                this.passwordLabel = $(e.target);
                break;

            case this.buttonId:
                this.button = $(e.target);
                break;

            case this.busyId:
                this.busyIndicator = $(e.target);
                break;

            case this.messageLabelId:
                this.messageLabel = $(e.target);
                this.messageLabel.addClass('messageLabel');
                break;
        }

        if (this.button && this.userName && this.password && this.userLabel && this.passwordLabel && this.messageLabel && this.busyIndicator) {
            this.elem.removeEventListener(BreaseEvent.WIDGET_READY, this._bind('_onWidgetsReady'));
            this.el.find('.userRow').append(this.userLabel, this.userName);
            this.el.find('.passRow').append(this.passwordLabel, this.password);
            this.el.find('.btnRow').append(this.button);
            this.busyWrapper = this.el.find('.breaseLoginBusyWrapper').append(this.busyIndicator);
            this.busyWrapper.hide();

            this.button.on(BreaseEvent.CLICK, this._bind('_onButtonClick'));

            //create Reference to Aggregated Widgets
            this.userLabelWidget = brease.callWidget(this.userLabelId, 'widget');
            this.textInputWidget = brease.callWidget(this.userNameId, 'widget');
            this.passwordLabelWidget = brease.callWidget(this.passwordLabelId, 'widget');
            this.passwordWidget = brease.callWidget(this.passwordId, 'widget');
            this.buttonWidget = brease.callWidget(this.buttonId, 'widget');
            this.messageLabelWidget = brease.callWidget(this.messageLabelId, 'widget');

            this._dispatchReady();
            if (this.isEnabled()) {
                this.enable();
            } else {
                this.disable();
            }
        }
    };

    function _addChildWidgets(widget) {
        widget.elem.addEventListener(BreaseEvent.WIDGET_READY, widget._bind('_onWidgetsReady'));
        var settings = widget.settings;

        brease.uiController.createWidgets(widget.elem, [
            {
                className: 'Label',
                id: widget.userLabelId,
                options: {
                    enable: settings.enable,
                    text: settings.userLabel,
                    style: settings.labelStyle,
                    droppable: false,
                    omitDisabledClick: true
                }
            },
            {
                className: 'TextInput',
                id: widget.userNameId,
                options: {
                    value: settings.userName,
                    enable: settings.enableUserInput && settings.enable,
                    style: settings.userInputStyle,
                    keyboard: settings.keyboard,
                    droppable: false,
                    omitDisabledClick: true
                }
            },
            {
                className: 'Label',
                id: widget.passwordLabelId,
                options: {
                    enable: settings.enable,
                    text: settings.passwordLabel,
                    style: settings.labelStyle,
                    droppable: false,
                    omitDisabledClick: true
                }
            },
            {
                className: 'Password',
                id: widget.passwordId,
                options: {
                    enable: settings.enable,
                    value: '',
                    style: settings.passwordInputStyle,
                    keyboard: settings.keyboard,
                    droppable: false,
                    omitDisabledClick: true
                }
            },
            {
                className: 'Button',
                id: widget.buttonId,
                options: {
                    enable: settings.enable,
                    text: settings.buttonLabel,
                    style: settings.buttonStyle,
                    droppable: false,
                    omitDisabledClick: true
                }
            },
            {
                className: 'Label',
                id: widget.messageLabelId,
                options: {
                    enable: settings.enable,
                    style: settings.messageStyle,
                    droppable: false,
                    omitDisabledClick: true
                }
            },
            {
                className: 'BusyIndicator',
                id: widget.busyId,
                options: {}
            }

        ], true, widget.settings.parentContentId);
    }

    function _setUserChangedMessageText(widget) {
        if (widget.settings.userChangedMessage !== undefined) {
            if (brease.language.isKey(widget.settings.userChangedMessage) === false) {
                widget.settings.userChangedMessageText = Types.parseValue(widget.settings.userChangedMessage, 'String');
                widget.setLangDependency(false);
            } else {
                widget.settings.userChangedMessageText = brease.language.getTextByKey(brease.language.parseKey(widget.settings.userChangedMessage));
                widget.setLangDependency(true);
            }
        }
    }

    return dragAndDropCapability.decorate(userDependency.decorate(languageDependency.decorate(WidgetClass, false), true), false);

});
