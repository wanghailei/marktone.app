module Marktone
	# An installer's file downloaded for publishing, renamed to its fixed name, with a SHA-256 checksum file beside it in the form
	# `sha256sum -c` reads.
	class Package
		attr_reader :installer, :path

		# Renames the downloaded file of this version to the installer's fixed name and writes its checksum file.
		def self.prepare!( installer:, version:, folder: )
			path = File.join( folder, installer.published_name )
			File.rename( File.join( folder, installer.source_name( version ) ), path )
			new( installer: installer, path: path ).tap( &:write_checksum! )
		end

		def initialize( installer:, path: )
			@installer = installer
			@path = path
		end

		def sha256 = @sha256 ||= Digest::SHA256.file( path ).hexdigest
		def size = File.size( path )
		def files = [ path, checksum_path ]

		def write_checksum! = File.write( checksum_path, "#{ sha256 }  #{ installer.published_name }\n" )

	private

		def checksum_path = "#{ path }.sha256"
	end
end
