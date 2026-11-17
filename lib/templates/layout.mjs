// The page around every page's main part: the head that loads the font, the stylesheet and the ground, and the copyright at the foot.
export function layout( { title, content, year } ) {
	return `<!doctype html>
<!-- Written by bin/sync from lib/templates; change the templates, not this file. -->
<!-- Behaviour (by eye): white Berkeley Mono text on a dark ground drawn at random from the WHL Colours Palette, the copyright at the foot. -->
<html lang="en-GB">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
	<title>${ title }</title>
	<meta name="description" content="Marktone, a desktop Markdown editor for macOS and Linux that shows your document rendered as you write it, and saves it as plain Markdown.">
	<link rel="preload" href="/fonts/BerkeleyMonoVariable.woff2" as="font" type="font/woff2" crossorigin>
	<link rel="stylesheet" href="/style.css">
	<script src="/ground.js"></script>
</head>
<body>
	<main>
${ content }	</main>
	<footer>© ${ year } <a href="https://whl.ltd">Wanted Hacker Limited</a> / WANG Hailei</footer>
</body>
</html>
`
}
