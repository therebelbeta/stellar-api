module.exports = {
  gh_callback: function(req, res) {
    var token = req.user.sessionToken;
    res.json({
      token: token
    });
  }
}