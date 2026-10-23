# Milton Lodge — local preview verification

Two final factory checks passed: **20 passed / 0 failed / 0 warnings** each, with CLS **0.057** on both. Logs: `qa/factory-green-1.log` and `qa/factory-green-2.log`. The standalone package check also passed. Exact results and index hash are in `BUILD-RESULT.json`. Nine image elements comprise eight distinct actual business photos plus the genuine logo. Prices are a documented skip because current rates have not been verified, not a claim that pricing was checked.

`qa/check-interactions.py` passed actual Playwright viewports360×800,390×844,736×1024,768×1024,1024×900 and1440×900. Mobile navigation checks include toggle state/accessible labels, Escape and focus return, outside click, and closing after section links. All three menu categories have correct item counts, a single selected button and matching controlled panel, live announcement, Enter and Space activation. Every image decoded with alt text. Menu, room, story and contact sections were checked for overflow and captured; no page errors.

No-JavaScript mode keeps all ten verified dish names/descriptions and core copy visible. Native phone, directions and source menu links remain. No fake order form, reservation confirmation, current prices, closing-hour status or fabricated review publication date. Review metadata identifies the capture date explicitly. Phone hero uses contain sizing so the whole burger/fries subject is visible.

Art direction was inspected at desktop and phone sizes after applying Hayden’s flow instruction. The room’s timber, blue seating, amber and cream carry through the page. Food photos lead into a paper menu, then the bar, documented history and visit actions. No generic service-card stack or unrelated novelty interaction. A seasonal Mother’s Day balloon photo was removed from the phone opener in favor of the real burger photo; the contact heading was shortened to remove a phone-width orphan line.

`qa/check-package.py` checks390/1440 standalone viewports, all nine embedded assets, all menu choices, mobile navigation, uncropped phone hero, no overflow/page errors, and exact ZIP source-file byte matches. Public ZIP includes only index, CSS, JS and the eight photos plus logo; internal notes/source files are excluded.

Browser-pane surfaces were unavailable in this session. These are actual Playwright viewport tests and inspected screenshots, not Browser-pane verification. No phone calls, order submissions, outreach, publishing or financial action occurred.
