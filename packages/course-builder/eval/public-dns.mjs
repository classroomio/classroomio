/**
 * Eval-only: resolves host names through public DNS servers instead of this machine's resolver, so a flaky local
 * network (a phone hotspot) cannot pass for a site being unreachable. Import it before the package. Production keeps
 * the system resolver.
 */
import dns from 'node:dns';
import { syncBuiltinESMExports } from 'node:module';

const resolver = new dns.Resolver({ timeout: 3_000, tries: 2 });
resolver.setServers(['1.1.1.1', '8.8.8.8']);
const systemLookup = dns.lookup;

function publicLookup(hostname, options, callback) {
  const done = typeof options === 'function' ? options : callback;
  const settings = typeof options === 'function' ? {} : typeof options === 'number' ? { family: options } : options;
  const finish = (addresses) => {
    if (!addresses.length) return systemLookup(hostname, options, callback);
    if (settings.all) return done(null, addresses);

    return done(null, addresses[0].address, addresses[0].family);
  };

  resolver.resolve4(hostname, (error4, v4 = []) => {
    if (settings.family === 4) return finish(error4 ? [] : v4.map((address) => ({ address, family: 4 })));

    resolver.resolve6(hostname, (error6, v6 = []) => {
      const addresses = [
        ...(error4 ? [] : v4.map((address) => ({ address, family: 4 }))),
        ...(error6 || settings.family === 4 ? [] : v6.map((address) => ({ address, family: 6 })))
      ].filter((entry) => !settings.family || entry.family === settings.family);
      finish(addresses);
    });
  });
}

dns.lookup = publicLookup;
syncBuiltinESMExports();
