

define('extplug/rollover-blurb/blurb',['require','exports','module','jquery','plug/actions/users/UserFindAction','plug/util/util','extplug/util/request'],function (require, exports, module) {

  var $ = require('jquery');
  var UserFindAction = require('plug/actions/users/UserFindAction');
  var util = require('plug/util/util');
  var request = require('extplug/util/request');

  /**
   * Finds the blurb for a user.
   * It's more complex than it should be, because plug.dj doesn't
   * really return the blurb in any useful way anywhere. So our only
   * option is to extract it from a user's profile page.
   */
  function getBlurb(user) {
    return $.Deferred(function (d) {
      // user has a blurb property: use that
      if (user.has('blurb')) {
        return d.resolve(user.get('blurb'));
      }
      // else, we need to fetch their profile page
      // ...which is impossible if they are below level 5
      else if (user.get('level') < 5) {
        return d.reject(new Error('User does not have a profile page'));
      }
      // user already has a "slug" property, so fetch the profile page
      else if (user.has('slug')) {
        return fromPage(user).then(d.resolve, d.reject);
      }
      // user doesn't have a "slug" property
      else {
        new UserFindAction(user.get('id')).on('success', function (data) {
          user.set(data);
          // this is kind of useless, because plug.dj doesn't
          // send the blurb in the user meta info, but maybe someday
          // they will!
          if (user.has('blurb')) {
            d.resolve(user.get('blurb'));
          } else if (user.has('slug')) {
            fromPage(user).then(d.resolve, d.reject);
          } else {
            d.reject(new Error('Could not find this user\'s profile URL'));
          }
        }).on('error', d.reject);
      }
    });
  }
  // regex that sort-of, kind-of matches the blurb div contents (hopefully)
  var blurbRe = /"blurb">\s*<div class="arrow-up"><\/div>\s*<div class="box">(.*?)<\/div>/;
  function fromPage(user) {
    return request('https://plug.dj/@/' + encodeURIComponent(user.get('slug'))).then(function (body) {
      return body.match(blurbRe)[1];
    })
    // cache the blurb (.set().get(), <3)
    .then(function (blurb) {
      return user.set('blurb', util.cleanTypedString(blurb)).get('blurb');
    });
  }

  module.exports = getBlurb;
});


define('extplug/rollover-blurb/main',['require','exports','module','jquery','meld','extplug/Plugin','plug/views/users/userRolloverView','./blurb'],function (require, exports, module) {

  var $ = require('jquery');
  var meld = require('meld');

  var Plugin = require('extplug/Plugin');

  var rolloverView = require('plug/views/users/userRolloverView');

  var getBlurb = require('./blurb');

  var emoji = $('<span />').addClass('emoji-glow').append($('<span />').addClass('emoji emoji-1f4dd'));

  var RolloverBlurb = Plugin.extend({
    name: 'Rollover Blurb',
    description: 'Show user "Blurb" / bio in rollover popups.',

    enable: function enable() {
      this._super();
      this.Style({
        '.extplug-blurb': {
          'padding': '10px',
          'position': 'absolute',
          'top': '3px',
          'background': '#282c35',
          'width': '100%',
          'box-sizing': 'border-box',
          'display': 'none'
        },
        '.expand .extplug-blurb': {
          'display': 'block'
        }
      });

      this.showAdvice = meld.after(rolloverView, 'showModal', this.addBlurb);
      this.hideAdvice = meld.before(rolloverView, 'hide', this.removeBlurb);
    },

    disable: function disable() {
      this._super();
      this.showAdvice.remove();
      this.hideAdvice.remove();
    },

    // these advice methods are not bound, so their context is the rollover View instance
    addBlurb: function addBlurb() {
      var _this = this;

      this.$('.extplug-blurb-wrap').remove();
      var span = $('<span />').addClass('extplug-blurb');
      var div = $('<div />').addClass('info extplug-blurb-wrap').append(span);
      getBlurb(this.user).then(function (blurb) {
        if (blurb) {
          // `this` == the RolloverView
          _this.$('.actions').before(div);
          span.append(emoji, ' ' + blurb);
          div.height(span[0].offsetHeight + 6);
          _this.$el.css('top', parseInt(_this.$el.css('top'), 10) - div.height() + 'px');
        }
      });
    },
    removeBlurb: function removeBlurb() {
      // `this` == the RolloverView
      this.$('.extplug-blurb-wrap').remove();
    }

  });

  module.exports = RolloverBlurb;
});
