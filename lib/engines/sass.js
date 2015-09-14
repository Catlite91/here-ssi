var helper = require("../utils");

try {
  var sass = require("node-sass");
  exports.compile = function(xcssfile) {
    var sasstxt = helper.getUnicode(xcssfile);
    if (sasstxt) {
      var r = sass.renderSync({
        data: sasstxt
      });
	  return r.css.toString('utf8') + "\n";
    }

    return null;
  };
}
catch(e) {
  exports.compile = function(xcssfile) {
    return "/* node-sass isn't installed\n *"+xcssfile+" ERROR!\n */";
  };
}
