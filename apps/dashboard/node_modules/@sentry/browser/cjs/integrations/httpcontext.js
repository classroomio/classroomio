Object.defineProperty(exports, '__esModule', { value: true });

const core = require('@sentry/core');
const helpers = require('../helpers.js');

/** HttpContext integration collects information about HTTP request headers */
class HttpContext  {constructor() { HttpContext.prototype.__init.call(this); }
  /**
   * @inheritDoc
   */
   static __initStatic() {this.id = 'HttpContext';}

  /**
   * @inheritDoc
   */
   __init() {this.name = HttpContext.id;}

  /**
   * @inheritDoc
   */
   setupOnce() {
    core.addGlobalEventProcessor((event) => {
      if (core.getCurrentHub().getIntegration(HttpContext)) {
        // if none of the information we want exists, don't bother
        if (!helpers.WINDOW.navigator && !helpers.WINDOW.location && !helpers.WINDOW.document) {
          return event;
        }

        // grab as much info as exists and add it to the event
        const url = (event.request && event.request.url) || (helpers.WINDOW.location && helpers.WINDOW.location.href);
        const { referrer } = helpers.WINDOW.document || {};
        const { userAgent } = helpers.WINDOW.navigator || {};

        const headers = {
          ...(event.request && event.request.headers),
          ...(referrer && { Referer: referrer }),
          ...(userAgent && { 'User-Agent': userAgent }),
        };
        const request = { ...event.request, ...(url && { url }), headers };

        return { ...event, request };
      }
      return event;
    });
  }
} HttpContext.__initStatic();

exports.HttpContext = HttpContext;
//# sourceMappingURL=httpcontext.js.map
