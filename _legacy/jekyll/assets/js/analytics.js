(function () {
    'use strict';

    const script = document.currentScript;
    if (!script || script.dataset.enabled !== 'true') return;

    const measurementId = script.dataset.measurementId;
    const siteHost = new URL(script.dataset.siteUrl).hostname.replace(/^www\./, '');
    if (!/^G-[A-Z0-9]+$/.test(measurementId) ||
        window.location.hostname.replace(/^www\./, '') !== siteHost) return;

    const pageId = document.body.dataset.analyticsPage;
    const clickEvents = new Set([
        'wcm_booking_click', 'wcm_contact_click', 'wcm_academy_click',
        'wcm_resource_download', 'wcm_questionnaire_click',
        'wcm_navigation_click', 'wcm_social_click'
    ]);
    const milestones = [25, 50, 75, 90];
    const reached = new Set();
    const viewed = new WeakSet();
    const timers = new Map();
    let observer;
    let consented = false;

    function hasConsent() {
        return Boolean(window.Cookiebot && window.Cookiebot.consent &&
            window.Cookiebot.consent.statistics === true);
    }

    function referrerOrigin(value) {
        if (!value) return '';
        try {
            const url = new URL(value);
            return url.origin;
        } catch (_) {
            return '';
        }
    }

    // GTM's existing Google tag consumes gtag event commands on this data layer.
    // No second config or page_view command, and no pre-consent event queue.
    function gtag() {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push(arguments);
    }

    function emit(name, parameters) {
        if (!hasConsent() || document.visibilityState !== 'visible') return;
        gtag('event', name, Object.assign({
            send_to: measurementId,
            page_id: pageId,
            page_location: new URL(script.dataset.pagePath, script.dataset.siteUrl).href,
            page_referrer: referrerOrigin(document.referrer)
        }, parameters));
    }

    function actionParameters(element) {
        return {
            placement: element.dataset.analyticsPlacement,
            item_id: element.dataset.analyticsItem
        };
    }

    // Delegation includes clicks on icons inside links and keyboard activation.
    // Navigation is never delayed or cancelled by analytics.
    function trackInteraction(event) {
        if (event.type === 'auxclick' && event.button !== 1) return;
        const element = event.target.closest('[data-analytics-event]');
        if (element && clickEvents.has(element.dataset.analyticsEvent)) {
            emit(element.dataset.analyticsEvent, actionParameters(element));
        }
        const menu = event.target.closest('.menu-button');
        if (menu && event.type !== 'auxclick') {
            emit('wcm_menu_toggle', {
                menu_state: menu.getAttribute('aria-expanded') === 'true' ? 'open' : 'closed'
            });
        }
    }
    document.addEventListener('click', trackInteraction);
    document.addEventListener('auxclick', trackInteraction);

    function scrollPercent() {
        const distance = document.documentElement.scrollHeight - window.innerHeight;
        return distance > 0 ? Math.min(100, window.scrollY / distance * 100) : 0;
    }

    window.addEventListener('scroll', function () {
        if (!hasConsent() || document.visibilityState !== 'visible') return;
        const percent = scrollPercent();
        milestones.forEach(function (milestone) {
            if (percent >= milestone && !reached.has(milestone)) {
                reached.add(milestone);
                emit('wcm_scroll_depth', { percent_scrolled: milestone });
            }
        });
    }, { passive: true });

    function stopViews() {
        if (observer) observer.disconnect();
        timers.forEach(function (timer) { window.clearTimeout(timer); });
        timers.clear();
    }

    function startViews() {
        stopViews();
        if (!hasConsent() || document.visibilityState !== 'visible' ||
            !window.IntersectionObserver) return;

        observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                const element = entry.target;
                if (!entry.isIntersecting || entry.intersectionRatio < 0.5) {
                    window.clearTimeout(timers.get(element));
                    timers.delete(element);
                    return;
                }
                if (viewed.has(element) || timers.has(element)) return;
                timers.set(element, window.setTimeout(function () {
                    timers.delete(element);
                    if (!hasConsent() || document.visibilityState !== 'visible') return;
                    viewed.add(element);
                    observer.unobserve(element);
                    if (element.dataset.analyticsContent) {
                        emit('wcm_content_view', { content_id: element.dataset.analyticsContent });
                    } else {
                        emit('wcm_cta_view', Object.assign(actionParameters(element), {
                            action_name: element.dataset.analyticsEvent
                        }));
                    }
                }, 1000));
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('[data-analytics-content], [data-analytics-event]').forEach(function (element) {
            const action = element.dataset.analyticsEvent;
            if (!viewed.has(element) && (!action ||
                (clickEvents.has(action) && action !== 'wcm_navigation_click' && action !== 'wcm_social_click'))) {
                observer.observe(element);
            }
        });
    }

    function updateConsent() {
        const next = hasConsent();
        if (next === consented) return;
        consented = next;
        if (consented) {
            // Do not report scroll thresholds passed before consent was given.
            const percent = scrollPercent();
            milestones.forEach(function (milestone) {
                if (percent >= milestone) reached.add(milestone);
            });
            startViews();
        } else {
            stopViews();
        }
    }

    ['CookiebotOnConsentReady', 'CookiebotOnAccept', 'CookiebotOnDecline'].forEach(function (name) {
        window.addEventListener(name, updateConsent);
    });
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') startViews();
        else stopViews();
    });
    updateConsent();
}());
