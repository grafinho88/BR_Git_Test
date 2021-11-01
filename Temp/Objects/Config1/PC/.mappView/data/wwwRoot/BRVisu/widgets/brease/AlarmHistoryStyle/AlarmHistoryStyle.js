/*global define*/
define([
    'widgets/brease/TableWidgetStyle/TableWidgetStyle'
], function (SuperClass) {
    
    'use strict';

    /**
     * @class widgets.brease.AlarmHistoryStyle
     * #Description
     * AlarmHistoryStyle - abstract widget to set styles in the AlarmHistory  
     * Text can be language dependent.  
     * @breaseNote 
     * @extends widgets.brease.TableWidgetStyle
     * @iatMeta studio:visible
     * false
     * @abstract
     */

    var WidgetClass = SuperClass.extend(function AlarmHistoryStyle() {
        SuperClass.apply(this, arguments);
    }, false);

    return WidgetClass;

});
