#!/bin/sh
# Removes the Marktone that install.sh put in place, and only that: the program in ~/.local/bin, its menu entry and its icon. The
# settings and the Help file Marktone writes for itself are kept, and it says where they are; no Markdown file is touched.
#
# Usage: curl -fsSL https://marktone.app/uninstall.sh | sh
# Exit codes: 0 when Marktone is removed, or was not installed; 1 when a file could not be removed.
#
# The whole script is one function, called on the last line, so a download cut short runs nothing.

uninstall_marktone() {
	set -eu
	program="$HOME/.local/bin/marktone"
	entry="$HOME/.local/share/applications/marktone.desktop"
	icon="$HOME/.local/share/icons/hicolor/512x512/apps/marktone.png"
	# Where Marktone keeps its settings and its Help file on Linux, as its settings.rs names them.
	settings="${XDG_CONFIG_HOME:-$HOME/.config}/marktone"
	help="${XDG_DATA_HOME:-$HOME/.local/share}/marktone"

	if [ ! -e "$program" ] && [ ! -e "$entry" ] && [ ! -e "$icon" ]; then
		echo "Marktone is not installed in $HOME/.local, so nothing was removed."
		return
	fi
	rm -f "$program" "$entry" "$icon"
	echo "Removed Marktone: $program, its menu entry and its icon."
	echo "Your settings in $settings and the Help file in $help are kept; delete them by hand if you no longer want them. Your Markdown files are not touched."
}

uninstall_marktone
