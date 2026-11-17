module Marktone
	# The site's folder: the update feed and the two pages rendered from it, the home page and the download page.
	class Site
		TEMPLATES = File.expand_path( "templates", __dir__ )

		# A page of the site: where it is written, the template that draws its main part, and its title.
		Page = Data.define( :path, :template, :title )
		PAGES = [ Page.new( path: "index.html", template: "home", title: "Marktone" ), Page.new( path: "download/index.html", template: "download", title: "Download Marktone" ) ]

		def initialize( folder: )
			@folder = folder
		end

		# The version the feed names, or nil before anything has been published.
		def version = ( Feed.read( feed_path ).version if File.exist?( feed_path ) )

		def publish!( release:, packages: )
			Feed.for( release: release, packages: packages ).write!( feed_path )
			render!
		end

		# Renders every page from the feed. It runs on every sync, so a change to a template reaches the site without a new release.
		def render!
			feed = Feed.read( feed_path )
			downloads = view( "downloads", feed: feed )
			PAGES.each do |page|
				content = view( page.template, feed: feed, downloads: downloads )
				File.write( File.join( @folder, page.path ), view( "layout", page: page, content: content, year: Time.now.year ) )
			end
		end

	private

		def feed_path = File.join( @folder, "download/latest.json" )
		def view( name, **locals ) = ERB.new( File.read( File.join( TEMPLATES, "#{ name }.html.erb" ) ), trim_mode: "-" ).result_with_hash( **locals )
	end
end
