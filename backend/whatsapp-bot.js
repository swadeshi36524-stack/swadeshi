const {
  sendText,
  sendButtons,
  sendList,
  getSession,
  saveSession,
  isDuplicateMessage
} = require('./whatsapp');
const pool = require('./db');

// ---------------------------------------------------------------------------
// Localization strings. Adding a new language = add one entry here + one
// button in the language menu below. No other code changes required.
// ---------------------------------------------------------------------------
const LANGUAGES = {
  lang_en: {
    welcome: 'Welcome to Swadeshi Natural Products! Please choose your language:',
    menu_body: 'How can we help you today?',
    browse_cats: 'Browse Categories',
    ask_question: 'Ask a Question',
    select_cat: 'Select a Category',
    select_prod: 'Select a Product',
    products_in: 'Products in',
    navigation: 'Navigation',
    next: 'Next Products',
    prev: 'Previous Products',
    back_menu: 'Back to Main Menu',
    in_stock: 'In Stock',
    out_of_stock: 'Out of Stock',
    price: 'Price',
    mrp: 'MRP',
    pack: 'Pack',
    sku: 'SKU',
    delivery: 'Delivery',
    status: 'Status',
    no_categories: 'No categories are available right now. Please try again later.',
    no_products: 'No products were found in this category.',
    ask_prompt: 'Please type your question and I will do my best to help.',
    anything_else: 'Is there anything else I can assist you with?',
    fallback: "Sorry, I didn't understand that. Please use the options below.",
    qa_no_match: "I'm not confident I can answer that. For detailed help please contact our team at +91 9030036524.",
    qa_found: 'Here is what I found:',
    error: 'Something went wrong on our side. Please try again in a moment.'
  },
  lang_hi: {
    welcome: 'स्वदेशी नेचुरल प्रोडक्ट्स में आपका स्वागत है! कृपया अपनी भाषा चुनें:',
    menu_body: 'आज हम आपकी कैसे मदद कर सकते हैं?',
    browse_cats: 'श्रेणियाँ देखें',
    ask_question: 'प्रश्न पूछें',
    select_cat: 'एक श्रेणी चुनें',
    select_prod: 'एक उत्पाद चुनें',
    products_in: 'उत्पाद -',
    navigation: 'नेविगेशन',
    next: 'अगले उत्पाद',
    prev: 'पिछले उत्पाद',
    back_menu: 'मुख्य मेनू पर वापस जाएँ',
    in_stock: 'स्टॉक में है',
    out_of_stock: 'स्टॉक में नहीं है',
    price: 'कीमत',
    mrp: 'एमआरपी',
    pack: 'पैक',
    sku: 'एसकेयू',
    delivery: 'डिलीवरी',
    status: 'स्थिति',
    no_categories: 'अभी कोई श्रेणी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',
    no_products: 'इस श्रेणी में कोई उत्पाद नहीं मिला।',
    ask_prompt: 'कृपया अपना प्रश्न लिखें, मैं पूरी कोशिश करूँगा कि मदद कर सकूँ।',
    anything_else: 'क्या मैं आपकी किसी और चीज़ में सहायता कर सकता हूँ?',
    fallback: 'क्षमा करें, मैं समझ नहीं पाया। कृपया नीचे दिए विकल्पों का उपयोग करें।',
    qa_no_match: 'मुझे इसका पक्का उत्तर नहीं पता। विस्तृत सहायता के लिए कृपया हमारी टीम से संपर्क करें: +91 9030036524।',
    qa_found: 'मुझे यह मिला:',
    error: 'हमारी ओर से कुछ गलत हो गया। कृपया थोड़ी देर बाद पुनः प्रयास करें।'
  },
  lang_te: {
    welcome: 'స్వదేశీ నేచురల్ ప్రొడక్ట్స్‌కు స్వాగతం! దయచేసి మీ భాషను ఎంచుకోండి:',
    menu_body: 'ఈరోజు మేము మీకు ఎలా సహాయపడగలము?',
    browse_cats: 'కేటగిరీలను చూడండి',
    ask_question: 'ప్రశ్న అడగండి',
    select_cat: 'ఒక కేటగిరీని ఎంచుకోండి',
    select_prod: 'ఒక ఉత్పత్తిని ఎంచుకోండి',
    products_in: 'ఉత్పత్తులు -',
    navigation: 'నావిగేషన్',
    next: 'తదుపరి ఉత్పత్తులు',
    prev: 'మునుపటి ఉత్పత్తులు',
    back_menu: 'ప్రధాన మెనూకు తిరిగి వెళ్ళండి',
    in_stock: 'స్టాక్ ఉంది',
    out_of_stock: 'స్టాక్ లేదు',
    price: 'ధర',
    mrp: 'ఎంఆర్‌పీ',
    pack: 'ప్యాక్',
    sku: 'ఎస్‌కేయూ',
    delivery: 'డెలివరీ',
    status: 'స్థితి',
    no_categories: 'ప్రస్తుతం కేటగిరీలు అందుబాటులో లేవు. దయచేసి కొంత సమయం తర్వాత ప్రయత్నించండి.',
    no_products: 'ఈ కేటగిరీలో ఉత్పత్తులు కనుగొనబడలేదు.',
    ask_prompt: 'దయచేసి మీ ప్రశ్నను టైప్ చేయండి, నేను సహాయం చేయడానికి ప్రయత్నిస్తాను.',
    anything_else: 'నేను మీకు ఇంకా ఏదైనా సహాయం చేయగలనా?',
    fallback: 'క్షమించండి, నాకు అర్థం కాలేదు. దయచేసి క్రింది ఎంపికలను ఉపయోగించండి.',
    qa_no_match: 'దీనికి ఖచ్చితమైన సమాధానం నా దగ్గర లేదు. వివరమైన సహాయం కోసం మా టీమ్‌ను సంప్రదించండి: +91 9030036524.',
    qa_found: 'నాకు ఇది దొరికింది:',
    error: 'మా వైపు ఏదో తప్పు జరిగింది. దయచేసి కొద్దిసేపటి తర్వాత ప్రయత్నించండి.'
  }
};

const LANGUAGE_BUTTONS = [
  { id: 'lang_en', title: 'English' },
  { id: 'lang_hi', title: 'Hindi' },
  { id: 'lang_te', title: 'Telugu' }
];

// WhatsApp allows max 10 rows per list. We reserve 1 slot for navigation.
const PAGE_SIZE = 9;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function t(session) {
  return LANGUAGES[session.language] || LANGUAGES.lang_en;
}

function isRestart(text) {
  return text === 'hi' || text === 'hello' || text === 'hey' || text === 'start';
}

async function askLanguage(from) {
  await sendButtons(from, LANGUAGES.lang_en.welcome, LANGUAGE_BUTTONS);
}

// ---------------------------------------------------------------------------
// Screens
// ---------------------------------------------------------------------------
async function showMainMenu(from, session) {
  const lang = t(session);
  session.state = 'MAIN_MENU';
  session.pagination_offset = 0;
  session.last_category = null;
  session.last_product_id = null;
  await saveSession(from, session);

  await sendButtons(from, lang.menu_body, [
    { id: 'browse_cats', title: lang.browse_cats },
    { id: 'ask_question', title: lang.ask_question }
  ]);
}

async function showCategories(from, session) {
  const lang = t(session);

  // Categories are derived from the live products table so admin changes
  // are reflected automatically. Empty categories are simply never shown.
  const { rows } = await pool.query(
    `SELECT cat, MAX(cat_label) AS cat_label, COUNT(*) AS total
       FROM products
      WHERE active = true
      GROUP BY cat
      ORDER BY MAX(cat_label)`
  );

  if (!rows.length) {
    await sendText(from, lang.no_categories);
    return showMainMenu(from, session);
  }

  const sections = [{
    title: lang.browse_cats,
    rows: rows.slice(0, 10).map((r) => ({
      id: `cat_${r.cat}`,
      title: String(r.cat_label || r.cat).slice(0, 24),
      description: `${r.total}`
    }))
  }];

  session.state = 'BROWSING_CATS';
  await saveSession(from, session);

  await sendList(from, lang.browse_cats, lang.select_cat, lang.browse_cats, sections);
}

async function showProducts(from, session) {
  const lang = t(session);
  const cat = session.last_category;
  const offset = session.pagination_offset || 0;

  // Fetch one extra row to detect whether a next page exists.
  const { rows } = await pool.query(
    `SELECT id, name, price, stock
       FROM products
      WHERE cat = $1 AND active = true
      ORDER BY name
      LIMIT $2 OFFSET $3`,
    [cat, PAGE_SIZE + 1, offset]
  );

  const hasMore = rows.length > PAGE_SIZE;
  const products = rows.slice(0, PAGE_SIZE);

  if (!products.length) {
    await sendText(from, lang.no_products);
    return showCategories(from, session);
  }

  const sections = [{
    title: `${lang.products_in} ${cat}`.slice(0, 24),
    rows: products.map((p) => ({
      id: `prod_${p.id}`,
      title: String(p.name).slice(0, 24),
      description: `₹${p.price} · ${Number(p.stock) > 0 ? lang.in_stock : lang.out_of_stock}`
    }))
  }];

  session.state = 'BROWSING_PRODS';
  await saveSession(from, session);

  await sendList(from, cat, lang.select_prod, lang.select_prod, sections);

  // Navigation buttons (WhatsApp lists allow only one action button, so
  // pagination and back are delivered as a follow-up button message).
  const navButtons = [];
  if (offset > 0) navButtons.push({ id: 'prev_prods', title: lang.prev });
  if (hasMore) navButtons.push({ id: 'next_prods', title: lang.next });
  navButtons.push({ id: 'back_menu', title: lang.back_menu });

  await sendButtons(from, lang.navigation, navButtons);
}

async function showProductDetails(from, session, productId) {
  const lang = t(session);

  // Always read the freshest record so price/stock match the admin panel.
  const { rows } = await pool.query(
    'SELECT * FROM products WHERE id = $1 AND active = true',
    [productId]
  );
  const p = rows[0];

  if (!p) {
    await sendText(from, lang.no_products);
    return showCategories(from, session);
  }

  const price = Number(p.price);
  const oldPrice = Number(p.old_price);
  const inStock = Number(p.stock) > 0;

  let detail = `*${p.name}*\n`;
  if (p.title && p.title !== p.name) detail += `${p.title}\n`;

  detail += `\n💰 *${lang.price}:* ₹${price}`;
  if (oldPrice > price) {
    detail += `  (${lang.mrp}: ₹${oldPrice}, ${Number(p.discount)}% OFF)`;
  }
  detail += `\n📦 *${lang.status}:* ${inStock ? lang.in_stock : lang.out_of_stock}`;
  if (p.telugu) detail += `\n🧾 *${lang.pack}:* ${p.telugu}`;
  detail += `\n🏷️ *${lang.sku}:* ${p.id}`;
  if (p.delivery) detail += `\n🚚 *${lang.delivery}:* ${p.delivery}`;
  if (p.description) detail += `\n\n${p.description}`;

  await sendText(from, detail);

  session.state = 'PRODUCT_DETAILS';
  session.last_product_id = productId;
  await saveSession(from, session);

  // Requirement: this final screen exposes EXACTLY ONE option.
  await sendButtons(from, lang.anything_else, [
    { id: 'back_menu', title: lang.back_menu }
  ]);
}

async function handleQuestion(from, session, question) {
  const lang = t(session);

  if (!question || !question.trim()) {
    await sendText(from, lang.ask_prompt);
    session.state = 'ASK_QUESTION';
    await saveSession(from, session);
    return;
  }

  // Search the live catalogue for a confident, data-backed answer.
  const { rows } = await pool.query(
    `SELECT name, price, stock
       FROM products
      WHERE active = true
        AND (name ILIKE $1 OR description ILIKE $1 OR cat_label ILIKE $1)
      ORDER BY name
      LIMIT 5`,
    [`%${question.trim()}%`]
  );

  if (rows.length) {
    let answer = `${lang.qa_found}\n\n`;
    rows.forEach((p) => {
      answer += `• *${p.name}*: ₹${p.price} (${Number(p.stock) > 0 ? lang.in_stock : lang.out_of_stock})\n`;
    });
    await sendText(from, answer);
  } else {
    await sendText(from, lang.qa_no_match);
  }

  session.state = 'ASK_QUESTION';
  await saveSession(from, session);

  await sendButtons(from, lang.anything_else, [
    { id: 'back_menu', title: lang.back_menu }
  ]);
}

// ---------------------------------------------------------------------------
// Main entry point called by the webhook route
// ---------------------------------------------------------------------------
async function handleWhatsAppWebhook(payload) {
  try {
    const value = payload?.entry?.[0]?.changes?.[0]?.value;
    const messages = value?.messages;

    if (!Array.isArray(messages) || !messages.length) return;

    const message = messages[0];

    // Idempotency: ignore duplicate deliveries of the same message ID.
    if (isDuplicateMessage(message.id)) return;

    const from = message.from;
    const text = message.text?.body?.trim().toLowerCase();
    const buttonId = message.interactive?.button_reply?.id;
    const listId = message.interactive?.list_reply?.id;

    let session = (await getSession(from)) || { phone_number: from, state: 'START', language: null };

    // Restart whenever the customer greets the bot.
    if (isRestart(text)) {
      session.state = 'AWAITING_LANGUAGE';
      session.language = session.language || null;
      await saveSession(from, session);
      return askLanguage(from);
    }

    // First contact (or an interrupted session without language) -> ask language.
    if (session.state === 'START' && !session.language) {
      session.state = 'AWAITING_LANGUAGE';
      await saveSession(from, session);
      return askLanguage(from);
    }

    const lang = t(session);

    switch (session.state) {
      case 'AWAITING_LANGUAGE': {
        if (buttonId && LANGUAGES[buttonId]) {
          session.language = buttonId;
          await showMainMenu(from, session);
        } else {
          await askLanguage(from);
        }
        break;
      }

      case 'MAIN_MENU': {
        if (buttonId === 'browse_cats') {
          await showCategories(from, session);
        } else if (buttonId === 'ask_question') {
          session.state = 'ASK_QUESTION';
          await saveSession(from, session);
          await sendText(from, lang.ask_prompt);
        } else if (buttonId === 'back_menu') {
          await showMainMenu(from, session);
        } else {
          await sendButtons(from, lang.fallback, [
            { id: 'browse_cats', title: lang.browse_cats },
            { id: 'ask_question', title: lang.ask_question }
          ]);
        }
        break;
      }

      case 'BROWSING_CATS': {
        if (listId && listId.startsWith('cat_')) {
          session.last_category = listId.slice(4);
          session.pagination_offset = 0;
          await showProducts(from, session);
        } else if (buttonId === 'back_menu') {
          await showMainMenu(from, session);
        } else {
          await showCategories(from, session);
        }
        break;
      }

      case 'BROWSING_PRODS': {
        if (listId && listId.startsWith('prod_')) {
          await showProductDetails(from, session, listId.slice(5));
        } else if (buttonId === 'next_prods') {
          session.pagination_offset = (session.pagination_offset || 0) + PAGE_SIZE;
          await saveSession(from, session);
          await showProducts(from, session);
        } else if (buttonId === 'prev_prods') {
          session.pagination_offset = Math.max(0, (session.pagination_offset || 0) - PAGE_SIZE);
          await saveSession(from, session);
          await showProducts(from, session);
        } else if (buttonId === 'back_menu') {
          await showMainMenu(from, session);
        } else {
          await showProducts(from, session);
        }
        break;
      }

      case 'PRODUCT_DETAILS': {
        if (buttonId === 'back_menu') {
          await showMainMenu(from, session);
        } else {
          await sendButtons(from, lang.anything_else, [
            { id: 'back_menu', title: lang.back_menu }
          ]);
        }
        break;
      }

      case 'ASK_QUESTION': {
        if (buttonId === 'back_menu') {
          await showMainMenu(from, session);
        } else {
          await handleQuestion(from, session, message.text?.body);
        }
        break;
      }

      default: {
        await showMainMenu(from, session);
      }
    }
  } catch (err) {
    console.error('[WhatsApp] Bot error:', err.message || err);
  }
}

module.exports = {
  handleWhatsAppWebhook
};