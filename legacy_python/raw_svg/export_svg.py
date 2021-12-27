from typing import List, Dict

from .path import Paths

def create_svg(paths: Paths, width: int, height: int) -> str:
    header = '<?xml version="1.0" encoding="UTF-8"?>\n'
    header += '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" \
        width="%dpt" height="%dpt" viewBox="0 0 %d %d" version="1.1">\n' % (width, height, width, height)

    body = ''
    for id_str, path in paths.entries.items():
        body += path.svg_str(id_str) + '\n'

    footer = '</svg>'

    return header + body + footer