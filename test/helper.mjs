// What every test file shares: a private release as gh describes it, and a site folder holding only a feed.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { Installer, Release, Site } from "../lib/marktone.mjs"

// A private release as `gh release view --json tagName,body,assets` gives it, with every installer of the version unless some are left out.
export function privateRelease( { version = "0.41.1", body = "", without = [], extra = [] } = {} ) {
	const names = [ `Marktone_${ version }_aarch64.dmg`, `Marktone_${ version }_aarch64.dmg.sha256`, `marktone_${ version }_x86_64.AppImage`, `marktone_${ version }_x86_64.tar.gz`, `marktone_${ version }_linux.sha256`, ...extra ].filter( ( name ) => !without.includes( name ) )
	return new Release( { tagName: `v${ version }`, body, assets: names.map( ( name ) => ( { name } ) ) } )
}

// A site folder holding only the feed of the given version, as a published site would, with every installer at 12,345,678 bytes and
// the given notes.
export function siteWithFeed( folder, { version = "0.41.1", changes } = {} ) {
	const assets = Object.fromEntries( Installer.all.map( ( installer ) => [ installer.feedKey, { url: `https://github.com/wanghailei/marktone.app/releases/download/v${ version }/${ installer.publishedName }`, sha256: "0".repeat( 64 ), size: 12_345_678 } ] ) )
	mkdirSync( join( folder, "download" ), { recursive: true } )
	writeFileSync( join( folder, "download/latest.json" ), JSON.stringify( { version, notes: "https://marktone.app/download/", changes, assets } ) )
	return new Site( { folder } )
}

// Runs the work in a new empty folder and removes the folder afterwards, so no test leaves a trace.
export function withinFolder( work ) {
	const folder = mkdtempSync( join( tmpdir(), "marktone-test-" ) )
	try {
		return work( folder )
	} finally {
		rmSync( folder, { recursive: true, force: true } )
	}
}
