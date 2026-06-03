export default {
  fetch(request) {
    const url = new URL(request.url);
    url.hostname = 'winstools.com';
    return Response.redirect(url.toString(), 301);
  },
};
