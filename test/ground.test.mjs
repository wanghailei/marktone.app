import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// The ground's colours, as ground.js lists them.
const grounds = readFileSync( join( import.meta.dirname, "../ground.js" ), "utf8" ).match( /#[0-9a-f]{6}/g )

// Master's ruling of 2026-11-17: the ground is drawn only from the palette's second row, its 28 hues at 11% lightness.
test( "The ground is drawn only from the palette's row at 11% lightness", () => {
	assert.equal( grounds.length, 28 )
	assert.equal( grounds[ 0 ], "#0f0000" )
	assert.equal( grounds.at( -1 ), "#0f0002" )
	for( const darker of [ "#030000", "#000003" ] ) assert.ok( !grounds.includes( darker ), darker )
	for( const lighter of [ "#220001", "#360104" ] ) assert.ok( !grounds.includes( lighter ), lighter )
} )
