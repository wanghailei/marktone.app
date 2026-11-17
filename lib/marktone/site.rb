module Marktone
	# The site's folder: the download page and its update feed, both written from the release being published so they always agree.
	class Site
		TEMPLATE = File.expand_path( "download.html.erb", __dir__ )

		def initialize( folder: )
			@folder = folder
		end

		# The version the feed names, or nil before anything has been published.
		def version
			JSON.parse( File.read( feed_path ) )[ "version" ] if File.exist?( feed_path )
		end

		def publish!( release:, packages: )
			FileUtils.mkdir_p File.dirname( feed_path )
			File.write( feed_path, JSON.pretty_generate( feed( release, packages ) ).gsub( /^( +)/ ) { "\t" * ( $1.size / 2 ) } + "\n" )
			File.write( File.join( @folder, "download/index.html" ), page( release, packages ) )
		end

	private

		def feed_path = File.join( @folder, "download/latest.json" )

		def feed( release, packages )
			assets = packages.to_h do [ it.installer.feed_key, { "url" => address( release, it.installer ), "sha256" => it.sha256, "size" => it.size } ] end
			{ "version" => release.version, "notes" => "https://github.com/#{ PUBLIC_REPOSITORY }/releases/tag/#{ release.tag }", "assets" => assets }
		end

		def page( release, packages )
			link = ->( installer ) { address( release, installer ) }
			ERB.new( File.read( TEMPLATE ), trim_mode: "-" ).result_with_hash( release: release, link: link, notes: "https://github.com/#{ PUBLIC_REPOSITORY }/releases/tag/#{ release.tag }" )
		end

		# The file's address on this version's release, so the page and the feed name the same files as the version they show.
		def address( release, installer ) = "https://github.com/#{ PUBLIC_REPOSITORY }/releases/download/#{ release.tag }/#{ installer.published_name }"
	end
end
