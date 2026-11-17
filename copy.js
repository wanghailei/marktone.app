// marktone.app's copy buttons: each line to copy into a terminal has a button, hidden in the page so a browser without scripts shows
// the line alone, which this shows and makes copy the line. A click copies exactly the line's text, with no newline, and the button
// shows a tick and says "Copied" for two seconds. Where the browser refuses the clipboard, the line is selected instead, to be copied by
// hand. Loaded with defer, so it runs once the page is read.
//
// Behaviour (by eye): a click or Enter on the button copies the line and turns the icon into a tick for two seconds; a refused
// clipboard selects the line.
const COPIED_FOR = 2000

for( const button of document.querySelectorAll( "button.copy" ) ) {
	const line = button.closest( ".command" ).querySelector( "code" )
	const label = button.getAttribute( "aria-label" )
	button.hidden = false
	button.addEventListener( "click", async () => {
		try {
			await navigator.clipboard.writeText( line.textContent )
		} catch {
			window.getSelection().selectAllChildren( line )
			return
		}
		button.classList.add( "copied" )
		button.setAttribute( "aria-label", "Copied" )
		setTimeout( () => {
			button.classList.remove( "copied" )
			button.setAttribute( "aria-label", label )
		}, COPIED_FOR )
	} )
}
