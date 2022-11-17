function JSONedtr(data, outputElement, config = {}) {
    if (!window.jQuery) {
        console.error("JSONedtr requires jQuery");
        return;
    }
    var JSONedtr = {};
    JSONedtr.config = config;
    if (JSONedtr.config.instantChange === null){
		JSONedtr.config.instantChange = true;
	}
    if(JSONedtr.config.deleteDisabled ===  null){
        JSONedtr.config.deleteDisabled = false;
    }
    if(JSONedtr.config.addDisabled ===  null){
        JSONedtr.config.addDisabled = false;
    }
    if(JSONedtr.config.editKeyDisabled ===  null){
        JSONedtr.config.editKeyDisabled = false;
    }
    if (JSONedtr.config.editValueDisabled === null){
        JSONedtr.config.editValueDisabled = false;
    }
    if (JSONedtr.config.careAboutType === null){
        // lazy mode
        JSONedtr.config.careAboutType = false;
    }
    JSONedtr.level = function (node, lvl = 0) {
        let output = '';
        $.each(node, function (key, value) {
            JSONedtr.i++;
            if (typeof key === 'string'){
				key = key.replace(/"/g, "&quot;");
			}
            let type = 'text';
            if (typeof value === 'object') {
                type = typeof value;
                if (Array.isArray(value)){
					type = 'array';
				}
                output += '<div class="jse--row jse--row--list" id="jse--row-' + JSONedtr.i +
                    '"><input type="text" class="jse--key jse--' + type + '" data-level="' + lvl + '" value="' + key + '" ';
                if(JSONedtr.config.editKeyDisabled){
                    output += 'disabled';
                }
                output += '> : <span class="jse--typeof">(' + type + ')</span>';
                output += JSONedtr.level(value, lvl + 1);
            } else {
                if (typeof value == 'string'){
                    value = value.replaceAll(/"/g, "&quot;");
                }
                if (JSONedtr.config.careAboutType) {
                    if (value === 'true' || value === 'false') {
                        type = 'boolean';
                    } else if (typeof value === 'number'){
                        type = 'number';
                    } else if (!isNaN(value/1) && value.substring(0,1) !== " " && value.substring(0,1) !== "0"){
                        type = 'number';
                        value = (value/1);
                    }
                }
                output += '<div class="jse--row" id="jse--row-' + JSONedtr.i +
                    '"><input type="text" class="jse--key" data-level="' + lvl + '" value="' + key + '" ';
                if(JSONedtr.config.editKeyDisabled){
                    output += 'disabled';
                }
                let typeForInput = type;
                let checked = '';
                if (typeForInput === 'boolean'){
                    typeForInput = 'checkbox';
                    checked = 'checked';
                }
                output += '> : <span class="jse--typeof">(' + type + ')</span><input type="' +typeForInput +
                    '" class="jse--value jse--value--' + type + '" value="' + value + '" data-key="' + key + '" ' + checked;
                if(JSONedtr.config.editValueDisabled){
                   output += ' disabled';
                }
                output += '>';
            }
            if (!JSONedtr.config.deleteDisabled){
                output += '<div class="jse--delete">✖</div>';
            }
            output += '</div>';
        });
        if (!JSONedtr.config.addDisabled){
            output += '<div class="jse--row jse--add" data-level="' + lvl + '"><button class="jse--plus">✚</button></div>';
        }
        return output;
    };
    JSONedtr._getData = function (node = $(JSONedtr.outputElement + ' > .jse--row'), resultInArray = false) {
        let result = {};
        if (resultInArray){
            result = [];
        }
        $.each(node, function () {
            if ($(this).children('span.jse--typeof').length > 0) {
                let key = $(this).children('input.jse--key').val(), value = '';
                if ($(this).children('span.jse--typeof').html().includes('object')){
                    result[key] = JSONedtr._getData($(this).children('div.jse--row'));
                } else if ($(this).children('span.jse--typeof').html().includes('array')){
                    result[key] = JSONedtr._getData($(this).children('div.jse--row'), true);
                } else {
                    if($(this).children('span.jse--typeof').html().includes('boolean')){
                        value = $(this).children('.jse--value').is(':checked');
                    } else if($(this).children('span.jse--typeof').html().includes('number')){
                        value = ($(this).children('.jse--value').val()/1);
                    } else {
                        value = $(this).children('.jse--value').val();
                    }
                    result[key] = value;
                }
            }
        });
        return result;
    };
    JSONedtr.getDataString = function () {
        return JSON.stringify(JSONedtr._getData());
    };
    JSONedtr.addRowForm = function (plus) {
        let lvl = $(plus).data('level');
        //
        // TODO: add support for array, object and  reference
        //
        let typeofHTML = '<select class="typeof">'+
            '<option value="text" selected="selected">Text</option>'+
            '<option value="number">Number</option>'+
            '<option value="boolean">Boolean</option>'
            /*'<option value="object">Object</option></select>'
            +'<option value="array">Array</option>'+
            +'<option value="reference">Reference</option>'*/;
        $(plus).html('<input type="text" class="jse--key" data-level="' + lvl + '" value=""> : <span class="jse--typeof">( ' + typeofHTML +
            ' )</span><input type="text" class="jse--value jse--value__new jse--value--text" value=""><button class="jse--save">Save</button><button class="jse--cancel">Cancel</button>');
        $(plus).children('.jse--key').focus();
        $(plus).children('span.jse--typeof').change(function () {
            switch ($(this).children('select.typeof').val()) {
                case 'text':
                    $(this).parent().children('.jse--value__new').replaceWith('<input type="text" class="jse--value jse--value__new jse--value--text" value="">');
                    $(this).parent().children('.jse--value__new').focus();
                    break;
                case 'number':
                    $(this).parent().children('.jse--value__new').replaceWith('<input type="number" class="jse--value jse--value__new jse--value--number" value="">');
                    $(this).parent().children('.jse--value__new').focus();
                    break;
                case 'boolean':
                    $(this).parent().children('.jse--value__new').replaceWith('<input type="checkbox" class="jse--value jse--value__new jse--value--boolean" value="">');
                    $(this).parent().children('.jse--value__new').focus();
                    break;
                case 'object':
                    $(this).parent().children('.jse--value__new').replaceWith('<span class="jse--value__new jse--value--object"></span>');
                    break;
            }
        });
        let isChildOfArray = false;
        if($(plus).parent().children('span.jse--typeof').length > 0){
            isChildOfArray = $(plus).parent().children('span.jse--typeof').html().includes('array');
        }
        if (isChildOfArray){
            let iLastIndex = 0;
            $(plus).parent().children('.jse--row').children('.jse--key').each(function (count) {
                iLastIndex =  count;
            });
            $(plus).parent().children('.jse--add').children('.jse--key').val(iLastIndex).prop('disabled', true);
        }
        $('.jse--row.jse--add .jse--save').click(function (e) {
            JSONedtr.addRow(e.currentTarget.parentElement)
        });
        $('.jse--row.jse--add .jse--cancel').click(function (e) {
            let x = e.currentTarget.parentElement
            if(!JSONedtr.config.addDisabled){
                $(e.currentTarget.parentElement).html('<button class="jse--plus">✚</button>');
            }
            $(x).find('.jse--plus').click(function (e) {
                JSONedtr.addRowForm(e.currentTarget.parentElement);
            });
        });
    };
    JSONedtr.addRow = function (row) {
        let typeOf = $(row).children('span.jse--typeof').children('select').val();
        let ii = $(JSONedtr.outputElement).data('i');
        ii++;
        $(JSONedtr.outputElement).data('i', ii);
        let lvl = $(row).data('level');
        $(row).removeClass('jse--add').attr('id', 'jse--row-' + ii);
        $(row).find('span.jse--typeof').html('(' + typeOf + ')');
        let key = $(row).find('.jse--key').val();
        $(row).find('.jse--value__new').data('key', key).removeClass('jse--value__new');
        if(!JSONedtr.config.deleteDisabled){
            $(row).append('<div class="jse--delete">✖</div>');
        }
        $(row).find('.jse--delete').click(function (e) {
            JSONedtr.deleteRow(e.currentTarget.parentElement);
        });
        $(row).children('.jse--save, .jse--cancel').remove();
        if (!JSONedtr.config.addDisabled){
            $(row).after('<div class="jse--row jse--add" data-level="' + lvl + '"><button class="jse--plus">✚</button></div>');
            $(row).find('.jse--value');
        }
        if (JSONedtr.config.editKeyDisabled){
            $(row).children('input.jse--key').prop('disabled', true);
        }
        if (JSONedtr.config.editValueDisabled){
            $(row).children('input.jse--value').prop('disabled', true);
        }
        $(row).parent().find('.jse--row.jse--add .jse--plus').click(function (e) {
            JSONedtr.addRowForm(e.currentTarget.parentElement);
        });
        $(row).find('input').on('change input', function (e) {
            if (JSONedtr.config.runFunctionOnUpdate) {
                if (JSONedtr.config.instantChange || 'change' === e.type){
                    JSONedtr.executeFunctionByName(JSONedtr.config.runFunctionOnUpdate, window, JSONedtr);
                }
            }
        });
        if (JSONedtr.config.runFunctionOnUpdate) {
            JSONedtr.executeFunctionByName(JSONedtr.config.runFunctionOnUpdate, window, JSONedtr);
        }
    };
    JSONedtr.deleteRow = function (row) {
        let isInArray = false, parentId;
        if ($(row).parent().children('span.jse--typeof').length){
            isInArray = $(row).parent().children('span.jse--typeof').html().includes('array');
            parentId = $(row).parent().attr('id');
        }
        if (isInArray){
            $.each($('#'+parentId).children('.jse--row'), function (index) {
                if ($(this).children('.jse--typeof').length > 0){
                    $(this).children('.jse--key').val(index);
                }
            });
        } else {
            $(row).remove();
        }
        if (JSONedtr.config.runFunctionOnUpdate) {
            JSONedtr.executeFunctionByName(JSONedtr.config.runFunctionOnUpdate, window, JSONedtr);
        }
    };
    JSONedtr.executeFunctionByName = function (functionName, context /*, args */) {
        let args = Array.prototype.slice.call(arguments, 2);
        let namespaces = functionName.split(".");
        let func = namespaces.pop();
        for (let i = 0; i < namespaces.length; i++) {
            context = context[namespaces[i]];
        }
        return context[func].apply(context, args);
    };
    JSONedtr.init = function (data, outputElement) {
        data = JSON.parse(data);
        JSONedtr.i = 0;
        JSONedtr.outputElement = outputElement;
        let html = JSONedtr.level(data);
        $(outputElement).addClass('jse--output').html(html).data('i', JSONedtr.i);
        $(outputElement + ' .jse--row.jse--add .jse--plus').click(function (e) {
            JSONedtr.addRowForm(e.currentTarget.parentElement);
        });
        $(outputElement + ' .jse--row .jse--delete').click(function (e) {
            JSONedtr.deleteRow(e.currentTarget.parentElement);
        });
        $(outputElement + ' .jse--row input').on('change input', function (e) {
            if (JSONedtr.config.runFunctionOnUpdate) {
                if (JSONedtr.config.instantChange || 'change' === e.type){
                    JSONedtr.executeFunctionByName(JSONedtr.config.runFunctionOnUpdate, window, JSONedtr);
                }
            }
        });
    };
    JSONedtr.init(data, outputElement);
    return JSONedtr;
}
