/* ============================================================
   FHSN Design Lab — vote endpoint (Vercel Serverless Function)
   POST /api/vote with one voter's ballot → emails it via Resend.

   Environment variables (Vercel → Settings → Environment Variables):
     RESEND_API_KEY  required. Resend API key (re_…).
     VOTE_EMAIL      optional. Recipient; defaults to durandt9919@gmail.com.
     VOTE_FROM       optional. Sender; defaults to Resend's test sender, which
                     can only deliver to the Resend account's own address.
     SITE_URL        optional. Base URL for the "open the site as they voted"
                     link; defaults to the website-dev production domain.

   The recipient is fixed here on the server, so the endpoint cannot be used
   to email anyone else. Everything from the browser is length-limited,
   pattern-checked and HTML-escaped before it goes into the email.
   ============================================================ */
const TO = process.env.VOTE_EMAIL || 'durandt9919@gmail.com';
const FROM = process.env.VOTE_FROM || 'FHSN Design Lab <onboarding@resend.dev>';
const SITE = (process.env.SITE_URL || 'https://website-dev-nine-sable.vercel.app').replace(/\/+$/, '');
const ID = /^[a-z]{2,20}$/;
const HEX = /^#[0-9a-f]{6}$/i;

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const str = (s, max) => String(s == null ? '' : s).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

function cleanItems(list, max) {
  return (Array.isArray(list) ? list : []).slice(0, max).map(it => {
    const value = ID.test(it && it.value) ? it.value : 'orig';
    return { label: str(it && it.label, 60), choice: str(it && it.choice, 60), changed: value !== 'orig' };
  }).filter(it => it.label);
}

function table(items) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">' + items.map(it =>
    '<tr><td style="padding:7px 10px 7px 0;border-bottom:1px solid #eee;color:#555;font-size:14px;width:48%">' + esc(it.label) + '</td>' +
    '<td style="padding:7px 0;border-bottom:1px solid #eee;font-size:14px;' + (it.changed ? 'color:#7A1620;font-weight:700' : 'color:#999') + '">' +
    esc(it.choice) + (it.changed ? '' : ' <span style="font-size:12px">(original)</span>') + '</td></tr>').join('') + '</table>';
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }); }
  if (!process.env.RESEND_API_KEY) return res.status(500).json({ error: 'Voting email is not set up yet (RESEND_API_KEY is missing in Vercel).' });
  let b = req.body || {};
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { return res.status(400).json({ error: 'Bad request.' }); } }
  if (b.hp) return res.status(200).json({ ok: true });            /* honeypot field: only bots fill it */

  const first = str(b.voter && b.voter.first, 60), last = str(b.voter && b.voter.last, 60);
  if (!first || !last) return res.status(400).json({ error: 'Please enter your name and surname.' });
  const name = first + ' ' + last;

  const pages = (Array.isArray(b.pages) ? b.pages : []).slice(0, 6).map(p => ({
    name: str(p && p.name, 40), saved: !!(p && p.saved), items: cleanItems(p && p.items, 25)
  })).filter(p => p.name);
  const site = cleanItems(b.site, 20);
  const red = HEX.test(b.colours && b.colours.red) ? b.colours.red.toUpperCase() : null;
  const grey = HEX.test(b.colours && b.colours.grey) ? b.colours.grey.toUpperCase() : null;
  const updated = !!b.updated;

  /* link that reopens the site exactly as this person voted (rebuilt from validated ids only) */
  const v = Object.entries(b.v && typeof b.v === 'object' ? b.v : {}).slice(0, 120)
    .filter(([k, val]) => ID.test(k) && ID.test(val) && val !== 'orig').map(([k, val]) => k + '.' + val).join('~');
  /* base URL is server-configured, never taken from request headers (a forged Host / X-Forwarded-Host
     would otherwise put an attacker's link inside an email the owner trusts) */
  const link = SITE + '/index.html?' + [red && 'red=' + red.slice(1), grey && 'grey=' + grey.slice(1), v && 'v=' + v].filter(Boolean).join('&');

  const savedCount = pages.filter(p => p.saved).length;
  const changedCount = pages.reduce((n, p) => n + (p.saved ? p.items.filter(i => i.changed).length : 0), 0) + site.filter(i => i.changed).length;
  const when = new Date().toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg', dateStyle: 'long', timeStyle: 'short' });
  const subject = 'FHSN design vote — ' + name + (updated ? ' (updated)' : '');

  const html =
    '<div style="background:#f4f1ec;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">' +
    '<div style="max-width:640px;margin:0 auto;background:#fff;border-top:6px solid #7A1620">' +
    '<div style="padding:26px 28px 10px"><div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#C9A227;font-weight:700">FHSN website · design vote' + (updated ? ' · updated' : '') + '</div>' +
    '<h1 style="margin:8px 0 4px;font-family:Georgia,serif;font-style:italic;font-size:30px;color:#2E3532">' + esc(name) + '</h1>' +
    '<div style="color:#777;font-size:14px">' + esc(when) + ' · saved ' + savedCount + ' of ' + pages.length + ' pages · ' + changedCount + ' options changed from the original</div></div>' +
    (red && grey ? '<div style="padding:14px 28px"><div style="font-size:13px;font-weight:700;color:#2E3532;margin-bottom:8px">Colours</div>' +
      '<table role="presentation" cellpadding="0" cellspacing="0"><tr>' +
      '<td style="width:44px;height:28px;background:' + grey + '"></td><td style="padding:0 18px 0 8px;font-size:13px;color:#555">Grey ' + grey + '</td>' +
      '<td style="width:44px;height:28px;background:' + red + '"></td><td style="padding:0 8px;font-size:13px;color:#555">Red ' + red + '</td></tr></table></div>' : '') +
    pages.map(p => '<div style="padding:14px 28px"><div style="font-size:16px;font-weight:700;color:#2E3532;margin-bottom:6px">' + esc(p.name) + ' page' +
      (p.saved ? '' : ' <span style="font-size:12px;font-weight:400;color:#B26B00">— not saved, counts as no preference</span>') + '</div>' +
      (p.saved ? table(p.items) : '') + '</div>').join('') +
    (site.length ? '<div style="padding:14px 28px"><div style="font-size:16px;font-weight:700;color:#2E3532;margin-bottom:6px">Whole site</div>' + table(site) + '</div>' : '') +
    (link ? '<div style="padding:18px 28px 30px"><a href="' + esc(link) + '" style="display:inline-block;background:#7A1620;color:#fff;text-decoration:none;padding:12px 22px;font-size:14px;font-weight:700">Open the site as ' + esc(first) + ' voted →</a></div>' : '') +
    '</div></div>';

  const text = [subject, when, '', red && grey ? 'Colours: grey ' + grey + ', red ' + red : '', '']
    .concat(pages.map(p => p.name + ' page' + (p.saved ? '\n' + p.items.map(i => '  ' + i.label + ': ' + i.choice + (i.changed ? '' : ' (original)')).join('\n') : ' — not saved (no preference)')))
    .concat(site.length ? ['', 'Whole site', site.map(i => '  ' + i.label + ': ' + i.choice + (i.changed ? '' : ' (original)')).join('\n')] : [])
    .concat(link ? ['', 'Open the site as ' + first + ' voted: ' + link] : []).join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [TO], subject: subject, html: html, text: text })
    });
    if (!r.ok) {
      let msg = ''; try { msg = (await r.json()).message || ''; } catch (e) {}
      console.error('Resend rejected the vote email', r.status, msg);
      return res.status(502).json({ error: 'The email service refused the vote (' + r.status + (msg ? ': ' + str(msg, 160) : '') + ').' });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Vote email failed', e);
    return res.status(502).json({ error: 'Could not reach the email service. Please try again.' });
  }
};
