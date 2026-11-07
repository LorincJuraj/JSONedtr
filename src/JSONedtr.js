function JSONedtr( data, outputElement, config = {} ){

	if (! window.jQuery) {
        console.error("JSONedtr requires jQuery");
        return;
    }

	var JSONedtr = {};

	JSONedtr.config = config;

	if( JSONedtr.config.instantChange == null  )
		JSONedtr.config.instantChange = true ;

	// Toolbar configuration - which buttons to show
	if( JSONedtr.config.toolbar == null )
		JSONedtr.config.toolbar = {
			search: false,
			export: false,
			import: false,
			undo: false,
			redo: false,
			validate: false,
			theme: false
		};

	// Default theme ('light' or 'dark')
	if( JSONedtr.config.theme == null )
		JSONedtr.config.theme = 'light';

	// History for undo/redo
	JSONedtr.history = [];
	JSONedtr.historyIndex = -1;
	JSONedtr.maxHistory = 50;

	// Original data for change highlighting
	JSONedtr.originalData = null;

	// Search filter
	JSONedtr.searchFilter = '';

	JSONedtr.saveHistory = function() {
		// Remove any future history if we're not at the end
		JSONedtr.history = JSONedtr.history.slice(0, JSONedtr.historyIndex + 1);

		// Save current state
		var currentState = JSONedtr.getDataString();
		JSONedtr.history.push(currentState);

		// Limit history size
		if( JSONedtr.history.length > JSONedtr.maxHistory ) {
			JSONedtr.history.shift();
		} else {
			JSONedtr.historyIndex++;
		}
	};

	JSONedtr.undo = function() {
		if( JSONedtr.historyIndex > 0 ) {
			JSONedtr.historyIndex--;
			var state = JSONedtr.history[JSONedtr.historyIndex];
			JSONedtr.reload(JSON.parse(state));
		}
	};

	JSONedtr.redo = function() {
		if( JSONedtr.historyIndex < JSONedtr.history.length - 1 ) {
			JSONedtr.historyIndex++;
			var state = JSONedtr.history[JSONedtr.historyIndex];
			JSONedtr.reload(JSON.parse(state));
		}
	};

	JSONedtr.reload = function( newData ) {
		JSONedtr.i = 0;
		$( JSONedtr.outputElement ).attr('data-type', Array.isArray(newData) ? 'array' : 'object');
		var html = JSONedtr.level( newData, 0, Array.isArray(newData) );
		$( JSONedtr.outputElement ).html( html ).data('i', JSONedtr.i);
		JSONedtr.bindEvents();
		JSONedtr.highlightChanges();
		// Зберігаємо активний фільтр пошуку (якщо був) після перебудови
		// вмісту (undo/redo/import) — застосовується лише як показ/приховування.
		if( JSONedtr.searchFilter ) {
			JSONedtr.applyFilter( JSONedtr.searchFilter );
		}
	};

	JSONedtr.highlightChanges = function() {
		if( !JSONedtr.originalData ) return;

		var currentData = JSONedtr.getData();
		$( JSONedtr.outputElement ).find('.jse--row').removeClass('jse--changed');

		JSONedtr.compareAndHighlight( JSONedtr.originalData, currentData, JSONedtr.outputElement );
	};

	JSONedtr.compareAndHighlight = function( original, current, parentSelector ) {
		$.each( current, function( key, value ) {
			var originalValue = original ? original[key] : undefined;
			var selector = parentSelector + ' .jse--row';

			if( value !== null && typeof value == 'object' ) {
				// Recursively compare nested objects/arrays
				var rowSelector = selector + ':has(.jse--key[value="' + key + '"])';
				JSONedtr.compareAndHighlight( originalValue, value, rowSelector );
			} else {
				if( originalValue !== value ) {
					// Highlight changed row
					var row = $( parentSelector ).find('.jse--key[value="' + key + '"]').closest('.jse--row');
					row.addClass('jse--changed');
				}
			}
		});
	};

	JSONedtr.level = function ( node, lvl=0, isArray=false ) {
		var output = '';
		var index = 0;
		var containerType = isArray ? 'array' : 'object';

		$.each( node , function( key, value ) {
			JSONedtr.i++;

			var displayKey = key;
			if( typeof key == 'string' )
				displayKey = key.replace(/"/g,"");

			// Array index display - also serves as drag handle for array items
			var indexHTML = '';
			if( isArray ) {
				indexHTML = '<span class="jse--index jse--drag-handle" title="Drag & Drop">⠿ [' + index + ']</span> ';
				index++;
			}

			if( value !== null && typeof value == 'object' ) {
				var type = typeof value;

				if( Array.isArray( value ) )
					type = 'array';

				output += '<div class="jse--row jse--row--array" id="jse--row-' + JSONedtr.i + '" data-key="' + key + '" draggable="true">';
				output += '<div class="jse--toggle" draggable="false">▼</div>';
				output += indexHTML;
				// For arrays, don't show key input (index is shown visually)
				if( !isArray ) {
					output += '<input type="text" class="jse--key jse--array jse--editable" data-level="' + lvl + '" value="' + displayKey + '" draggable="false"> : ';
				}
				output += '<span class="jse--typeof">(' + type + ')</span>';
				output += '<div class="jse--actions" draggable="false">';
				output += '<button type="button" class="jse--btn jse--btn-up" title="Move up">↑</button>';
				output += '<button type="button" class="jse--btn jse--btn-down" title="Move down">↓</button>';
				output += '<button type="button" class="jse--btn jse--btn-copy" title="Copy">⧉</button>';
				output += '<button type="button" class="jse--btn jse--btn-delete" title="Delete">✖</button>';
				output += '</div>';
				output += '<div class="jse--children" data-type="' + (Array.isArray(value) ? 'array' : 'object') + '">';
				output += JSONedtr.level( value, lvl+1, Array.isArray(value) );
				output += '</div>';
				output += '</div>';
			} else {
				var type = typeof value;
				var valueClass = 'jse--value';
				var inputType = 'text';

				if( type == 'number' ) {
					valueClass = 'jse--value jse--number';
					inputType = 'number';
				}

				if( value === null ) {
					type = 'null';
					valueClass = 'jse--value jse--null';
					value = 'null';
				}

				if( typeof value == 'string' )
					value = value.replace(/"/g,"");

				output += '<div class="jse--row" id="jse--row-' + JSONedtr.i + '" data-key="' + key + '" draggable="true">';
				output += indexHTML;
				// For arrays, don't show key input (index is shown visually)
				if( !isArray ) {
					output += '<input type="text" class="jse--key jse--editable" data-level="' + lvl + '" value="' + displayKey + '" draggable="false"> : ';
				}
				output += '<span class="jse--typeof">(' + type + ')</span>';
				output += '<input type="' + inputType + '" class="' + valueClass + '" value="' + value + '" data-key="' + key + '"' + (inputType == 'number' ? ' step="any"' : '') + ' draggable="false">';
				output += '<div class="jse--actions" draggable="false">';
				output += '<button type="button" class="jse--btn jse--btn-up" title="Move up">↑</button>';
				output += '<button type="button" class="jse--btn jse--btn-down" title="Move down">↓</button>';
				output += '<button type="button" class="jse--btn jse--btn-copy" title="Copy">⧉</button>';
				output += '<button type="button" class="jse--btn jse--btn-delete" title="Delete">✖</button>';
				output += '</div>';
				output += '</div>';
			}
		})

		output += '<div class="jse--row jse--add" data-level="' + lvl + '" data-container-type="' + containerType + '"><button type="button" class="jse--plus">✚</button></div>';

		return output;
	}

	// Дані обчислюються безпосередньо з рядків (.jse--row), а не з їхніх
	// input-елементів. Попередня реалізація визначала, чи рядок є
	// об'єктом/масивом, за наявністю класу jse--object/jse--array на
	// input полі ключа — але таке поле ключа взагалі НЕ генерується для
	// елементів масиву (isArray == true, дивись level()), тому вкладені
	// об'єкти/масиви всередині масиву повністю "губилися" при зборі
	// даних. Це і призводило до пошкодження структури JSON при
	// перенесенні/збереженні елементів масиву. Нова реалізація визначає
	// тип рядка за наявністю дочірнього контейнера .jse--children.
	JSONedtr.getData = function( $rows, isArray ){
		if( $rows === undefined ) {
			$rows = $( JSONedtr.outputElement ).children('.jse--row:not(.jse--add)');
			isArray = ( $( JSONedtr.outputElement ).attr('data-type') === 'array' );
		}

		var result = isArray ? [] : {};

		$rows.each(function() {
			var $row = $( this );
			var $childrenContainer = $row.children('.jse--children');

			if( $childrenContainer.length ) {
				// Вкладений об'єкт або масив
				var childIsArray = ( $childrenContainer.attr('data-type') === 'array' );
				var value = JSONedtr.getData( $childrenContainer.children('.jse--row:not(.jse--add)'), childIsArray );

				if( isArray ) {
					result.push( value );
				} else {
					var key = $row.children('.jse--key').first().val();
					result[ key ] = value;
				}
			} else {
				var $valueInput = $row.children('.jse--value, .jse--number, .jse--reference').first();
				if( !$valueInput.length ) return;

				var value = $valueInput.val();

				// Convert number type to actual number
				if( $valueInput.hasClass( 'jse--number' ) ) {
					value = parseFloat( value );
					if( isNaN( value ) ) value = 0;
				}

				if( $valueInput.hasClass( 'jse--null' ) && value === 'null' ) {
					value = null;
				}

				if( isArray ) {
					result.push( value );
				} else {
					var key = $row.children('.jse--key').first().val();
					result[ key ] = value;
				}
			}
		});

		return result;
	}

	JSONedtr.getDataString = function(){
		return JSON.stringify( JSONedtr.getData(), null, 2 );
	}

	JSONedtr.validateJSON = function() {
		try {
			var data = JSONedtr.getData();
			JSON.stringify(data);
			return { valid: true, data: data };
		} catch( e ) {
			return { valid: false, error: e.message };
		}
	};

	JSONedtr.addRowForm = function( plus ) {
		var lvl = $( plus ).data('level');

		var typeofHTML = '<select class="jse--typeof">'+
							'<option value="text" selected="selected">Text</option>'+
							'<option value="number">Number</option>'+
							'<option value="object">Object</option>'+
							'<option value="array">Array</option>'+
							'<option value="reference">Reference</option>'+
							'<option value="boolean">Boolean</option>'+
						'</select>';

		var containerType = $( plus ).attr('data-container-type') || $( plus ).parent().attr('data-type') || 'object';
		var isArrayContainer = ( containerType === 'array' );

		if( isArrayContainer ) {
			$( plus ).html('<span class="jse--typeof">( ' + typeofHTML + ' )</span><input type="text" class="jse--value jse--value__new" value=""><button type="button" class="jse--save">Save</button><button type="button" class="jse--cancel">Cancel</button>');
			$( plus ).find('.jse--value__new').focus();
		} else {
			$( plus ).html('<input type="text" class="jse--key" data-level="' + lvl + '" value=""> : <span class="jse--typeof">( ' + typeofHTML + ' )</span><input type="text" class="jse--value jse--value__new" value=""><button type="button" class="jse--save">Save</button><button type="button" class="jse--cancel">Cancel</button>');
			$( plus ).children('.jse--key').focus();
		}

		$( plus ).find( 'select.jse--typeof' ).change(function(){
			switch ( $(this).val() ) {
				case 'text':
					$(this).parent().siblings( '.jse--value__new' ).replaceWith( '<input type="text" class="jse--value jse--value__new" value="">' );
					$(this).parent().siblings( '.jse--value__new' ).focus();
					break;
				case 'number':
					$(this).parent().siblings( '.jse--value__new' ).replaceWith( '<input type="number" class="jse--value jse--value__new" value="" step="any">' );
					$(this).parent().siblings( '.jse--value__new' ).focus();
					break;
				case 'boolean':
					$(this).parent().siblings( '.jse--value__new' ).replaceWith( '<input type="checkbox" class="jse--value jse--value__new" value="">' );
					$(this).parent().siblings( '.jse--value__new' ).focus();
					break;
				case 'reference':
					$(this).parent().siblings( '.jse--value__new' ).replaceWith( '<input type="text" class="jse--value jse--value__new jse--reference" value="" placeholder="ID or reference...">' );
					$(this).parent().siblings( '.jse--value__new' ).focus();
					break;
				case 'object':
				case 'array':
					$(this).parent().siblings( '.jse--value__new' ).replaceWith( '<span class="jse--value__new"></span>' );
					break;
			}
		})

		$( '.jse--row.jse--add .jse--save' ).click(function( e ){
			e.preventDefault();
			JSONedtr.addRow( e.currentTarget.parentElement )
		})

		$( '.jse--row.jse--add .jse--cancel' ).click(function( e ){
			e.preventDefault();
			var x = e.currentTarget.parentElement
			$( e.currentTarget.parentElement ).html('<button type="button" class="jse--plus">✚</button>');
			$( x ).find( '.jse--plus' ).click( function(e){
				JSONedtr.addRowForm( e.currentTarget.parentElement );
			});
		})
	}

	JSONedtr.addRow = function( row ) {

		var typeOf = $( row ).find( 'select.jse--typeof option:selected' ).val();
		var ii = $( JSONedtr.outputElement ).data('i');
		ii++;
		$( JSONedtr.outputElement ).data('i', ii);
		var lvl = $( row ).data('level');
		var parent = $( row ).parent();
		var containerType = $( row ).attr('data-container-type') || parent.attr('data-type') || 'object';
		var isArrayContainer = ( containerType === 'array' );

		$( row ).removeClass( 'jse--add' ).attr('id', 'jse--row-' + ii ).attr('draggable', 'true').removeAttr('data-container-type');
		$( row ).find( 'span.jse--typeof' ).html('(' + typeOf +')');

		var key;
		if( isArrayContainer ) {
			// Key is the positional index among existing (non-add) siblings
			key = parent.children('.jse--row:not(.jse--add)').length - 1;
			if( key < 0 ) key = 0;
			$( row ).attr('data-key', key);
		} else {
			key = $( row ).find( '.jse--key' ).val();

			// Check for duplicate keys
			var duplicateKey = false;
			parent.find('.jse--key').each(function() {
				if( $(this).val() === key && !$(this).hasClass('jse--key') ) {
					duplicateKey = true;
					return false;
				}
			});
		}

		switch ( typeOf ) {
			case 'text':
				$( row ).find( '.jse--value__new' ).data( 'key', key ).removeClass( 'jse--value__new' ).attr('draggable', 'false');
				break;
			case 'number':
				$( row ).find( '.jse--value__new' ).data( 'key', key ).data( 'type', 'number' ).addClass( 'jse--number' ).removeClass( 'jse--value__new' ).attr('draggable', 'false');
				break;
			case 'reference':
				$( row ).find( '.jse--value__new' ).data( 'key', key ).data( 'type', 'reference' ).addClass( 'jse--reference' ).removeClass( 'jse--value__new' ).attr('draggable', 'false');
				break;
			case 'boolean':
				if ($( row ).find( '.jse--value__new' ).is(':checked')) {
					$( row ).find( '.jse--value__new' ).replaceWith( '<input type="text" class="jse--value" value="true" data-key="' + key + '" draggable="false">' );
				} else {
					$( row ).find( '.jse--value__new' ).replaceWith( '<input type="text" class="jse--value" value="false" data-key="' + key + '" draggable="false">' );
				}
				break;
			case 'object':
				if( !isArrayContainer ) $( row ).find( '.jse--key' ).addClass( 'jse--object' );
				$( row ).append( '<div class="jse--children" data-type="object"><div class="jse--row jse--add" data-level="' + (lvl + 1) + '" data-container-type="object"><button type="button" class="jse--plus">✚</button></div></div>' );
				$( row ).addClass( 'jse--row-object' );
				break;
			case 'array':
				if( !isArrayContainer ) $( row ).find( '.jse--key' ).addClass( 'jse--array' );
				$( row ).append( '<div class="jse--children" data-type="array"><div class="jse--row jse--add" data-level="' + (lvl + 1) + '" data-container-type="array"><button type="button" class="jse--plus">✚</button></div></div>' );
				$( row ).addClass( 'jse--row-array' );
				break;
		}

		// Add action buttons
		var actionsHTML = '<div class="jse--actions" draggable="false">';
		actionsHTML += '<button type="button" class="jse--btn jse--btn-up" title="Move up">↑</button>';
		actionsHTML += '<button type="button" class="jse--btn jse--btn-down" title="Move down">↓</button>';
		actionsHTML += '<button type="button" class="jse--btn jse--btn-copy" title="Copy">⧉</button>';
		actionsHTML += '<button type="button" class="jse--btn jse--btn-delete" title="Delete">✖</button>';
		actionsHTML += '</div>';

		// Add toggle for objects/arrays
		if( typeOf === 'object' || typeOf === 'array' ) {
			$( row ).prepend( '<div class="jse--toggle" draggable="false">▼</div>' );
		}

		$( row ).append( actionsHTML );

		$( row ).children( '.jse--save, .jse--cancel' ).remove();
		$( row ).after( '<div class="jse--row jse--add" data-level="' + lvl + '" data-container-type="' + containerType + '"><button type="button" class="jse--plus">✚</button></div>' );

		// For array containers replace the (now unused) key input with the
		// standard index / drag-handle markup, matching the other items.
		if( isArrayContainer ) {
			$( row ).find( '> .jse--key' ).remove();
			$( row ).prepend( '<span class="jse--index jse--drag-handle" title="Drag & drop">⠿ [' + key + ']</span> ' );
			JSONedtr.updateArrayIndices( parent );
		}

		JSONedtr.bindEvents();
		JSONedtr.saveHistory();

		if ( JSONedtr.config.runFunctionOnUpdate ) {
			JSONedtr.executeFunctionByName( JSONedtr.config.runFunctionOnUpdate , window, JSONedtr);
		}

	}

	JSONedtr.deleteRow = function( row ) {
		$( row ).remove();
		JSONedtr.saveHistory();
		if ( JSONedtr.config.runFunctionOnUpdate ) {
			JSONedtr.executeFunctionByName( JSONedtr.config.runFunctionOnUpdate , window, JSONedtr);
		}
	}

	JSONedtr.moveRow = function( row, direction ) {
		var $row = $( row );
		var $parent = $row.parent();

		if( direction === 'up' ) {
			var $prev = $row.prev('.jse--row:not(.jse--add)');
			if( $prev.length ) {
				$row.insertBefore( $prev );
			}
		} else if( direction === 'down' ) {
			var $next = $row.next('.jse--row:not(.jse--add)');
			if( $next.length ) {
				$row.insertAfter( $next );
			}
		}

		// Update array indices after move
		JSONedtr.updateArrayIndices( $parent );

		JSONedtr.saveHistory();
		if ( JSONedtr.config.runFunctionOnUpdate ) {
			JSONedtr.executeFunctionByName( JSONedtr.config.runFunctionOnUpdate , window, JSONedtr);
		}
	}

	JSONedtr.copyRow = function( row ) {
		var $row = $( row );
		var $clone = $row.clone();
		var ii = $( JSONedtr.outputElement ).data('i');
		var $parent = $row.parent();
		var isArrayItem = $row.find('> .jse--index').length > 0;

		// Generate new ID
		ii++;
		$( JSONedtr.outputElement ).data('i', ii);
		$clone.attr('id', 'jse--row-' + ii);

		if( !isArrayItem ) {
			// Update key to indicate copy
			var key = $clone.find('.jse--key').first().val();
			var newKey = key + '_copy';
			$clone.find('.jse--key').first().val(newKey);

			// Update data-key for value inputs
			$clone.find('.jse--value, .jse--number, .jse--reference').each(function() {
				$(this).data('key', newKey);
			});
		}

		// Insert after original
		$row.after( $clone );

		// For array items, renumber indices/keys of the whole container
		if( isArrayItem ) {
			JSONedtr.updateArrayIndices( $parent );
		}

		JSONedtr.bindEvents();
		JSONedtr.saveHistory();

		if ( JSONedtr.config.runFunctionOnUpdate ) {
			JSONedtr.executeFunctionByName( JSONedtr.config.runFunctionOnUpdate , window, JSONedtr);
		}
	}

	JSONedtr.toggleCollapse = function( row ) {
		var $row = $( row );
		var $children = $row.find('> .jse--children');
		var $toggle = $row.find('> .jse--toggle');

		if( $children.is(':visible') ) {
			$children.slideUp(200);
			$toggle.text('▶');
		} else {
			$children.slideDown(200);
			$toggle.text('▼');
		}
	}

	JSONedtr.updateArrayIndices = function( $parent ) {
		// Ця функція має сенс лише для контейнерів типу "масив" — саме там
		// ключем елемента є його позиційний індекс, і тому індекс потрібно
		// перерахувати після переміщення/видалення/додавання рядків.
		//
		// Раніше функція викликалась безумовно (як для масивів, так і для
		// об'єктів) і завжди перезаписувала значення поля .jse--key на
		// числовий індекс. Через це переміщення (drag&drop або кнопками
		// ↑/↓) КЛЮЧІВ ОБ'ЄКТА призводило до втрати їхніх справжніх імен —
		// усі ключі перетворювались на "0", "1", "2"... — саме це й ламало
		// структуру JSON. Для об'єктів жодного перерахунку індексів/ключів
		// бути не повинно: порядок рядків у DOM вже коректний, а імена
		// ключів мають залишатися незмінними.
		var isArrayContainer = ( $parent.attr('data-type') === 'array' );

		if( !isArrayContainer ) {
			return;
		}

		// Find all direct row children (not .jse--add) and update their indices.
		// ВАЖЛИВО: усі пошуки нижче обмежені лише прямими нащадками рядка
		// (children(), а не find()). Раніше використовувався find(), який
		// шукає ПО ВСЬОМУ піддереву — і коли елемент масиву сам був
		// об'єктом/масивом з вкладеними значеннями, їхні data-key
		// перезаписувались індексом верхнього елемента, що ламало
		// структуру JSON (втрачались справжні ключі вкладених об'єктів).
		var index = 0;
		$parent.children('.jse--row:not(.jse--add)').each(function() {
			var $row = $(this);
			// Update visual index display (лише власний індекс рядка)
			var $indexEl = $row.children('.jse--index').first();
			if( $indexEl.length ) {
				$indexEl.html('⠿ [' + index + ']');
			}
			// Update key input value (for arrays, key = index)
			var $keyInput = $row.children('.jse--key').first();
			if( $keyInput.length ) {
				$keyInput.val(index);
			}
			// Update data-key on value inputs (лише прямі, не вкладені)
			$row.children('.jse--value, .jse--number, .jse--reference').each(function() {
				$(this).data('key', index);
			});
			index++;
		});
	}

	// Пошук реалізований як показ/приховування вже існуючих рядків
	// (без перебудови даних), тому редагування пошукового рядка ніколи
	// не веде до втрати вже введених даних.
	JSONedtr.applyFilter = function( term ) {
		JSONedtr.searchFilter = term || '';

		var $rows = $( JSONedtr.outputElement ).find('.jse--row:not(.jse--add)');

		if( !JSONedtr.searchFilter ) {
			$rows.show();
			return;
		}

		var lowerTerm = JSONedtr.searchFilter.toLowerCase();

		$rows.hide();

		$rows.each(function(){
			var $row = $( this );
			var text = '';

			var $key = $row.find('> .jse--key').first();
			if( $key.length ) text += ' ' + $key.val();

			var $index = $row.find('> .jse--index').first();
			if( $index.length ) text += ' ' + $index.text();

			var $value = $row.find('> .jse--value, > .jse--number, > .jse--reference').first();
			if( $value.length ) text += ' ' + $value.val();

			if( text.toLowerCase().indexOf( lowerTerm ) !== -1 ) {
				// Show the matched row, all of its ancestor rows (so it is
				// reachable), and all of its descendant rows (full subtree).
				$row.show();
				$row.parents('.jse--row').show();
				$row.find('.jse--row').show();
			}
		});
	}

	// Backwards compatible alias
	JSONedtr.search = function( term ) {
		JSONedtr.applyFilter( term );
	}

	JSONedtr.exportJSON = function() {
		var data = JSONedtr.getDataString();
		var blob = new Blob([data], { type: 'application/json' });
		var url = URL.createObjectURL(blob);
		var a = document.createElement('a');
		a.href = url;
		a.download = 'data.json';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	JSONedtr.importJSON = function( file ) {
		var reader = new FileReader();
		reader.onload = function(e) {
			try {
				var data = JSON.parse(e.target.result);
				JSONedtr.originalData = JSON.parse(JSON.stringify(data));
				JSONedtr.reload(data);
				JSONedtr.saveHistory();
			} catch( err ) {
				alert('Invalid JSON file: ' + err.message);
			}
		};
		reader.readAsText(file);
	}

	JSONedtr.bindEvents = function() {
		var outputElement = JSONedtr.outputElement;

		// Plus button for adding rows
		$( outputElement + ' .jse--row.jse--add .jse--plus' ).off('click').click(function( e ){
			e.preventDefault();
			JSONedtr.addRowForm( e.currentTarget.parentElement );
		});

		// Delete button
		$( outputElement + ' .jse--btn-delete' ).off('click').click(function( e ){
			e.preventDefault();
			var row = $(this).closest('.jse--row');
			JSONedtr.deleteRow( row );
		});

		// Move up button
		$( outputElement + ' .jse--btn-up' ).off('click').click(function( e ){
			e.preventDefault();
			var row = $(this).closest('.jse--row');
			JSONedtr.moveRow( row, 'up' );
		});

		// Move down button
		$( outputElement + ' .jse--btn-down' ).off('click').click(function( e ){
			e.preventDefault();
			var row = $(this).closest('.jse--row');
			JSONedtr.moveRow( row, 'down' );
		});

		// Copy button
		$( outputElement + ' .jse--btn-copy' ).off('click').click(function( e ){
			e.preventDefault();
			var row = $(this).closest('.jse--row');
			JSONedtr.copyRow( row );
		});

		// Toggle collapse
		$( outputElement + ' .jse--toggle' ).off('click').click(function( e ){
			e.preventDefault();
			var row = $(this).closest('.jse--row');
			JSONedtr.toggleCollapse( row );
		});

		// Input changes
		$( outputElement + ' .jse--row input' ).off('change input').on( 'change input', function( e ){
			if ( JSONedtr.config.runFunctionOnUpdate ) {
				if( JSONedtr.config.instantChange || 'change' == e.type )
					JSONedtr.executeFunctionByName( JSONedtr.config.runFunctionOnUpdate , window, JSONedtr);
			}
			// Save history on change
			if( 'change' == e.type ) {
				JSONedtr.saveHistory();
			}
		});

		// Key editing (make keys editable)
		$( outputElement + ' .jse--editable' ).off('blur').on('blur', function() {
			var newKey = $(this).val();
			var row = $(this).closest('.jse--row');
			var valueInput = row.find('.jse--value, .jse--number, .jse--reference').first();
			if( valueInput.length ) {
				valueInput.data('key', newKey);
			}
			JSONedtr.saveHistory();
		});
	}

	JSONedtr.bindKeyboardShortcuts = function() {
		$(document).on('keydown', function(e) {
			// Only handle shortcuts when focused inside the editor
			if( !$(e.target).closest(JSONedtr.outputElement).length ) return;

			// Ctrl+Z - Undo
			if( e.ctrlKey && e.key === 'z' && !e.shiftKey ) {
				e.preventDefault();
				JSONedtr.undo();
			}
			// Ctrl+Y or Ctrl+Shift+Z - Redo
			else if( (e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z') ) {
				e.preventDefault();
				JSONedtr.redo();
			}
			// Ctrl+Shift+S - Save/Export (Ctrl+S conflicts with browser save)
			else if( e.ctrlKey && e.shiftKey && e.key === 'S' ) {
				e.preventDefault();
				JSONedtr.exportJSON();
			}
			// Delete - Delete selected row
			else if( e.key === 'Delete' && $(e.target).hasClass('jse--key') ) {
				e.preventDefault();
				var row = $(e.target).closest('.jse--row');
				JSONedtr.deleteRow( row );
			}
		});
	}

	JSONedtr.executeFunctionByName = function(functionName, context /*, args */) {
		var args = Array.prototype.slice.call(arguments, 2);
		var namespaces = functionName.split(".");
		var func = namespaces.pop();
		for(var i = 0; i < namespaces.length; i++) {
			context = context[namespaces[i]];
		}
		return context[func].apply(context, args);
	}

	JSONedtr.createToolbar = function( outputElement ) {
		var tb = JSONedtr.config.toolbar || {};
		var toolbar = '<div class="jse--toolbar">';
		var hasContent = false;

		if( tb.search !== false ) {
			toolbar += '<input type="text" class="jse--search-input" placeholder=" Search...">';
			toolbar += '<button type="button" class="jse--btn-search" title="Search">🔍</button>';
			toolbar += '<button type="button" class="jse--btn-clear-search" title="Clear">✕</button>';
			hasContent = true;
		}

		if( tb.export !== false || tb.import !== false ) {
			if( hasContent ) toolbar += '<span class="jse--toolbar-separator">|</span>';
			if( tb.export !== false )
				toolbar += '<button type="button" class="jse--btn-export" title="Export JSON (Ctrl+Shift+S)">💾</button>';
			if( tb.import !== false ) {
				toolbar += '<button type="button" class="jse--btn-import" title="Import JSON">📂</button>';
				toolbar += '<input type="file" class="jse--file-input" accept=".json" style="display:none">';
			}
			hasContent = true;
		}

		if( tb.undo !== false || tb.redo !== false ) {
			if( hasContent ) toolbar += '<span class="jse--toolbar-separator">|</span>';
			if( tb.undo !== false )
				toolbar += '<button type="button" class="jse--btn-undo" title="Undo (Ctrl+Z)">↶</button>';
			if( tb.redo !== false )
				toolbar += '<button type="button" class="jse--btn-redo" title="Redo (Ctrl+Y)">↷</button>';
			hasContent = true;
		}

		if( tb.theme !== false ) {
			if( hasContent ) toolbar += '<span class="jse--toolbar-separator">|</span>';
			// \uD83C\uDF19 = 🌙 (crescent moon), \u2600\uFE0F = ☀️ (sun)
			var themeIcon = (JSONedtr.config.theme === 'dark') ? '\u2600\uFE0F' : '\uD83C\uDF19';
			toolbar += '<button type="button" class="jse--btn-theme" title="Change theme">' + themeIcon + '</button>';
		}

		if( tb.validate !== false ) {
			if( hasContent ) toolbar += '<span class="jse--toolbar-separator">|</span>';
			toolbar += '<button type="button" class="jse--btn-validate" title="JSON Validation">✓</button>';
			hasContent = true;
		}

		toolbar += '</div>';

		$( outputElement ).before( toolbar );

		// Захоплюємо посилання на щойно вставлений toolbar ОДРАЗУ після
		// його вставки. Якщо зробити це пізніше (після вставки
		// модального вікна валідації), безпосереднім попереднім
		// елементом outputElement стане вже модальне вікно, а не
		// toolbar — і $toolbar.find(...) повертав би порожню
		// колекцію, через що жодна кнопка тулбару не отримувала
		// обробників подій (саме це й ламало всі кнопки toolbar).
		var $toolbar = $( outputElement ).prev('.jse--toolbar');

		// Validation modal (hidden by default)
		var modalHtml = '<div class="jse--validation-modal" style="display:none;">' +
			'<div class="jse--validation-modal-content">' +
			'<span class="jse--validation-status"></span>' +
			'<button type="button" class="jse--validation-modal-close" title="Close">✕</button>' +
			'</div></div>';
		$( outputElement ).before( modalHtml );

		// Search - виконується лише за кнопкою/Enter, а не "на льоту"
		// (щоб не перебудовувати список при кожному натисканні клавіші,
		// коли елементів багато) і ніколи не змінює дані, лише
		// показує/приховує вже існуючі рядки.
		$toolbar.find('.jse--search-input').on('keydown', function( e ) {
			if( e.key === 'Enter' ) {
				e.preventDefault();
				JSONedtr.applyFilter( $(this).val() );
			}
		});

		$toolbar.find('.jse--btn-search').click(function() {
			var term = $toolbar.find('.jse--search-input').val();
			JSONedtr.applyFilter( term );
		});

		$toolbar.find('.jse--btn-clear-search').click(function() {
			$toolbar.find('.jse--search-input').val('');
			JSONedtr.applyFilter('');
		});

		// Export
		$toolbar.find('.jse--btn-export').click(function() {
			JSONedtr.exportJSON();
		});

		// Import
		$toolbar.find('.jse--btn-import').click(function() {
			$toolbar.find('.jse--file-input').click();
		});

		$toolbar.find('.jse--file-input').change(function(e) {
			if( e.target.files.length > 0 ) {
				JSONedtr.importJSON( e.target.files[0] );
			}
		});

		// Undo/Redo
		$toolbar.find('.jse--btn-undo').click(function() {
			JSONedtr.undo();
		});

		$toolbar.find('.jse--btn-redo').click(function() {
			JSONedtr.redo();
		});

		// Validate
		$toolbar.find('.jse--btn-validate').click(function() {
			var result = JSONedtr.validateJSON();
			var $modal = $( outputElement ).prev('.jse--validation-modal');
			var $status = $modal.find('.jse--validation-status');

			if( result.valid ) {
				$status.html('<span class="jse--validation-ok">✓ Valid</span>');
			} else {
				$status.html('<span class="jse--validation-error">✗ ' + result.error + '</span>');
			}

			$modal.fadeIn(200);

			// Auto-hide after 3 seconds
			setTimeout(function() {
				$modal.fadeOut(200);
			}, 3000);
		});

		// Close validation modal
		$( outputElement ).prev('.jse--validation-modal').find('.jse--validation-modal-close').click(function() {
			$(this).closest('.jse--validation-modal').fadeOut(200);
		});

		// Close on click outside
		$( outputElement ).prev('.jse--validation-modal').click(function(e) {
			if( e.target === this ) {
				$(this).fadeOut(200);
			}
		});

		// Close on Escape
		$(document).on('keydown', function(e) {
			if( e.key === 'Escape' ) {
				$( outputElement ).prev('.jse--validation-modal').fadeOut(200);
			}
		});

		// Theme toggle
		$toolbar.find('.jse--btn-theme').click(function() {
			JSONedtr.toggleTheme();
		});
	};

	JSONedtr.toggleTheme = function() {
		var $darkCss = $('#jsonedtr-dark-css');
		if( !$darkCss.length ) return;

		var isDark = !$darkCss.prop('disabled');
		$darkCss.prop('disabled', isDark);

		// Update button icon: \uD83C\uDF19 = 🌙, \u2600\uFE0F = ️
		var $btn = $('.jse--btn-theme');
		if( $btn.length ) {
			$btn.text(isDark ? '\uD83C\uDF19' : '\u2600\uFE0F');
		}

		try {
			localStorage.setItem('jsonedtr-theme', isDark ? 'light' : 'dark');
		} catch(e) {}
	};

	JSONedtr.applySavedTheme = function() {
		var theme = JSONedtr.config.theme || 'light';
		try {
			var saved = localStorage.getItem('jsonedtr-theme');
			if( saved ) theme = saved;
		} catch(e) {}

		if( theme === 'dark' ) {
			var $darkCss = $('#jsonedtr-dark-css');
			if( $darkCss.length ) {
				$darkCss.prop('disabled', false);
			}
			// Update button icon to sun (\u2600\uFE0F = ☀️)
			var $btn = $('.jse--btn-theme');
			if( $btn.length ) {
				$btn.text('\u2600\uFE0F');
			}
		}
	};

	JSONedtr.initDragAndDrop = function( outputElement ) {
		var dragSrcEl = null;
		var isDragging = false;

		// Рядки мають атрибут draggable="true", виставлений одразу при
		// генерації HTML (level()/addRow()), тому не залежимо від
		// динамічного перемикання draggable через mousedown (це було
		// нестабільним і саме через це drag&drop не працював).
		// Елементи, з яких перетягування починати не повинно (кнопки,
		// текстові поля значень тощо) мають draggable="false" безпосередньо
		// в розмітці — цього достатньо, аби браузер не почав drag, коли
		// користувач лише виділяє текст або натискає кнопку.

		$( outputElement ).on('dragstart', '.jse--row:not(.jse--add)', function(e) {
			// Додаткова перевірка на випадок кастомних/скопійованих рядків.
			if( $(e.target).is('button, .jse--btn, .jse--save, .jse--cancel, .jse--value, .jse--number, .jse--reference') ) {
				e.preventDefault();
				return false;
			}

			dragSrcEl = this;
			isDragging = true;
			e.stopPropagation();
			e.originalEvent.dataTransfer.effectAllowed = 'move';
			e.originalEvent.dataTransfer.setData('text/plain', $(this).attr('id') || '');
			$(this).addClass('jse--dragging');
		});

		$( outputElement ).on('dragend', '.jse--row:not(.jse--add)', function(e) {
			$(this).removeClass('jse--dragging');
			$( outputElement ).find('.jse--row').removeClass('jse--drag-over');
			isDragging = false;
			dragSrcEl = null;
		});

		$( outputElement ).on('dragover', '.jse--row:not(.jse--add)', function(e) {
			if( !isDragging || !dragSrcEl ) return;
			e.preventDefault();
			e.stopPropagation();
			if( this === dragSrcEl ) return;
			e.originalEvent.dataTransfer.dropEffect = 'move';
			$( outputElement ).find('.jse--row').removeClass('jse--drag-over');
			$(this).addClass('jse--drag-over');
		});

		$( outputElement ).on('dragleave', '.jse--row:not(.jse--add)', function(e) {
			$(this).removeClass('jse--drag-over');
		});

		$( outputElement ).on('drop', '.jse--row:not(.jse--add)', function(e) {
			e.preventDefault();
			e.stopPropagation();

			$(this).removeClass('jse--drag-over');

			if( !isDragging || !dragSrcEl || dragSrcEl === this ) {
				isDragging = false;
				return false;
			}

			var $src = $( dragSrcEl );
			var $dst = $( this );

			// Дозволяємо переміщення лише в межах одного й того самого
			// батьківського контейнера (масиву/об'єкта одного рівня).
			var sameParent = ( $src.parent()[0] === $dst.parent()[0] );

			if( sameParent ) {
				var srcIndex = $src.index();
				var dstIndex = $dst.index();

				if( srcIndex < dstIndex ) {
					$src.insertAfter( $dst );
				} else {
					$src.insertBefore( $dst );
				}

				// Update array indices after move
				JSONedtr.updateArrayIndices( $src.parent() );

				// Save history and trigger update
				JSONedtr.saveHistory();
				if ( JSONedtr.config.runFunctionOnUpdate ) {
					JSONedtr.executeFunctionByName( JSONedtr.config.runFunctionOnUpdate , window, JSONedtr);
				}
			}

			isDragging = false;
			dragSrcEl = null;
			return false;
		});
	};

	JSONedtr.init = function( data, outputElement ) {
		data = JSON.parse( data );
		JSONedtr.i = 0;
		JSONedtr.outputElement = outputElement;
		JSONedtr.originalData = JSON.parse(JSON.stringify(data));

		// Create toolbar
		JSONedtr.createToolbar( outputElement );

		var rootIsArray = Array.isArray( data );
		var html = JSONedtr.level( data, 0, rootIsArray );

		$( outputElement ).addClass('jse--output').attr('data-type', rootIsArray ? 'array' : 'object').html( html ).data('i', JSONedtr.i);

		JSONedtr.bindEvents();
		JSONedtr.bindKeyboardShortcuts();
		JSONedtr.initDragAndDrop( outputElement );
		JSONedtr.saveHistory();
		JSONedtr.applySavedTheme();
	}

	JSONedtr.init( data, outputElement );

	return JSONedtr;
};
