import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname } from "node:path"
import { DOWNLOAD_PAGE, PUBLIC_REPOSITORY } from "./addresses.mjs"

// The update feed, download/latest.json: the version marktone.app offers, where its notes are, what changed in Markdown, and each
// installer's address, checksum and size. Check for Updates reads it, and the site's pages are rendered from it, so the pages always say
// what the feed says. The notes are on the download page, under the version, so What Changed opens marktone.app and never GitHub.
export class Feed {
	static read( path ) {
		return new Feed( JSON.parse( readFileSync( path, "utf8" ) ) )
	}

	static for( { release, packages } ) {
		const assets = Object.fromEntries( packages.map( ( prepared ) => [ prepared.installer.feedKey, { url: `https://github.com/${ PUBLIC_REPOSITORY }/releases/download/${ release.tag }/${ prepared.installer.publishedName }`, sha256: prepared.sha256, size: prepared.size } ] ) )
		return new Feed( { version: release.version, notes: DOWNLOAD_PAGE, changes: release.changes, assets } )
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

	get changes() {
		return this.#description.changes ?? ""
	}

	// The same feed with its release's notes as they now stand, so notes edited after publishing reach the site.
	noting( release ) {
		const { version, assets } = this.#description
		return new Feed( { version, notes: DOWNLOAD_PAGE, changes: release.changes, assets } )
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
