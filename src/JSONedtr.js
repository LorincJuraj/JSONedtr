/**
 * https://github.com/LorincJuraj/JSONedtr
 * https://www.jqueryscript.net/demo/visual-json-editor-jsonedtr/
 * 
 * Usage:
    var editor = new JSONedtr(
        '{"Number":1,"Array":[1,2,3,"four"],"Object":{"aa":11,"bb":22.22},"String":"Hello World!","Boolean":true}',
        '#id-of-el', 
        {
            runFunctionOnUpdate: function (editor) {
                //console.log('JSONedtr', editor);
                console.log('JSONedtr', editor.getDataString());
                //console.log('JSONedtr', editor.getData());
            },
            instantChange: true,
            readOnly: false, //Edit function disabled
            outputIsHumanReadable: false,
            labelSave: 'Mentés',
            labelCancel: 'Mégsem',
            labelKey: 'kulcs',
            labelValue: 'érték',
            labelDefault: 'Alapállás',
            labelClearAll: 'Mind töröl',
            labelCopyToCB: 'Másolás',
            labelPasteFromCB: 'Beillesztés',
            label_type_string: 'Szöveg',
            label_type_number: 'Szám',
            label_type_boolean: 'Igaz/Hamis',
            label_type_array: 'Tömb',
            label_type_object: 'Objektum',                            
            arrayAdditionDisabled: false,
            objectAdditionDisabled: false,
            templateDark: false
        });
 
 * 
 * @type {type}
 */

function JSONedtr(data, outputElement, config = {}){

    if (!window.jQuery) {
        console.error("JSONedtr requires jQuery");
        return;
    }

    var JSONedtr = {};
    
    JSONedtr.saveData = data; /* SAVE DEFAULT */
    JSONedtr.uniqueId = Math.random().toString(36).substr(2, 9);
//console.log(outputElement, JSONedtr.uniqueId);    
    //Default values
    JSONedtr.config = $.extend(
            {
                instantChange: true, /* True: call runFunctionOnUpdate on INPUT && CHANGE event, False: call runFunctionOnUpdate on CHANGE event */
                runFunctionOnUpdate: null, /* call on update string || function */
                readOnly: false, //Edit function disabled
                outputIsHumanReadable: false,
                labelSave: 'Save',
                labelCancel: 'Cancel',
                labelKey: 'key',
                labelValue: 'value',
                labelDefault: 'Default',
                labelClearAll: 'Clear all',
                labelCopyToCB: 'Copy',
                labelPasteFromCB: 'Paste',
                label_type_string: 'String',
                label_type_number: 'Number',
                label_type_boolean: 'Boolean',
                label_type_array: 'Array',
                label_type_object: 'Object',
                arrayAdditionDisabled: false, /* True: Can't add new Array */
                objectAdditionDisabled: false, /* True: Can't add new Object */
                templateDark: false
            }, config);

    JSONedtr.getConfigValue = function (key, def = null) {
        if (
            typeof JSONedtr.config === 'object' &&
            typeof JSONedtr.config[key] !== 'undefined'
        ) {
            return JSONedtr.config[key];
        }
        return def;
    }

    JSONedtr.setConfigValue = function (key, value) {
        if (typeof JSONedtr.config !== 'object') {
            JSONedtr.config = {};
        }
        JSONedtr.config[key] = value;
    }

    if (JSONedtr.getConfigValue('instantChange') === null) {
        JSONedtr.setConfigValue('instantChange', true);
    }

    JSONedtr.level = function (node, lvl = 0, isArrayParam ) {
        var output = '';
        
        var isArray = false;
        if ( typeof isArrayParam !== 'undefined' && isArrayParam !== null ) {
            isArray = (isArrayParam? true:false);
        }
        
        var readOnly = JSONedtr.getConfigValue('readOnly', false);
        var lblKey = JSONedtr.getConfigValue('labelKey', 'key');
        var lblValue = JSONedtr.getConfigValue('labelValue', 'value');
        var readOnlyProp = (readOnly? 'readonly="true"': '');
        var disabledProp = (readOnly? 'disabled="true"': '');

        $.each(node, function (key, value) {
            JSONedtr.i++;
            var rowId = 'jse--row-' + JSONedtr.uniqueId + '-' + JSONedtr.i;
            if (typeof key === 'string' && key) {
                key = key.replace(/\"/g, "&quot;");
            }

            var type = typeof value;
            var typeKey = 'label_type_' + type; 
//console.log('key', key, 'value', value, 'type', type);
            var keyReadOnly = ( isArray?'readonly="true"': readOnlyProp );
            var rowClass = 'jse--row-' + type;
            
            if (type === 'object') { /* Object || Array */
                if (Array.isArray(value)) {
                    type = 'array';
                }
                typeKey = 'label_type_' + type; 
                
                var labelText = JSONedtr.getConfigValue(typeKey, '?');

                rowClass = 'jse--row-' + type;

                output += '<div class="jse--row ' + rowClass + '" id="' + rowId + '"><input type="text" class="jse--key" data-level="' + lvl + '" value="' + key + '" placeholder="'+lblKey+'" '+keyReadOnly+' /> <span class="jse--typeof" data-type="' + type + '">(' + labelText + ')</span>';
                //output += JSONedtr.level(value, lvl + 1);
                output += JSONedtr.level(value, lvl + 1, (type=='array'? true:false));
                output += '<div class="jse--delete">✖</div></div>';
            } else { /* string || number || boolean */
                var labelText = JSONedtr.getConfigValue(typeKey, '?');
                var inputValueType = 'text';
                var checked = '';
                var disabled = '';
                if (type === 'string') {
                    value = value.replace(/\"/g, "&quot;");
                } else if (type === 'number') {
                    inputValueType = 'number';
                } else if (type === 'boolean') {
                    inputValueType = 'checkbox';
                    if (value) {
                        checked = 'checked="true"';
                    }
                    disabled = disabledProp;
                }
                output += '<div class="jse--row '+rowClass+'" id="' + rowId + '"><input type="text" class="jse--key" data-level="' + lvl + '" value="' + key + '" '+keyReadOnly+' placeholder="'+lblKey+'" /> <span class="jse--typeof" data-type="' + type + '">(' + labelText + ')</span><input type="' + inputValueType + '" class="jse--value" value="' + value + '" ' + checked + ' placeholder="'+lblValue+'" '+readOnlyProp+' '+disabled+' /><div class="jse--delete">✖</div></div>';
            }
        })
        
        if ( !readOnly ) {
            output += '<div class="jse--row jse--add" data-level="' + lvl + '"><button class="jse--plus">✚</button></div>';
        }
        return output;
    }

    JSONedtr.getData = function (node = $(JSONedtr.outputElement + ' > .jse--row > input'), isArrayParam) {
        var isArray = false;
        if ( typeof isArrayParam !== 'undefined' && isArrayParam !== null ) {
            isArray = (isArrayParam? true:false);
        }
        
        if ( isArray ) {
            var result = [];
        } else {
            var result = {};
        }
        $.each(node, function () {
            var o = $(this);
            var oRow = o.parent();
            //var oRow = o.closest('.jse--row');
            var oRowId = oRow.attr('id');
            var sTypeOf = oRow.find('.jse--typeof');
            var typeOf = sTypeOf.data('type');

//console.log(oRowId, o, typeOf, o.val() );                    
            if (o.hasClass('jse--key')) {
                if (typeOf == 'array' || typeOf == 'object') {
                    //if ( oRow.hasClass( 'jse--row-object' ) || oRow.hasClass( 'jse--row-array' ) ) {
                    var selector = '#' + oRowId + ' > .jse--row > input';
                    if ( isArray ) { 
                        result.push( JSONedtr.getData($(selector), (typeOf=='array'? true:false) ) );
                    } else {
                        result[ o.val( ) ] = JSONedtr.getData($(selector), (typeOf=='array'? true:false) );
                    }
                }
            } else if (o.hasClass('jse--value')) { /* MSG: (array && object) esetén nincs érték */
                if ( typeof typeOf === 'undefined' || !typeOf ) {
                    typeOf = 'string';
                }
                var iKey = oRow.find('.jse--key');
                var key = iKey.val();
                
                var oVal = o.val();
                if (typeOf == 'number') {
                    oVal = parseFloat( oVal );
                    if ( isNaN(oVal) ) {
                        oVal = null;
                    }
                } else if (typeOf == 'boolean') {
                    if (o.attr('type') === 'checkbox') {
                        oVal = (o.is(':checked') ? true : false);
                    } else {
                        var oVal = ( oVal ).toLowerCase();
                        oVal = $.trim(oVal);
                        if (
                            oVal == '' ||
                            oVal == 'false' ||
                            oVal == 'null' ||
                            parseFloat(oVal) == 0
                        ) {
                            oVal = false;
                        } else {
                            oVal = true;
                        }
                    }
                }
                if ( isArray ) {
                    result.push( oVal );
                } else {
                    result[ key ] = oVal;
                }

            }

        });
        return result;
    }

    JSONedtr.getDataString = function (humanReadable) {
        if ( typeof humanReadable !== 'undefined' && humanReadable ) {
            return JSON.stringify(JSONedtr.getData(), null, 2);
        } else { /* 1 sorba */
            return JSON.stringify(JSONedtr.getData());
        }
    }

    JSONedtr.addRowForm = function (plus) {
        var plusO = $(plus);
//console.log(plusO);  
        var plusParent = plusO.parent();
        var lvl = plusO.data('level');
        var arrayAdditionDisabled = JSONedtr.getConfigValue('arrayAdditionDisabled');
        var objectAdditionDisabled = JSONedtr.getConfigValue('objectAdditionDisabled');
        var lblSave = JSONedtr.getConfigValue('labelSave', 'Save');
        var lblCancel = JSONedtr.getConfigValue('labelCancel', 'Cancel');
        var lblKey = JSONedtr.getConfigValue('labelKey', 'key');
        var lblValue = JSONedtr.getConfigValue('labelValue', 'value');

        var typeofHTML = '<select class="jse--typeof-list">' +
                '<option value="string" selected="selected">'+JSONedtr.getConfigValue('label_type_string', 'String')+'</option>' +
                '<option value="number">'+JSONedtr.getConfigValue('label_type_number', 'Number')+'</option>' +
                '<option value="boolean">'+JSONedtr.getConfigValue('label_type_boolean', 'Boolean')+'</option>';
        
        //MSG: reference type...Whyyy?
        //typeofHTML += '<option value="reference">Reference</option>'; 
        if (!objectAdditionDisabled) {
            typeofHTML += '<option value="object">'+JSONedtr.getConfigValue('label_type_object', 'Object')+'</option>';
        }
        if (!arrayAdditionDisabled) {
            typeofHTML += '<option value="array">'+JSONedtr.getConfigValue('label_type_array', 'Array')+'</option>';
        }
        typeofHTML += '</select>';

        plusO.html('<input type="text" class="jse--key" data-level="' + lvl + '" value="" placeholder="'+lblKey+'" /> <span class="jse--typeof">( ' + typeofHTML + ' )</span><input type="text" class="jse--value jse--value__new" value="" placeholder="'+lblValue+'" /><button class="jse--save">' + lblSave + '</button><button class="jse--cancel">' + lblCancel + '</button>');
        
        var jseKey = plusO.children('.jse--key');
        if ( plusParent.hasClass('jse--row') && plusParent.hasClass('jse--row-array') ) {
            var rows = plusParent.find('> [id].jse--row:not(.jse--add)');
            //console.log('rows', rows);
            rows.each(function (id, el) {
                var o = $(this);
                o.find('>.jse--key').first().val(id).prop('readonly', true);
            });
            jseKey.val(rows.length);
            jseKey.prop('readonly', true);
            plusO.children('.jse--value').focus();
        } else {
            jseKey.focus();
        }
        //$(plus).children('.jse--key').focus();

        plusO.find('select.jse--typeof-list').change(function () {
            var o = $(this);
            var p = o.parent();
            switch (o.val()) {
                case 'number':
                    p.siblings('.jse--value__new').replaceWith('<input type="number" class="jse--value jse--value__new" value="" />');
                    p.siblings('.jse--value__new').focus();
                    break;
                case 'string':
                    p.siblings('.jse--value__new').replaceWith('<input type="text" class="jse--value jse--value__new" value="" />');
                    p.siblings('.jse--value__new').focus();
                    break;
                case 'boolean':
                    p.siblings('.jse--value__new').replaceWith('<input type="checkbox" class="jse--value jse--value__new" value="1" />&nbsp;&nbsp;&nbsp;');
                    p.siblings('.jse--value__new').focus();
                    break;
                case 'array':
                case 'object':
                    p.siblings('.jse--value__new').replaceWith('<span class="jse--value__new"></span>');
                    break;
            }
        })

        $('.jse--row.jse--add .jse--save').click(function (e) {
            JSONedtr.addRow(e.currentTarget.parentElement);
        });

        $('.jse--row.jse--add .jse--cancel').click(function (e) {
            var x = e.currentTarget.parentElement;
            $(e.currentTarget.parentElement).html('<button class="jse--plus">✚</button>');
            $(x).find('.jse--plus').click(function (e) {
                JSONedtr.addRowForm(e.currentTarget.parentElement);
            });
        })
    }

    JSONedtr.addRow = function (row) {
        var typeOf = $(row).find('select.jse--typeof-list option:selected').val();
        var ii = $(JSONedtr.outputElement).data('i');
        ii++;
        var rowId = 'jse--row-' + JSONedtr.uniqueId + '-' + ii;
        $(JSONedtr.outputElement).data('i', ii);
        var lvl = $(row).data('level');
        $(row).removeClass('jse--add').attr('id', rowId);
        var labelTypeKey = 'label_type_' + typeOf;
        var labelTypeText = JSONedtr.getConfigValue(labelTypeKey, typeOf);        
        
        $(row).find('span.jse--typeof').html('(' + labelTypeText + ')').attr('data-type', typeOf);
        var key = $(row).find('.jse--key').val();
        switch (typeOf) {
        case 'number':
        case 'string':
            $(row).find('.jse--value__new').removeClass('jse--value__new');
            break;
        case 'boolean':
            var isChecked = $(row).find('.jse--value__new').is(':checked');
            var iValue = '';
            var checked = '';
            if ( isChecked ) {
                iValue = 'true';
                checked = 'checked="true"';
            } else {
                iValue = 'false';
            }
            //$(row).find('.jse--value__new').replaceWith('<input type="text" class="jse--value" value="' + iValue + '" >');
            $(row).find('.jse--value__new').replaceWith('<input type="checkbox" class="jse--value" value="' + iValue + '" '+checked+' />');
            break;
        case 'array':
            $(row).append('<div class="jse--row jse--add" data-level="' + (lvl + 1) + '"><button class="jse--plus">✚</button></div>');
            //$(row).addClass('jse--row-array');
            break;
        case 'object':
            $(row).append('<div class="jse--row jse--add" data-level="' + (lvl + 1) + '"><button class="jse--plus">✚</button></div>');
            //$(row).addClass('jse--row-object');
            break;
        }
        $(row).addClass('jse--row-' + typeOf);

        $(row).append('<div class="jse--delete">✖</div>');

        $(row).find('.jse--delete').click(function (e) {
            JSONedtr.deleteRow(e.currentTarget.parentElement);
        });

        $(row).children('.jse--save, .jse--cancel').remove();
        $(row).after('<div class="jse--row jse--add" data-level="' + lvl + '"><button class="jse--plus">✚</button></div>');
        $(row).parent().find('.jse--row.jse--add .jse--plus').click(function (e) {
            JSONedtr.addRowForm(e.currentTarget.parentElement)
        });

        if (JSONedtr.getConfigValue('runFunctionOnUpdate')) {
            $(row).find('input').on('change input', function (e) {
                if (
                    JSONedtr.getConfigValue('instantChange') ||
                    'change' == e.type
                ) {
                    JSONedtr.executeFunction(JSONedtr.config.runFunctionOnUpdate, window, JSONedtr);
                }
            });

            JSONedtr.executeFunction(JSONedtr.config.runFunctionOnUpdate, window, JSONedtr);
        }

    }

    JSONedtr.deleteRow = function (row) {
        var oRow = $(row);
        if ( oRow.hasClass('jse--row') ) {
            var pRow = oRow.parent();
            oRow.remove();
            if ( pRow.hasClass('jse--row') && pRow.hasClass('jse--row-array') ) {
                var rows = pRow.find('> [id].jse--row:not(.jse--add)');
                rows.each(function (id, el) {
                    var o = $(this);
                    o.find('> .jse--key').first().val(id).prop('readonly', true);
                });
            }
            if (JSONedtr.getConfigValue('runFunctionOnUpdate')) {
                JSONedtr.executeFunction(JSONedtr.config.runFunctionOnUpdate, window, JSONedtr);
            }
        }
    }

    /**
     * functionName can be function type
     * @param {type} functionName
     * @param {type} context
     * @return {unresolved}
     */
    JSONedtr.executeFunction = function (functionName, context /*, args */) {
        var args = Array.prototype.slice.call(arguments, 2);
        //console.log('args' ,args );
        if (typeof functionName === 'function') {
            //return functionName.apply(null, args);
            return functionName.apply(context, args);
        } else if (typeof functionName === 'string') {
            var namespaces = functionName.split(".");
            var func = namespaces.pop();
            for (var i = 0; i < namespaces.length; i++) {
                context = context[namespaces[i]];
            }
            return context[func].apply(context, args);
        }
        return null;
    }
    
    /**
     * Copy To Clipboard
     * @param {type} val
     * @return {undefined}
     */
    JSONedtr.copyText = function(val, caller) {
        var TA = $('<textarea></textarea>');
        TA.css({
            position: 'relative',
            left: '0',
            top: '0'
            ,zIndex: '10000'
            ,width: '0',
            height: '0',
            opacity: '0'
        });
        TA.html(val);
        if ( caller === null ) {
            $('body').append(TA);
        } else {
            TA.insertAfter( $(caller) );
        }
        TA.focus();
        TA.select();
        var result = document.execCommand('copy');
        TA.remove();
        return result;
    }

    JSONedtr.reset = function () {
        var lblClearAll = JSONedtr.getConfigValue('labelClearAll', 'Clear all');
        var cRet = confirm(lblClearAll);
        if ( 
            cRet &&
            JSONedtr.outputElement 
        ) {
            JSONedtr.init('{}', JSONedtr.outputElement, true);
        }
        return false;
    }
    
    JSONedtr.default = function () {
        var lblDefault = JSONedtr.getConfigValue('labelDefault', 'Default');
        var cRet = confirm(lblDefault);
        if ( 
            cRet &&
            JSONedtr.outputElement && 
            typeof JSONedtr.saveData !== 'undefined'
        ) {
            JSONedtr.init( JSONedtr.saveData, JSONedtr.outputElement, true );
        }
        return false;
    }

    JSONedtr.init = function (data, outputElement, update) {
        if (data === null || !data) {
            data = '{}';
        }
        if ( typeof data !== 'object' ) {
            try {
                data = JSON.parse(data);
            } catch ( error ) {
                console.error( 'JSONedtr', error );
            //MSG+ATTN: Comments can't be used in JSON!
                data = {};
            }
        }
        JSONedtr.i = 0;
        JSONedtr.outputElement = outputElement;
        //var html = JSONedtr.level(data, 0, (Array.isArray(data)? true:false));
        var html = JSONedtr.level(data, 0, false);
        
        var readOnly = JSONedtr.getConfigValue('readOnly', false);
        
        var lblClearAll = JSONedtr.getConfigValue('labelClearAll', 'Clear all');
        var lblDefault = JSONedtr.getConfigValue('labelDefault', 'Default');
        var lblCopyCB = JSONedtr.getConfigValue('labelCopyToCB', 'Copy');
        var lblPasteCB = JSONedtr.getConfigValue('labelPasteFromCB', 'Paste');
        html += '<div class="jse--row">';
        html += '<button class="jse--copy-to-clipboard">'+lblCopyCB+'</button> ';
        if ( !readOnly ) {
            html += '<button class="jse--paste-from-clipboard">'+lblPasteCB+'</button> \n\
            <button class="jse--default">'+lblDefault+'</button> \n\
            <button class="jse--reset">'+lblClearAll+'</button>';
        }
        html += '</div>';

        var OE = $(outputElement);
        OE.addClass('jse--output')
        .html(html)
        .data('i', JSONedtr.i);

        if (JSONedtr.getConfigValue('templateDark')) {
            OE.addClass('jse--template-dark');
        }
        
        if ( readOnly ) {
            OE.addClass('jse--readonly');
        } else {
            $(outputElement + ' .jse--row.jse--add .jse--plus').click(function (e) {
                JSONedtr.addRowForm(e.currentTarget.parentElement);
            });

            $(outputElement + ' .jse--row .jse--delete').click(function (e) {
                JSONedtr.deleteRow(e.currentTarget.parentElement);
            });
        }
        
        $(outputElement + ' button').click(function (e) {
            var o = $(this);
            if ( o.hasClass('jse--reset') ) {
                JSONedtr.reset(e);
            } else if ( o.hasClass('jse--default') ) {
                JSONedtr.default(e);
            } else if ( o.hasClass('jse--copy-to-clipboard') ) {
                var result = JSONedtr.copyText( JSONedtr.getDataString( JSONedtr.getConfigValue('outputIsHumanReadable', false) ), this );
                if ( result ) { alert('OK'); }
//console.log('copy-to-clipboard', result );
            } else if ( o.hasClass('jse--paste-from-clipboard') ) {
                //var result = document.execCommand('cut'); 
                //var result = document.execCommand('paste'); //On IE
                //var result = document.execCommand('Paste', null, null);
                
                navigator.clipboard.readText()
                .then(clipText => { 
//console.log('paste-from-clipboard', clipText );
                    if ( clipText ) { 
                        var cRet = confirm(lblPasteCB);
                        if ( 
                            cRet &&
                            JSONedtr.outputElement 
                        ) {
                            JSONedtr.init( clipText, JSONedtr.outputElement, true );
                        }
                    }
                });
//console.log('paste-from-clipboard', result );
            }
            e.preventDefault();
            return false;
        });
        
        if ( JSONedtr.getConfigValue('runFunctionOnUpdate')) {
            $(outputElement + ' .jse--row input').on('change input', function (e) {
                //console.log($(this), e);
                if (
                    JSONedtr.getConfigValue('instantChange') ||
                    'change' == e.type
                ) {
                    JSONedtr.executeFunction(JSONedtr.config.runFunctionOnUpdate, window, JSONedtr);
                }
            });
            
            if ( typeof update !== 'undefined' && update ) {
                JSONedtr.executeFunction(JSONedtr.config.runFunctionOnUpdate, window, JSONedtr);
            }
        }
    }

    JSONedtr.init(data, outputElement);

    return JSONedtr;
};
