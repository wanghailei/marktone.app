module Marktone
	# Brings marktone.app level with the private repository's latest release: publishes its installers, then writes the site's files, then
	# keeps only the newest releases. The site's files come last, so the page and the feed never name a file that is not yet published.
	class Sync
		# Master's ruling on wanghailei/marktone#105: only the newest three releases are kept.
		RELEASES_KEPT = 3

		def initialize( source:, destination:, site: )
			@source = source
			@destination = destination
			@site = site
		end

		# Publishes the latest release when it is complete and new, renders the site's pages from its feed, and returns a sentence saying
		# what happened.
		def sync!
			outcome = publish_latest!
			@site.render! if @site.version
			outcome
		end

	private

		def publish_latest!
			release = @source.latest
			return "#{ release.title } is already on marktone.app; nothing to publish." if @site.version == release.version
			return "#{ release.title } is not complete yet: it lacks an installer, so marktone.app stays on #{ @site.version || "nothing" }." unless release.complete?
			publish!( release )
			prune!
			"Published #{ release.title } on marktone.app."
		end

		def publish!( release )
			Dir.mktmpdir do |folder|
				@source.download!( release, folder )
				packages = Installer.all.map do Package.prepare!( installer: it, version: release.version, folder: folder ) end
				@destination.publish!( tag: release.tag, title: release.title, notes: release.public_notes, files: packages.flat_map( &:files ) )
				@site.publish!( release: release, packages: packages )
			end
		end

		def prune! = @destination.tags.drop( RELEASES_KEPT ).each { @destination.delete!( it ) }
	end
end
