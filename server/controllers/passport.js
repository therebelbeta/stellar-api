module.exports = {
  gh_callback: function(req, res) {
    var token = req.user.sessionToken;
    var body = '<html><body>' +
      '<script>' +
      '   window.opener.window.gitAuth = "' + token + '";' +
      '   window.close();' +
      '</script>' +
      '</body></html>';
    res.writeHead(200, {
      'Content-Length': Buffer.byteLength(body),
      'Content-Type': 'text/html'
    });
    res.write(body);
    res.end();
  }
}