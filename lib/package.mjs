import { createHash } from "node:crypto"
import { readFileSync, renameSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"

// An installer's file downloaded for publishing, renamed to its fixed name, with a SHA-256 checksum file beside it in the form
// `sha256sum -c` reads.
export class Package {
	// Renames the downloaded file of this version to the installer's fixed name and writes its checksum file.
	static prepare( { installer, version, folder } ) {
		const path = join( folder, installer.publishedName )
		renameSync( join( folder, installer.sourceName( version ) ), path )
		const prepared = new Package( { installer, path } )
		prepared.writeChecksum()
		return prepared
	}

	constructor( { installer, path } ) {
		this.installer = installer
		this.path = path
	}

	get sha256() {
		this.digest ??= createHash( "sha256" ).update( readFileSync( this.path ) ).digest( "hex" )
		return this.digest
	}

	get size() {
		return statSync( this.path ).size
	}

	get files() {
		return [ this.path, this.checksumPath ]
	}

	get checksumPath() {
		return `${ this.path }.sha256`
	}

	writeChecksum() {
		writeFileSync( this.checksumPath, `${ this.sha256 }  ${ this.installer.publishedName }\n` )
	}
}
