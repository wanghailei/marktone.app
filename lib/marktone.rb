# Publishes Marktone's newest release on marktone.app: it copies the installers from the private repository's latest release to a release
# of this public repository, under names that never change, and writes the download page and its update feed to match. bin/sync runs it.
require "digest"
require "erb"
require "fileutils"
require "json"
require "open3"
require "tmpdir"

module Marktone
	# The public repository whose releases hold the installers, and the page users are sent to.
	PUBLIC_REPOSITORY = "wanghailei/marktone.app"
	DOWNLOAD_PAGE = "https://marktone.app/download/"
end

require "marktone/feed"
require "marktone/installer"
require "marktone/package"
require "marktone/release"
require "marktone/releases"
require "marktone/site"
require "marktone/sync"
