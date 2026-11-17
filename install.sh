#!/bin/sh
# Installs the latest Marktone for Linux on x86-64 in the user's own folders, or updates it: the program in ~/.local/bin, its menu
# entry in ~/.local/share/applications and its icon in ~/.local/share/icons. It needs no sudo and no FUSE, since it installs the
# release's tarball rather than its AppImage. It learns the latest version from marktone.app's feed each time it runs, so a new
# release needs no change here.
#
# Usage: curl -fsSL https://marktone.app/install.sh | sh
# Exit codes: 0 when Marktone is installed; 1 when it is not, with one sentence saying why. A run that fails leaves the folders as
# they were and removes its temporary folder.
#
# The whole script is one function, called on the last line: sh reads a piped script as it arrives, so a download cut short ends
# before that line and runs nothing.

install_marktone() {
	set -eu
	feed="https://marktone.app/download/latest.json"
	programs="$HOME/.local/bin"
	entries="$HOME/.local/share/applications"
	icons="$HOME/.local/share/icons/hicolor/512x512/apps"

	if [ "$( uname -s )" != Linux ] || [ "$( uname -m )" != x86_64 ]; then
		refuse "this installer is for Linux on x86-64, and this machine is $( uname -s ) on $( uname -m ). Download Marktone from https://marktone.app/download/ instead."
	fi
	for tool in curl sha256sum tar; do
		command -v "$tool" > /dev/null 2>&1 || refuse "it needs $tool, which this machine does not have. Install $tool with your system's package manager, then run this again."
	done

	# Everything is downloaded and unpacked in a temporary folder, and each file is copied in beside its place before all three are
	# moved into place, so a failure before the moves leaves an installed Marktone whole. Leaving, however it leaves, removes both.
	temporary=$( mktemp -d )
	trap 'rm -rf "$temporary"; rm -f "$programs/.marktone.new" "$entries/.marktone.desktop.new" "$icons/.marktone.png.new"' EXIT
	trap 'exit 1' HUP INT TERM

	curl -fsSL "$feed" -o "$temporary/latest.json" || refuse "marktone.app could not be reached to learn the latest version. Check the connection, then run this again."
	# The feed is JSON on several lines. Joined into one, each value this needs is a quoted string after its key; the Linux tarball's
	# object holds no braces of its own.
	description=$( tr -d '\n' < "$temporary/latest.json" )
	version=$( value version "$description" )
	tarball=$( printf '%s' "$description" | sed -n 's/.*"linux-x86_64-tar"[[:space:]]*:[[:space:]]*{\([^}]*\)}.*/\1/p' )
	[ -n "$tarball" ] || refuse "marktone.app offers no Linux download at the moment. Try again later."

	curl -fsSL "$( value url "$tarball" )" -o "$temporary/marktone.tar.gz" || refuse "the download from marktone.app failed. Check the connection, then run this again."
	# The checksum is compared before anything in the download is unpacked.
	[ "$( sha256sum < "$temporary/marktone.tar.gz" | cut -d ' ' -f 1 )" = "$( value sha256 "$tarball" )" ] || refuse "the download does not match the checksum marktone.app publishes, so it was not unpacked."
	tar -xzf "$temporary/marktone.tar.gz" -C "$temporary"
	unpacked="$temporary/marktone-$version"
	[ -f "$unpacked/marktone" ] || refuse "the download from marktone.app holds no Marktone $version."

	mkdir -p "$programs" "$entries" "$icons"
	cp "$unpacked/marktone" "$programs/.marktone.new"
	chmod 755 "$programs/.marktone.new"
	cp "$unpacked/marktone.png" "$icons/.marktone.png.new"
	# The menu entry names the program and the icon by where they are installed, so the menu starts Marktone and shows its icon even
	# when ~/.local/bin is not on the PATH.
	sed -e "s|^Exec=.*|Exec=\"$programs/marktone\" %f|" -e "s|^Icon=.*|Icon=$icons/marktone.png|" "$unpacked/marktone.desktop" > "$entries/.marktone.desktop.new"
	# A move within a folder replaces the file at once: a Marktone that is running keeps the program it started from.
	mv -f "$programs/.marktone.new" "$programs/marktone"
	mv -f "$icons/.marktone.png.new" "$icons/marktone.png"
	mv -f "$entries/.marktone.desktop.new" "$entries/marktone.desktop"

	echo "Installed Marktone $version in $programs/marktone, with its menu entry and icon."
	case ":$PATH:" in
		*":$programs:"*) ;;
		*) printf '%s\n  %s\n' "~/.local/bin is not on your PATH, so a terminal will not find marktone. Add this line to ~/.profile, then log in again:" 'export PATH="$HOME/.local/bin:$PATH"' ;;
	esac
}

# Says why Marktone was not installed, and stops.
refuse() {
	echo "Marktone was not installed: $1" >&2
	exit 1
}

# The string a key holds in a piece of the feed: `value url "$tarball"`.
value() {
	printf '%s' "$2" | sed -n "s/.*\"$1\"[[:space:]]*:[[:space:]]*\"\([^\"]*\)\".*/\1/p"
}

install_marktone
