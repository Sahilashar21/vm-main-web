"""
E-Paper routes — edition/page/article APIs + AI features
All data stored in MongoDB. Article images on Cloudinary.
"""
import json
import os
import re
from datetime import datetime, timezone
from functools import wraps

from flask import Blueprint, current_app, jsonify, redirect, render_template, request, session, url_for

epaper_bp = Blueprint("epaper", __name__)


# ── Helpers ─────────────────────────────────────────


def _get_editions_col():
    from app.utils.mongo import get_epaper_editions_collection
    return get_epaper_editions_collection()


def _get_logged_in_user():
    user = session.get("auth_user")
    if isinstance(user, dict) and user.get("email"):
        return user
    return None


def _is_admin_user():
    user = _get_logged_in_user()
    return bool(user and str(user.get("role", "")).strip().lower() == "admin")


def _is_api_request():
    return (
        request.path.startswith("/api/")
        or request.is_json
        or request.headers.get("X-Requested-With") == "XMLHttpRequest"
    )


def _is_supported_image_upload(file_storage):
    if not file_storage:
        return False

    signature = file_storage.stream.read(32)
    file_storage.stream.seek(0)

    if signature.startswith(b"\x89PNG\r\n\x1a\n"):  # PNG
        return True
    if signature.startswith(b"\xff\xd8\xff"):  # JPEG
        return True
    if signature[:6] in {b"GIF87a", b"GIF89a"}:  # GIF
        return True
    if signature.startswith(b"RIFF") and signature[8:12] == b"WEBP":  # WEBP
        return True
    return False


def admin_required(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        user = _get_logged_in_user()
        if user is None:
            if _is_api_request():
                return jsonify({"error": "Login required."}), 401

            next_url = request.full_path.rstrip("?") if request.query_string else request.path
            return redirect(url_for("auth.login", next=next_url))

        if not _is_admin_user():
            if _is_api_request():
                return jsonify({"error": "Admin access required."}), 403
            return "Admin access required.", 403

        return view(*args, **kwargs)

    return wrapped


# ── Viewer Page ────────────────────────────────────
@epaper_bp.route("/epaper-viewer")
@epaper_bp.route("/epaper-viewer/<date>")
@epaper_bp.route("/epaper-viewer/<date>/page-<int:page>")
def epaper_viewer(date=None, page=1):
    return render_template("pages/epaper_viewer.html", initial_date=date, initial_page=page)


# ── Admin Page (Region Mapper) ─────────────────────
@epaper_bp.route("/epaper-admin")
@admin_required
def epaper_admin_v2():
    return render_template("admin/epaper_admin_v2.html")


# ── API: List editions ─────────────────────────────
@epaper_bp.route("/api/epaper/editions")
def api_editions():
    col = _get_editions_col()
    editions = list(col.find({}, {"_id": 0}).sort("date", -1))
    return jsonify({"editions": [
        {"date": e["date"], "name": e.get("name", ""), "language": e.get("language", "Hindi"),
         "total_pages": len(e.get("pages", []))}
        for e in editions
    ]})


# ── API: Get edition by date ───────────────────────
@epaper_bp.route("/api/epaper/edition/<date>")
def api_edition(date):
    if not re.match(r"\d{4}-\d{2}-\d{2}$", date):
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    col = _get_editions_col()
    edition = col.find_one({"date": date}, {"_id": 0})

    if not edition:
        return jsonify({"error": "No edition for this date."}), 404

    return jsonify({
        "date": edition["date"],
        "name": edition.get("name", ""),
        "language": edition.get("language", "Hindi"),
        "pages": edition.get("pages", []),
    })


# ── API: Get article ──────────────────────────────
@epaper_bp.route("/api/epaper/article/<article_id>")
def api_article(article_id):
    col = _get_editions_col()
    for ed in col.find({}, {"_id": 0}):
        for page in ed.get("pages", []):
            for art in page.get("articles", []):
                if str(art.get("id")) == str(article_id):
                    return jsonify(art)
    return jsonify({"error": "Article not found."}), 404


# ── API: Create / Update edition (Admin) ───────────
@epaper_bp.route("/api/epaper/admin/edition", methods=["POST"])
@admin_required
def api_create_edition():
    data = request.get_json(silent=True) or {}
    date_str = data.get("date", "")
    if not re.match(r"\d{4}-\d{2}-\d{2}$", date_str):
        return jsonify({"error": "date required (YYYY-MM-DD)."}), 400

    col = _get_editions_col()
    existing = col.find_one({"date": date_str})

    if existing:
        update = {
            "name": data.get("name", existing.get("name", "")),
            "language": data.get("language", existing.get("language", "Hindi")),
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
        if "pages" in data:
            update["pages"] = data["pages"]
        col.update_one({"date": date_str}, {"$set": update})
    else:
        col.insert_one({
            "date": date_str,
            "name": data.get("name", f"Edition {date_str}"),
            "language": data.get("language", "Hindi"),
            "pages": data.get("pages", []),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    return jsonify({"success": True}), 201


# ── API: Delete edition ───────────────────────────
@epaper_bp.route("/api/epaper/admin/edition/<date>", methods=["DELETE"])
@admin_required
def api_delete_edition(date):
    col = _get_editions_col()
    col.delete_one({"date": date})
    return jsonify({"success": True})


# ── API: Upload article image → Cloudinary ─────────
@epaper_bp.route("/api/epaper/admin/upload-image", methods=["POST"])
@admin_required
def api_upload_image():
    photo = request.files.get("image")
    if not photo or photo.filename == "":
        return jsonify({"error": "No image file provided."}), 400

    allowed = {"png", "jpg", "jpeg", "webp", "gif"}
    ext = photo.filename.rsplit(".", 1)[-1].lower() if "." in photo.filename else ""
    if ext not in allowed or not _is_supported_image_upload(photo):
        return jsonify({"error": "Invalid file type."}), 400

    try:
        from app.utils.cloudinary_util import upload_epaper_image
        result = upload_epaper_image(photo)
        if result and result.get("url"):
            return jsonify({"url": result["url"], "public_id": result["public_id"]})
        return jsonify({"error": "Upload failed."}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@epaper_bp.route("/api/epaper/admin/replace-thumbnail", methods=["POST"])
@admin_required
def api_replace_thumbnail():
    photo = request.files.get("image")
    edition_date = (request.form.get("edition_date") or "").strip()
    page_number_raw = (request.form.get("page_number") or "").strip()

    if not re.match(r"\d{4}-\d{2}-\d{2}$", edition_date):
        return jsonify({"error": "edition_date required (YYYY-MM-DD)."}), 400

    try:
        page_number = int(page_number_raw)
    except (TypeError, ValueError):
        return jsonify({"error": "page_number must be a positive integer."}), 400

    if page_number < 1:
        return jsonify({"error": "page_number must be a positive integer."}), 400

    if not photo or photo.filename == "":
        return jsonify({"error": "No image file provided."}), 400

    allowed = {"png", "jpg", "jpeg", "webp", "gif"}
    ext = photo.filename.rsplit(".", 1)[-1].lower() if "." in photo.filename else ""
    if ext not in allowed or not _is_supported_image_upload(photo):
        return jsonify({"error": "Invalid file type."}), 400

    col = _get_editions_col()
    edition = col.find_one({"date": edition_date})
    if not edition:
        return jsonify({"error": "Edition not found."}), 404

    pages = edition.get("pages", [])
    page_index = None
    for idx, page in enumerate(pages):
        try:
            current_page_number = int(page.get("page_number", idx + 1))
        except (TypeError, ValueError):
            current_page_number = idx + 1
        if current_page_number == page_number:
            page_index = idx
            break

    if page_index is None and page_number <= len(pages):
        page_index = page_number - 1

    if page_index is None:
        return jsonify({"error": "Page not found in this edition."}), 404

    try:
        from app.utils.cloudinary_util import upload_epaper_image

        upload_result = upload_epaper_image(
            photo,
            public_id=f"vm_epaper/thumb_{edition_date.replace('-', '')}_p{page_number}",
        )
        thumbnail_url = upload_result.get("url", "")
        if not thumbnail_url:
            return jsonify({"error": "Upload failed."}), 500

        pages[page_index]["thumbnail_url"] = thumbnail_url
        col.update_one(
            {"date": edition_date},
            {"$set": {"pages": pages, "updated_at": datetime.now(timezone.utc).isoformat()}},
        )
        return jsonify({"success": True, "thumbnail_url": thumbnail_url, "page_number": page_number})
    except Exception:
        current_app.logger.exception(
            "Failed to replace thumbnail for edition %s page %s",
            edition_date,
            page_number,
        )
        return jsonify({"error": "Thumbnail replacement failed."}), 500


# ── AI: Translate ──────────────────────────────────
@epaper_bp.route("/api/epaper/translate", methods=["POST"])
def api_translate():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")
    target = data.get("target_lang", "en")

    if not text:
        return jsonify({"error": "No text provided."}), 400

    try:
        from urllib.request import Request, urlopen
        libre_url = os.getenv("LIBRETRANSLATE_URL", "https://libretranslate.de/translate")
        req_body = json.dumps({
            "q": text[:2000],
            "source": "auto",
            "target": target,
            "format": "text",
        }).encode("utf-8")
        req = Request(libre_url, data=req_body, headers={"Content-Type": "application/json"})
        with urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read().decode("utf-8"))
            return jsonify({"translated_text": result.get("translatedText", text)})
    except Exception:
        return jsonify({
            "translated_text": text,
            "note": "Translation API unavailable. Showing original text."
        })


# ── AI: Summarize ──────────────────────────────────
@epaper_bp.route("/api/epaper/summarize", methods=["POST"])
def api_summarize():
    data = request.get_json(silent=True) or {}
    text = data.get("text", "")

    if not text:
        return jsonify({"error": "No text provided."}), 400

    sentences = [s.strip() for s in re.split(r'[।.!?\n]+', text) if s.strip() and len(s.strip()) > 10]

    if not sentences:
        return jsonify({"summary": [text[:200]]})

    if len(sentences) <= 3:
        return jsonify({"summary": sentences})

    stopwords = {'का', 'की', 'के', 'में', 'है', 'हैं', 'को', 'से', 'और', 'पर', 'ने',
                 'एक', 'यह', 'वह', 'भी', 'इस', 'the', 'is', 'a', 'an', 'of', 'in',
                 'to', 'for', 'and', 'on', 'with', 'that', 'this', 'it', 'are', 'was'}
    words = re.findall(r'\w+', text.lower())
    freq = {}
    for w in words:
        if w not in stopwords and len(w) > 2:
            freq[w] = freq.get(w, 0) + 1

    max_freq = max(freq.values()) if freq else 1

    scored = []
    for i, sent in enumerate(sentences):
        score = 0
        sent_words = re.findall(r'\w+', sent.lower())
        for w in sent_words:
            score += freq.get(w, 0) / max_freq
        if i == 0:
            score += 3
        elif i == len(sentences) - 1:
            score += 1.5
        elif i < 3:
            score += 1
        if 20 < len(sent) < 150:
            score += 0.5
        if re.search(r'\d', sent):
            score += 1

        scored.append((score, i, sent))

    scored.sort(key=lambda x: x[0], reverse=True)
    top = sorted(scored[:5], key=lambda x: x[1])
    summary = [s[2] for s in top]

    return jsonify({"summary": summary})


# ── AI: LLM Script Optimization ────────────────────
@epaper_bp.route("/api/epaper/tts-script", methods=["POST"])
def api_tts_script():
    """Use Groq LLM to create a studio-quality news anchor broadcast script for TTS."""
    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()

    if not text:
        return jsonify({"error": "No text provided."}), 400

    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return jsonify({"error": "Groq API key not configured"}), 500

    try:
        from groq import Groq
        client = Groq(api_key=api_key)

        system_prompt = (
            "You are a senior broadcast script writer for India's top news channels "
            "(Aaj Tak, NDTV India, Zee 24 Taas, ABP Maza, Times Now). "
            "Transform raw news text into a broadcast-ready narration script that sounds "
            "exactly like a real live news anchor — not a robot.\n\n"

            "LANGUAGE DETECTION:\n"
            "Detect the primary language: Hindi (हिंदी), Marathi (मराठी), or English.\n"
            "Return \"language\" as: \"hi\" for Hindi, \"mr\" for Marathi, \"en\" for English.\n"
            "Mixed scripts are normal — keep natural code-switching (e.g. English proper nouns in Hindi article).\n\n"

            "MANDATORY TRANSFORMATIONS:\n\n"

            "1. SENTENCE RHYTHM — Break long sentences at natural breath points. "
            "Each sentence max 15 words. Short punchy sentences for impact.\n\n"

            "2. PAUSE INJECTION (critical for realistic delivery):\n"
            "   - After headline: add \"...\" (anchor pause before story)\n"
            "   - After key facts, numbers, names: add \", \" (short beat)\n"
            "   - Between topic shifts in Hindi/Marathi: add \" | \" \n"
            "   - After dramatic statements: add \" — \" \n"
            "   - End of important section: add full stop + new line\n\n"

            "3. NUMBER & SYMBOL CONVERSION:\n"
            "   Hindi/Marathi: ₹50,000 → पचास हजार रुपये | ₹2 crore → दो करोड़ रुपये "
            "| 50% → पचास प्रतिशत | 10 lakh → दस लाख\n"
            "   English: $1M → one million dollars | 10% → ten percent "
            "| 2025 → twenty twenty-five\n\n"

            "4. ABBREVIATION EXPANSION:\n"
            "   Hindi: JEE→जे ई ई | NEET→नीट | IIT→आई आई टी | UP→उत्तर प्रदेश "
            "| CM→मुख्यमंत्री | PM→प्रधानमंत्री | BJP→बी जे पी | MH→महाराष्ट्र\n"
            "   Marathi: JEE→जे ई ई | CM→मुख्यमंत्री | PM→पंतप्रधान | MH→महाराष्ट्र\n"
            "   English: JEE→J-E-E | IIT→I-I-T | CM→Chief Minister | PM→Prime Minister\n\n"

            "5. ANCHOR TONE BY LANGUAGE:\n"
            "   Hindi (Aaj Tak style): आदरपूर्ण, स्पष्ट उच्चारण, थोड़ी urgency। "
            "वाक्य छोटे और प्रभावशाली। \'है\' and \'हैं\' pronounced clearly.\n"
            "   Marathi (Zee 24 Taas style): स्पष्ट मराठी उच्चारण, Mumbaiya नाही। "
            "\'आहे\' not \'आये\', \'होते\' clearly. Standard Pune-style Marathi diction.\n"
            "   English (NDTV style): Crisp neutral Indian English. Measured pace. "
            "Proper stress on key words.\n\n"

            "6. OPENING FORMAT (mandatory):\n"
            "   Hindi: Start with \"एक बड़ी खबर... \" or \"ताज़ा जानकारी के मुताबिक... \"\n"
            "   Marathi: Start with \"महत्त्वाची बातमी... \" or \"ताज्या माहितीनुसार... \"\n"
            "   English: Start with \"Breaking news — \" or \"In a major development, \"\n\n"

            "7. VOICE STYLE (choose one based on story tone):\n"
            "   Breaking/urgent: speed=1.0, pitch=\"+2Hz\"\n"
            "   Education/results: speed=0.95, pitch=\"+0Hz\"\n"
            "   Government/policy: speed=0.92, pitch=\"-2Hz\"\n"
            "   Positive/achievement: speed=1.0, pitch=\"+3Hz\"\n\n"

            "Return ONLY valid JSON — no markdown, no extra text:\n"
            "{ \"language\": \"hi|mr|en\", \"title_script\": \"...\"," 
            "\"body_script\": \"...\","
            "\"voice_style\": { \"speed\": 0.95, \"pitch\": \"+0Hz\","
            "\"emotion\": \"calm-authoritative\", \"pause_style\": \"short after facts\" } }"
        )

        response = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Raw News Article:\n\n{text[:4000]}"}
            ],
            model=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=2000,
        )
        import json
        result = json.loads(response.choices[0].message.content)
        return jsonify(result)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"LLM script optimization failed: {str(e)}"}), 500


# ── AI: TTS (Edge Neural Voices — Real Indian Anchor) ──
@epaper_bp.route("/api/epaper/tts", methods=["POST"])
def api_tts():
    """Server-side TTS using Microsoft Edge Neural voices.
    Supports Hindi, Marathi, and English with authentic Indian news anchor voices.
    Returns MP3 audio stream.
    """
    import asyncio
    import io
    from flask import send_file

    data = request.get_json(silent=True) or {}
    text = data.get("text", "").strip()
    voice = data.get("voice", "")   # optional frontend override
    rate = data.get("rate", "+0%")  # e.g. "+10%", "-5%"
    pitch = data.get("pitch", "+0Hz")

    if not text:
        return jsonify({"error": "No text provided."}), 400

    text = text[:6000]  # slightly higher limit for longer articles

    # ── Language detection ───────────────────────────────────────────────────
    # Devanagari script covers both Hindi and Marathi (U+0900–U+097F)
    devanagari_chars = len(re.findall(r'[\u0900-\u097F]', text))
    devanagari_ratio = devanagari_chars / max(len(text), 1)

    # Marathi-distinctive words/patterns
    MARATHI_WORDS = [
        'आहे', 'नाही', 'आणि', 'मला', 'आपण', 'होते', 'केले', 'झाले',
        'त्यांनी', 'म्हणाले', 'यावर', 'यामुळे', 'सांगितले', 'महाराष्ट्र',
        'पुणे', 'मुंबई', 'नागपूर', 'ठाणे', 'सरकार', 'विद्यार्थी'
    ]
    HINDI_WORDS = [
        'है', 'नहीं', 'और', 'था', 'हैं', 'यह', 'हो', 'उन्होंने',
        'कहा', 'इससे', 'इसलिए', 'बताया', 'राज्य', 'सरकार'
    ]
    marathi_hits = sum(1 for w in MARATHI_WORDS if w in text)
    hindi_hits = sum(1 for w in HINDI_WORDS if w in text)

    if not voice:
        if devanagari_ratio > 0.3:
            if marathi_hits > hindi_hits:
                # Marathi — male anchor: deep, clear standard Marathi
                voice = "mr-IN-ManoharNeural"
                if rate == "+0%": rate = "-5%"
                if pitch == "+0Hz": pitch = "-2Hz"
            else:
                # Hindi — Aaj Tak style male anchor: authoritative
                voice = "hi-IN-MadhurNeural"
                if rate == "+0%": rate = "-5%"
                if pitch == "+0Hz": pitch = "-3Hz"
        else:
            # English — NDTV India style male anchor: crisp, measured
            voice = "en-IN-PrabhatNeural"
            if rate == "+0%": rate = "-5%"
            if pitch == "+0Hz": pitch = "-2Hz"
    else:
        # Frontend selected a voice — apply language-specific defaults
        _voice_defaults = {
            "hi-IN-MadhurNeural":  ("-5%", "-3Hz"),
            "hi-IN-SwaraNeural":   ("-3%", "+0Hz"),
            "mr-IN-ManoharNeural": ("-5%", "-2Hz"),
            "mr-IN-AarohiNeural":  ("-3%", "+0Hz"),
            "en-IN-PrabhatNeural": ("-5%", "-2Hz"),
            "en-IN-NeerjaNeural":  ("-3%", "+0Hz"),
        }
        if voice in _voice_defaults and rate == "+0%" and pitch == "+0Hz":
            rate, pitch = _voice_defaults[voice]

    # Normalise rate from float if needed
    if isinstance(rate, (int, float)):
        pct = int((rate - 1) * 100)
        rate = f"+{pct}%" if pct >= 0 else f"{pct}%"

    async def _generate_audio():
        import edge_tts
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
        return audio_data

    try:
        loop = asyncio.new_event_loop()
        audio_bytes = loop.run_until_complete(_generate_audio())
        loop.close()

        if not audio_bytes:
            return jsonify({"error": "TTS generation failed — no audio returned."}), 500

        return send_file(
            io.BytesIO(audio_bytes),
            mimetype="audio/mpeg",
            as_attachment=False,
            download_name="tts_audio.mp3",
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"TTS error: {str(e)}"}), 500


# ── API: Available TTS voices ──────────────────────
@epaper_bp.route("/api/epaper/tts/voices")
def api_tts_voices():
    """Return available Indian voice options for the frontend voice selector."""
    return jsonify({"voices": [
        {"id": "hi-IN-MadhurNeural",  "name": "माधुर (Hindi Male)",    "lang": "hi", "gender": "male",   "style": "News Anchor",  "default_rate": "-5%", "default_pitch": "-3Hz"},
        {"id": "hi-IN-SwaraNeural",   "name": "स्वरा (Hindi Female)",  "lang": "hi", "gender": "female", "style": "News Anchor",  "default_rate": "-3%", "default_pitch": "+0Hz"},
        {"id": "mr-IN-ManoharNeural", "name": "मनोहर (Marathi Male)",  "lang": "mr", "gender": "male",   "style": "News Anchor",  "default_rate": "-5%", "default_pitch": "-2Hz"},
        {"id": "mr-IN-AarohiNeural",  "name": "आरोही (Marathi Female)","lang": "mr", "gender": "female", "style": "Professional", "default_rate": "-3%", "default_pitch": "+0Hz"},
        {"id": "en-IN-PrabhatNeural", "name": "Prabhat (English Male)", "lang": "en", "gender": "male",   "style": "News Anchor",  "default_rate": "-5%", "default_pitch": "-2Hz"},
        {"id": "en-IN-NeerjaNeural",  "name": "Neerja (English Female)","lang": "en", "gender": "female", "style": "Professional", "default_rate": "-3%", "default_pitch": "+0Hz"},
    ]})
