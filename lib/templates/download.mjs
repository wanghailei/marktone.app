// The download page's main part: the name and the download section.
export function download( { downloads } ) {
	return `		<header>
			<h1><a href="/">Marktone</a></h1>
			<p>A desktop Markdown editor for macOS and Linux that shows your document rendered as you write it, and saves it as plain Markdown.</p>
		</header>

${ downloads }`
}
