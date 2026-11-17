import { DOWNLOAD_PAGE } from "./addresses.mjs"
import { Installer } from "./installer.mjs"

// A list of what changed starts with a bold line, "New since 0.45.3", "New in 0.46.3" or "Since 0.45.3", and runs to the first blank
// line after it. Only these lists are for users: the install steps and build details around them are written for the team.
const CHANGES = /^\*\*(?:New|Since)\b[^\n]*\*\*\n(?:.+\n?)*/gm

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

	// What changed, as users read it on marktone.app: every list of what changed, in Markdown, or nothing when the notes have none.
	get changes() {
		return [ ...String( this.#description.body ?? "" ).matchAll( CHANGES ) ].map( ( list ) => list[ 0 ].trim() ).join( "\n\n" )
	}

	// The notes users read on the public release: what is new, and where to download. The build details written for the team stay private.
	get publicNotes() {
		return [ this.changes, `Download and install: ${ DOWNLOAD_PAGE }` ].filter( Boolean ).join( "\n\n" ) + "\n"
	}
}
