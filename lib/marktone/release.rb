module Marktone
	# A release of the private repository, as `gh release view --json tagName,body,assets` describes it.
	class Release
		# The notes' list of what is new starts with a bold "New since" line and runs to the first blank line after it.
		CHANGES = /^\*\*New since [^\n]*\*\*\n(?:.+\n?)*/

		def initialize( description )
			@description = description
		end

		def tag = @description.fetch( "tagName" )
		def version = tag.delete_prefix( "v" )
		def title = "Marktone #{ version }"

		# Whether every installer is attached. The Mac disk image is built on a Mac and attached minutes after the Linux files.
		def complete? = Installer.all.all? { asset_names.include?( it.source_name( version ) ) }

		# The notes users read on the public release: what is new, and where to download. The build details written for the team stay private.
		def public_notes
			changes = @description.fetch( "body", "" ).to_s[ CHANGES ]
			[ changes&.strip, "Download and install: #{ DOWNLOAD_PAGE }" ].compact.join( "\n\n" ) + "\n"
		end

	private

		def asset_names = @description.fetch( "assets", [] ).map { it.fetch( "name" ) }
	end
end
