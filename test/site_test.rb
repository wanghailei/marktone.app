require_relative "test_helper"

class SiteTest < Minitest::Test
	def test_when_an_installer_is_prepared_it_takes_its_fixed_name_with_a_checksum_file_beside_it
		Dir.mktmpdir do |folder|
			File.write( File.join( folder, "Marktone_0.41.1_aarch64.dmg" ), "disk image" )

			package = Marktone::Package.prepare!( installer: Marktone::Installer.mac, version: "0.41.1", folder: folder )

			assert_equal [ "Marktone-arm64.dmg", "Marktone-arm64.dmg.sha256" ], package.files.map { File.basename( it ) }
			assert_equal "#{ Digest::SHA256.hexdigest( "disk image" ) }  Marktone-arm64.dmg\n", File.read( package.files.last )
		end
	end

	def test_when_a_version_is_published_the_feed_names_it_with_every_installer_checksum_and_size
		within_published_site do |folder|
			feed = JSON.parse( File.read( File.join( folder, "download/latest.json" ) ) )

			assert_equal "0.41.1", feed[ "version" ]
			assert_equal "https://github.com/wanghailei/marktone.app/releases/tag/v0.41.1", feed[ "notes" ]
			assert_equal [ "linux-x86_64-appimage", "linux-x86_64-deb", "linux-x86_64-tar", "macos-arm64" ], feed[ "assets" ].keys.sort
			assert_equal( { "url" => "https://github.com/wanghailei/marktone.app/releases/download/v0.41.1/Marktone-amd64.deb", "sha256" => Digest::SHA256.hexdigest( "deb" ), "size" => 3 }, feed[ "assets" ][ "linux-x86_64-deb" ] )
		end
	end

	def test_when_a_version_is_published_the_download_page_links_every_installer_of_that_version
		within_published_site do |folder|
			page = File.read( File.join( folder, "download/index.html" ) )

			assert_includes page, "Latest version: 0.41.1"
			[ "Marktone-arm64.dmg", "Marktone-x86_64.AppImage", "Marktone-amd64.deb", "Marktone-x86_64.tar.gz" ].each do
				assert_includes page, "https://github.com/wanghailei/marktone.app/releases/download/v0.41.1/#{ it }\""
				assert_includes page, "https://github.com/wanghailei/marktone.app/releases/download/v0.41.1/#{ it }.sha256\""
			end
		end
	end

	def test_when_a_version_is_published_the_site_reports_that_version
		within_published_site do |folder|
			assert_equal "0.41.1", Marktone::Site.new( folder: folder ).version
		end
	end

	def test_when_the_site_has_no_feed_it_has_no_version
		Dir.mktmpdir do |folder|
			assert_nil Marktone::Site.new( folder: folder ).version
		end
	end

private

	# Publishes 0.41.1 into an empty site folder, from installer files whose contents are their short names.
	def within_published_site
		Dir.mktmpdir do |folder|
			packages = { Marktone::Installer.mac => "dmg", Marktone::Installer.appimage => "appimage", Marktone::Installer.deb => "deb", Marktone::Installer.tarball => "tar" }.map do |installer, contents|
				File.write( File.join( folder, installer.source_name( "0.41.1" ) ), contents )
				Marktone::Package.prepare!( installer: installer, version: "0.41.1", folder: folder )
			end
			Marktone::Site.new( folder: folder ).publish!( release: private_release, packages: packages )
			yield folder
		end
	end
end
