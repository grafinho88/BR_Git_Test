define(function () {

    'use strict';

    /**
     * @class widgets.brease.common.libs.wfUtils.UtilsEditableBinding
     * This Module should be used for handling the EditableBindings (Bindable Properties, which are able to handle a TwoWay-Binding)
     */

    var UtilsEditableBinding = {};

    /**
     * @method 
     * This Function is used for setting the correct parameters for the Framework to establish an editableBinding
     * @param {Boolean} editable editable - input of setEditable function
     * @param {Object} metaData metaData - input of setEditable function
     * @param {WidgetInstance} widget Instance of the Widget 
     * @param {StringArray1D} propertyArray In this array all the property-names should be listed for an editableBinding e.g. ['node', 'value',...]
     */
    UtilsEditableBinding.handleEditable = function (editable, metaData, widget, propertyArray) {
        if (metaData !== undefined && metaData.refAttribute !== undefined) {
            var refAttribute = metaData.refAttribute;
            if (propertyArray.indexOf(refAttribute) > -1) {
                widget.settings.editable = editable;
                widget._internalEnable();
            }
        }
    };

    return UtilsEditableBinding;
});
