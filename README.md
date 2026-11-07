# JSONedtr

jQuery powered visual JSON editor for basic JSON editing in your web project.

This repository contains an extended version of JSONedtr: the original editor was
extended with a toolbar, search, undo/redo, JSON import/export, validation,
themes, drag & drop, collapse/expand, array support and many fixes.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
    - [Basic usage](#basic-usage)
    - [Configuration](#configuration)
    - [Multiple instances](#multiple-instances)
    - [Getting data](#getting-data)
    - [Programmatic updates](#programmatic-updates)
- [Extended functionality](#extended-functionality)
    - [Toolbar](#toolbar)
    - [Value types](#value-types)
    - [Row actions and drag & drop](#row-actions-and-drag--drop)
    - [Search / filter](#search--filter)
    - [Undo / redo](#undo--redo)
    - [Export / import](#export--import)
    - [Validation](#validation)
    - [Themes](#themes)
    - [Change highlighting](#change-highlighting)
    - [Keyboard shortcuts](#keyboard-shortcuts)
    - [Public API](#public-api)
    - [Fixes over the original project](#fixes-over-the-original-project)
    - [Known limitations](#known-limitations)
- [TODO](#todo)
- [Support](#support)
- [Contributing](#contributing)

## Demo

[Original JSONedtr demo on JSFiddle](https://jsfiddle.net/4te6bkma/2/)

A complete local demo of the extended functionality is available in
`examples/test.html`.

## Features

- Visual editing of JSON objects and arrays, including nested and empty containers
- Full toolbar: search, export, import, undo, redo, validation and theme switching
- Add / delete / copy / move rows, plus drag & drop reordering
- Collapse and expand nested objects/arrays
- Number, null, boolean, reference and text values
- Live change callbacks (`runFunctionOnUpdate`, `instantChange`)
- Light and dark themes with persistence in `localStorage`
- Keyboard shortcuts
- Multiple independent editor instances on one page

## Installation

Include jQuery, `src/JSONedtr.css` and `src/JSONedtr.js`:

```html
<script src="jquery.js"></script>
<link rel="stylesheet" type="text/css" href="src/JSONedtr.css">
<script src="src/JSONedtr.js"></script>
```

To support the dark theme, additionally include `src/JSONedtr-dark.css`
**after** the light theme and give it the ID `jsonedtr-dark-css`:

```html
<link rel="stylesheet" type="text/css" href="src/JSONedtr.css">
<link rel="stylesheet" type="text/css" href="src/JSONedtr-dark.css" id="jsonedtr-dark-css" disabled>
```

The dark stylesheet is expected to be toggled by the editor
(`JSONedtr.toggleTheme()` / toolbar button). If the element with this ID does
not exist, theme switching is silently ignored.

## Usage

#### Basic usage

##### Create an element for the editor

```html
<div id="output"></div>
```

##### Initialize the editor with your data

```js
$(document).ready(function () {
    var data = '{"first_key":"one","second_key":"two","third_key":{"one":"item 3-1","two":"item 3-2","three":"item 3-3"}}';
    var editor = new JSONedtr(data, '#output');
});
```

The constructor returns the editor API object, so the returned value can be
used to call `getData()`, `reload()`, `undo()` and other methods (see
[Public API](#public-api)).

#### Configuration

```js
var editor = new JSONedtr(JSON.stringify(data), '#output', {
    // Call the update callback on every input event (default: true).
    instantChange: true,

    // Default theme: 'light' or 'dark'.
    theme: 'light',

    // Name of a global function (namespaces are supported) that is called
    // on every change. The editor instance is passed as the first argument.
    runFunctionOnUpdate: 'syncJsonEditor',

    // Toolbar buttons. Set a key to false to hide that button.
    // If the whole `toolbar` option is omitted, all buttons are hidden.
    toolbar: {
        search: true,
        export: true,
        import: true,
        undo: true,
        redo: true,
        validate: true,
        theme: true
    }
});

window.syncJsonEditor = function (instance) {
    console.log(instance.getData());
};
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `instantChange` | boolean | `true` | Call `runFunctionOnUpdate` on every `input` event, not only on `change`. |
| `theme` | string | `'light'` | Initial theme (`'light'` or `'dark'`). The user choice is persisted in `localStorage` under `jsonedtr-theme`. |
| `runFunctionOnUpdate` | string | – | Global function name (dot notation allowed) invoked on updates. Receives the editor instance. |
| `toolbar` | object | all `false` | Per-button visibility flags: `search`, `export`, `import`, `undo`, `redo`, `validate`, `theme`. |

#### Multiple instances

```html
<div id="output-1"></div>
<div id="output-2"></div>
```

```js
$(document).ready(function () {
    var editor1 = new JSONedtr('{"a":1,"b":2}', '#output-1');
    var editor2 = new JSONedtr('{"c":[1,2,3],"d":{"e":"f"}}', '#output-2');
});
```

Each instance keeps its own data, history, search filter and theme state.

#### Getting data

```js
var data = editor.getData();          // JS object / array
var json = editor.getDataString();    // pretty-printed JSON string
```

`getData()` reads the current state directly from the DOM (including nested
objects and arrays), not from the original input data.

#### Programmatic updates

```js
// Replace editor content (also used internally by undo/redo and import).
editor.reload({new_key: 'new value'});
```

## Extended functionality

### Toolbar

The toolbar is rendered above the editor and is configured with the `toolbar`
option. Available buttons:

| Button | Action |
| --- | --- |
| Search field + 🔍 / ✕ | Filter rows by key, array index or value. |
| 💾 Export | Download the current JSON as `data.json`. |
| 📂 Import | Load a `.json` file and replace the editor content. |
| ↶ Undo | Restore the previous history state. |
| ↷ Redo | Restore the next history state. |
| ✓ Validate | Validate the current state and show a result modal. |
| 🌙 / ☀️ Theme | Toggle light/dark theme. |

If `toolbar` is not passed at all, no buttons are shown (an empty toolbar
container is still created).

### Value types

| Type | Behaviour |
| --- | --- |
| `string` | Edited in a text input. |
| `number` | Rendered as a number input; `getData()` converts it with `parseFloat()`. |
| `null` | Displayed as `null` and preserved as `null` in `getData()`. |
| `object` | Expandable/collapsible container with nested rows. |
| `array` | Expandable/collapsible container with numbered indexes. |
| `boolean` | Existing values are displayed as `true` / `false`. The add-row form provides a boolean checkbox. |
| `reference` | Fork-specific string type, highlighted differently; exported as a plain string. |

The add-row form (`✚`) lets you choose the type of the new row:
**Text**, **Number**, **Object**, **Array**, **Reference** or **Boolean**.

### Row actions and drag & drop

Each row has action buttons that appear on hover:

- **↑ / ↓** – move the row up or down inside its parent container
- **⧉** – duplicate the row. Object keys get a `_copy` suffix; array items are
  duplicated and the array is reindexed.
- **✖** – delete the row
- **▼ / ▶** – collapse or expand nested objects/arrays
- **Drag & drop** – reorder rows within the same parent container

Moving and duplicating rows inside arrays automatically recalculates the array
index display and `data-key` values.

### Search / filter

Typing in the toolbar search field filters visible rows:

- matching is case-insensitive and checks the key, array index and scalar value
- the matched row, its ancestors and its whole subtree stay visible
- clearing the search restores all rows
- the filter survives editor rebuilds (undo/redo/import) while active

The filter only hides/shows rows; it does not modify the data returned by
`getData()`.

### Undo / redo

- History is saved on every committed change, add, delete, move, copy and import.
- The last 50 states are kept (`JSONedtr.maxHistory`).
- Undo/redo is available from the toolbar and with keyboard shortcuts.
- Restoring a state rebuilds the editor and re-applies the current search filter.

### Export / import

- **Export** downloads the current JSON as `data.json`.
- **Import** reads a local `.json` file, parses it and replaces the editor
  content. Invalid files show an alert with the parsing error and leave the
  current content unchanged.

```js
editor.exportJSON();
editor.importJSON(fileInput.files[0]);
```

### Validation

The validation button runs `validateJSON()` and shows a modal with either:

- confirmation that the current data is valid JSON, or
- the error message produced while serialising the data.

```js
var result = editor.validateJSON();
// {valid: true, data: {...}} or {valid: false, error: '...'}
```

### Themes

- Light theme: `JSONedtr.css`
- Dark theme: `JSONedtr-dark.css` (link must have `id="jsonedtr-dark-css"`)

The selected theme is stored in `localStorage` under `jsonedtr-theme` and
restored automatically on the next page load. The dark theme overrides the
light stripe backgrounds, inputs, toolbar, changed/search highlights and
validation modal with dark colours (including `!important` guards so that
page/theme CSS cannot leave light rows inside the dark editor).

```js
editor.toggleTheme();    // switch and persist
editor.applySavedTheme(); // re-apply the stored theme
```

### Change highlighting

Scalar rows whose value differs from the initial snapshot are marked with the
`jse--changed` class. Highlighting is recalculated by `highlightChanges()`
(after undo/redo, import and programmatic `reload()`), so it can also be
triggered manually:

```js
editor.highlightChanges();
```

The `jse--search-match` CSS class is available for custom integrations, but
the built-in search filter does not apply it automatically — filtering only
shows/hides rows.

### Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Redo |
| `Ctrl+Shift+S` | Export JSON |
| `Delete` | Delete the row when a key input is focused |

Shortcuts are handled only while focus is inside the editor.

### Public API

| Method | Description |
| --- | --- |
| `getData()` | Return the current data as a JS object/array. |
| `getDataString()` | Return pretty-printed JSON. |
| `reload(data)` | Replace editor content with new data. |
| `undo()` / `redo()` | Navigate the history. |
| `saveHistory()` | Store the current state in history manually. |
| `validateJSON()` | Return `{valid, data}` or `{valid: false, error}`. |
| `search(term)` / `applyFilter(term)` | Filter rows by a search term. `search()` is a backwards-compatible alias. |
| `exportJSON()` | Download the current JSON. |
| `importJSON(file)` | Load JSON from a `File` object. |
| `highlightChanges()` | Recalculate changed-row highlighting. |
| `toggleTheme()` | Switch theme and persist the choice. |
| `applySavedTheme()` | Apply the theme stored in `localStorage`. |
| `addRow(row)` | Commit an add-row form row into a normal row. |
| `deleteRow(row)` | Delete a row. |
| `copyRow(row)` | Duplicate a row. |
| `moveRow(row, 'up' \| 'down')` | Move a row inside its parent. |
| `toggleCollapse(row)` | Collapse/expand a nested container. |
| `updateArrayIndices(parent)` | Recalculate indexes of an array container. |

`row` arguments accept a DOM element or jQuery object.

### Fixes over the original project

- Nested objects/arrays inside arrays are no longer lost when collecting data:
  `getData()` detects containers via the `.jse--children` element instead of
  the key input class (array items have no key input).
- Double quotes in keys and values no longer break the rendered markup.
- `runFunctionOnUpdate` is called on every update, not only on some actions.
- Object keys are no longer overwritten with numeric indexes when rows are
  moved: index recalculation is applied only to array containers.
- Moving/copying rows inside arrays keeps indexes and `data-key` values correct.
- Event handlers for add/delete/move/copy/toggle buttons are re-bound with
  `.off()` so repeated rebuilds do not duplicate handlers.
- The active search filter is preserved after undo/redo/import rebuilds.
- Empty objects and empty arrays are supported as root data and as nested values.
- Dark theme covers stripes, inputs, toolbar, highlights and modals.

### Known limitations

- Boolean values are displayed and returned as the strings `"true"` / `"false"`;
  convert them in the host application if a native JSON boolean is required.
- `reference` is not part of the JSON standard; it is exported as a string.
- The `null` type can be edited but is not offered in the add-row form.
- Undo history is in-memory only and is lost on page reload.

## TODO

- ~~better support for array data type~~ DONE
- ~~better support for number type~~ DONE
- ~~add support to reference type~~ DONE
- ~~dark theme~~ DONE
- native boolean round-trip (currently converted to strings)
- use SASS
- minify code for production

## Support

Please [open an issue](https://github.com/LorincJuraj/JSONedtr/issues/new) for support.

## Contributing

New pull requests are encouraged and welcomed.

Please contribute using [Github Flow](https://guides.github.com/introduction/flow/). Create a branch, add commits, and [open a pull request](https://github.com/fraction/readme-boilerplate/compare/).
