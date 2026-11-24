import { test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync, execFileSync } from "node:child_process"
import { createHash } from "node:crypto"
import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs"
import { delimiter, join, resolve } from "node:path"
import { withinFolder } from "./helper.mjs"

const SITE = resolve( import.meta.dirname, ".." )
const DESKTOP = "[Desktop Entry]\nType=Application\nName=Marktone\nExec=marktone %f\nIcon=marktone\nTerminal=false\n"

// Every program the scripts use, found on this machine's PATH, so a test can offer all of them but one.
const PROGRAMS = [ "sha256sum", "tar", "gzip", "mktemp", "rm", "mkdir", "cp", "chmod", "mv", "sed", "tr", "cut" ]

// A machine with a fresh home folder, and marktone.app as `curl` sees it: the feed, the Linux tarball and the AppImage of the given
// version, served from a folder by a `curl` that copies the file named by the address's last part. The tarball's program prints its
// version, as `marktone --version` does. The AppImage stands in for a real one: run with --appimage-extract, it unpacks its menu entry
// and icon into squashfs-root in the current folder, as an AppImage's runtime does; run otherwise, it prints its version.
function machine( folder, { version = "0.42.0", checksum, tarball = true, without = [], system = "Linux", processor = "x86_64" } = {} ) {
	const home = join( folder, "home" )
	const web = join( folder, "web" )
	const programs = join( folder, "programs" )
	const temporary = join( folder, "temporary" )
	for( const path of [ home, web, programs, temporary ] ) mkdirSync( path, { recursive: true } )

	const unpacked = join( folder, "build", `marktone-${ version }` )
	mkdirSync( join( unpacked, "licences" ), { recursive: true } )
	writeFileSync( join( unpacked, "marktone" ), `#!/bin/sh\necho "marktone ${ version }"\n`, { mode: 0o755 } )
	writeFileSync( join( unpacked, "marktone.desktop" ), DESKTOP )
	writeFileSync( join( unpacked, "marktone.png" ), "icon" )
	writeFileSync( join( unpacked, "licences/IBM-Plex-Mono-OFL.txt" ), "licence" )
	execFileSync( "tar", [ "-czf", join( web, "Marktone-x86_64.tar.gz" ), "-C", join( folder, "build" ), `marktone-${ version }` ] )

	writeFileSync( join( web, "Marktone-x86_64.AppImage" ), `#!/bin/sh\nif [ "$1" = --appimage-extract ]; then\n\tmkdir -p squashfs-root\n\tprintf '%s' '${ DESKTOP }' > squashfs-root/marktone.desktop\n\tprintf '%s' 'appimage icon' > squashfs-root/marktone.png\n\texit 0\nfi\necho "marktone ${ version } from the AppImage"\n` )

	const digest = ( name ) => existsSync( join( web, name ) ) ? createHash( "sha256" ).update( readFileSync( join( web, name ) ) ).digest( "hex" ) : "0".repeat( 64 )
	const asset = ( name ) => ( { url: `https://github.com/wanghailei/marktone.app/releases/download/v${ version }/${ name }`, sha256: checksum ?? digest( name ), size: 1 } )
	const assets = { "macos-arm64": asset( "Marktone-arm64.dmg" ), "linux-x86_64-appimage": asset( "Marktone-x86_64.AppImage" ), ...( tarball ? { "linux-x86_64-tar": asset( "Marktone-x86_64.tar.gz" ) } : {} ) }
	const changes = "**New in 0.42.0**\n- Braces `{ }` and \"quotes\" in the notes, and \"linux-x86_64-tar\" named."
	writeFileSync( join( web, "latest.json" ), JSON.stringify( { version, notes: "https://marktone.app/download/", changes, assets }, null, "\t" ) + "\n" )

	// A program stood in for is written as a script of its own, never through a link to the machine's real one.
	for( const program of PROGRAMS.filter( ( name ) => !without.includes( name ) ) ) symlinkSync( which( program ), join( programs, program ) )
	if( !without.includes( "curl" ) ) script( programs, "curl", `for word in "$@"; do case "$word" in https://*) address="$word" ;; esac; done\nwhile [ $# -gt 0 ]; do [ "$1" = -o ] && target="$2"; shift; done\ncp "${ web }/\${address##*/}" "$target" 2>/dev/null || exit 22\n` )
	if( !without.includes( "uname" ) ) script( programs, "uname", `case "$1" in -s) echo ${ system } ;; -m) echo ${ processor } ;; esac\n` )

	return { home, temporary, programs }
}

function script( folder, name, body ) {
	const path = join( folder, name )
	writeFileSync( path, `#!/bin/sh\n${ body }` )
	chmodSync( path, 0o755 )
}

function which( program ) {
	const folder = process.env.PATH.split( delimiter ).find( ( candidate ) => existsSync( join( candidate, program ) ) )
	return join( folder, program )
}

// Runs one of the site's scripts as `curl -fsSL https://marktone.app/<name> | sh -s -- <arguments>` runs it: the script read by sh
// from its input, with the arguments after it.
function run( name, { home, temporary, programs }, { path = [ programs ], arguments: words = [] } = {} ) {
	const ran = spawnSync( "/bin/sh", [ "-s", "--", ...words ], { input: readFileSync( join( SITE, name ) ), env: { HOME: home, TMPDIR: temporary, PATH: path.join( delimiter ) }, encoding: "utf8" } )
	return { status: ran.status, output: ran.stdout + ran.stderr }
}

const installed = ( home ) => [ ".local/bin/marktone", ".local/share/applications/marktone.desktop", ".local/share/icons/hicolor/512x512/apps/marktone.png" ].map( ( path ) => join( home, path ) )

test( "When it is run on Linux x86-64, the installer puts the program, its menu entry and its icon in the user's own folders", () => {
	withinFolder( ( folder ) => {
		const box = machine( folder )

		const { status, output } = run( "install.sh", box, { path: [ join( box.home, ".local/bin" ), box.programs ] } )

		assert.equal( status, 0, output )
		const [ program, entry, icon ] = installed( box.home )
		assert.equal( execFileSync( program, [ "--version" ], { encoding: "utf8" } ), "marktone 0.42.0\n" )
		assert.match( readFileSync( entry, "utf8" ), new RegExp( `^Exec="${ program }" %f$`, "m" ) )
		assert.match( readFileSync( entry, "utf8" ), new RegExp( `^Icon=${ icon }$`, "m" ) )
		assert.equal( readFileSync( icon, "utf8" ), "icon" )
		assert.equal( output, `Installed Marktone 0.42.0 in ${ program }, with its menu entry and icon.\n` )
	} )
} )

test( "When the installer is run again, it replaces the installed Marktone with the latest, leaving one copy", () => {
	withinFolder( ( folder ) => {
		const box = machine( folder, { version: "0.42.0" } )
		run( "install.sh", { ...machine( join( folder, "old" ), { version: "0.41.1" } ), home: box.home } )
		assert.equal( execFileSync( installed( box.home )[ 0 ], [ "--version" ], { encoding: "utf8" } ), "marktone 0.41.1\n" )
		run( "install.sh", box )

		const { status } = run( "install.sh", box )

		assert.equal( status, 0 )
		assert.equal( execFileSync( installed( box.home )[ 0 ], [ "--version" ], { encoding: "utf8" } ), "marktone 0.42.0\n" )
		assert.deepEqual( readdirSync( join( box.home, ".local/bin" ) ), [ "marktone" ] )
		assert.deepEqual( readdirSync( join( box.home, ".local/share/applications" ) ), [ "marktone.desktop" ] )
		assert.deepEqual( readdirSync( box.temporary ), [] )
	} )
} )

test( "When ~/.local/bin is not on the PATH, the installer says how to add it", () => {
	withinFolder( ( folder ) => {
		const { output } = run( "install.sh", machine( folder ) )

		assert.match( output, /~\/\.local\/bin is not on your PATH, so a terminal will not find marktone\. Add this line to ~\/\.profile, then log in again:\n  export PATH="\$HOME\/\.local\/bin:\$PATH"\n/ )
	} )
} )

test( "When the download does not match the feed's checksum, the installer refuses and installs nothing", () => {
	withinFolder( ( folder ) => {
		const box = machine( folder, { checksum: "0".repeat( 64 ) } )

		const { status, output } = run( "install.sh", box )

		assert.equal( status, 1 )
		assert.equal( output, "Marktone was not installed: the download does not match the checksum marktone.app publishes, so it was not unpacked.\n" )
		assert.equal( existsSync( join( box.home, ".local" ) ), false )
		assert.deepEqual( readdirSync( box.temporary ), [] )
	} )
} )

test( "When the machine is not Linux on x86-64, the installer refuses and changes nothing", () => {
	withinFolder( ( folder ) => {
		const box = machine( folder, { system: "Darwin", processor: "arm64" } )

		const { status, output } = run( "install.sh", box )

		assert.equal( status, 1 )
		assert.equal( output, "Marktone was not installed: this installer is for Linux on x86-64, and this machine is Darwin on arm64. Download Marktone from https://marktone.app/download/ instead.\n" )
		assert.equal( existsSync( join( box.home, ".local" ) ), false )
	} )
} )

test( "When curl, sha256sum or tar is missing, the installer refuses and names it", () => {
	for( const missing of [ "curl", "sha256sum", "tar" ] ) {
		withinFolder( ( folder ) => {
			const box = machine( folder, { without: [ missing ] } )

			const { status, output } = run( "install.sh", box )

			assert.equal( status, 1, missing )
			assert.equal( output, `Marktone was not installed: it needs ${ missing }, which this machine does not have. Install ${ missing } with your system's package manager, then run this again.\n` )
			assert.equal( existsSync( join( box.home, ".local" ) ), false, missing )
		} )
	}
} )

test( "When the feed names no Linux tarball, the installer refuses and installs nothing", () => {
	withinFolder( ( folder ) => {
		const box = machine( folder, { tarball: false } )

		const { status, output } = run( "install.sh", box )

		assert.equal( status, 1 )
		assert.equal( output, "Marktone was not installed: marktone.app offers no Linux download at the moment. Try again later.\n" )
		assert.equal( existsSync( join( box.home, ".local" ) ), false )
	} )
} )

test( "When Marktone is installed, the uninstaller removes exactly what the installer put in place and keeps the settings and Help", () => {
	withinFolder( ( folder ) => {
		const box = machine( folder )
		run( "install.sh", box )
		mkdirSync( join( box.home, ".config/marktone" ), { recursive: true } )
		writeFileSync( join( box.home, ".config/marktone/settings.toml" ), "" )
		writeFileSync( join( box.home, ".local/bin/other" ), "" )

		const { status, output } = run( "uninstall.sh", box )

		assert.equal( status, 0 )
		for( const path of installed( box.home ) ) assert.equal( existsSync( path ), false, path )
		assert.deepEqual( readdirSync( join( box.home, ".local/bin" ) ), [ "other" ] )
		assert.equal( existsSync( join( box.home, ".config/marktone/settings.toml" ) ), true )
		assert.equal( output, `Removed Marktone: ${ join( box.home, ".local/bin/marktone" ) }, its menu entry and its icon.\nYour settings in ${ join( box.home, ".config/marktone" ) } and the Help file in ${ join( box.home, ".local/share/marktone" ) } are kept; delete them by hand if you no longer want them. Your Markdown files are not touched.\n` )
	} )
} )

test( "When Marktone is installed or removed, the user's applications cache is refreshed after its menu entry changes, and the chosen defaults are left alone", () => {
	withinFolder( ( folder ) => {
		const box = machine( join( folder, "test user" ) )
		const applications = join( box.home, ".local/share/applications" )
		const log = join( folder, "desktop-database.log" )
		const defaults = join( box.home, ".config/mimeapps.list" )
		const original = "[Default Applications]\ntext/markdown=vim.desktop\n"
		mkdirSync( join( box.home, ".config" ), { recursive: true } )
		writeFileSync( defaults, original )
		script( box.programs, "update-desktop-database", `
[ "$#" -eq 1 ] || exit 2
if [ -f "$1/marktone.desktop" ]; then state=present; else state=absent; fi
printf '%s %s\\n' "$state" "$1" >> "${ log }"
` )

		const install = run( "install.sh", box )
		assert.equal( install.status, 0, install.output )
		assert.equal( readFileSync( log, "utf8" ), `present ${ applications }\n` )
		assert.equal( readFileSync( defaults, "utf8" ), original )

		const uninstall = run( "uninstall.sh", box )
		assert.equal( uninstall.status, 0, uninstall.output )
		assert.equal( readFileSync( log, "utf8" ), `present ${ applications }\nabsent ${ applications }\n` )
		assert.equal( readFileSync( defaults, "utf8" ), original )
	} )
} )

test( "When the applications cache cannot be refreshed, installing and removing Marktone still succeed and say so", () => {
	withinFolder( ( folder ) => {
		const box = machine( folder )
		const entry = installed( box.home )[ 1 ]
		script( box.programs, "update-desktop-database", "exit 1\n" )

		const install = run( "install.sh", box )
		assert.equal( install.status, 0, install.output )
		assert.equal( existsSync( entry ), true )
		assert.match( install.output, /could not refresh the desktop MIME cache/ )

		const uninstall = run( "uninstall.sh", box )
		assert.equal( uninstall.status, 0, uninstall.output )
		assert.equal( existsSync( entry ), false )
		assert.match( uninstall.output, /could not refresh the desktop MIME cache/ )
	} )
} )

test( "When the installer is run with --appimage, it installs the AppImage itself with its menu entry and icon, and the uninstaller removes them", () => {
	withinFolder( ( folder ) => {
		const box = machine( folder )
		const appimage = readFileSync( join( folder, "web/Marktone-x86_64.AppImage" ) )

		const install = run( "install.sh", box, { arguments: [ "--appimage" ] } )

		assert.equal( install.status, 0, install.output )
		const [ program, entry, icon ] = installed( box.home )
		assert.deepEqual( readFileSync( program ), appimage )
		assert.equal( execFileSync( program, [ "--version" ], { encoding: "utf8" } ), "marktone 0.42.0 from the AppImage\n" )
		assert.match( readFileSync( entry, "utf8" ), new RegExp( `^Exec="${ program }" %f$`, "m" ) )
		assert.match( readFileSync( entry, "utf8" ), new RegExp( `^Icon=${ icon }$`, "m" ) )
		assert.equal( readFileSync( icon, "utf8" ), "appimage icon" )
		assert.match( install.output, new RegExp( `^Installed Marktone 0\\.42\\.0 in ${ program }, with its menu entry and icon\\.$`, "m" ) )
		assert.deepEqual( readdirSync( box.temporary ), [] )

		const uninstall = run( "uninstall.sh", box )

		assert.equal( uninstall.status, 0, uninstall.output )
		for( const path of installed( box.home ) ) assert.equal( existsSync( path ), false, path )
	} )
} )

test( "When the AppImage does not match the feed's checksum, the installer run with --appimage refuses and installs nothing", () => {
	withinFolder( ( folder ) => {
		const box = machine( folder )
		const feed = JSON.parse( readFileSync( join( folder, "web/latest.json" ), "utf8" ) )
		feed.assets[ "linux-x86_64-appimage" ].sha256 = "0".repeat( 64 )
		writeFileSync( join( folder, "web/latest.json" ), JSON.stringify( feed, null, "\t" ) )

		const { status, output } = run( "install.sh", box, { arguments: [ "--appimage" ] } )

		assert.equal( status, 1 )
		assert.equal( output, "Marktone was not installed: the download does not match the checksum marktone.app publishes, so it was not unpacked.\n" )
		assert.equal( existsSync( join( box.home, ".local" ) ), false )
	} )
} )

test( "When the installer is given an argument other than --appimage, it refuses and changes nothing", () => {
	withinFolder( ( folder ) => {
		const box = machine( folder )

		const { status, output } = run( "install.sh", box, { arguments: [ "--deb" ] } )

		assert.equal( status, 1 )
		assert.equal( output, "Marktone was not installed: the installer takes no argument, or --appimage to install the AppImage. Run it again as curl -fsSL https://marktone.app/install.sh | sh, or with | sh -s -- --appimage.\n" )
		assert.equal( existsSync( join( box.home, ".local" ) ), false )
	} )
} )

test( "When Marktone is not installed, the uninstaller says so and changes nothing", () => {
	withinFolder( ( folder ) => {
		const box = machine( folder )

		const { status, output } = run( "uninstall.sh", box )

		assert.equal( status, 0 )
		assert.equal( output, `Marktone is not installed in ${ join( box.home, ".local" ) }, so nothing was removed.\n` )
		assert.equal( existsSync( join( box.home, ".local" ) ), false )
	} )
} )
