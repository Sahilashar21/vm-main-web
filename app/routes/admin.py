"""
Admin routes: admin panel, legacy e-paper upload, excel upload, user management.
All data stored in MongoDB + Cloudinary. No external API dependencies.
"""
import os
import io
import re
import tempfile
import uuid
from datetime import datetime, timezone

from flask import Blueprint, flash, jsonify, redirect, render_template, request, url_for

from app.services.auth_service import admin_required, get_logged_in_user, get_otp_provider
from app.constants.upload_tables import UPLOAD_TARGET_TABLES

admin_bp = Blueprint("admin", __name__)
THUMBNAIL_DPI = 72
FULL_PAGE_DPI = 300
BYTES_PER_MB = 1024 * 1024


def _safe_public_id_part(value):
    cleaned = re.sub(r"[^a-zA-Z0-9_-]+", "-", (value or "").strip())
    return cleaned.strip("-") or "edition"


def _extract_pdf_pages_to_images(pdf_bytes, lang, week):
    try:
        import fitz  # PyMuPDF
    except ImportError as exc:
        raise RuntimeError("PyMuPDF is required for PDF page extraction.") from exc

    from app.utils.cloudinary_util import upload_epaper_page_image

    page_images = []
    thumb_total = 0
    full_total = 0

    with tempfile.TemporaryDirectory() as tmp_dir:
        pdf_path = os.path.join(tmp_dir, "edition.pdf")
        with open(pdf_path, "wb") as pdf_out:
            pdf_out.write(pdf_bytes)

        doc = fitz.open(pdf_path)
        try:
            base_id = f"{_safe_public_id_part(lang)}-{_safe_public_id_part(week)}-{uuid.uuid4().hex[:10]}"

            for page_number, page in enumerate(doc, start=1):
                thumb_path = os.path.join(tmp_dir, f"p{page_number:03d}_thumb.jpg")
                full_path = os.path.join(tmp_dir, f"p{page_number:03d}_full.jpg")

                page.get_pixmap(dpi=THUMBNAIL_DPI, alpha=False).save(thumb_path, jpg_quality=88)
                page.get_pixmap(dpi=FULL_PAGE_DPI, alpha=False).save(full_path, jpg_quality=95)

                thumb_size = os.path.getsize(thumb_path)
                full_size = os.path.getsize(full_path)
                thumb_total += thumb_size
                full_total += full_size

                thumb_upload = upload_epaper_page_image(
                    thumb_path,
                    public_id=f"{base_id}_p{page_number:03d}_thumb_{THUMBNAIL_DPI}dpi",
                )
                full_upload = upload_epaper_page_image(
                    full_path,
                    public_id=f"{base_id}_p{page_number:03d}_full_{FULL_PAGE_DPI}dpi",
                )

                page_images.append({
                    "page_number": page_number,
                    "thumbnail_url": thumb_upload.get("url", ""),
                    "thumbnail_public_id": thumb_upload.get("public_id", ""),
                    "fullres_url": full_upload.get("url", ""),
                    "fullres_public_id": full_upload.get("public_id", ""),
                    "thumbnail_dpi": THUMBNAIL_DPI,
                    "fullres_dpi": FULL_PAGE_DPI,
                    "thumbnail_size_bytes": thumb_size,
                    "fullres_size_bytes": full_size,
                })
        finally:
            doc.close()

    return {
        "page_images": page_images,
        "total_pages": len(page_images),
        "thumbnail_total_bytes": thumb_total,
        "fullres_total_bytes": full_total,
    }


@admin_bp.route("/admin")
@admin_required
def admin_legacy():
    return render_template("admin/epaperadmin.html")


@admin_bp.route("/admin-panel")
@admin_required
def admin_panel():
    auth_user = get_logged_in_user()
    admin_tools = [
        {
            "title": "E-Paper Studio",
            "description": "Create editions, position article blocks, and publish the visual e-paper layout.",
            "href": url_for("epaper.epaper_admin_v2"),
            "status": "Ready",
        },
        {
            "title": "Legacy E-Paper Upload",
            "description": "Upload weekly e-paper PDFs with metadata. PDFs stored on Cloudinary.",
            "href": url_for("admin.admin_legacy"),
            "status": "Ready",
        },
        {
            "title": "Excel Upload",
            "description": "Import colleges, universities, courses, and entrance exam data from spreadsheets.",
            "href": url_for("admin.excel_upload"),
            "status": "Ready",
        },
        {
            "title": "Public E-Paper Preview",
            "description": "Jump into the live reader to verify the final public experience after publishing.",
            "href": url_for("main.epaper"),
            "status": "Public",
        },
    ]
    return render_template(
        "admin/admin_panel.html",
        auth_user=auth_user,
        admin_tools=admin_tools,
    )


# ══════════════════════════════════════════════════════════════════════════
# LEGACY E-PAPER API  (MongoDB + Cloudinary)
# ══════════════════════════════════════════════════════════════════════════

@admin_bp.route("/api/legacy-epaper/upload", methods=["POST"])
@admin_required
def legacy_epaper_upload():
    """Upload a new e-paper edition with PDF to Cloudinary, metadata to MongoDB."""
    from app.utils.mongo import get_epaper_legacy_collection

    lang = request.form.get("lang", "Marathi").strip()
    week = request.form.get("week", "").strip()
    start = request.form.get("start", "").strip()
    end = request.form.get("end", "").strip()
    tags = request.form.get("tags", "").strip()
    is_new = request.form.get("is_new", "true") == "true"

    if not week or not start or not end:
        return jsonify({"error": "Week, start date, and end date are required."}), 400

    pdf_file = request.files.get("file")
    pdf_url = ""
    pdf_public_id = ""

    if pdf_file and pdf_file.filename:
        allowed = {"pdf"}
        ext = pdf_file.filename.rsplit(".", 1)[-1].lower() if "." in pdf_file.filename else ""
        if ext not in allowed:
            return jsonify({"error": "Only PDF files are accepted."}), 400

        try:
            from app.utils.cloudinary_util import upload_epaper_pdf
            pdf_bytes = pdf_file.read()
            if not pdf_bytes:
                return jsonify({"error": "Uploaded PDF is empty."}), 400

            result = upload_epaper_pdf(io.BytesIO(pdf_bytes), filename=f"{lang}_{week}".replace(" ", "_"))
            pdf_url = result.get("url", "")
            pdf_public_id = result.get("public_id", "")

            extracted = _extract_pdf_pages_to_images(pdf_bytes, lang, week)
        except Exception as e:
            return jsonify({"error": f"PDF upload failed: {e}"}), 500
    else:
        extracted = {
            "page_images": [],
            "total_pages": 0,
            "thumbnail_total_bytes": 0,
            "fullres_total_bytes": 0,
        }

    tag_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []

    col = get_epaper_legacy_collection()
    doc = {
        "lang": lang,
        "week": week,
        "start": start,
        "end": end,
        "tags": tag_list,
        "is_new": is_new,
        "pdf_url": pdf_url,
        "pdf_public_id": pdf_public_id,
        "page_images": extracted["page_images"],
        "image_profile": {
            "thumbnail_dpi": THUMBNAIL_DPI,
            "fullres_dpi": FULL_PAGE_DPI,
            "total_pages": extracted["total_pages"],
            "thumbnail_total_bytes": extracted["thumbnail_total_bytes"],
            "fullres_total_bytes": extracted["fullres_total_bytes"],
            "estimated_total_mb": round(
                (extracted["thumbnail_total_bytes"] + extracted["fullres_total_bytes"]) / BYTES_PER_MB, 2
            ),
        },
        "created_at": datetime.now(timezone.utc),
    }
    result = col.insert_one(doc)

    return jsonify({"success": True, "id": str(result.inserted_id)}), 201


@admin_bp.route("/api/legacy-epaper/list")
@admin_required
def legacy_epaper_list():
    """List all legacy e-paper editions from MongoDB."""
    from app.utils.mongo import get_epaper_legacy_collection
    col = get_epaper_legacy_collection()
    editions = []
    for e in col.find({}).sort("created_at", -1):
        editions.append({
            "id": str(e["_id"]),
            "lang": e.get("lang", ""),
            "week": e.get("week", ""),
            "start": e.get("start", ""),
            "end": e.get("end", ""),
            "tags": e.get("tags", []),
            "is_new": e.get("is_new", False),
            "pdf_url": e.get("pdf_url", ""),
            "total_pages": len(e.get("page_images", [])),
            "image_profile": e.get("image_profile", {}),
            "created_at": e["created_at"].isoformat() if isinstance(e.get("created_at"), datetime) else str(e.get("created_at", "")),
        })
    return jsonify(editions)


@admin_bp.route("/api/legacy-epaper/<edition_id>", methods=["DELETE"])
@admin_required
def legacy_epaper_delete(edition_id):
    """Delete a legacy e-paper edition from MongoDB and Cloudinary."""
    from bson import ObjectId
    from app.utils.mongo import get_epaper_legacy_collection
    from app.utils.cloudinary_util import delete_cloudinary_file

    col = get_epaper_legacy_collection()
    try:
        doc = col.find_one({"_id": ObjectId(edition_id)})
    except Exception:
        return jsonify({"error": "Invalid ID."}), 400

    if not doc:
        return jsonify({"error": "Edition not found."}), 404

    # Delete PDF from Cloudinary
    if doc.get("pdf_public_id"):
        try:
            delete_cloudinary_file(doc["pdf_public_id"], resource_type="raw")
        except Exception:
            pass

    # Delete extracted page images from Cloudinary
    for page in doc.get("page_images", []):
        for key in ("thumbnail_public_id", "fullres_public_id"):
            public_id = page.get(key)
            if not public_id:
                continue
            try:
                delete_cloudinary_file(public_id, resource_type="image")
            except Exception:
                pass

    col.delete_one({"_id": doc["_id"]})
    return jsonify({"success": True})


# ══════════════════════════════════════════════════════════════════════════
# EXCEL UPLOAD  (now uses MongoDB)
# ══════════════════════════════════════════════════════════════════════════

@admin_bp.route("/excel-upload", methods=["GET", "POST"])
@admin_required
def excel_upload():
    from app.services.upload_service import convert_excel_to_records, insert_records_via_mongo

    allowed_tables = {item["value"] for item in UPLOAD_TARGET_TABLES}
    default_table = "universities"
    selected_table = default_table

    ctx = dict(
        configured=True,
        table_name=selected_table,
        selected_table=selected_table,
        upload_targets=UPLOAD_TARGET_TABLES,
    )

    if request.method == "POST":
        selected_table = request.form.get("target_table", default_table).strip()
        ctx["selected_table"] = selected_table
        ctx["table_name"] = selected_table

        if selected_table not in allowed_tables:
            flash("Please choose a valid target table.", "error")
            return render_template("admin/excel_upload.html", **ctx)

        uploaded_file = request.files.get("excel_file")
        if uploaded_file is None or not uploaded_file.filename:
            flash("Please choose an Excel file to upload.", "error")
            return render_template("admin/excel_upload.html", **ctx)

        if not uploaded_file.filename.lower().endswith((".xlsx", ".xls")):
            flash("Invalid file type. Please upload an .xlsx or .xls file.", "error")
            return render_template("admin/excel_upload.html", **ctx)

        try:
            records = convert_excel_to_records(uploaded_file)
            inserted_rows = insert_records_via_mongo(selected_table, records)
        except Exception as exc:
            flash(f"Upload failed: {exc}", "error")
            return render_template("admin/excel_upload.html", **ctx)

        flash(f"Upload successful. Inserted {inserted_rows} row(s) into {selected_table}.", "success")
        return redirect(url_for("admin.excel_upload"))

    return render_template("admin/excel_upload.html", **ctx)


# ══════════════════════════════════════════════════════════════════════════
# USER MANAGEMENT
# ══════════════════════════════════════════════════════════════════════════

@admin_bp.route("/admin-panel/users")
@admin_required
def manage_users():
    from app.utils.mongo import get_users_collection
    users_col = get_users_collection()
    users = list(users_col.find({}, {
        "password_hash": 0,
        "password_reset_token": 0,
        "password_reset_expires": 0,
    }).sort("created_at", -1))
    auth_user = get_logged_in_user()
    return render_template("admin/manage_users.html",
        auth_user=auth_user,
        users=users,
        total_users=len(users),
    )


@admin_bp.route("/admin-panel/users/<user_email>/toggle-admin", methods=["POST"])
@admin_required
def toggle_admin(user_email):
    from app.utils.mongo import get_users_collection
    users_col = get_users_collection()
    user = users_col.find_one({"email": user_email})
    if not user:
        flash("User not found.", "error")
        return redirect(url_for("admin.manage_users"))

    current_admin = get_logged_in_user()
    if user["email"] == current_admin["email"]:
        flash("You cannot change your own admin status.", "error")
        return redirect(url_for("admin.manage_users"))

    new_role = "user" if user.get("role") == "admin" else "admin"
    users_col.update_one(
        {"email": user_email},
        {"$set": {"role": new_role, "updated_at": datetime.now(timezone.utc)}},
    )
    flash(f"{user['name']} is now {'an admin' if new_role == 'admin' else 'a regular user'}.", "success")
    return redirect(url_for("admin.manage_users"))


@admin_bp.route("/admin-panel/users/<user_email>/delete", methods=["POST"])
@admin_required
def admin_delete_user(user_email):
    from app.utils.mongo import get_users_collection
    users_col = get_users_collection()
    user = users_col.find_one({"email": user_email})
    if not user:
        flash("User not found.", "error")
        return redirect(url_for("admin.manage_users"))

    current_admin = get_logged_in_user()
    if user["email"] == current_admin["email"]:
        flash("You cannot delete your own account from here.", "error")
        return redirect(url_for("admin.manage_users"))

    if user.get("profile_photo_id"):
        try:
            from app.utils.cloudinary_util import delete_profile_photo
            delete_profile_photo(user["profile_photo_id"])
        except Exception:
            pass

    users_col.delete_one({"email": user_email})
    flash(f"Account for {user['name']} ({user_email}) has been deleted.", "success")
    return redirect(url_for("admin.manage_users"))
