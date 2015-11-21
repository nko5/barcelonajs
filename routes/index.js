'use strict';

var express = require('express');
var repository = require('../lib/repository');
var search = require('../lib/search');

var router = express.Router();

/* GET fech all repos for the logged user */
router.get('/home', function(req, res) {
  console.log('ebtra');
  repository.getUserRepos(req.user.accessToken)
    .then(function(resolved) {
      var context = {};
      context.repos = resolved;
      res.render('home', context);
    }, function(rejected) {
      context.error = rejected;
      res.render('home', context);
    });
});

/* GET checks the information for a repo */
router.get('/check/:name/:repo', function(req, res) {
  var context = {};
  var repoName = req.params.repo;
  var user = req.params.name;
  context.user = req.user;

  repository.getRepo(user, repoName, req.user.accessToken)
    .then(function(repo) {
      context.repo = repo;
      repository.checkRepo(repo, req.user.accessToken)
        .then(function(result) {
          context.hasIssues = false;
          if (result.hasIssues) {
            context.hasIssues = true;
          }
          context.hasContribuingMd = false;
          if (result.hasContribuingMd) {
            context.hasContribuingMd = true;
          }
          context.hasPackageJson = false;
          if (result.hasPackageJson) {
            context.hasPackageJson = true;
          }
          req.session.currentRepo = repoName;
          if (result.hasPackageJson && result.hasIssues && result.hasContribuingMd) {
            res.redirect('/match/' + repoName);
          } else {
            res.render('summary', context);
          }
        });
    });
});

router.post('/match/make', function(req, res) {
  if (req.session.currentRepo) {
    var repo = req.session.currentRepo;
    var user = req.user.profile.username;
    var developer = req.body.developer;

    repository.matchMade(user, repo, developer, req.user.accessToken)
      .then(function(resolved) {
        res.status(200).send();
      });
  }
});

router.post('/fix/contributingmd', function(req, res) {
  if (req.session.currentRepo) {
    var repo = req.session.currentRepo;
    var user = req.user.profile.username;

    repository.createContributingmd(user, repo, req.user.accessToken)
      .then(function(resolved) {
        res.status(200).send();
      }, function(rejected) {
        res.status(500).send();
      });
  } else {
    res.status(500).send();
  }
});

/* GET repo is valid so match process starts */
router.get('/match/:repo', function(req, res) {
  var context = {};
  var username = req.user.profile.username;
  var reponame = req.params.repo;
  req.session.currentRepo = reponame;
  context.user = req.user;

  //context.match = req.user
  //res.render("match", context);

  search.searchAndSaveDevs(username, 'Girona', req.user.accessToken)
    .then(function(matchusers) {
      context.match = req.user
      console.log(matchusers);
      res.render("match", context);
    })
    .catch((error) => {
      //next(error);
      context.match = req.user
      res.render("match", context);
    });
});

module.exports = router;
