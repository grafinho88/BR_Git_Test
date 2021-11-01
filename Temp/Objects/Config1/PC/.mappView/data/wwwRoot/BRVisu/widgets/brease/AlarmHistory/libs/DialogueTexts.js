define([], function () {
    'use strict';
    function DialogueTexts() {
        return {
            en: {
                filter: {
                    title: 'Configuration dialog to filter the alarm history',
                    col: 'Column',
                    op: 'Operator',
                    val: 'Value',
                    and: 'and',
                    or: 'or',
                    act: 'active',
                    inact: 'inactive',
                    actack: 'active acknowledged',
                    inactack: 'inactive acknowledged'
                },
                sort: {
                    title: 'Configuration dialog to sort the alarm history',
                    col: 'Column',
                    sort: 'Sort',
                    by: 'By',
                    first: 'First',
                    inc: 'increasing',
                    dec: 'decreasing',
                    then: 'then',
                    az: 'A - Z',
                    za: 'Z - A',
                    old: 'oldest first',
                    new: 'newest first'
                },
                style: {
                    title: 'Configuration dialog to style the alarm history',
                    style: 'Set style',
                    state: 'if alarm is',
                    act: 'active',
                    actack: 'active acknowledged',
                    inact: 'inactive',
                    inactack: 'inactive acknowledged',
                    any: 'any',
                    sev: 'and severity condition',
                    and: 'and',
                    or: 'or'
                }
            },
            de: {
                filter: {
                    title: 'Konfigurationsdialog zum Filtern der Alarmhistorie',
                    col: 'Spalte',
                    op: 'Operator',
                    val: 'Wert',
                    and: 'und',
                    or: 'oder',
                    act: 'aktiv',
                    inact: 'inaktiv',
                    actack: 'aktiv bestätigt',
                    inactack: 'inaktiv bestätigt'
                },
                sort: {
                    title: 'Konfigurationsdialog zum Sortieren der Alarmhistorie',
                    col: 'Spalte',
                    sort: 'Sortieren',
                    by: 'Nach',
                    first: 'Zuerst',
                    inc: 'aufsteigend',
                    dec: 'absteigend',
                    then: 'dann',
                    az: 'A - Z',
                    za: 'Z - A',
                    old: 'älteste',
                    new: 'neueste'
                },
                style: {
                    title: 'Konfigurationsdialog zum Stylen der Alarmhistorie',
                    act: 'aktiv',
                    inact: 'inaktiv',
                    actack: 'aktiv bestätigt',
                    inactack: 'inaktiv bestätigt',
                    any: 'alle',
                    sev: 'und Schweregrad ist',
                    and: 'und',
                    or: 'oder',
                    style: 'Style festlegen',
                    state: 'wenn Alarm ist'
                }
            }
        };
    }
    
    return new DialogueTexts();
});
