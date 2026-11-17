require_relative "test_helper"

class ReleaseTest < Minitest::Test
	NOTES = <<~MARKDOWN
		Marktone 0.41.1 for Linux on x86-64, built from `main` at 8d65f6b on 2026-11-17.

		**New since 0.40.1**
		- **A file opened from a blank window opens in that window.**
		- **Body text is 400 Regular by default.**

		Not yet seen in a real window on a Mac: Read mode.
	MARKDOWN

	def test_when_the_release_has_every_installer_it_is_complete
		assert private_release.complete?
	end

	def test_when_the_mac_disk_image_is_not_yet_attached_the_release_is_not_complete
		refute private_release( without: [ "Marktone_0.41.1_aarch64.dmg" ] ).complete?
	end

	def test_when_the_notes_list_what_is_new_the_public_notes_carry_that_list_and_the_download_page
		notes = private_release( body: NOTES ).public_notes

		assert_equal "**New since 0.40.1**\n- **A file opened from a blank window opens in that window.**\n- **Body text is 400 Regular by default.**\n\nDownload and install: https://marktone.app/download/\n", notes
	end

	def test_when_the_notes_list_nothing_new_the_public_notes_carry_only_the_download_page
		assert_equal "Download and install: https://marktone.app/download/\n", private_release( body: "Built on Arch Linux." ).public_notes
	end
end
