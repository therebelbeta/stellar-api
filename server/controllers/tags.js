module.exports = {
  getAllTags: function(req, res, next) {
    Repo.find({
        id: req.user.github
      },
      function(err, data) {
        if (err) {
          res.json(err);
        }
        else {
          data = data[0];
          console.log(' ');
          var response = data.tags;
          res.json(response);
        }
      }
    );
  },
  getTag: function(req, res, next) {

  },
  saveTag: function(req, res, next) {
    var tag = req.body.tag;
    Repo.find({
      id: req.user.github
    }, function(err, data) {
      if (err) {
        res.json(err);
      }
      var findTag = _.find(data.tags, {
        id: tag.id
      });
      var tagExists = !_.isUndefined(findTag);
      if (tagExists) {
        var i = _.findIndex(data.tags, {
          id: tag.id
        });
        data.tags[i] = tag;
      }
      else {
        data.tags.push(tag);
      }
      data.save(function(err) {
        if (err) return res.json({
          'error': err
        });
        res.json('success');
      });
    });
  },
  deleteTag: function(req, res, next) {

  }
}