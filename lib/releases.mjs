import { execFileSync } from "node:child_process"
import { Installer } from "./installer.mjs"
import { Release } from "./release.mjs"

// One repository's GitHub Releases, reached through the gh command. The private repository is read with a token that may read it; the
// public one is written with the workflow's own token. Each gh failure stops the run with gh's own words, since a half-run publish is
// safe to run again: nothing points at a release until the site's files are written last.
export class Releases {
	#repository
	#token

	constructor( { repository, token } ) {
		this.#repository = repository
		this.#token = token
	}

	latest() {
		return new Release( JSON.parse( this.#gh( "release", "view", "--json", "tagName,body,assets" ) ) )
	}

	download( release, folder ) {
		const patterns = Installer.all.flatMap( ( installer ) => [ "--pattern", installer.sourceName( release.version ) ] )
		this.#gh( "release", "download", release.tag, "--dir", folder, "--clobber", ...patterns )
	}

	// Creates the release with its files and marks it Latest, or, when a run before this one stopped part-way, attaches the files again.
	publish( { tag, title, notes, files } ) {
		if( this.tags().includes( tag ) ) return this.#gh( "release", "upload", tag, "--clobber", ...files )
		return this.#gh( "release", "create", tag, "--title", title, "--notes", notes, "--latest", ...files )
	}

	// Release tags, newest first.
	tags() {
		return JSON.parse( this.#gh( "release", "list", "--limit", "100", "--json", "tagName" ) ).map( ( release ) => release.tagName )
	}

	delete( tag ) {
		this.#gh( "release", "delete", tag, "--yes", "--cleanup-tag" )
	}

	#gh( ...words ) {
		const env = this.#token ? { ...process.env, GH_TOKEN: this.#token } : process.env
		try {
			return execFileSync( "gh", [ ...words, "--repo", this.#repository ], { env, encoding: "utf8", stdio: [ "ignore", "pipe", "pipe" ] } )
		} catch( failure ) {
			throw new Error( `gh ${ words.slice( 0, 2 ).join( " " ) } failed for ${ this.#repository }: ${ String( failure.stderr ?? failure.message ).trim() }` )
		}
	}
}
