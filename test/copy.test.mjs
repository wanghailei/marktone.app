import { test, mock } from "node:test"
import assert from "node:assert/strict"
import { copy, offerCopying } from "../copy.js"

const LINE = "curl -fsSL https://marktone.app/install.sh | sh"

// A browser's clipboard that writes, or refuses as a browser does when it denies the permission.
const writing = () => ( { written: [], async writeText( text ) { this.written.push( text ) } } )
const refusing = () => ( { async writeText() { throw new Error( "NotAllowedError: Write permission denied." ) } } )

// A page whose selection records what is selected, and whose copy command copies the selection, refuses, or throws.
function page( { copies = true, throws = false } = {} ) {
	const selection = { selected: undefined, selectAllChildren( node ) { this.selected = node }, removeAllRanges() { this.selected = undefined } }
	return {
		copied: [],
		getSelection: () => selection,
		execCommand( command ) {
			if( throws ) throw new Error( "execCommand is not supported" )
			if( copies ) this.copied.push( selection.selected.textContent )
			return command === "copy" && copies
		},
		get selected() {
			return selection.selected
		},
	}
}

const line = () => ( { textContent: LINE } )

test( "When the browser grants the clipboard, the line is copied through it and nothing is selected", async () => {
	const clipboard = writing()
	const shown = page()

	assert.equal( await copy( line(), { clipboard, page: shown } ), true )
	assert.deepEqual( clipboard.written, [ LINE ] )
	assert.equal( shown.selected, undefined )
} )

test( "When the browser refuses the clipboard, the line is copied with the copy command and left unselected", async () => {
	const shown = page()

	assert.equal( await copy( line(), { clipboard: refusing(), page: shown } ), true )
	assert.deepEqual( shown.copied, [ LINE ] )
	assert.equal( shown.selected, undefined )
} )

test( "When the browser has no clipboard, the line is selected and copied with the copy command", async () => {
	const shown = page()

	assert.equal( await copy( line(), { clipboard: undefined, page: shown } ), true )
	assert.deepEqual( shown.copied, [ LINE ] )
} )

test( "When the browser refuses both the clipboard and the copy command, nothing is copied and the line is left selected", async () => {
	for( const shown of [ page( { copies: false } ), page( { throws: true } ) ] ) {
		const copied = line()

		assert.equal( await copy( copied, { clipboard: refusing(), page: shown } ), false )
		assert.equal( shown.selected, copied )
	}
} )

// A page holding one line to copy with its button, as the site's template writes it, the button hidden.
function pageWithButton( options ) {
	const shown = page( options )
	const code = line()
	const hint = { textContent: "" }
	const classes = new Set( [ "copy" ] )
	const attributes = new Map( [ [ "aria-label", "Copy the install line" ] ] )
	const button = {
		hidden: true,
		classList: { add: ( name ) => classes.add( name ), remove: ( name ) => classes.delete( name ), contains: ( name ) => classes.has( name ) },
		getAttribute: ( name ) => attributes.get( name ),
		setAttribute: ( name, value ) => attributes.set( name, value ),
		closest: () => ( { querySelector: () => code } ),
		querySelector: () => hint,
		addEventListener( event, handler ) {
			this.click = handler
		},
	}
	shown.querySelectorAll = () => [ button ]
	return { shown, button, hint }
}

test( "When the line is copied, its button shows the tick and says Copied for two seconds", async () => {
	mock.timers.enable( { apis: [ "setTimeout" ] } )
	try {
		const { shown, button } = pageWithButton()
		offerCopying( shown, { clipboard: writing(), mac: false } )
		assert.equal( button.hidden, false )

		await button.click()

		assert.equal( button.classList.contains( "copied" ), true )
		assert.equal( button.getAttribute( "aria-label" ), "Copied" )
		mock.timers.tick( 2000 )
		assert.equal( button.classList.contains( "copied" ), false )
		assert.equal( button.getAttribute( "aria-label" ), "Copy the install line" )
	} finally {
		mock.timers.reset()
	}
} )

test( "When nothing could be copied, its button shows how to copy the selected line by hand, in place of the tick", async () => {
	mock.timers.enable( { apis: [ "setTimeout" ] } )
	try {
		for( const [ mac, hint ] of [ [ false, "Press Ctrl+C" ], [ true, "Press Cmd+C" ] ] ) {
			const { shown, button, hint: shownHint } = pageWithButton( { copies: false } )
			offerCopying( shown, { clipboard: refusing(), mac } )

			await button.click()

			assert.equal( button.classList.contains( "copied" ), false )
			assert.equal( button.classList.contains( "refused" ), true )
			assert.equal( shownHint.textContent, hint )
			assert.equal( button.getAttribute( "aria-label" ), hint )
		}
	} finally {
		mock.timers.reset()
	}
} )
