import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"
import { Installer, Sync } from "../lib/marktone.mjs"
import { privateRelease, siteWithFeed, withinFolder } from "./helper.mjs"

// The private repository's releases, as GitHub would answer: its latest release, and the installer files it downloads.
class Source {
	#release

	constructor( release ) {
		this.#release = release
	}

	latest() {
		return this.#release
	}

	download( release, folder ) {
		for( const installer of Installer.all ) writeFileSync( join( folder, installer.sourceName( release.version ) ), installer.publishedName )
	}
}

// The public repository's releases, recording what is published and deleted.
class Destination {
	constructor( { tags = [] } = {} ) {
		this.knownTags = tags
		this.published = []
		this.deleted = []
	}

	publish( { tag, title, files } ) {
		this.published.push( { tag, title, files: files.map( ( path ) => basename( path ) ).sort() } )
		this.knownTags.unshift( tag )
	}

	tags() {
		return this.knownTags
	}

	delete( tag ) {
		this.deleted.push( tag )
	}
}

// A site folder whose feed names the given version.
function withinSite( version, work ) {
	return withinFolder( ( folder ) => work( siteWithFeed( folder, { version } ), folder ) )
}

test( "When the newest release is already on the site, nothing is published", () => {
	withinSite( "0.41.1", ( site ) => {
		const destination = new Destination( { tags: [ "v0.41.1" ] } )

		new Sync( { source: new Source( privateRelease() ), destination, site } ).sync()

		assert.deepEqual( destination.published, [] )
	} )
} )

test( "When the newest release is already on the site, its pages are rendered again from the feed", () => {
	withinSite( "0.41.1", ( site, folder ) => {
		new Sync( { source: new Source( privateRelease() ), destination: new Destination( { tags: [ "v0.41.1" ] } ), site } ).sync()

		assert.match( readFileSync( join( folder, "index.html" ), "utf8" ), /Version 0\.41\.1/ )
	} )
} )

test( "When the newest release lacks an installer, nothing is published", () => {
	withinSite( "0.40.1", ( site ) => {
		const destination = new Destination()
		const release = privateRelease( { without: [ "Marktone_0.41.1_aarch64.dmg" ] } )

		new Sync( { source: new Source( release ), destination, site } ).sync()

		assert.deepEqual( destination.published, [] )
		assert.equal( site.version, "0.40.1" )
	} )
} )

test( "When a new complete release appears, it is published and the site points to it", () => {
	withinSite( "0.40.1", ( site ) => {
		const destination = new Destination()

		new Sync( { source: new Source( privateRelease() ), destination, site } ).sync()

		assert.deepEqual( destination.published, [ { tag: "v0.41.1", title: "Marktone 0.41.1", files: [ "Marktone-amd64.deb", "Marktone-amd64.deb.sha256", "Marktone-arm64.dmg", "Marktone-arm64.dmg.sha256", "Marktone-x86_64.AppImage", "Marktone-x86_64.AppImage.sha256", "Marktone-x86_64.tar.gz", "Marktone-x86_64.tar.gz.sha256" ] } ] )
		assert.equal( site.version, "0.41.1" )
	} )
} )

test( "When more than three releases are public, the oldest are deleted", () => {
	withinSite( "0.38.1", ( site ) => {
		const destination = new Destination( { tags: [ "v0.40.1", "v0.38.1", "v0.37.3" ] } )

		new Sync( { source: new Source( privateRelease() ), destination, site } ).sync()

		assert.deepEqual( destination.deleted, [ "v0.37.3" ] )
	} )
} )

test( "When the newest release is already on the site, its notes as they now stand are written on the pages", () => {
	withinSite( "0.41.1", ( site, folder ) => {
		const release = privateRelease( { body: "**New since 0.40.1**\n- **Body text is 400 Regular by default.**\n" } )

		new Sync( { source: new Source( release ), destination: new Destination( { tags: [ "v0.41.1" ] } ), site } ).sync()

		assert.match( readFileSync( join( folder, "download/index.html" ), "utf8" ), /<li><strong>Body text is 400 Regular by default\.<\/strong><\/li>/ )
		assert.equal( JSON.parse( readFileSync( join( folder, "download/latest.json" ), "utf8" ) ).notes, "https://marktone.app/download/" )
	} )
} )
