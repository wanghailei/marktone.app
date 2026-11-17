// The home page's main part: the README's account of Marktone, with the download section near the top.
export function home( { downloads } ) {
	return `		<header>
			<h1>Marktone</h1>
			<p>A desktop Markdown editor for macOS and Linux that shows your document rendered as you write it, and saves it as plain Markdown.</p>
		</header>

${ downloads }
		<section>
			<h2>The Problem</h2>
			<p>Plain Markdown is easy to keep and hard to read: every heading, emphasis and table is wrapped in <code>#</code>, <code>**</code> and <code>|</code>. A separate preview pane means reading in one place and writing in another.</p>
		</section>

		<section>
			<h2>What Marktone Does</h2>
			<p><strong>Shows the document, not the markup.</strong> Headings, emphasis, lists, quotes, tables, code, links, pictures, task lists and footnotes are drawn as they read. The block under the caret shows its Markdown, so you always edit the real text.</p>
			<p><strong>Saves as you go, and changes only what you edited.</strong> Every change is saved to the file without asking. Files with Windows line endings are saved with Unix line endings. If another program changes the file you are editing, Marktone tells you.</p>
			<p><strong>Reads comfortably, day and night.</strong> A day theme and a night theme follow your system's light or dark setting. Settings sets the font (Berkeley Mono Variable when installed), its size and weight, the line height and the width of the text column.</p>
			<p><strong>Works across a folder.</strong> Open Folder lists a folder's Markdown files in a sidebar, and the outline lists the document's headings, taking you to one with a click. Find and Replace work across the document, Chinese included.</p>
			<p><strong>Helps you write.</strong> Brackets, quotes and <code>**</code> close as you type, copying gives Markdown, and a task's checkbox ticks with a click. A pasted picture is saved in a <code>&lt;document name&gt;.assets</code> folder beside the document and linked.</p>
			<p><strong>Exports to HTML and PDF.</strong> Export as HTML writes an HTML file. Export as PDF prints A4 pages through an installed Chrome, Chromium, Edge or Brave.</p>
			<p>Marktone has no plugins, maths, diagrams, custom CSS or account.</p>
		</section>

		<section>
			<h2>When to Use Marktone</h2>
			<p><strong>Keeping notes, drafts or a book in Markdown files,</strong> and wanting to read them rendered while you write.</p>
			<p><strong>Editing READMEs and documentation</strong> that must stay plain Markdown in the repository.</p>
			<p><strong>Writing in Chinese and English,</strong> with the system's input methods.</p>
		</section>
`
}
