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

for( const missing of [ "Marktone_0.89.2_aarch64.dmg", "marktone_0.89.2_x86_64.AppImage", "marktone_0.89.2_x86_64.tar.gz", "Marktone_0.89.2_aarch64.dmg.sha256", "marktone_0.89.2_linux.sha256" ] ) {
	test( `When the newest release lacks a required asset, nothing is published — ${ missing }`, () => {
		withinSite( "0.87.4", ( site ) => {
			const destination = new Destination()
			const release = privateRelease( { version: "0.89.2", without: [ missing ], extra: [ "marktone_0.89.2_amd64.deb" ] } )

			const result = new Sync( { source: new Source( release ), destination, site } ).sync()

			assert.match( result, /is not complete yet/ )
			assert.deepEqual( destination.published, [] )
			assert.equal( site.version, "0.87.4" )
		} )
	} )
}

for( const extra of [ [], [ "marktone_0.89.2_amd64.deb" ] ] ) {
	test( `When a new release has every required asset, only supported installers and their checksums are published — ${ extra.length ? "with an extra Debian package" : "without Debian" }`, () => {
		withinSite( "0.87.4", ( site, folder ) => {
			const destination = new Destination()
			const release = privateRelease( { version: "0.89.2", extra } )

			new Sync( { source: new Source( release ), destination, site } ).sync()

			assert.deepEqual( destination.published, [ { tag: "v0.89.2", title: "Marktone 0.89.2", files: [ "Marktone-arm64.dmg", "Marktone-arm64.dmg.sha256", "Marktone-x86_64.AppImage", "Marktone-x86_64.AppImage.sha256", "Marktone-x86_64.tar.gz", "Marktone-x86_64.tar.gz.sha256" ] } ] )
			const feed = JSON.parse( readFileSync( join( folder, "download/latest.json" ), "utf8" ) )
			assert.equal( feed.version, "0.89.2" )
			assert.deepEqual( Object.keys( feed.assets ).sort(), [ "linux-x86_64-appimage", "linux-x86_64-tar", "macos-arm64" ] )
			for( const page of [ "index.html", "download/index.html" ] ) {
				const text = readFileSync( join( folder, page ), "utf8" )
				assert.match( text, /Version 0\.89\.2/, page )
				assert.doesNotMatch( text, /\.deb\b|sudo apt install/, page )
			}
		} )
	} )
}

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
