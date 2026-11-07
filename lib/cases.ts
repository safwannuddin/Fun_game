import type { Case, DeviceId, EvidenceLine } from "./types";

/** Helpers keep the bank readable. */
const ok = (text: string, why = "Nothing wrong here."): EvidenceLine => ({ text, bad: false, why });
const bad = (text: string, why: string): EvidenceLine => ({ text, bad: true, why });

/**
 * Built-in case bank. Used offline, when no GEMINI_API_KEY is set,
 * or whenever the AI is slow or returns something invalid.
 * All brands are fictional.
 */
export const CASE_BANK: Case[] = [
  // ───────────────────────── LAPTOP (vibe-coded bugs) ─────────────────────────
  {
    id: "laptop-leaked-key",
    device: "laptop",
    title: "The key in plain sight",
    story: "Pixel asked an AI to load snacks on the home page. It works first time, and that's the problem.",
    clues: [
      "I was written in seconds by something that never sleeps.",
      "I work perfectly. Anyone can read my secret.",
      "Open the lid: I live where the keys are pressed.",
    ],
    evidence: {
      file: "src/home.js · runs in the browser",
      lang: "js",
      lines: [
        ok("// Show today's snacks on the home page (AI generated)"),
        bad('const API_KEY = "sk_live_51Hc9fA2xQ8pL0vT";', "A live secret key shipped to the browser. Anyone can copy it from DevTools."),
        ok("export async function loadSnacks() {"),
        ok('  const res = await fetch(`https://api.snackdb.io/v1/list?key=${API_KEY}`);', "Uses the key, but the leak is where the key is stored."),
        ok("  const snacks = await res.json();"),
        ok("  render(snacks);"),
        ok("}"),
      ],
    },
    need: 1,
    technique: "leaked-secret",
    fixes: [
      { text: "Rename API_KEY to something boring like cfg", ok: false, why: "A new name doesn't hide it. It's still in the browser." },
      { text: "Keep the key in a server environment variable and call your own /api/snacks route", ok: true, why: "The secret never leaves the server." },
      { text: "Base64-encode the key", ok: false, why: "Base64 is encoding, not encryption. Anyone can decode it." },
    ],
    lesson: {
      how: "AI assistants often paste secret keys straight into front-end code. Bots scan websites and GitHub for keys all day, then use them to run up bills or steal data.",
      spot: "Strings like sk_live, api_key, token or password in code that runs in the browser or is committed to Git.",
      tip: "Keep secrets in server-side environment variables and never commit .env files.",
      vibe: "Ask your AI: “Does this code expose any API keys or secrets to the browser?”",
    },
    source: "bank",
  },
  {
    id: "laptop-sqli",
    device: "laptop",
    title: "The magic username",
    story: "Someone logged into Pixel's app without a password. They typed a strange username: ' OR '1'='1' --",
    clues: [
      "I talk to the database for you.",
      "I trust every word you type.",
      "Check the machine where Pixel writes code.",
    ],
    evidence: {
      file: "server/routes/login.js · server",
      lang: "js",
      lines: [
        ok('router.post("/login", async (req, res) => {'),
        ok("  const { username, password } = req.body;", "Reading the form is fine."),
        bad("  const sql = \"SELECT * FROM users WHERE name = '\" + username + \"'\";", "User input is glued into the SQL text, so the hacker's quote marks rewrite the query."),
        ok("  const [user] = await db.query(sql);", "Runs whatever SQL it is given. The bug is the line above."),
        ok("  if (!user) return res.status(401).send(\"Nope\");"),
        ok("  res.send(`Welcome back, ${user.name}`);"),
        ok("});"),
      ],
    },
    need: 1,
    technique: "sql-injection",
    fixes: [
      { text: "Lowercase the username before using it", ok: false, why: "The attack works just as well in lowercase." },
      { text: 'Use a parameterised query: db.query("SELECT * FROM users WHERE name = ?", [username])', ok: true, why: "The database treats input as data, never as SQL." },
      { text: "Wrap the query in try/catch", ok: false, why: "That hides errors. The injection still runs." },
    ],
    lesson: {
      how: "When user input is joined straight into a database query, an attacker can type SQL instead of a name and read, change or delete the whole database.",
      spot: "Queries built with + or template strings that include anything the user typed.",
      tip: "Always use parameterised queries or an ORM.",
      vibe: "Ask your AI: “Is this query safe from SQL injection?”",
    },
    source: "bank",
  },
  {
    id: "laptop-xss",
    device: "laptop",
    title: "The comment that bites",
    story: 'NullByte posted a comment on Pixel\'s app: <img src=x onerror="stealCookies()">. Everyone who reads it gets hacked.',
    clues: [
      "I show what other people write.",
      "I treat words as if they were code.",
      "I'm on the screen that folds shut.",
    ],
    evidence: {
      file: "src/comments.js · runs in the browser",
      lang: "js",
      lines: [
        ok("export function showComment(comment) {"),
        ok('  const box = document.createElement("article");'),
        ok('  box.className = "comment";'),
        bad("  box.innerHTML = comment.text;", "innerHTML runs any HTML or script hidden inside the comment."),
        ok("  feed.prepend(box);"),
        ok("}"),
      ],
    },
    need: 1,
    technique: "xss",
    fixes: [
      { text: "box.textContent = comment.text;", ok: true, why: "The comment is shown as plain text, so the code never runs." },
      { text: "box.innerHTML = comment.text.trim();", ok: false, why: "Trimming spaces doesn't remove the script." },
      { text: "Block comments longer than 100 characters", ok: false, why: "The attack fits in under 50." },
    ],
    lesson: {
      how: "If a page inserts user text as HTML, an attacker can hide JavaScript in it that runs in every visitor's browser and steals their session.",
      spot: "innerHTML, outerHTML, document.write or dangerouslySetInnerHTML used with user input.",
      tip: "Use textContent for user text, or sanitise HTML with a trusted library.",
      vibe: "Ask your AI: “Can any user input in this code run as HTML or JavaScript?”",
    },
    source: "bank",
  },
  {
    id: "laptop-admin",
    device: "laptop",
    title: "Everyone is admin",
    story: "Suddenly every user on Pixel's app can delete accounts. The AI made one tiny typo.",
    clues: [
      "I decide who is the boss.",
      "One missing symbol and I say yes to everyone.",
      "I'm in the code on the folding computer.",
    ],
    evidence: {
      file: "server/auth/permissions.js · server",
      lang: "js",
      lines: [
        ok("export function canDeleteUsers(user) {"),
        ok("  if (!user) return false;"),
        bad('  if (user.role = "admin") {', "A single = SETS the role to admin instead of comparing it, so every user passes."),
        ok("    return true;"),
        ok("  }"),
        ok("  return false;"),
        ok("}"),
      ],
    },
    need: 1,
    technique: "broken-access",
    fixes: [
      { text: 'if (user.role === "admin") {', ok: true, why: "=== compares, so only real admins pass." },
      { text: 'if (user.role = "Admin") {', ok: false, why: "Still a single =, still assigns." },
      { text: "Hide the delete button for normal users", ok: false, why: "Attackers call the server directly. The check must be on the server." },
    ],
    lesson: {
      how: "Small slips in permission checks let normal users do admin things. Broken access control is number one on the OWASP Top 10 list of web risks.",
      spot: "Checks using = instead of ===, or permission checks that only happen in the browser.",
      tip: "Test that a normal account is really blocked from admin actions on the server.",
      vibe: "Ask your AI: “Can a normal user get past this permission check?”",
    },
    source: "bank",
  },

  // ───────────────────────── MONITOR (email) ─────────────────────────
  {
    id: "monitor-phishing",
    device: "monitor",
    title: "Account deleted in 1 hour",
    story: "Pixel's inbox has an urgent email. You're looking at its raw source, the way a security analyst would.",
    clues: [
      "I arrived without anyone asking for me.",
      "I pretend to be someone you trust, and I'm in a hurry.",
      "Look at the big screen with the red number.",
    ],
    evidence: {
      file: "inbox/urgent-security-alert.eml",
      lang: "eml",
      lines: [
        bad('From: "SnackSwap Security" <security@snackswap-verify.co>', "SnackSwap's real address ends in @snackswap.app. This is a look-alike domain."),
        ok("To: pixel@brightfield.ac.uk"),
        bad("Subject: URGENT: your account will be DELETED in 1 hour", "Panic plus a deadline is designed to stop you thinking."),
        bad("Authentication-Results: spf=fail; dkim=none", "The sending server isn't authorised to send for that domain."),
        ok("Content-Type: text/html; charset=utf-8"),
        ok("<p>Dear Customer, we noticed a login from a new device.</p>", "Generic, but not the strongest clue here."),
        bad('<a href="http://snackswap.verify-login.xyz/login">snackswap.app/login</a>', "The link text says snackswap.app but it really goes to verify-login.xyz."),
        ok("<p>The SnackSwap Team</p>"),
      ],
    },
    need: 3,
    technique: "phishing",
    fixes: [
      { text: "Click the link just to check whether it's real", ok: false, why: "The page is built to steal whatever you type." },
      { text: "Reply and ask if the email is genuine", ok: false, why: "You'd be asking the scammer." },
      { text: "Don't click. Open the app yourself and report the email as phishing", ok: true, why: "Always go to the real site directly." },
    ],
    lesson: {
      how: "Scammers send emails pretending to be a trusted company and link to a fake login page that steals your password.",
      spot: "Look-alike sender domains, failed SPF/DKIM, urgent deadlines, and links whose real address differs from the text.",
      tip: "Never log in from an email link. Type the address yourself or use the app.",
    },
    source: "bank",
  },
  {
    id: "monitor-spear",
    device: "monitor",
    title: "Your mailbox is full",
    story: "An email that looks like it's from the university IT team just arrived. Here's the raw source.",
    clues: [
      "I know where you study.",
      "I say your storage is almost full.",
      "Check the desktop screen's inbox.",
    ],
    evidence: {
      file: "inbox/mailbox-quota.eml",
      lang: "eml",
      lines: [
        bad("From: IT Helpdesk <helpdesk@brightfield-uni-support.com>", "Brightfield's real domain is brightfield.ac.uk."),
        ok("To: pixel@brightfield.ac.uk"),
        bad("Subject: Mailbox 99% full: action required TODAY", "Urgency to rush you."),
        ok("X-Mailer: MassMailer 3.1", "Odd, but not proof on its own."),
        ok("<p>Hi student, your storage limit has almost been reached.</p>"),
        bad('<a href="https://brightfield-mail-upgrade.net/sso">Upgrade for free</a>', "A look-alike login page that collects your university password."),
        ok("<p>Brightfield University IT Services</p>", "Anyone can type a signature."),
      ],
    },
    need: 3,
    technique: "spear-phishing",
    fixes: [
      { text: "Log in quickly before your email stops working", ok: false, why: "That's exactly what the attacker wants." },
      { text: "Report it through the real IT website, then delete it", ok: true, why: "IT can block it and warn everyone else." },
      { text: "Reply STOP", ok: false, why: "Replying confirms your address is active." },
    ],
    lesson: {
      how: "Spear phishing targets a specific group by copying an organisation they trust, like their own university IT team.",
      spot: "Domains that are almost right, 'action required today', and requests to log in through a link.",
      tip: "Check any IT request through your organisation's official website or helpdesk.",
    },
    source: "bank",
  },

  // ───────────────────────── PHONE (smishing) ─────────────────────────
  {
    id: "phone-smishing",
    device: "phone",
    title: "Parcel on hold",
    story: "Pixel's phone buzzed at 02:14. Here's the message exactly as the phone received it.",
    clues: [
      "I buzzed in the middle of the night.",
      "I only want a tiny payment.",
      "Pick up the small screen on the desk.",
    ],
    evidence: {
      file: "messages/incoming.json",
      lang: "json",
      lines: [
        ok("{"),
        bad('  "from": "+44 7491 220813",', "Delivery firms text from a short name like QuickParcel, not a random mobile number."),
        ok('  "received": "02:14",'),
        ok('  "body": "QuickParcel: we could not deliver your parcel today.",'),
        bad('  "body2": "Pay a £1.45 redelivery fee within 2 hours or it will be returned.",', "A tiny fee plus a deadline. They really want your full card details."),
        bad('  "link": "https://quickparcel-redelivery.help/pay"', "Not QuickParcel's real website."),
        ok("}"),
      ],
    },
    need: 2,
    technique: "smishing",
    fixes: [
      { text: "Pay it, it's only £1.45", ok: false, why: "The fee is bait. They take your card details." },
      { text: "Tap the link just to look", ok: false, why: "Fake pages can steal what you type." },
      { text: "Delete it and check tracking in the official app", ok: true, why: "Go to the real source yourself." },
    ],
    lesson: {
      how: "Smishing is phishing by SMS. Scammers pretend to be delivery firms or banks to get you onto a fake payment page.",
      spot: "Unknown numbers, small fees, short deadlines, and links that aren't the company's real site.",
      tip: "Never pay through a text link. Open the official app or website yourself.",
    },
    source: "bank",
  },

  // ───────────────────────── USB (baiting) ─────────────────────────
  {
    id: "usb-baiting",
    device: "usb",
    title: "Exam answers 2026",
    story: "Pixel found a USB labelled EXAM ANSWERS in the library and plugged it in. Here's what's on it.",
    clues: [
      "I was found, not bought.",
      "My label is too good to be true.",
      "I'm small, orange and plugged into nothing yet.",
    ],
    evidence: {
      file: "terminal · /media/EXAM_ANSWERS_2026",
      lang: "shell",
      lines: [
        ok("$ ls -la /media/EXAM_ANSWERS_2026"),
        ok("-rw-r--r--  12K  revision_notes.txt", "Plain text can't run code."),
        ok("-rw-r--r--  2.1M photo_01.jpg"),
        bad("-rwxr-xr-x  640K exam_answers.pdf.exe", "A double extension: it's really a program (.exe) pretending to be a PDF."),
        ok("-rw-r--r--  1K   autorun.inf"),
        ok("$ cat autorun.inf"),
        bad("open=exam_answers.pdf.exe", "Tries to launch the program automatically when the USB is plugged in."),
      ],
    },
    need: 2,
    technique: "usb-baiting",
    fixes: [
      { text: "Double-click the PDF to see what's inside", ok: false, why: "That runs the malware." },
      { text: "Rename it to .pdf so it's safe", ok: false, why: "Renaming doesn't change what's inside." },
      { text: "Unplug it, open nothing, and hand it to IT security", ok: true, why: "Unknown USBs are a classic attack. Let the experts check it." },
    ],
    lesson: {
      how: "Attackers leave infected USB sticks with tempting labels. Curiosity does the rest: one double-click installs malware.",
      spot: "Double extensions like .pdf.exe, autorun files, and USBs you didn't buy.",
      tip: "Never plug in a found USB, and turn on 'show file extensions' on your computer.",
    },
    source: "bank",
  },

  // ───────────────────────── ROUTER (evil twin) ─────────────────────────
  {
    id: "router-evil-twin",
    device: "router",
    title: "Two guest networks",
    story: "Pixel's laptop scanned for Wi-Fi in the campus café. One of these networks is a trap.",
    clues: [
      "I'm invisible but everyone connects to me.",
      "I share my name with someone honest.",
      "Look up at the shelf with the blinking lights.",
    ],
    evidence: {
      file: "terminal · nmcli dev wifi list",
      lang: "shell",
      lines: [
        ok("SSID                 SECURITY    SIGNAL  BSSID"),
        ok("Brightfield-Guest    WPA2        72      A4:5E:60:11:2C:10"),
        ok("Brightfield-Staff    WPA2-Ent    65      A4:5E:60:11:2C:11"),
        bad("Brightfield-Guest    --          99      DE:AD:BE:EF:00:01", "Same name as the real guest network, but open, a different BSSID and suspiciously strong: an evil twin."),
        ok("BeanCafe-Customers   WPA2        58      F0:9F:C2:3A:77:02"),
        ok("Sam's iPhone         WPA2        31      6A:1B:22:90:4C:5E", "Someone's hotspot. Not yours, but not a trap."),
      ],
    },
    need: 1,
    technique: "evil-twin",
    fixes: [
      { text: "Join the strongest one and only check social media", ok: false, why: "Your social logins pass through the attacker's laptop." },
      { text: "Ask staff which network is real, or use mobile data", ok: true, why: "Confirm before you connect." },
      { text: "Join it, open networks are faster", ok: false, why: "Open and strong is exactly the bait." },
    ],
    lesson: {
      how: "An attacker sets up a hotspot with the same name as a trusted network. Devices connect to the strongest signal, and all your traffic passes through the attacker.",
      spot: "Duplicate names, open security where it should be locked, and an unfamiliar BSSID.",
      tip: "Confirm the network with staff, prefer mobile data, and use a VPN on public Wi-Fi.",
    },
    source: "bank",
  },

  // ───────────────────────── STICKY NOTE ─────────────────────────
  {
    id: "sticky-passwords",
    device: "sticky",
    title: "The note on the monitor",
    story: "Pixel's roommate keeps passwords on a sticky note. Flag every one a hacker would crack in seconds.",
    clues: [
      "I remember things so you don't have to.",
      "I'm yellow and I tell everyone your secrets.",
      "I'm stuck to the corner of the big screen.",
    ],
    evidence: {
      file: "sticky-note.txt",
      lang: "txt",
      lines: [
        bad("uni email   → password123", "One of the most-used passwords in the world."),
        bad("Instagram   → Mittens2004", "Pet name plus birth year, both easy to find on social media."),
        bad("banking     → qwerty", "A keyboard pattern. Cracked instantly."),
        ok("Steam       → purple-tiger-ocean-lamp", "A long random passphrase. Very hard to crack."),
        ok("laptop      → 7#kQ!m29&vLx", "Long and random. Strong, just hard to remember."),
      ],
    },
    need: 3,
    technique: "weak-passwords",
    fixes: [
      { text: "Keep the note, but hide it under the keyboard", ok: false, why: "The first place anyone looks." },
      { text: "Add ! to the end of every password", ok: false, why: "Cracking tools already try that." },
      { text: "Use a password manager, long unique passphrases and 2FA", ok: true, why: "Unique, long and 2FA stops most attacks." },
    ],
    lesson: {
      how: "Attackers try lists of millions of common passwords and personal details from social media. Weak passwords fall in seconds.",
      spot: "Short words, keyboard patterns, names plus years, and the same password everywhere.",
      tip: "Use three or four random words, a password manager, and two-factor authentication.",
    },
    source: "bank",
  },

  // ───────────────────────── QR POSTER ─────────────────────────
  {
    id: "qr-quishing",
    device: "qr",
    title: "Free pizza Friday",
    story: "A poster offers free pizza if you scan the QR code. Here's what the code actually decodes to.",
    clues: [
      "I promise you something delicious.",
      "You can't read my real address with your eyes.",
      "I'm hanging on the wall next to the window.",
    ],
    evidence: {
      file: "terminal · zbarimg poster.jpg",
      lang: "shell",
      lines: [
        ok("$ zbarimg poster.jpg"),
        bad("QR-Code:https://pizza-claim-free.xyz/sso?next=/claim", "Not the Students' Union site, and it's asking you to sign in."),
        ok("$ whois pizza-claim-free.xyz | grep Created"),
        bad("Creation Date: 2026-11-06", "The domain was registered two days ago. Brand-new domains are a huge red flag."),
        ok("$ curl -s https://pizza-claim-free.xyz/sso | grep title"),
        bad("<title>Brightfield Student Login</title>", "A copy of the university login page on a random domain."),
      ],
    },
    need: 2,
    technique: "quishing",
    fixes: [
      { text: "Scan and log in fast before the pizza runs out", ok: false, why: "Rush plus a login: that's the trap." },
      { text: "Don't scan. Check the event on the official Students' Union website", ok: true, why: "Real events are listed on official pages." },
      { text: "Scan it but use an old password", ok: false, why: "People reuse passwords. It may still work somewhere." },
    ],
    lesson: {
      how: "A QR code hides the real link, so scammers stick fake codes on posters, parking meters and menus that lead to fake login or payment pages.",
      spot: "Stickers over printed codes, odd domains in the link preview, and anything asking you to log in.",
      tip: "Read the link preview before opening it, and never log in through an unexpected QR code.",
    },
    source: "bank",
  },
];

export function casesFor(device: DeviceId): Case[] {
  return CASE_BANK.filter((c) => c.device === device);
}

/** Pick a bank case for a device, avoiding ids already seen when possible. */
export function pickBankCase(device: DeviceId, seen: string[] = [], rand: () => number = Math.random): Case {
  const all = casesFor(device);
  const fresh = all.filter((c) => !seen.includes(c.id));
  const pool = fresh.length ? fresh : all;
  return structuredClone(pool[Math.floor(rand() * pool.length)]);
}
