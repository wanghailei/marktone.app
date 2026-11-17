require_relative "test_helper"

class SyncTest < Minitest::Test
	# The private repository's releases, as GitHub would answer: its latest release, and the installer files it downloads.
	class Source
		def initialize( release ) = @release = release
		def latest = @release

		def download!( release, folder )
			Marktone::Installer.all.each do File.write( File.join( folder, it.source_name( release.version ) ), it.published_name ) end
		end
	end

	# The public repository's releases, recording what is published and deleted.
	class Destination
		attr_reader :published, :deleted

		def initialize( tags: [] )
			@tags = tags
			@published = []
			@deleted = []
		end

		def publish!( tag:, title:, notes:, files: )
			@published << { tag: tag, title: title, files: files.map { File.basename( it ) }.sort }
			@tags.unshift tag
		end

		def tags = @tags
		def delete!( tag ) = @deleted << tag
	end

	def test_when_the_newest_release_is_already_on_the_site_nothing_is_published
		within_site( version: "0.41.1" ) do |site|
			destination = Destination.new( tags: [ "v0.41.1" ] )

			Marktone::Sync.new( source: Source.new( private_release ), destination: destination, site: site ).sync!

			assert_empty destination.published
		end
	end

	def test_when_the_newest_release_lacks_an_installer_nothing_is_published
		within_site( version: "0.40.1" ) do |site|
			destination = Destination.new
			release = private_release( without: [ "Marktone_0.41.1_aarch64.dmg" ] )

			Marktone::Sync.new( source: Source.new( release ), destination: destination, site: site ).sync!

			assert_empty destination.published
			assert_equal "0.40.1", site.version
		end
	end

	def test_when_a_new_complete_release_appears_it_is_published_and_the_site_points_to_it
		within_site( version: "0.40.1" ) do |site|
			destination = Destination.new

			Marktone::Sync.new( source: Source.new( private_release ), destination: destination, site: site ).sync!

			assert_equal [ { tag: "v0.41.1", title: "Marktone 0.41.1", files: [ "Marktone-amd64.deb", "Marktone-amd64.deb.sha256", "Marktone-arm64.dmg", "Marktone-arm64.dmg.sha256", "Marktone-x86_64.AppImage", "Marktone-x86_64.AppImage.sha256", "Marktone-x86_64.tar.gz", "Marktone-x86_64.tar.gz.sha256" ] } ], destination.published
			assert_equal "0.41.1", site.version
		end
	end

	def test_when_more_than_three_releases_are_public_the_oldest_are_deleted
		within_site( version: "0.38.1" ) do |site|
			destination = Destination.new( tags: [ "v0.40.1", "v0.38.1", "v0.37.3" ] )

			Marktone::Sync.new( source: Source.new( private_release ), destination: destination, site: site ).sync!

			assert_equal [ "v0.37.3" ], destination.deleted
		end
	end

private

	# A site folder whose feed names the given version.
	def within_site( version: )
		Dir.mktmpdir do |folder|
			FileUtils.mkdir_p File.join( folder, "download" )
			File.write( File.join( folder, "download/latest.json" ), JSON.generate( "version" => version ) )
			yield Marktone::Site.new( folder: folder )
		end
	end
end
