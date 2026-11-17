import { Installer } from "../installer.mjs"

// The download section: the version, its notes, and each installer with its size, checksum and install steps, all from the feed.
export function downloads( { feed } ) {
	return `		<section>
			<h2>Download</h2>
			<p class="muted">Version ${ feed.version } · <a href="${ feed.notes }">Release notes</a></p>

			<h3>macOS (Apple silicon)</h3>
			<p><a href="${ feed.url( Installer.mac ) }">↓ Marktone-arm64.dmg</a> <span class="muted">${ feed.size( Installer.mac ) } · <a href="${ feed.checksumUrl( Installer.mac ) }">SHA-256</a></span></p>
			<p>Open the <code>.dmg</code> and drag Marktone into Applications. The first time, right-click Marktone in Applications and choose Open: Marktone is not notarised by Apple, so macOS refuses a plain double-click.</p>

			<h3>Linux (x86-64)</h3>
			<p><a href="${ feed.url( Installer.appimage ) }">↓ Marktone-x86_64.AppImage</a> <span class="muted">${ feed.size( Installer.appimage ) } · <a href="${ feed.checksumUrl( Installer.appimage ) }">SHA-256</a></span><br>Make it executable with <code>chmod +x Marktone-x86_64.AppImage</code>, then run it.</p>
			<p><a href="${ feed.url( Installer.deb ) }">↓ Marktone-amd64.deb</a> <span class="muted">${ feed.size( Installer.deb ) } · <a href="${ feed.checksumUrl( Installer.deb ) }">SHA-256</a></span><br>On Debian or Ubuntu: <code>sudo apt install ./Marktone-amd64.deb</code></p>
			<p><a href="${ feed.url( Installer.tarball ) }">↓ Marktone-x86_64.tar.gz</a> <span class="muted">${ feed.size( Installer.tarball ) } · <a href="${ feed.checksumUrl( Installer.tarball ) }">SHA-256</a></span><br>Unpack it and run <code>marktone</code> in the unpacked folder; its desktop file and icon are beside it.</p>
		</section>
`
}
