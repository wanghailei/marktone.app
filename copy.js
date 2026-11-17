// marktone.app's copy buttons: each line to copy into a terminal has a button, hidden in the page so a browser without scripts shows
// the line alone, which this shows and makes copy the line. Loaded as a module, so it runs once the page is read; the tests import
// it, so it starts only where there is a page.
//
// Behaviour (by eye): a click or Enter on the button copies the line and turns the icon into a tick for two seconds; where nothing
// could be copied, the line is selected and the button says "Press Ctrl+C", or "Press Cmd+C" on a Mac.
const COPIED_FOR = 2000
const HINT_FOR = 4000

// Copies exactly the line's text, with no newline, and answers whether it reached the clipboard. The Clipboard API comes first. A
// browser may refuse it even within a click, as Chromium does when the site has no clipboard permission ("Write permission
// denied"), or not offer it outside a secure page: then the line is selected and the browser's copy command copies the selection,
// still within the click. When both are refused, the line is left selected for the reader to copy.
export async function copy( line, { clipboard, page } ) {
	try {
		await clipboard.writeText( line.textContent )
		return true
	} catch {
		const selection = page.getSelection()
		selection.selectAllChildren( line )
		try {
			if( !page.execCommand( "copy" ) ) return false
		} catch {
			return false
		}
		// Copied: the selection was only the means, and left in place it would look like something still to do.
		selection.removeAllRanges()
		return true
	}
}

// Shows each copy button on the page and makes a click copy its line: a tick and "Copied" when the line was copied, and otherwise
// the keys that copy the selected line, shown in place of the tick.
export function offerCopying( page, { clipboard, mac } ) {
	const hint = mac ? "Press Cmd+C" : "Press Ctrl+C"
	for( const button of page.querySelectorAll( "button.copy" ) ) {
		const line = button.closest( ".command" ).querySelector( "code" )
		const label = button.getAttribute( "aria-label" )
		button.hidden = false
		button.addEventListener( "click", async () => {
			const copied = await copy( line, { clipboard, page } )
			const state = copied ? "copied" : "refused"
			button.querySelector( ".copy-hint" ).textContent = copied ? "" : hint
			button.classList.add( state )
			button.setAttribute( "aria-label", copied ? "Copied" : hint )
			setTimeout( () => {
				button.classList.remove( state )
				button.setAttribute( "aria-label", label )
			}, copied ? COPIED_FOR : HINT_FOR )
		} )
	}
}

if( globalThis.document ) offerCopying( document, { clipboard: navigator.clipboard, mac: /Mac/.test( navigator.platform ) } )
