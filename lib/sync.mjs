import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Installer } from "./installer.mjs"
import { Package } from "./package.mjs"

// Master's ruling on wanghailei/marktone#105: only the newest three releases are kept.
const RELEASES_KEPT = 3

// Brings marktone.app level with the private repository's latest release: publishes its installers, then writes the site's files, then
// keeps only the newest releases. The site's files come last, so the pages and the feed never name a file that is not yet published.
export class Sync {
	#source
	#destination
	#site

	constructor( { source, destination, site } ) {
		this.#source = source
		this.#destination = destination
		this.#site = site
	}

	// Publishes the latest release when it is complete and new, renders the site's pages from its feed, and returns a sentence saying
	// what happened.
	sync() {
		const outcome = this.#publishLatest()
		if( this.#site.version ) this.#site.render()
		return outcome
	}

	#publishLatest() {
		const release = this.#source.latest()
		if( this.#site.version === release.version ) {
			// The notes may have been edited since the release was published, or published before the site showed them.
			this.#site.note( release )
			return `${ release.title } is already on marktone.app; nothing to publish.`
		}
		if( !release.complete ) return `${ release.title } is not complete yet: it lacks a required installer or checksum, so marktone.app stays on ${ this.#site.version ?? "nothing" }.`
		this.#publish( release )
		this.#prune()
		return `Published ${ release.title } on marktone.app.`
	}

	// The installers are downloaded into a folder of their own, removed once they are published.
	#publish( release ) {
		const folder = mkdtempSync( join( tmpdir(), "marktone-release-" ) )
		try {
			this.#source.download( release, folder )
			const packages = Installer.all.map( ( installer ) => Package.prepare( { installer, version: release.version, folder } ) )
			this.#destination.publish( { tag: release.tag, title: release.title, notes: release.publicNotes, files: packages.flatMap( ( prepared ) => prepared.files ) } )
			this.#site.publish( { release, packages } )
		} finally {
			rmSync( folder, { recursive: true, force: true } )
		}
	}

	#prune() {
		for( const tag of this.#destination.tags().slice( RELEASES_KEPT ) ) this.#destination.delete( tag )
	}
}
