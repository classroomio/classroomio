/*
 * pricing.js — the pricing card, opened whenever the user clicks any premium item.
 *
 * One component for every entry point (a premium theme, the Public API, SSO, learning paths,
 * branding removal). It shows the five plans from proto.js, says which plan an item starts at,
 * and always has a way out that does not need a plan. Upgrading is simulated.
 *
 * window.pricing.open({ state, item, themeId, commit, onUpgrade, onFree, onPreview })
 */
(function () {
  const P = window.proto;
  const esc = P.escapeHtml;

  let host = null;

  function close() {
    host?.remove();
    host = null;
    document.removeEventListener('keydown', onKey, true);
  }

  function onKey(event) {
    if (event.key !== 'Escape') return;

    event.stopImmediatePropagation();
    close();
  }

  function itemContext(item, themeId) {
    const rule = P.PREMIUM_ITEMS[item];
    const minimum = P.planById(rule.min);

    if (item === 'theme') {
      const theme = P.themeById(themeId);

      return {
        lead: `<div class="pr-thumb"><img src="${theme.preview}" alt="" onerror="this.remove()" /></div>`,
        title: `${esc(theme.title)} is a premium theme`,
        body: `${esc(theme.description)}. Every theme except Quartz is included from ${esc(minimum.name)} up.`,
        short: `${esc(theme.title)} and all premium themes`
      };
    }

    if (item === 'general') {
      return {
        lead: `<div class="pr-ic">${P.icon('zap', 22)}</div>`,
        title: 'Choose the plan that fits',
        body: 'More learners and admins, custom branding, certificates, learning paths and automation. You can carry on with Free.',
        short: 'everything above Free'
      };
    }

    return {
      lead: `<div class="pr-ic">${P.icon(item === 'sso' ? 'lock' : item === 'paths' ? 'route' : item === 'branding' ? 'sparkle' : 'zap', 22)}</div>`,
      title: `${esc(rule.label)} is included from ${esc(minimum.name)}`,
      body: `Available on ${esc(minimum.name)}${minimum.id === 'ENTERPRISE' ? '' : ' and every plan above it'}. You can carry on without it.`,
      short: esc(rule.label)
    };
  }

  function open({ state, item, themeId, commit, onUpgrade, onFree, onPreview }) {
    close();

    const rule = P.PREMIUM_ITEMS[item];
    const context = itemContext(item, themeId);
    let billing = state.billing === 'monthly' ? 'monthly' : 'annual';

    host = document.createElement('div');
    host.id = 'pricing-host';
    host.innerHTML = `
      <div class="scrim pr-scrim" id="pr-scrim">
        <div class="modal modal-xl" role="dialog" aria-modal="true" aria-label="Pricing">
          <div class="pr-head">
            ${context.lead}
            <div style="flex:1;min-width:0">
              <span class="badge badge-primary-soft">${P.icon('lock', 11)} Premium</span>
              <h3>${context.title}</h3>
              <p>${context.body}</p>
            </div>
            <button class="icon-btn" id="pr-close" aria-label="Close" style="flex:none">${P.icon('x', 15)}</button>
          </div>
          <div class="pr-bar">
            <div class="seg2" id="pr-billing" role="group" aria-label="Billing">
              <button type="button" data-bill="annual">Annual · about 20% less</button>
              <button type="button" data-bill="monthly">Monthly</button>
            </div>
            ${item === 'theme' ? `<button class="btn btn-ghost btn-sm" id="pr-preview">${P.icon('eye', 13)} Preview ${esc(P.themeById(themeId).title)} first</button>` : ''}
          </div>
          <div class="pr-plans" id="pr-plans"></div>
          <p class="hint" style="margin:14px 0 0">Prices are per month. Upgrading here is simulated: no checkout runs and no payment details are collected. You can finish onboarding on Free.</p>
        </div>
      </div>`;
    document.body.appendChild(host);

    const paint = () => {
      host
        .querySelectorAll('#pr-billing button')
        .forEach((button) => button.classList.toggle('on', button.dataset.bill === billing));

      host.querySelector('#pr-plans').innerHTML = P.PLANS.map((plan) => {
        const included = P.hasPlan(plan.id, rule.min);
        const price = plan[billing];
        const custom = price === 'Custom';
        const current = state.plan === plan.id;

        let cta;
        if (plan.id === 'FREE') {
          cta = `<button class="btn btn-outline" style="width:100%" data-pr="free">${current ? 'Continue on Free' : 'Stay on Free'}</button>`;
        } else if (!included) {
          cta = `<button class="btn btn-outline" style="width:100%" disabled>Doesn't include this</button>`;
        } else if (plan.id === 'ENTERPRISE') {
          cta = `<button class="btn btn-outline" style="width:100%" data-pr="contact">Contact us</button>`;
        } else {
          cta = `<button class="btn ${plan.popular ? 'btn-primary' : 'btn-outline'}" style="width:100%" data-pr="upgrade" data-plan="${plan.id}">Upgrade to ${esc(plan.name)}</button>`;
        }

        return `
          <div class="pr-plan${plan.popular ? ' featured' : ''}${included && plan.id !== 'FREE' ? ' unlocks' : ''}">
            ${plan.popular ? '<span class="pr-pop badge badge-default">Most popular · the main plan</span>' : ''}
            <div class="pr-name">${esc(plan.name)}</div>
            <div class="pr-price${custom ? ' custom' : ''}">${custom ? 'Custom' : `$${esc(price)}`}${custom ? '' : '<span class="per">/mo</span>'}</div>
            <div class="pr-sub">${custom ? 'Talk to the team' : plan.id === 'FREE' ? 'Free forever' : billing === 'annual' ? 'billed annually' : 'billed monthly'}</div>
            <div class="pr-stats">
              <div><span>Admin seats</span><b>${esc(plan.seats)}</b></div>
              <div><span>Learners</span><b>${esc(plan.learners)}</b></div>
              <div><span>AI token quota</span><b>${esc(plan.tokens)}</b></div>
            </div>
            ${included && plan.id !== 'FREE' ? `<div class="pr-unlock">${P.icon('check', 12)} Includes ${context.short}</div>` : ''}
            <ul>${plan.features.map((line) => `<li>${P.icon('check', 12)}<span>${esc(line)}</span></li>`).join('')}</ul>
            ${cta}
          </div>`;
      }).join('');

      host.querySelector('[data-pr="free"]')?.addEventListener('click', () => {
        close();
        onFree?.();
      });
      host
        .querySelector('[data-pr="contact"]')
        ?.addEventListener('click', () =>
          P.toast('Enterprise is custom-priced. The real button books a call with the team.')
        );
      host.querySelectorAll('[data-pr="upgrade"]').forEach((button) =>
        button.addEventListener('click', () => {
          const planId = button.dataset.plan;

          state.plan = planId;
          state.billing = billing;
          commit();
          close();
          P.toast(`Simulated upgrade to ${P.planById(planId).name}. No payment was taken.`);
          onUpgrade?.(planId);
        })
      );
    };

    paint();

    host.querySelector('#pr-close').addEventListener('click', close);
    host.querySelector('#pr-scrim').addEventListener('click', (event) => {
      if (event.target.id === 'pr-scrim') close();
    });
    host.querySelector('#pr-preview')?.addEventListener('click', () => {
      close();
      onPreview?.();
    });
    host.querySelectorAll('#pr-billing button').forEach((button) =>
      button.addEventListener('click', () => {
        billing = button.dataset.bill;
        state.billing = billing;
        commit();
        paint();
      })
    );

    document.addEventListener('keydown', onKey, true);
    host.querySelector('#pr-close').focus();
  }

  window.pricing = { open, close };
})();
