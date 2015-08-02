define(function (require, exports, module) {

  const $ = require('jquery');
  const { before, after } = require('meld');

  const Plugin = require('extplug/Plugin');

  const rolloverView = require('plug/views/users/userRolloverView');

  const getBlurb = require('./blurb');

  const emoji = $('<span />').addClass('emoji-glow')
    .append($('<span />').addClass('emoji emoji-1f4dd'));

  const RolloverBlurb = Plugin.extend({
    name: 'Rollover Blurb',
    description: 'Show user "Blurb" / bio in rollover popups.',

    style: {
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
    },

    enable() {
      this.showAdvice = after(rolloverView, 'showModal', this.addBlurb);
      this.hideAdvice = before(rolloverView, 'hide', this.removeBlurb);
    },

    disable() {
      this.showAdvice.remove();
      this.hideAdvice.remove();
    },

    // these advice methods are not bound, so their context is the rollover View instance
    addBlurb() {
      this.$('.extplug-blurb-wrap').remove();
      let span = $('<span />').addClass('extplug-blurb');
      let div = $('<div />').addClass('info extplug-blurb-wrap').append(span);
      getBlurb(this.user).then(blurb => {
        if (blurb) {
          // `this` == the RolloverView
          this.$('.actions').before(div);
          span.append(emoji, ` ${blurb}`);
          let height = span[0].offsetHeight + 6;
          div.height(height);
          if (this.$el.hasClass('upwards')) {
            this.$el.css('top', (parseInt(this.$el.css('top'), 10) - height) + 'px');
          }
        }
      });
    },
    removeBlurb() {
      // `this` == the RolloverView
      this.$('.extplug-blurb-wrap').remove();
    }

  });

  module.exports = RolloverBlurb;

});
