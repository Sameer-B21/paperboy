// Serves the static site in site/, and redirects www -> apex so the site has
// one canonical address.
//
// Google's OAuth consent screen lists paperboyhq.com as the authorized domain,
// and reviewers do visit the homepage. A visitor who types "www." and lands on
// a Cloudflare error page is a bad look during a restricted-scope review.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname.startsWith("www.")) {
      url.hostname = url.hostname.slice(4);
      //301: permanent, so browsers and crawlers stop asking
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
