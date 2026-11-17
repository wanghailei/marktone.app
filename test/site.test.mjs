import { test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { readFileSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"
import { Installer, Package, Site } from "../lib/marktone.mjs"
import { privateRelease, siteWithFeed, withinFolder } from "./helper.mjs"

const NOTES = `Marktone 0.41.1 for Linux on x86-64, built from \`main\` at 8d65f6b on 2026-11-17.

**New since 0.40.1**
- **A file opened from a blank window opens in that window.**
- Body text is \`400\` Regular by default.
`

const sha256 = ( text ) => createHash( "sha256" ).update( text ).digest( "hex" )

// Publishes 0.41.1 into an empty site folder, from installer files whose contents are their short names.
function withinPublishedSite( work ) {
	return withinFolder( ( folder ) => {
		const contents = new Map( [ [ Installer.mac, "dmg" ], [ Installer.appimage, "appimage" ], [ Installer.deb, "deb" ], [ Installer.tarball, "tar" ] ] )
		const packages = [ ...contents ].map( ( [ installer, text ] ) => {
			writeFileSync( join( folder, installer.sourceName( "0.41.1" ) ), text )
			return Package.prepare( { installer, version: "0.41.1", folder } )
		} )
		new Site( { folder } ).publish( { release: privateRelease( { body: NOTES } ), packages } )
		return work( folder )
	} )
}

test( "When an installer is prepared, it takes its fixed name with a checksum file beside it", () => {
	withinFolder( ( folder ) => {
		writeFileSync( join( folder, "Marktone_0.41.1_aarch64.dmg" ), "disk image" )

		const prepared = Package.prepare( { installer: Installer.mac, version: "0.41.1", folder } )

		assert.deepEqual( prepared.files.map( ( path ) => basename( path ) ), [ "Marktone-arm64.dmg", "Marktone-arm64.dmg.sha256" ] )
		assert.equal( readFileSync( prepared.files[ 1 ], "utf8" ), `${ sha256( "disk image" ) }  Marktone-arm64.dmg\n` )
	} )
} )

test( "When a version is published, the feed names it with its notes on the site's download page, and every installer, checksum and size", () => {
	withinPublishedSite( ( folder ) => {
		const feed = JSON.parse( readFileSync( join( folder, "download/latest.json" ), "utf8" ) )

		assert.equal( feed.version, "0.41.1" )
		assert.equal( feed.notes, "https://marktone.app/download/" )
		assert.deepEqual( Object.keys( feed.assets ).sort(), [ "linux-x86_64-appimage", "linux-x86_64-deb", "linux-x86_64-tar", "macos-arm64" ] )
		assert.deepEqual( feed.assets[ "linux-x86_64-deb" ], { url: "https://github.com/wanghailei/marktone.app/releases/download/v0.41.1/Marktone-amd64.deb", sha256: sha256( "deb" ), size: 3 } )
	} )
} )

test( "When a version is published, the download page links every installer of that version", () => {
	withinPublishedSite( ( folder ) => {
		const page = readFileSync( join( folder, "download/index.html" ), "utf8" )

		assert.match( page, /Version 0\.41\.1/ )
		for( const name of [ "Marktone-arm64.dmg", "Marktone-x86_64.AppImage", "Marktone-amd64.deb", "Marktone-x86_64.tar.gz" ] ) {
			assert.ok( page.includes( `https://github.com/wanghailei/marktone.app/releases/download/v0.41.1/${ name }"` ), name )
			assert.ok( page.includes( `https://github.com/wanghailei/marktone.app/releases/download/v0.41.1/${ name }.sha256"` ), `${ name }.sha256` )
		}
	} )
} )

test( "When a version is published, the home page links every installer of that version", () => {
	withinPublishedSite( ( folder ) => {
		const page = readFileSync( join( folder, "index.html" ), "utf8" )

		assert.match( page, /Version 0\.41\.1/ )
		for( const name of [ "Marktone-arm64.dmg", "Marktone-x86_64.AppImage", "Marktone-amd64.deb", "Marktone-x86_64.tar.gz" ] ) {
			assert.ok( page.includes( `https://github.com/wanghailei/marktone.app/releases/download/v0.41.1/${ name }"` ), name )
		}
	} )
} )

test( "When the site is rendered from its feed alone, both pages name the feed's version and file sizes", () => {
	withinFolder( ( folder ) => {
		siteWithFeed( folder, { version: "0.42.0" } ).render()

		for( const page of [ "index.html", "download/index.html" ] ) {
			const text = readFileSync( join( folder, page ), "utf8" )
			assert.match( text, /Version 0\.42\.0/, page )
			assert.match( text, /12\.3 MB/, page )
		}
	} )
} )

test( "When a version is published, the site reports that version", () => {
	withinPublishedSite( ( folder ) => {
		assert.equal( new Site( { folder } ).version, "0.41.1" )
	} )
} )

test( "When the site has no feed, it has no version", () => {
	withinFolder( ( folder ) => {
		assert.equal( new Site( { folder } ).version, undefined )
	} )
} )

test( "When a version is published, its notes are written on the home page and the download page as text", () => {
	withinPublishedSite( ( folder ) => {
		for( const page of [ "index.html", "download/index.html" ] ) {
			const text = readFileSync( join( folder, page ), "utf8" )
			assert.ok( text.includes( "<p><strong>New since 0.40.1</strong></p>\n\t\t\t<ul>\n\t\t\t\t<li><strong>A file opened from a blank window opens in that window.</strong></li>\n\t\t\t\t<li>Body text is <code>400</code> Regular by default.</li>\n\t\t\t</ul>" ), page )
			assert.ok( !text.includes( "8d65f6b" ), `${ page } keeps the build details private` )
		}
	} )
} )

test( "When a version is published, no page links to its release notes on GitHub", () => {
	withinPublishedSite( ( folder ) => {
		for( const page of [ "index.html", "download/index.html" ] ) {
			const text = readFileSync( join( folder, page ), "utf8" )
			assert.ok( !text.includes( "releases/tag/" ), page )
			assert.ok( !text.includes( "Release notes" ), page )
		}
	} )
} )

test( "When the notes carry markup outside the part of Markdown they are written in, it is shown as plain text, escaped", () => {
	withinFolder( ( folder ) => {
		const changes = "**New in 0.42.0**\n- <script>alert(1)</script> & \"quotes\"\n- See [the issue](https://github.com/wanghailei/marktone/issues/1) and [the site](https://marktone.app/)\n- [a script](javascript:void)\n\n# Not a heading\nwrapped onto two lines"

		siteWithFeed( folder, { version: "0.42.0", changes } ).render()

		const text = readFileSync( join( folder, "download/index.html" ), "utf8" )
		assert.ok( text.includes( "<li>&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;</li>" ) )
		assert.ok( text.includes( "<li>See the issue and <a href=\"https://marktone.app/\">the site</a></li>" ) )
		assert.ok( text.includes( "<li>a script</li>" ) )
		assert.ok( text.includes( "<p># Not a heading wrapped onto two lines</p>" ) )
		assert.ok( !text.includes( "github.com/wanghailei/marktone/" ) )
	} )
} )

test( "When the feed carries no notes, the pages show the version alone", () => {
	withinFolder( ( folder ) => {
		siteWithFeed( folder, { version: "0.42.0" } ).render()

		assert.match( readFileSync( join( folder, "index.html" ), "utf8" ), /<p class="muted">Version 0\.42\.0<\/p>\n\n\t\t\t<h3>/ )
	} )
} )
