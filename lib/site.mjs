import { existsSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { Feed } from "./feed.mjs"
import { layout } from "./templates/layout.mjs"
import { home } from "./templates/home.mjs"
import { download } from "./templates/download.mjs"
import { downloads } from "./templates/downloads.mjs"

// A page of the site: where it is written, the template that draws its main part, and its title.
const PAGES = [ { path: "index.html", template: home, title: "Marktone" }, { path: "download/index.html", template: download, title: "Download Marktone" } ]

// The site's folder: the update feed and the two pages rendered from it, the home page and the download page.
export class Site {
	#folder

	constructor( { folder } ) {
		this.#folder = folder
	}

	// The version the feed names, or undefined before anything has been published.
	get version() {
		return existsSync( this.#feedPath ) ? Feed.read( this.#feedPath ).version : undefined
	}

	publish( { release, packages } ) {
		Feed.for( { release, packages } ).write( this.#feedPath )
		this.render()
	}

	// Renders every page from the feed. It runs on every sync, so a change to a template reaches the site without a new release.
	render() {
		const feed = Feed.read( this.#feedPath )
		const section = downloads( { feed } )
		for( const page of PAGES ) {
			const content = page.template( { downloads: section } )
			writeFileSync( join( this.#folder, page.path ), layout( { title: page.title, content, year: new Date().getFullYear() } ) )
		}
	}

	get #feedPath() {
		return join( this.#folder, "download/latest.json" )
	}
}
