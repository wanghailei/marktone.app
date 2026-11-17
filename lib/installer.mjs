// One kind of installer Marktone ships. It knows the name its file has in the private release, which carries the version, and the fixed
// name it is published under, which does not, so a link to the latest release's file never changes. Its feed key is how Check for
// Updates finds it in latest.json.
export class Installer {
	static mac = new Installer( { feedKey: "macos-arm64", sourceName: "Marktone_{version}_aarch64.dmg", publishedName: "Marktone-arm64.dmg" } )
	static appimage = new Installer( { feedKey: "linux-x86_64-appimage", sourceName: "marktone_{version}_x86_64.AppImage", publishedName: "Marktone-x86_64.AppImage" } )
	static deb = new Installer( { feedKey: "linux-x86_64-deb", sourceName: "marktone_{version}_amd64.deb", publishedName: "Marktone-amd64.deb" } )
	static tarball = new Installer( { feedKey: "linux-x86_64-tar", sourceName: "marktone_{version}_x86_64.tar.gz", publishedName: "Marktone-x86_64.tar.gz" } )

	// Every installer a release must carry before it is published, so the site never offers half a release.
	static all = [ Installer.mac, Installer.appimage, Installer.deb, Installer.tarball ]

	#sourceName

	constructor( { feedKey, sourceName, publishedName } ) {
		this.feedKey = feedKey
		this.#sourceName = sourceName
		this.publishedName = publishedName
	}

	sourceName( version ) {
		return this.#sourceName.replace( "{version}", version )
	}
}
