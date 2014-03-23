# Changes to the default theme + layout

Several changes have been applied to the default theme and layout taken from the Flask website.

The following files have been added:

+ _templates/sidetoc.html ../../AutobahnPython/doc/_templates/
+ _templates/stay_informed.html ../../AutobahnPython/doc/_templates/
+ _themes/kr/static/autobahn.css ../../AutobahnPython/doc/_themes/kr/static
+ _themes/kr/previous_next.html ../../AutobahnPython/doc/_themes/kr/

The following files have been modified:

* _themes/kr/static/flasky.css_t ../../AutobahnPython/doc/_themes/kr/static
* _themes/kr/layout.html ../../AutobahnPython/doc/_themes/kr/
* _templates/side-secondary.html
* conf.py

## Keeping changes in sync

'make copycustom' has bee added, which copies all of the above to the other Autobahn repositories, except for

* _templates/side-secondary.html
* conf.py

which contain content specific to their respective repos.

** Any future changes to the layout should be made in Autobahn|JS and then synced from here. **
