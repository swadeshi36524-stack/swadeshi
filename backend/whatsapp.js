const https = require('https');
const pool = require('./db');

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';

const GRAPH_HOST = 'graph.facebook.com';

/**
 * Low-level sender for the Meta WhatsApp Cloud API.
 * Never logs the token or full payloads that could contain secrets.
 */
function callWhatsAppApi(payload) {
  return new Promise((resolve, reject) => {
    if (!WHATSAPP_TOKEN || !PHONE_NUMBER_ID) {
      return reject(new Error('WhatsApp credentials are not configured (WHATSAPP_TOKEN / WHATSAPP_PHONE_NUMBER_ID).'));
    }

    const body = JSON.stringify(payload);
    const options = {
      host: GRAPH_HOST,
      path: `/${VERSION}/${PHONE_NUMBER_ID}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseBody));
          } catch (err) {
            resolve({ raw: responseBody });
          }
        } else {
          console.error(`[WhatsApp] API error ${res.statusCode}:`, responseBody);
          reject(new Error(`WhatsApp API responded with ${res.statusCode}`));
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(15000, () => {
      req.destroy(new Error('WhatsApp API request timed out'));
    });
    req.write(body);
    req.end();
  });
}

/** Send a plain text message. */
async function sendText(to, text) {
  return callWhatsAppApi({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'text',
    text: { preview_url: false, body: text }
  });
}

/**
 * Send an interactive reply-buttons message.
 * WhatsApp allows at most 3 reply buttons.
 */
async function sendButtons(to, text, buttons) {
  return callWhatsAppApi({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text },
      action: {
        buttons: buttons.slice(0, 3).map((b) => ({
          type: 'reply',
          reply: { id: b.id, title: b.title.slice(0, 20) }
        }))
      }
    }
  });
}

/**
 * Send an interactive list message.
 * Each section may hold up to 10 rows total in WhatsApp.
 */
async function sendList(to, headerText, bodyText, buttonText, sections) {
  const interactive = {
    type: 'list',
    body: { text: bodyText },
    action: {
      button: buttonText.slice(0, 20),
      sections
    }
  };
  if (headerText) {
    interactive.header = { type: 'text', text: headerText.slice(0, 60) };
  }

  return callWhatsAppApi({
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to,
    type: 'interactive',
    interactive
  });
}

// ---------------------------------------------------------------------------
// Session persistence (per customer phone number)
// ---------------------------------------------------------------------------

async function getSession(phoneNumber) {
  const { rows } = await pool.query(
    'SELECT * FROM whatsapp_sessions WHERE phone_number = $1',
    [phoneNumber]
  );
  return rows[0] || null;
}

async function saveSession(phoneNumber, data) {
  const {
    language = null,
    state = 'START',
    last_category = null,
    last_product_id = null,
    pagination_offset = 0
  } = data || {};

  await pool.query(
    `INSERT INTO whatsapp_sessions
       (phone_number, language, state, last_category, last_product_id, pagination_offset, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (phone_number) DO UPDATE SET
       language = EXCLUDED.language,
       state = EXCLUDED.state,
       last_category = EXCLUDED.last_category,
       last_product_id = EXCLUDED.last_product_id,
       pagination_offset = EXCLUDED.pagination_offset,
       updated_at = NOW()`,
    [phoneNumber, language, state, last_category, last_product_id, pagination_offset || 0]
  );
}

// ---------------------------------------------------------------------------
// Idempotency: WhatsApp may deliver the same webhook more than once.
// We remember recently processed message IDs so duplicates are ignored.
// ---------------------------------------------------------------------------

const processedMessageIds = new Set();
const MAX_TRACKED_IDS = 2000;

function isDuplicateMessage(messageId) {
  if (!messageId) return false;
  if (processedMessageIds.has(messageId)) return true;
  processedMessageIds.add(messageId);
  if (processedMessageIds.size > MAX_TRACKED_IDS) {
    const oldest = processedMessageIds.values().next().value;
    processedMessageIds.delete(oldest);
  }
  return false;
}

module.exports = {
  sendText,
  sendButtons,
  sendList,
  getSession,
  saveSession,
  isDuplicateMessage
};