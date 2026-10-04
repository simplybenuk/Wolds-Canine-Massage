# Website interaction analytics

The site reuses Google tag `G-WSLKJ3G7QT`, loaded by the existing published Tag Manager container `GTM-W7H6FND`. The published container was checked on 4 October 2026 and contained one Google tag with page views enabled. Custom events use Google tag event commands on the existing `dataLayer`, with an explicit `send_to` destination. No extra GTM event tags or triggers are needed. Adding forwarding tags for the same events could count them twice.

Build and deploy the site with `JEKYLL_ENV=production` to activate tracking. Development builds omit GTM and disable custom events. Custom events also require the hostname from `url` in `_config.yml`, with or without `www`. Keep `analytics_measurement_id` aligned with the Google tag in GTM if the Analytics property changes.

## Events

Every custom event includes `page_id`. Link events also include `placement` and `item_id`, using fixed labels in the HTML. These distinguish the homepage hero, desktop header, mobile navigation, footer, service cards and in-page links without relying on button text.

| Event | What it measures | Examples of `item_id` or other parameters |
| --- | --- | --- |
| `wcm_booking_click` | Opening Square's booking journey | `appointment`, `initial_consultation`, `maintenance_massage`, `puppy_massage` |
| `wcm_contact_click` | Clicking a phone or email link | `phone`, `email` |
| `wcm_academy_click` | Opening an Academy destination | `free_face_massage_course`, `academy`, `ebooks` |
| `wcm_resource_download` | Clicking a PDF resource | `veterinary_consent`, `dog_health_record` |
| `wcm_questionnaire_click` | Opening the owner questionnaire | `owner_questionnaire` |
| `wcm_navigation_click` | Using navigation or course enquiry links | The destination, such as `services` or `contact` |
| `wcm_social_click` | Opening a social profile | `facebook`, `instagram` |
| `wcm_menu_toggle` | Opening or closing the mobile menu | `menu_state`: `open` or `closed` |
| `wcm_scroll_depth` | Reaching a scroll milestone | `percent_scrolled`: 25, 50, 75 or 90 |
| `wcm_content_view` | Seeing selected content for one second | `content_id`, such as `faq_referral`, `faq_insurance`, `veterinary_referral`, `testimonials` or a service/course |
| `wcm_cta_view` | Seeing a booking, contact, Academy, resource or questionnaire link for one second | `action_name` identifies the click event; `placement` and `item_id` identify the link |

Visibility events require at least half the tagged element to remain in the viewport for one continuous second while the tab is visible. They report exposure to the content or button, rather than proof someone read it. Each element is counted once per page load. Navigation and social links do not create CTA visibility events.

Link clicks include keyboard activation and middle-button opening in a new tab. A service card's `item_id` identifies the button clicked. All three service buttons currently open the same Square destination, so the label does not prove which service was selected there.

Scroll milestones use the percentage of available scroll travel, measured as scroll position divided by document height minus viewport height. They are emitted once per page load after scrolling. Pages that fit within the viewport emit none. Milestones passed before statistics consent are skipped.

Custom event names are separate from GA4's enhanced measurement events, including `click`, `file_download` and `scroll`. Use the `wcm_` events for these reports. Do not add generic and custom counts together as if they represented separate actions.

## GA4 reporting setup

The new events arrive automatically after deployment for visitors who permit statistics cookies. GA4 account settings still need an editor to create the following event-scoped custom dimensions under Admin, Data display, Custom definitions:

| Display name | Event parameter |
| --- | --- |
| Website page | `page_id` |
| Link placement | `placement` |
| Link item | `item_id` |
| CTA action | `action_name` |
| Content section | `content_id` |
| Menu state | `menu_state` |
| Scroll milestone | `percent_scrolled` |

Use Scroll milestone as a categorical breakdown to compare the four thresholds. Google says custom definitions can take 24–48 hours before they are usable in reports, and they do not populate historic data. Set them up before collecting the comparison period.

Mark `wcm_booking_click` and `wcm_contact_click` as key events if booking and enquiry intent are the site's primary goals. Keep Academy clicks as a separate goal if course traffic matters to the business. These are intent measures. They do not confirm a completed appointment, call, email or purchase.

Useful explorations:

- Compare booking clicks by `page_id`, `placement` and `item_id`, split by device category. This shows which pages and service cards prompt visitors to book.
- Compare `wcm_cta_view` with the corresponding click event for each page, placement and item. A visible button with few clicks suggests a different problem from a button few visitors reach. Clicks can happen before the one-second exposure threshold, and repeated clicks can make event-count ratios exceed 100%. Use user counts and sequential funnels as well; raw click/view ratios are not a conversion rate.
- Compare phone and email clicks by page and device. This can guide which contact option to emphasise.
- Build a sequence of services page view, service content exposure and booking click to locate where visitors drop out.
- Compare FAQ content exposure with later booking or contact intent. Exposure is an association, not evidence that reading the FAQ caused the action.
- Compare Academy destinations and placements. Existing UTMs remain intact for attribution on the Academy site.

## Consent and data

Custom events require `Cookiebot.consent.statistics === true`. Unknown, missing or declined consent produces no custom events. Revocation cancels pending visibility timers and stops future collection. Actions before consent are discarded and never replayed.

The local script uses `data-cookieconsent="ignore"` so it can listen for consent changes. Its event sender still checks statistics consent on every event. It creates no analytics cookies itself and loads no extra tracking service.

Custom labels are fixed in the source. The tracker does not read contact values, link URLs, link text, form inputs, questionnaire answers, testimonial names or clinical records. Custom events use the template's canonical page URL, including on a 404 page, and send only the referrer's origin. Visitor-supplied paths, query strings and fragments are excluded from these parameters. The existing Google tag's automatic page views and enhanced measurement are governed by the existing GTM, Cookiebot and GA4 configuration.

## Verification

Verified on 4 October 2026 with production and development Jekyll builds, nine passing regression tests, and Chromium checks of the public pages. Browser checks covered consent and withdrawal, keyboard and icon clicks, mobile navigation and resizing, and same-tab booking delivery. Real Cookiebot acceptance and intercepted requests from the existing Google tag confirmed custom events were addressed to `G-WSLKJ3G7QT`, including each service booking label once. Collection requests were intercepted before reaching Analytics, so synthetic interactions did not enter live reports.

Run `node --test tests/analytics.test.cjs` to check consent, revocation, URL handling, scroll deduplication, visibility timing and preview guards. Build both development and production versions with Jekyll. Test the resulting pages on desktop and mobile, including a page without testimonials.

After deployment, use Tag Assistant and GA4 Realtime to check the events in your own Analytics account:

1. Start without statistics consent. Try a booking link and scroll. No `wcm_` events should appear.
2. Accept statistics cookies. Try the hero booking button, a service booking button, phone/email links, an Academy link and a PDF. Check that each action produces one event with the correct page, placement and item.
3. Keep a tagged button or content heading visible for a second. Check its visibility event appears once. Scroll down and back up; each depth milestone should appear once.
4. Revoke statistics consent through Cookiebot. Further clicks and scrolling should produce no new custom events.
5. Check mobile menu open/close events and keyboard activation of links. All destinations should continue working.

Use a staging Analytics property for automated network tests, or intercept collection requests before they leave the browser. Do not send synthetic interactions into the live reports.

## Limits and site review

Square bookings, Academy enrolments or purchases, and Google Form submissions happen on other sites. This site records the handoff, not completion. Completed-booking measurement requires support on Square. Course sales or enrolments require tracking on the Academy. Clicks inside the embedded Google map are not observable from this page.

The contact page described a booking button that was missing. It now has a tagged booking button. The shared testimonial script now handles pages without testimonials, and the mobile menu uses its expanded state instead of inline styles that could hide desktop navigation after resizing.

The FAQ currently says initial appointments usually last 1.5 hours, while the services page and veterinary referral timeline say approximately 60 minutes. Confirm the correct duration before updating this copy. Analytics cannot resolve that business detail.

## References

- [Google tag event setup](https://developers.google.com/analytics/devguides/collection/ga4/events?client_type=gtag)
- [Routing events with send_to](https://developers.google.com/tag-platform/gtagjs/routing)
- [Cookiebot consent API and events](https://www.cookiebot.com/en/developer/)
- [GA4 custom dimensions](https://support.google.com/analytics/answer/14240153)
- [GA4 event-scoped custom dimensions](https://support.google.com/analytics/answer/14239696)
