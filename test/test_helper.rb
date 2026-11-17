# Loads the site's code and Minitest for every test file. bin/check starts coverage before this file runs.
$LOAD_PATH.unshift File.expand_path( "../lib", __dir__ )
require "marktone"
require "minitest/autorun"
require "tmpdir"
require "json"

# A private release as `gh release view --json tagName,body,assets` gives it, with every installer of the version unless some are left out.
def private_release( version: "0.41.1", body: "", without: [] )
	names = [ "Marktone_#{ version }_aarch64.dmg", "Marktone_#{ version }_aarch64.dmg.sha256", "marktone_#{ version }_x86_64.AppImage", "marktone_#{ version }_amd64.deb", "marktone_#{ version }_x86_64.tar.gz", "marktone_#{ version }_linux.sha256" ] - without
	assets = names.map do { "name" => it } end
	Marktone::Release.new( "tagName" => "v#{ version }", "body" => body, "assets" => assets )
end

# A site folder holding only the feed of the given version, as a published site would, with every installer at 12,345,678 bytes.
def site_with_feed( folder, version: "0.41.1" )
	assets = Marktone::Installer.all.to_h do [ it.feed_key, { "url" => "https://github.com/wanghailei/marktone.app/releases/download/v#{ version }/#{ it.published_name }", "sha256" => "0" * 64, "size" => 12_345_678 } ] end
	FileUtils.mkdir_p File.join( folder, "download" )
	File.write( File.join( folder, "download/latest.json" ), JSON.generate( "version" => version, "notes" => "https://github.com/wanghailei/marktone.app/releases/tag/v#{ version }", "assets" => assets ) )
	Marktone::Site.new( folder: folder )
end
