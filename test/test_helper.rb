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
