# docs/conf.py
# autobahn-js documentation configuration
import os
import sys
import json
from datetime import datetime

# -- Path setup --------------------------------------------------------------
sys.path.insert(0, os.path.abspath("./_extensions"))
sys.path.insert(0, os.path.abspath("."))

# Add .cicd/scripts to path for shared Sphinx extensions
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.cicd', 'scripts')))

# -- Project information -----------------------------------------------------
project = "autobahn"
author = "The WAMP/Autobahn/Crossbar.io OSS Project"
copyright = f"2014-{datetime.now():%Y}, typedef int GmbH (Germany)"

# Get version from package.json
base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))
with open(os.path.join(base_dir, "packages", "autobahn", "package.json")) as f:
    pkg = json.load(f)
    version = release = pkg["version"]

# -- General configuration ---------------------------------------------------
extensions = [
    # MyST Markdown support
    "myst_parser",

    # Core Sphinx extensions
    "sphinx.ext.intersphinx",
    "sphinx.ext.autosectionlabel",
    "sphinx.ext.todo",
    "sphinx.ext.viewcode",

    # Modern UX extensions
    "sphinx_design",
    "sphinx_copybutton",
    "sphinxext.opengraph",

    # JavaScript API documentation
    "sphinx_js",

    # Shared WAMP ecosystem extensions (from .cicd submodule)
    "sphinx_auto_section_anchors",
]

# Source file suffixes (both RST and MyST Markdown)
source_suffix = {
    ".rst": "restructuredtext",
    ".md": "markdown",
}

# The master toctree document
master_doc = "index"

# Language
language = "en"

# Exclude patterns
exclude_patterns = ["_build", "README.md"]

# -- MyST Configuration ------------------------------------------------------
myst_enable_extensions = [
    "colon_fence",
    "deflist",
    "tasklist",
    "attrs_block",
    "attrs_inline",
    "smartquotes",
    "linkify",
]
myst_heading_anchors = 3

# -- sphinx-js Configuration -------------------------------------------------
# Path to JavaScript source (relative to conf.py)
js_source_path = "../packages/autobahn/lib"

# Use jsdoc for parsing JavaScript
js_language = "javascript"

# -- Intersphinx Configuration -----------------------------------------------
intersphinx_mapping = {
    "python": ("https://docs.python.org/3", None),
    "autobahnpython": ("https://autobahn.readthedocs.io/en/latest/", None),
}
intersphinx_cache_limit = 5

# -- HTML Output (Furo Theme) ------------------------------------------------
html_theme = "furo"
html_title = f"{project}|js {release}"

# Furo theme options with Noto fonts and Autobahn subarea colors
html_theme_options = {
    # Source repository links
    "source_repository": "https://github.com/crossbario/autobahn-js/",
    "source_branch": "master",
    "source_directory": "docs/",

    # Noto fonts and Autobahn Medium Blue (#027eae) accent color
    "light_css_variables": {
        "font-stack": "'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "font-stack--monospace": "'Noto Sans Mono', SFMono-Regular, Menlo, Consolas, monospace",
        "color-brand-primary": "#027eae",
        "color-brand-content": "#027eae",
    },
    "dark_css_variables": {
        "font-stack": "'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        "font-stack--monospace": "'Noto Sans Mono', SFMono-Regular, Menlo, Consolas, monospace",
        "color-brand-primary": "#027eae",
        "color-brand-content": "#027eae",
    },
}

# Logo and favicon
html_logo = "_static/img/autobahn_logo_blue.svg"
html_favicon = "_static/favicon.ico"

# Static files
html_static_path = ["_static"]
html_css_files = [
    # Load Noto fonts from Google Fonts
    "https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600;700&family=Noto+Sans+Mono:wght@400;500&display=swap",
]

# -- OpenGraph (Social Media Meta Tags) -------------------------------------
ogp_site_url = "https://crossbario.github.io/autobahn-js/"

# -- Auto Section Anchors Configuration --------------------------------------
auto_section_anchor_force = True

# -- Miscellaneous -----------------------------------------------------------
todo_include_todos = True
autosectionlabel_prefix_document = True
pygments_style = "sphinx"
pygments_dark_style = "monokai"

# RST Substitutions
rst_epilog = r"""
.. |ab| replace:: Autobahn
.. |Ab| replace:: **Autobahn**
.. |abL| replace:: Autobahn\|JS
.. |AbL| replace:: **Autobahn**\|JS
.. _Autobahn: http://crossbar.io/autobahn#js
.. _AutobahnJS: http://crossbar.io/autobahn#js
.. _AutobahnPython: http://crossbar.io/autobahn#python
.. _WebSocket: http://tools.ietf.org/html/rfc6455
.. _RFC6455: http://tools.ietf.org/html/rfc6455
.. _WAMP: http://wamp-proto.org/
.. _Crossbar: http://crossbar.io/
"""
