module Marktone
	# The update feed, download/latest.json: the version marktone.app offers, where its notes are, and each installer's address, checksum
	# and size. Check for Updates reads it, and the site's pages are rendered from it, so the pages always say what the feed says.
	class Feed
		def self.read( path ) = new( JSON.parse( File.read( path ) ) )

		def self.for( release:, packages: )
			assets = packages.to_h do [ it.installer.feed_key, { "url" => "https://github.com/#{ PUBLIC_REPOSITORY }/releases/download/#{ release.tag }/#{ it.installer.published_name }", "sha256" => it.sha256, "size" => it.size } ] end
			new( "version" => release.version, "notes" => "https://github.com/#{ PUBLIC_REPOSITORY }/releases/tag/#{ release.tag }", "assets" => assets )
		end

		def initialize( description )
			@description = description
		end

		def version = @description.fetch( "version" )
		def notes = @description.fetch( "notes" )
		def url( installer ) = asset( installer ).fetch( "url" )
		def checksum_url( installer ) = "#{ url( installer ) }.sha256"

		# The file's size as a reader reads it, in decimal megabytes, as macOS's Finder counts them.
		def size( installer ) = format( "%.1f MB", asset( installer ).fetch( "size" ) / 1_000_000.0 )

		# Writes the feed indented with tabs, as every file in this repository is.
		def write!( path )
			FileUtils.mkdir_p File.dirname( path )
			File.write( path, JSON.pretty_generate( @description ).gsub( /^( +)/ ) { "\t" * ( $1.size / 2 ) } + "\n" )
		end

	private

		def asset( installer ) = @description.fetch( "assets" ).fetch( installer.feed_key )
	end
end
