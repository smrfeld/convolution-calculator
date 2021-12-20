from typing import List, Dict

from .path import Paths

def create_svg(paths: Paths, width: int, height: int) -> str:
    header = '<?xml version="1.0" encoding="UTF-8"?>\n'
    header += '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" \
        width="%dpt" height="%dpt" viewBox="0 0 %d %d" version="1.1">\n' % (width, height, width, height)

    body = ''
    for id_str, paths_list in paths.entries.items():
        # body += '<g id="%s">\n' % id_str
        for path in paths_list:
            body += path.svg_str(id_str) + '\n'
        # body += '</g>\n'

    footer = '</svg>'

    return header + body + footer