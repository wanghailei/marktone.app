// marktone.app's ground: on each visit, one dark colour from the WHL Colours Palette's default scheme (hue start 25, chroma 0.12,
// 28 hues, 18 lightness steps), from its four darkest rows: 5%, 11%, 16% and 21% lightness, on which white text reads clearly. The colours
// were computed with the palette's own code. Loaded in the head, before the page is drawn, so no other colour flashes first; without
// scripts the ground stays black.
const marktoneGrounds = [
	"#030000", "#030000", "#030000", "#030000", "#020000", "#020000", "#010000", "#010100", "#000100", "#000100", "#000100", "#000100", "#000101", "#000101", "#000101", "#000101", "#000102", "#000003", "#000006", "#000006", "#010006", "#010005", "#010004", "#020003", "#020002", "#020001", "#030000", "#030000",
	"#0f0000", "#0e0100", "#0b0200", "#090200", "#080300", "#060300", "#050400", "#040400", "#020500", "#000600", "#000601", "#000603", "#000504", "#000505", "#000506", "#000508", "#000509", "#00040c", "#000311", "#010217", "#030116", "#060014", "#080012", "#0b000e", "#0c000a", "#0e0006", "#0e0004", "#0f0002",
	"#220001", "#1f0300", "#1b0600", "#180900", "#150a00", "#120c00", "#100d00", "#0c0e00", "#081000", "#011200", "#001205", "#00110a", "#00110d", "#001010", "#001012", "#001015", "#000f18", "#000e1c", "#000c24", "#04082a", "#0a0529", "#100427", "#150223", "#19011e", "#1c0019", "#1f0013", "#20000c", "#210006",
	"#360104", "#310800", "#2c0f00", "#271300", "#241500", "#201700", "#1d1900", "#181b00", "#111d00", "#021f00", "#001f0c", "#001f14", "#001e19", "#001e1d", "#001d20", "#001c24", "#001c28", "#001a2e", "#001739", "#0a133e", "#150f3c", "#1d0c39", "#230935", "#28062f", "#2d0428", "#310220", "#330117", "#35000e"
]
document.documentElement.style.setProperty( "--marktone-ground", marktoneGrounds[ Math.floor( Math.random() * marktoneGrounds.length ) ] )
