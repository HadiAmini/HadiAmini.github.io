# M. Hadi Amini — static academic homepage (v6)

`index.html` is the main one-page site; `media.html` is the media archive.
There is no build step. Run `python3 -m http.server 8000` in this folder to preview.
Deploy this folder's contents with `index.html` at the hosting root.

## Editing

- Biographical and academic content: `index.html` and `media.html`.
- Research-area cross-lists: `assets/js/research-data.js`. Keep the groups, record
  counts, and corresponding HTML card labels synchronized when editing.
- Styling: `assets/css/styles.css`, consolidated into one responsive stylesheet.
- Navigation, search and gallery: `assets/js/main.js`.
- Photographs, book covers and logos: `assets/img/`.

All five publication categories start closed and open on visitor interaction. Search
can reveal matching categories; clearing it restores the previous open/closed state.
Publication categories, Ph.D. entries and award details use native disclosures.
With JavaScript disabled, all records remain accessible and the navigation is
shown in normal document flow. Research cards then link to the bibliography;
photo links open their original full-size images. Search and modal enhancements
are enabled only when the script loads. System fonts are used; no font files,
tracking code, third-party scripts, or analytics were added.

Former section URLs remain as small compatibility redirects. The configured
canonical domain remains https://hadiamini.com; this package does not deploy or
change the public domain. Owner-facing source and QA notes are outside this folder.

## Home media ribbon

The existing nine outlet logos scroll slowly on the home page. The circle beside
the strip pauses/resumes playback. Hovering or focusing a logo pauses it temporarily;
touching the strip pauses it for manual swiping until Play is selected. Motion also
stops offscreen, in hidden tabs, and while printing. The reduced-motion preference
and a no-JavaScript visit use a static grid instead. The media archive remains static.

## Version 6

The lab is named Security, Optimization, and Learning for Interdependent Networks
Lab. The introduction uses the owner-supplied sentence and links only “solid lab”
within that sentence. The three leadership-card numbers were removed. Other
changes are limited to copyediting; layout, media motion and controls are unchanged.

For GitHub Pages, publish the contents of this directory (not a ZIP and not its
parent directory) from the main branch, /(root). Keep the empty `.nojekyll` file.
This package intentionally omits `CNAME` so the GitHub address can be tested first.
After testing, configure the actual custom domain in repository Settings → Pages.
When GitHub creates `CNAME`, retain it on future website updates. A step-by-step
domain setup guide is in the separate review package. No accounts or DNS records
have been changed by this package.
