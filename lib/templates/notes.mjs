// What changed in a release, from the small part of Markdown its notes are written in: paragraphs, `-` lists, **bold**, `code` and
// [links](address). Everything else shows as the text it is, escaped, so nothing in the notes becomes markup of its own. A link shows
// only its text unless it leads to an https page off GitHub: the site sends no reader to GitHub, and a link of another kind, such as
// javascript:, could run code.
const SPAN = /`([^`]+)`|\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)\s]+)\)/g
const LIST_ITEM = /^\s*- (.*)$/
const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }

export function notes( markdown ) {
	return markdown.split( /\n\s*\n/ ).filter( ( text ) => text.trim() ).map( block ).join( "" )
}

// A block of lines between blank lines: its runs of list items become lists, and its other lines paragraphs, their lines joined by
// spaces as Markdown joins them. A line indented under a list item carries the item on.
function block( text ) {
	const runs = []
	for( const line of text.trim().split( "\n" ) ) {
		const item = line.match( LIST_ITEM )
		const last = runs.at( -1 )
		if( !item && last?.list && /^\s/.test( line ) ) last.lines.push( `${ last.lines.pop() } ${ line.trim() }` )
		else if( last && last.list === Boolean( item ) ) last.lines.push( item ? item[ 1 ] : line.trim() )
		else runs.push( { list: Boolean( item ), lines: [ item ? item[ 1 ] : line.trim() ] } )
	}
	return runs.map( run ).join( "" )
}

function run( { list, lines } ) {
	if( !list ) return `\t\t\t<p>${ inline( lines.join( " " ) ) }</p>\n`
	return `\t\t\t<ul>\n${ lines.map( ( line ) => `\t\t\t\t<li>${ inline( line ) }</li>\n` ).join( "" ) }\t\t\t</ul>\n`
}

function inline( text ) {
	let html = ""
	let shown = 0
	for( const match of text.matchAll( SPAN ) ) {
		html += escape( text.slice( shown, match.index ) ) + span( match )
		shown = match.index + match[ 0 ].length
	}
	return html + escape( text.slice( shown ) )
}

function span( [ , code, bold, label, address ] ) {
	if( code !== undefined ) return `<code>${ escape( code ) }</code>`
	if( bold !== undefined ) return `<strong>${ inline( bold ) }</strong>`
	return linkable( address ) ? `<a href="${ escape( address ) }">${ inline( label ) }</a>` : inline( label )
}

function linkable( address ) {
	const url = URL.parse( address )
	return url?.protocol === "https:" && url.hostname !== "github.com" && !url.hostname.endsWith( ".github.com" )
}

function escape( text ) {
	return text.replace( /[&<>"']/g, ( character ) => ESCAPES[ character ] )
}
