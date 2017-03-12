import $ from 'jquery';
import { before, after } from 'meld';
import * as emoji from 'plug/util/emoji';
import Plugin from 'extplug/Plugin';
import rolloverView from 'plug/views/users/userRolloverView';

import getBlurb from './blurb';
import style from './style.css';

const opening = Symbol('currently loading blurb');

const RolloverBlurb = Plugin.extend({
  name: 'Rollover Blurb',
  description: 'Show user "Blurb" / bio in rollover popups.',

  style,

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
    // we're already loading the blurb for this user, don't load it again
    if (this[opening] === this.user) {
      return;
    }
    this.$('.extplug-blurb-wrap').remove();
    const span = $('<span />').addClass('extplug-blurb');
    const div = $('<div />').addClass('info extplug-blurb-wrap').append(span);
    this[opening] = this.user;
    getBlurb(this.user).then(blurb => {
      // ensure that the same rollover is still open
      if (blurb && this[opening] === this.user) {
        this[opening] = null;
        // `this` == the RolloverView
        this.$('.actions').before(div);
        span.append(
          emoji.replace_colons(':pencil:'),
          ` ${blurb}`
        );
        const height = span[0].offsetHeight + 6;
        div.height(height);
        this.$el.css('top', (parseInt(this.$el.css('top'), 10) - height) + 'px');

        // Move the arrow down if this rollover opened downwards, so it still
        // aligns with whatever it was pointing to.
        if (this.$el.hasClass('chat') && !this.$el.hasClass('upwards')) {
          this.$el.find('.arrow-down').css('margin-top', `${height}px`);
        } else {
          this.$el.find('.arrow-down').css('margin-top', 0);
        }
      }
    });
  },
  removeBlurb() {
    // `this` == the RolloverView
    this.$('.extplug-blurb-wrap').remove();
  }
});

export default RolloverBlurb;
