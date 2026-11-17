// marktone.app's ground: on each visit, one dark colour from the WHL Colours Palette's default scheme (hue start 25, chroma 0.12,
// 28 hues, 18 lightness steps), from its row at 11% lightness, on which white text reads clearly: Master chose it on 2026-11-17 from
// the four darkest rows. The colours were computed with the palette's own code. Loaded in the head, before the page is drawn, so no
// other colour flashes first; without scripts the ground stays black.
const marktoneGrounds = [
	"#0f0000", "#0e0100", "#0b0200", "#090200", "#080300", "#060300", "#050400", "#040400", "#020500", "#000600", "#000601", "#000603", "#000504", "#000505", "#000506", "#000508", "#000509", "#00040c", "#000311", "#010217", "#030116", "#060014", "#080012", "#0b000e", "#0c000a", "#0e0006", "#0e0004", "#0f0002"
]
document.documentElement.style.setProperty( "--marktone-ground", marktoneGrounds[ Math.floor( Math.random() * marktoneGrounds.length ) ] )
