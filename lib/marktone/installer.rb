module Marktone
	# One kind of installer Marktone ships. It knows the name its file has in the private release, which carries the version, and the fixed
	# name it is published under, which does not, so a link to the latest release's file never changes. Its feed key is how Check for
	# Updates finds it in latest.json.
	class Installer
		attr_reader :feed_key, :published_name

		def self.mac = new( feed_key: "macos-arm64", source_name: "Marktone_%{version}_aarch64.dmg", published_name: "Marktone-arm64.dmg" )
		def self.appimage = new( feed_key: "linux-x86_64-appimage", source_name: "marktone_%{version}_x86_64.AppImage", published_name: "Marktone-x86_64.AppImage" )
		def self.deb = new( feed_key: "linux-x86_64-deb", source_name: "marktone_%{version}_amd64.deb", published_name: "Marktone-amd64.deb" )
		def self.tarball = new( feed_key: "linux-x86_64-tar", source_name: "marktone_%{version}_x86_64.tar.gz", published_name: "Marktone-x86_64.tar.gz" )

		# Every installer a release must carry before it is published, so the download page never offers half a release.
		def self.all = [ mac, appimage, deb, tarball ]

		def initialize( feed_key:, source_name:, published_name: )
			@feed_key = feed_key
			@source_name = source_name
			@published_name = published_name
		end

		def source_name( version ) = format( @source_name, version: version )

		# Installers are values: two with the same feed key are the same installer.
		def ==( other ) = other.is_a?( Installer ) && feed_key == other.feed_key
		alias eql? ==
		def hash = feed_key.hash
	end
end
