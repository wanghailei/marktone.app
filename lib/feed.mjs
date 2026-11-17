import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { PUBLIC_REPOSITORY } from "./addresses.mjs"

// The update feed, download/latest.json: the version marktone.app offers, where its notes are, and each installer's address, checksum
// and size. Check for Updates reads it, and the site's pages are rendered from it, so the pages always say what the feed says.
export class Feed {
	static read( path ) {
		return new Feed( JSON.parse( readFileSync( path, "utf8" ) ) )
	}

	static for( { release, packages } ) {
		const assets = Object.fromEntries( packages.map( ( prepared ) => [ prepared.installer.feedKey, { url: `https://github.com/${ PUBLIC_REPOSITORY }/releases/download/${ release.tag }/${ prepared.installer.publishedName }`, sha256: prepared.sha256, size: prepared.size } ] ) )
		return new Feed( { version: release.version, notes: `https://github.com/${ PUBLIC_REPOSITORY }/releases/tag/${ release.tag }`, assets } )
	}

	#description

	constructor( description ) {
		this.#description = description
	}

	get version() {
		return this.#description.version
	}

	get notes() {
		return this.#description.notes
	}

	url( installer ) {
		return this.#asset( installer ).url
	}

	checksumUrl( installer ) {
		return `${ this.url( installer ) }.sha256`
	}

	// The file's size as a reader reads it, in decimal megabytes, as macOS's Finder counts them.
	size( installer ) {
		return `${ ( this.#asset( installer ).size / 1_000_000 ).toFixed( 1 ) } MB`
	}

	// Writes the feed indented with tabs, as every file in this repository is.
	write( path ) {
		mkdirSync( dirname( path ), { recursive: true } )
		writeFileSync( path, JSON.stringify( this.#description, null, "\t" ) + "\n" )
	}

	#asset( installer ) {
		return this.#description.assets[ installer.feedKey ]
	}
}
