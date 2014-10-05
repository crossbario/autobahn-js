import os
import re
import shutil

for r, d, files in os.walk("../../crossbar/crossbar/crossbar/crossbar/templates/"):
   for f in files:
      if f == "autobahn.min.js":
         fn = os.path.normpath(os.path.join(r, f))
         shutil.copyfile("build/autobahn.min.js", fn)
