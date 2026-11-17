import { test } from "node:test"
import assert from "node:assert/strict"
import { privateRelease } from "./helper.mjs"

const NOTES = `Marktone 0.41.1 for Linux on x86-64, built from \`main\` at 8d65f6b on 2026-11-17.

**New since 0.40.1**
- **A file opened from a blank window opens in that window.**
- **Body text is 400 Regular by default.**

Not yet seen in a real window on a Mac: Read mode.
`

test( "When the release has every installer, it is complete", () => {
	assert.equal( privateRelease().complete, true )
} )

test( "When the Mac disk image is not yet attached, the release is not complete", () => {
	assert.equal( privateRelease( { without: [ "Marktone_0.41.1_aarch64.dmg" ] } ).complete, false )
} )

test( "When the notes list what is new, the public notes carry that list and the download page", () => {
	assert.equal( privateRelease( { body: NOTES } ).publicNotes, "**New since 0.40.1**\n- **A file opened from a blank window opens in that window.**\n- **Body text is 400 Regular by default.**\n\nDownload and install: https://marktone.app/download/\n" )
} )

test( "When the notes list nothing new, the public notes carry only the download page", () => {
	assert.equal( privateRelease( { body: "Built on Arch Linux." } ).publicNotes, "Download and install: https://marktone.app/download/\n" )
} )
