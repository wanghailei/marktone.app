import { DOWNLOAD_PAGE } from "./addresses.mjs"
import { Installer } from "./installer.mjs"

// The notes' list of what is new starts with a bold "New since" line and runs to the first blank line after it.
const CHANGES = /^\*\*New since [^\n]*\*\*\n(?:.+\n?)*/m

// A release of the private repository, as `gh release view --json tagName,body,assets` describes it.
export class Release {
	#description

	constructor( description ) {
		this.#description = description
	}

	get tag() {
		return this.#description.tagName
	}

	get version() {
		return this.tag.replace( /^v/, "" )
	}

	get title() {
		return `Marktone ${ this.version }`
	}

	// Whether every installer is attached. The Mac disk image is built on a Mac and attached minutes after the Linux files.
	get complete() {
		const names = ( this.#description.assets ?? [] ).map( ( asset ) => asset.name )
		return Installer.all.every( ( installer ) => names.includes( installer.sourceName( this.version ) ) )
	}

	// The notes users read on the public release: what is new, and where to download. The build details written for the team stay private.
	get publicNotes() {
		const changes = String( this.#description.body ?? "" ).match( CHANGES )?.[ 0 ].trim()
		return [ changes, `Download and install: ${ DOWNLOAD_PAGE }` ].filter( Boolean ).join( "\n\n" ) + "\n"
	}
}
