export default function getBlurb(user) {
  if (user.has('blurb')) {
    return Promise.resolve(user.get('blurb'));
  }

  return fetch(`/_/profile/${user.get('id')}/blurb`, { credentials: 'same-origin' })
    .then(res => res.json())
    .then((body) => {
      const { blurb } = body.data[0];
      user.set('blurb', blurb);
      return blurb;
    });
}
