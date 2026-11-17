module Marktone
	# One repository's GitHub Releases, reached through the gh command. The private repository is read with a token that may read it; the
	# public one is written with the workflow's own token. Each gh failure stops the run with gh's own words, since a half-run publish is
	# safe to run again: nothing points at a release until the site's files are written last.
	class Releases
		def initialize( repository:, token: nil )
			@repository = repository
			@token = token
		end

		def latest = Release.new( JSON.parse( gh( "release", "view", "--json", "tagName,body,assets" ) ) )

		def download!( release, folder )
			patterns = Installer.all.flat_map do [ "--pattern", it.source_name( release.version ) ] end
			gh "release", "download", release.tag, "--dir", folder, "--clobber", *patterns
		end

		# Creates the release with its files and marks it Latest, or, when a run before this one stopped part-way, attaches the files again.
		def publish!( tag:, title:, notes:, files: )
			return gh( "release", "upload", tag, "--clobber", *files ) if tags.include?( tag )
			gh "release", "create", tag, "--title", title, "--notes", notes, "--latest", *files
		end

		# Release tags, newest first.
		def tags = JSON.parse( gh( "release", "list", "--limit", "100", "--json", "tagName" ) ).map { it.fetch( "tagName" ) }

		def delete!( tag ) = gh( "release", "delete", tag, "--yes", "--cleanup-tag" )

	private

		def gh( *arguments )
			environment = @token ? { "GH_TOKEN" => @token } : {}
			output, errors, status = Open3.capture3( environment, "gh", *arguments, "--repo", @repository )
			raise "gh #{ arguments.first( 2 ).join( " " ) } failed for #{ @repository }: #{ errors.strip }" unless status.success?
			output
		end
	end
end
