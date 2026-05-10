"""
Cloudinary image upload utility.
"""
import os

import cloudinary
import cloudinary.uploader

_configured = False


def _ensure_configured():
    """Configure Cloudinary SDK from environment variables (lazy)."""
    global _configured
    if _configured:
        return

    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME", "").strip()
    api_key = os.getenv("CLOUDINARY_API_KEY", "").strip()
    api_secret = os.getenv("CLOUDINARY_API_SECRET", "").strip()

    if not cloud_name or not api_key or not api_secret:
        raise RuntimeError(
            "Cloudinary is not configured. Add CLOUDINARY_CLOUD_NAME, "
            "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET to your .env file."
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )
    _configured = True


def upload_profile_photo(file_data, user_email):
    """
    Upload a profile photo to Cloudinary.

    Args:
        file_data: file-like object or base64 data string
        user_email: used to create a unique public_id

    Returns:
        dict with 'url' and 'public_id', or None on failure.
    """
    _ensure_configured()

    # Create a stable public_id from email
    safe_id = user_email.replace("@", "_at_").replace(".", "_")
    public_id = f"vm_profiles/{safe_id}"

    result = cloudinary.uploader.upload(
        file_data,
        public_id=public_id,
        overwrite=True,
        folder="vm_profiles",
        transformation=[
            {"width": 400, "height": 400, "crop": "fill", "gravity": "face"},
            {"quality": "auto", "fetch_format": "auto"},
        ],
        resource_type="image",
    )

    return {
        "url": result.get("secure_url", ""),
        "public_id": result.get("public_id", ""),
    }


def delete_profile_photo(public_id):
    """Delete a profile photo from Cloudinary."""
    if not public_id:
        return
    _ensure_configured()
    try:
        cloudinary.uploader.destroy(public_id, resource_type="image")
    except Exception:
        pass


def upload_epaper_image(file_data, public_id=None):
    """
    Upload an e-paper article image to Cloudinary.

    Returns:
        dict with 'url' and 'public_id'.
    """
    _ensure_configured()

    import time
    if not public_id:
        public_id = f"vm_epaper/img_{int(time.time() * 1000)}"

    result = cloudinary.uploader.upload(
        file_data,
        public_id=public_id,
        overwrite=True,
        folder="vm_epaper",
        transformation=[
            {"quality": "auto:best", "fetch_format": "auto"},
        ],
        resource_type="image",
    )

    return {
        "url": result.get("secure_url", ""),
        "public_id": result.get("public_id", ""),
    }


def upload_epaper_page_image(file_data, public_id):
    """
    Upload an extracted e-paper page image (thumbnail or full resolution).

    Returns:
        dict with 'url' and 'public_id'.
    """
    _ensure_configured()

    result = cloudinary.uploader.upload(
        file_data,
        public_id=public_id,
        overwrite=True,
        folder="vm_epaper/pages",
        transformation=[
            {"quality": "auto:best", "fetch_format": "auto"},
        ],
        resource_type="image",
    )

    return {
        "url": result.get("secure_url", ""),
        "public_id": result.get("public_id", ""),
    }


def upload_epaper_pdf(file_data, filename="epaper"):
    """
    Upload an e-paper PDF to Cloudinary.

    Returns:
        dict with 'url' and 'public_id'.
    """
    _ensure_configured()

    import time
    public_id = f"vm_pdfs/{filename}_{int(time.time())}"

    result = cloudinary.uploader.upload(
        file_data,
        public_id=public_id,
        overwrite=True,
        folder="vm_pdfs",
        resource_type="raw",
    )

    return {
        "url": result.get("secure_url", ""),
        "public_id": result.get("public_id", ""),
    }


def delete_cloudinary_file(public_id, resource_type="image"):
    """Delete any file from Cloudinary."""
    if not public_id:
        return
    _ensure_configured()
    try:
        cloudinary.uploader.destroy(public_id, resource_type=resource_type)
    except Exception:
        pass
