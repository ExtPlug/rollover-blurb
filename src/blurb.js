import $ from 'jquery';
import UserFindAction from 'plug/actions/users/UserFindAction';
import util from 'plug/util/util';
import request from 'extplug/util/request';

/**
 * Finds the blurb for a user.
 * It's more complex than it should be, because plug.dj doesn't
 * really return the blurb in any useful way anywhere. So our only
 * option is to extract it from a user's profile page.
 */
function getBlurb(user) {
  return $.Deferred(d => {
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
      new UserFindAction(user.get('id'))
        .on('success', data => {
          user.set(data);
          // this is kind of useless, because plug.dj doesn't
          // send the blurb in the user meta info, but maybe someday
          // they will!
          if (user.has('blurb')) {
            d.resolve(user.get('blurb'));
          }
          else if (user.has('slug')) {
            fromPage(user).then(d.resolve, d.reject);
          }
          else {
            d.reject(new Error('Could not find this user\'s profile URL'));
          }
        })
        .on('error', d.reject);
    }
  });
}
// regex that sort-of, kind-of matches the blurb div contents (hopefully)
const blurbRe = /"blurb">\s*<div class="arrow-up"><\/div>\s*<div class="box">(.*?)<\/div>/;
function fromPage(user) {
  return request(`https://plug.dj/@/${encodeURIComponent(user.get('slug'))}`)
    .then(body => body.match(blurbRe)[1])
    // cache the blurb (.set().get(), <3)
    .then(blurb => user.set('blurb', util.cleanTypedString(blurb)).get('blurb'));
}

export default getBlurb;
