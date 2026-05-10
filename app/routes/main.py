"""
Main public page routes: home, blog, news, feedback, contact, etc.
"""
from flask import Blueprint, flash, jsonify, redirect, render_template, request, url_for


main_bp = Blueprint("main", __name__)


@main_bp.route("/")
def index():
    return render_template("pages/index.html")


@main_bp.route("/blog")
def blog():
    return render_template("pages/blogs.html")


@main_bp.route("/epaper")
def epaper():
    return render_template("pages/epaper.html")


@main_bp.route("/api/epaper-feed")
def epaper_feed():
    """Serve ALL e-paper editions (legacy PDFs + Studio articles) from MongoDB."""
    from app.utils.mongo import get_epaper_legacy_collection, get_epaper_editions_collection

    editions = []

    # 1) Legacy PDF uploads (from admin Legacy E-Paper Upload tab)
    legacy_col = get_epaper_legacy_collection()
    for e in legacy_col.find({}).sort("created_at", -1):
        editions.append({
            "id": str(e["_id"]),
            "type": "pdf",
            "lang": e.get("lang", "Marathi"),
            "week": e.get("week", ""),
            "start": e.get("start", ""),
            "end": e.get("end", ""),
            "tags": e.get("tags", []),
            "is_new": e.get("is_new", False),
            "pdf": e.get("pdf_url", ""),
            "pdf_url": e.get("pdf_url", ""),
            "page_images": e.get("page_images", []),
            "image_profile": e.get("image_profile", {}),
            "created_at": e["created_at"].isoformat() if hasattr(e.get("created_at", ""), "isoformat") else str(e.get("created_at", "")),
        })

    # 2) E-Paper Studio editions (article-based, from E-Paper Studio admin)
    studio_col = get_epaper_editions_collection()
    for e in studio_col.find({}).sort("date", -1):
        total_pages = len(e.get("pages", []))
        total_articles = sum(len(p.get("articles", [])) for p in e.get("pages", []))
        editions.append({
            "id": e.get("date", str(e["_id"])),
            "type": "studio",
            "lang": e.get("language", "Hindi"),
            "week": e.get("name", ""),
            "start": e.get("date", ""),
            "end": e.get("date", ""),
            "tags": ["E-Paper Studio"],
            "is_new": True,
            "pdf": "",
            "pdf_url": "",
            "viewer_url": f"/epaper-viewer/{e.get('date', '')}",
            "total_pages": total_pages,
            "total_articles": total_articles,
            "created_at": e.get("date", ""),
        })

    # Sort all editions by created_at descending (newest first)
    editions.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    return jsonify(editions)



@main_bp.route("/fyjc_rank")
def fyjc_rank():
    return render_template("pages/fyjc_rank.html")


@main_bp.route("/admissions")
def admissions():
    return render_template("pages/admissions.html")


@main_bp.route("/news")
def news():
    initial_articles = []
    category_labels = {
        "entrance": "Entrance Exams",
        "results": "Results",
        "admissions": "Admissions",
        "govtjobs": "Govt Jobs",
        "scholarship": "Scholarships",
    }
    try:
        from app.routes.news import _get_all_news
        initial_articles = _get_all_news()[:9]
    except Exception:
        pass

    return render_template("pages/news.html", initial_articles=initial_articles, category_labels=category_labels)


@main_bp.route("/exam-updates")
def exam_updates():
    return render_template("pages/exam-updates.html")


@main_bp.route("/stories")
@main_bp.route("/student-stories")
def student_stories():
    return render_template("pages/student-stories.html")


@main_bp.route("/submit_story")
@main_bp.route("/submit-story")
def submit_story():
    return render_template("pages/submit_story.html")


@main_bp.route("/feedback", methods=["GET", "POST"])
def feedback():
    if request.method == "POST":
        required_fields = ["u_name", "u_mobile", "u_email", "u_designation", "u_feedback"]
        missing_fields = [f for f in required_fields if not request.form.get(f, "").strip()]
        if missing_fields:
            flash("Please fill all required fields before submitting.", "error")
            return render_template("pages/feedback.html")
        flash("Feedback submitted successfully. Thank you!", "success")
        return redirect(url_for("main.feedback"))
    return render_template("pages/feedback.html")


@main_bp.route("/chatbot")
def chatbot():
    return render_template("pages/chatbot.html")


@main_bp.route("/guideme", methods=["GET", "POST"])
@main_bp.route("/guide-me", methods=["GET", "POST"])
def guide_me():
    if request.method == "POST":
        required_fields = ["full_name", "whatsapp", "email", "address", "requirement_type"]
        missing_fields = [f for f in required_fields if not request.form.get(f, "").strip()]
        if missing_fields:
            flash("Please complete all required Guide Me form fields.", "error")
            return render_template("pages/GuideMe1.html")
        flash("Guide Me form submitted successfully.", "success")
        return redirect(url_for("main.guide_me"))
    return render_template("pages/GuideMe1.html")


@main_bp.route("/refund-policy")
def refund_policy():
    return render_template("pages/refund.html")


@main_bp.route("/joinus")
@main_bp.route("/join-us")
def join_us():
    return render_template("pages/joinus VM.html")


@main_bp.route("/contact")
@main_bp.route("/contact-us")
def contact():
    return render_template("pages/contact-us.html")


@main_bp.route("/send-message", methods=["POST"])
def send_message():
    data = request.get_json()
    name = data.get("name", "").strip()
    email = data.get("email", "").strip()
    message = data.get("message", "").strip()

    if not name or not email or not message:
        return jsonify({"success": False, "error": "Name, email, and message are required."}), 400

    return jsonify({"success": True, "message": "Your message has been received. We will get back to you shortly."}), 200


@main_bp.route("/mock-exams")
def mock_exams():
    exams = ["JEE", "NEET", "MHT-CET", "CAT", "GATE", "CLAT"]
    streams = [
        {"name": "Engineering", "class": "engineering", "icon": "fa-microchip"},
        {"name": "Medical", "class": "medical", "icon": "fa-user-md"},
        {"name": "Management", "class": "management", "icon": "fa-chart-pie"},
        {"name": "Banking", "class": "banking", "icon": "fa-university"},
    ]
    return render_template("pages/mock_exams.html", exams=exams, streams=streams)


@main_bp.route("/entrance-exams")
def entrance_exams():
    return render_template("pages/entrance-exams.html")
