const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '../public/assets/js/analytics.js'), 'utf8');

function fixture({ consent = false, enabled = 'true', hostname = 'woldscaninemassage.co.uk' } = {}) {
    const windowListeners = {};
    const documentListeners = {};
    const timers = new Map();
    const elements = [];
    const observers = [];
    let timerId = 0;
    let elapsed = 0;
    function advance(milliseconds) {
        elapsed += milliseconds;
        [...timers.entries()].filter(([, timer]) => timer.due <= elapsed).forEach(([id, timer]) => {
            timers.delete(id);
            timer.fn();
        });
    }
    const window = {
        location: { hostname, href: `https://${hostname}/services?email=private@example.com#private` },
        dataLayer: [], Cookiebot: { consent: { statistics: consent } },
        innerHeight: 800, scrollY: 0,
        addEventListener(name, fn) { windowListeners[name] = fn; },
        setTimeout(fn, delay) { timers.set(++timerId, { fn, due: elapsed + delay }); return timerId; },
        clearTimeout(id) { timers.delete(id); },
        IntersectionObserver: class {
            constructor(callback) { this.callback = callback; this.observed = new Set(); observers.push(this); }
            observe(element) { this.observed.add(element); }
            unobserve(element) { this.observed.delete(element); }
            disconnect() { this.observed.clear(); }
        }
    };
    const document = {
        currentScript: { dataset: { enabled, measurementId: 'G-WSLKJ3G7QT', siteUrl: 'https://woldscaninemassage.co.uk', pagePath: '/services.html' } },
        body: { dataset: { analyticsPage: 'services' } },
        documentElement: { scrollHeight: 1800 }, visibilityState: 'visible',
        referrer: 'https://example.com/from?phone=private#private',
        addEventListener(name, fn) { documentListeners[name] = fn; },
        querySelectorAll() { return elements; }
    };
    vm.runInNewContext(source, { window, document, URL, IntersectionObserver: window.IntersectionObserver });
    return {
        window, document, elements, timers,
        events: () => window.dataLayer.map(args => ({ name: args[1], params: args[2] })),
        consent(value) {
            window.Cookiebot.consent.statistics = value;
            windowListeners[value ? 'CookiebotOnAccept' : 'CookiebotOnDecline']?.();
        },
        click(element, type = 'click', button = 0) {
            documentListeners[type]?.({ type, button, target: { closest: selector => selector === '[data-analytics-event]' ? element : null } });
        },
        scroll(y) { window.scrollY = y; windowListeners.scroll?.(); },
        intersect(element, ratio) {
            const observer = observers.at(-1);
            if (observer?.observed.has(element)) {
                observer.callback([{ target: element, isIntersecting: ratio > 0, intersectionRatio: ratio }]);
            }
        },
        advance,
        flush() { advance(1000); },
        visibility(value) { document.visibilityState = value; documentListeners.visibilitychange?.(); }
    };
}

const booking = () => ({ dataset: {
    analyticsEvent: 'wcm_booking_click', analyticsPlacement: 'service_card', analyticsItem: 'puppy_massage'
} });

test('unknown, declined and missing statistics consent produce no custom events', () => {
    const f = fixture();
    f.click(booking());
    f.scroll(950);
    delete f.window.Cookiebot;
    f.click(booking());
    assert.equal(f.events().length, 0);
});

test('granting consent does not replay clicks or previous scroll depth', () => {
    const f = fixture();
    f.click(booking());
    f.scroll(800);
    f.consent(true);
    assert.equal(f.events().length, 0);
    f.scroll(950);
    assert.deepEqual(f.events().map(e => e.params.percent_scrolled), [90]);
    f.click(booking());
    assert.equal(f.events().at(-1).name, 'wcm_booking_click');
});

test('events route to existing GA4 with fixed labels and cleaned URLs', () => {
    const f = fixture({ consent: true });
    f.click(booking());
    const [event] = f.events();
    assert.equal(event.params.send_to, 'G-WSLKJ3G7QT');
    assert.equal(event.params.page_id, 'services');
    assert.equal(event.params.item_id, 'puppy_massage');
    assert.equal(event.params.placement, 'service_card');
    assert.equal(event.params.page_location, 'https://woldscaninemassage.co.uk/services.html');
    assert.equal(event.params.page_referrer, 'https://example.com');
    assert.ok(!JSON.stringify(event).includes('private'));
    assert.equal(f.window.dataLayer[0][0], 'event');
});

test('middle-click is tracked and right-click is ignored', () => {
    const f = fixture({ consent: true });
    f.click(booking(), 'auxclick', 2);
    assert.equal(f.events().length, 0);
    f.click(booking(), 'auxclick', 1);
    assert.equal(f.events().length, 1);
    assert.equal(f.events()[0].name, 'wcm_booking_click');
});

test('revocation stops clicks, scrolling and pending visibility events immediately', () => {
    const f = fixture();
    const element = booking();
    f.elements.push(element);
    f.consent(true);
    f.intersect(element, 1);
    assert.equal(f.timers.size, 1);
    f.consent(false);
    f.flush();
    f.click(element);
    f.scroll(950);
    assert.equal(f.timers.size, 0);
    assert.equal(f.events().length, 0);
});

test('each scroll milestone records once, and non-scrollable pages record none', () => {
    const f = fixture({ consent: true });
    f.scroll(950);
    f.scroll(0);
    f.scroll(950);
    assert.deepEqual(f.events().map(e => e.params.percent_scrolled), [25, 50, 75, 90]);
    const short = fixture({ consent: true });
    short.document.documentElement.scrollHeight = short.window.innerHeight;
    short.scroll(0);
    assert.equal(short.events().length, 0);
});

test('visibility requires half the element for a full second and records once', () => {
    const f = fixture();
    const element = booking();
    f.elements.push(element);
    f.consent(true);
    f.intersect(element, 0.4);
    f.flush();
    assert.equal(f.events().length, 0);
    f.intersect(element, 1);
    f.intersect(element, 0);
    f.flush();
    assert.equal(f.events().length, 0);
    f.intersect(element, 1);
    f.advance(999);
    assert.equal(f.events().length, 0);
    f.advance(1);
    f.intersect(element, 1);
    f.flush();
    assert.equal(f.events().length, 1);
    assert.equal(f.events()[0].name, 'wcm_cta_view');
    assert.equal(f.events()[0].params.action_name, 'wcm_booking_click');
});

test('hidden tabs cancel pending views and resume visibility tracking when shown', () => {
    const f = fixture();
    const element = { dataset: { analyticsContent: 'faq_insurance' } };
    f.elements.push(element);
    f.consent(true);
    f.intersect(element, 1);
    f.visibility('hidden');
    f.flush();
    f.click(booking());
    assert.equal(f.events().length, 0);
    f.visibility('visible');
    f.intersect(element, 1);
    f.flush();
    assert.equal(f.events()[0].name, 'wcm_content_view');
    assert.equal(f.events()[0].params.content_id, 'faq_insurance');
});

test('local hosts, development builds and unrecognised actions record nothing', () => {
    for (const options of [{ enabled: 'false', consent: true }, { hostname: 'localhost', consent: true }]) {
        const f = fixture(options);
        f.click(booking());
        assert.equal(f.events().length, 0);
    }
    const f = fixture({ consent: true, hostname: 'www.woldscaninemassage.co.uk' });
    f.click({ dataset: { analyticsEvent: 'arbitrary_event' } });
    assert.equal(f.events().length, 0);
    f.click(booking());
    assert.equal(f.events().length, 1);
});
