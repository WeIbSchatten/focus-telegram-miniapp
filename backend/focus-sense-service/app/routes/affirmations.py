import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.config.database import get_db
from app.config.settings import settings
from app.models.affirmation import Affirmation
from app.schemas.affirmation import AffirmationRead, AffirmationCreate, AffirmationUpdate
from app.dependencies.auth import require_admin_or_moderator, verify_sense_access
from app.services.audio_compress import compress_audio_to_mp3

router = APIRouter(prefix="/affirmations", tags=["affirmations"])

ALLOWED_AUDIO = (".mp3", ".m4a", ".webm", ".ogg", ".wav")
MAX_SIZE = getattr(settings, "MAX_AUDIO_FILE_SIZE", 5 * 1024 * 1024)


def _affirmations_dir() -> Path:
    d = settings.upload_path / "affirmations"
    d.mkdir(parents=True, exist_ok=True)
    return d


@router.get("/", response_model=list[AffirmationRead])
@router.get("", response_model=list[AffirmationRead])
def list_affirmations(
    db: Session = Depends(get_db),
    _user=Depends(verify_sense_access),
):
    return db.query(Affirmation).order_by(Affirmation.order, Affirmation.id).all()


@router.get("/{affirmation_id}/audio")
def get_affirmation_audio(
    affirmation_id: int,
    db: Session = Depends(get_db),
    _user=Depends(verify_sense_access),
):
    affirmation = db.query(Affirmation).filter(Affirmation.id == affirmation_id).first()
    if not affirmation:
        raise HTTPException(status_code=404, detail="Аффирмация не найдена")
    path = settings.upload_path / affirmation.file_path
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Файл не найден")
    return FileResponse(
        path,
        media_type="audio/mpeg",
        filename=os.path.basename(affirmation.file_path),
    )


@router.post("/", response_model=AffirmationRead, status_code=status.HTTP_201_CREATED)
@router.post("", response_model=AffirmationRead, status_code=status.HTTP_201_CREATED)
async def create_affirmation(
    title: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    _user=Depends(require_admin_or_moderator),
):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_AUDIO:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Разрешены форматы: {', '.join(ALLOWED_AUDIO)}",
        )
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Размер файла не должен превышать {MAX_SIZE // (1024*1024)} МБ",
        )
    affirmations_dir = _affirmations_dir()
    safe_name = f"{uuid.uuid4().hex}{ext}"
    out_path = affirmations_dir / safe_name
    out_path.write_bytes(content)
    relative_path = f"affirmations/{safe_name}"
    file_size = len(content)

    result = compress_audio_to_mp3(out_path)
    if result is not None:
        compressed_path, compressed_size = result
        out_path.unlink(missing_ok=True)
        relative_path = f"affirmations/{compressed_path.name}"
        file_size = compressed_size

    affirmation = Affirmation(
        title=title.strip() or file.filename or "Аффирмация",
        file_path=relative_path,
        file_size=file_size,
        order=0,
    )
    db.add(affirmation)
    db.commit()
    db.refresh(affirmation)
    return affirmation


@router.patch("/{affirmation_id}", response_model=AffirmationRead)
def update_affirmation(
    affirmation_id: int,
    payload: AffirmationUpdate,
    db: Session = Depends(get_db),
    _user=Depends(require_admin_or_moderator),
):
    affirmation = db.query(Affirmation).filter(Affirmation.id == affirmation_id).first()
    if not affirmation:
        raise HTTPException(status_code=404, detail="Аффирмация не найдена")
    if payload.title is not None:
        affirmation.title = payload.title
    if payload.order is not None:
        affirmation.order = payload.order
    db.commit()
    db.refresh(affirmation)
    return affirmation


@router.delete("/{affirmation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_affirmation(
    affirmation_id: int,
    db: Session = Depends(get_db),
    _user=Depends(require_admin_or_moderator),
):
    affirmation = db.query(Affirmation).filter(Affirmation.id == affirmation_id).first()
    if not affirmation:
        raise HTTPException(status_code=404, detail="Аффирмация не найдена")
    path = settings.upload_path / affirmation.file_path
    if path.is_file():
        path.unlink(missing_ok=True)
    db.delete(affirmation)
    db.commit()
